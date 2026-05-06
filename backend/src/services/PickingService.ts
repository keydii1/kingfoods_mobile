import { Service, Inject } from "@tsed/di";
import { Order, OrderStatus } from "../Entity/Order";
import { Container, ContainerStatus } from "../Entity/Container";
import { ContainerItem, ContainerItemStatus } from "../Entity/ContainerItem";
import { User, UserRole } from "../Entity/User";
import { Product } from "../Entity/Product";
import { PickingTask, PickingTaskStatus } from "../Entity/PickingTask";
import { NotFound, BadRequest } from "../core/ErrorResponse";
import { TypeORMService } from "@tsed/typeorm";

@Service()
export class PickingService {
  @Inject(TypeORMService)
  private typeORMService: TypeORMService;

  /**
   * 1. Quản lý: Nhận đơn hàng sỉ của chi nhánh và chia tách/phân công nhiệm vụ pick hàng cho nhân viên
   * Ví dụ: Chi nhánh đặt 100 món A, Quản lý phân chia thành:
   * - Nhân viên 1: Pick 50 món A
   * - Nhân viên 2: Pick 50 món A
   */
  async assignAndSplitTasks(
    orderId: number,
    tasks: { productId: number; staffId: number; quantity: number; location?: string }[]
  ) {
    const order = await Order.getByIdOrFail(orderId);

    return await this.typeORMService.get().transaction(
      async (transactionalEntityManager) => {
        const createdTasks: PickingTask[] = [];

        for (const taskData of tasks) {
          const { productId, staffId, quantity, location } = taskData;

          const staff = await transactionalEntityManager.findOne(User, { where: { id: staffId } });
          if (!staff || staff.role !== UserRole.STAFF) {
            throw new BadRequest(`Nhân viên với ID ${staffId} không tồn tại hoặc không phải là Staff`);
          }

          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId },
            relations: ["category", "category.location"]
          });
          if (!product) {
            throw new NotFound(`Sản phẩm với ID ${productId} không tồn tại`);
          }

          // Tạo nhiệm vụ pick hàng chi tiết
          const pickingTask = transactionalEntityManager.create(PickingTask, {
            orderId: order.id,
            productId,
            assignedUserId: staffId,
            quantityToPick: quantity,
            quantityPicked: 0,
            status: PickingTaskStatus.PENDING,
            location: location || product?.category?.location?.name || "Khu A-Mặc định",
          });

          const savedTask = await transactionalEntityManager.save(pickingTask);
          createdTasks.push(savedTask);
        }

        // Chuyển trạng thái đơn hàng sang Đang xử lý
        order.status = OrderStatus.PROCESSING;
        await transactionalEntityManager.save(order);

        return {
          message: `Phân chia và tạo thành công ${createdTasks.length} nhiệm vụ pick hàng`,
          tasks: createdTasks,
        };
      }
    );
  }

  /**
   * 2. Nhân viên: Lấy danh sách nhiệm vụ pick hàng được giao cho mình trong ca
   */
  async getAssignedTasks(staffId: number) {
    return await PickingTask.find({
      where: { assignedUserId: staffId },
      relations: ["product", "product.category", "product.category.location", "order", "order.branch"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 3. Nhân viên: Tiến hành pick hàng, đi tới vị trí kệ (Location), thực hiện pick đúng số lượng và bỏ vào Container
   */
  async pickTaskItem(data: {
    taskId: number;
    quantity: number;
    containerCode: string;
    staffId: number;
  }) {
    const { taskId, quantity, containerCode, staffId } = data;

    return await this.typeORMService.get().transaction(
      async (transactionalEntityManager) => {
        const task = await transactionalEntityManager.findOne(PickingTask, {
          where: { id: taskId },
          relations: ["order"],
        });

        if (!task) {
          throw new NotFound(`Nhiệm vụ pick hàng #${taskId} không tồn tại`);
        }
        if (task.assignedUserId !== staffId) {
          throw new BadRequest(`Bạn không được giao thực hiện nhiệm vụ pick hàng này`);
        }
        if (task.status === PickingTaskStatus.COMPLETED) {
          throw new BadRequest(`Nhiệm vụ này đã hoàn thành trước đó`);
        }

        const remainingToPick = task.quantityToPick - task.quantityPicked;
        if (quantity > remainingToPick) {
          throw new BadRequest(
            `Số lượng pick (${quantity}) vượt quá số lượng còn lại cần pick (${remainingToPick}) của nhiệm vụ này`
          );
        }

        // Tìm hoặc tạo mới Container đựng hàng
        let container = await transactionalEntityManager.findOne(Container, {
          where: { code: containerCode },
        });

        if (!container) {
          container = transactionalEntityManager.create(Container, {
            code: containerCode,
            name: `Thùng hàng ${containerCode}`,
            capacity: 50, // Capacity mặc định, có thể tùy chỉnh
            currentUsage: 0,
            status: ContainerStatus.ACTIVE,
          });
          container = await transactionalEntityManager.save(container);
        }

        if (container.status === ContainerStatus.CLOSED || container.status === ContainerStatus.SHIPPED) {
          throw new BadRequest(`Container ${containerCode} đã niêm phong hoặc đã xuất kho, không thể bỏ thêm hàng`);
        }

        // Kiểm tra sức chứa (Capacity) của Container
        const remainingCapacity = container.capacity - container.currentUsage;
        if (quantity > remainingCapacity) {
          throw new BadRequest(
            `Container ${containerCode} đã đầy! Sức chứa còn lại: ${remainingCapacity}. Hãy lấy container khác.`
          );
        }

        // Tạo ContainerItem lưu vết: ai bỏ món hàng nào vào container nào, số lượng bao nhiêu
        const containerItem = transactionalEntityManager.create(ContainerItem, {
          containerId: container.id,
          orderId: task.orderId,
          productId: task.productId,
          quantity,
          pickedById: staffId,
          status: ContainerItemStatus.GOOD,
        });
        await transactionalEntityManager.save(containerItem);

        // Cập nhật số lượng đã pick trong nhiệm vụ
        task.quantityPicked += quantity;
        task.status = task.quantityPicked === task.quantityToPick ? PickingTaskStatus.COMPLETED : PickingTaskStatus.PICKING;
        await transactionalEntityManager.save(task);

        // Cập nhật dung lượng Container
        container.currentUsage += quantity;
        container.status = ContainerStatus.ACTIVE;
        await transactionalEntityManager.save(container);

        return {
          message: "Pick hàng bỏ vào container thành công",
          taskStatus: task.status,
          quantityRemaining: task.quantityToPick - task.quantityPicked,
          container,
          containerItem,
        };
      }
    );
  }

  /**
   * 4. Bàn giao nhiệm vụ giữa các ca (Handover)
   * Nếu hết ca mà nhân viên vẫn chưa pick xong đơn hàng, họ bàn giao nhiệm vụ còn dang dở này cho nhân viên ca sau
   */
  async handoverTask(taskId: number, nextStaffId: number, staffId: number) {
    const task = await PickingTask.getByIdOrFail(taskId);

    if (task.assignedUserId !== staffId) {
      throw new BadRequest("Bạn chỉ có thể bàn giao nhiệm vụ đang được giao cho chính mình");
    }
    if (task.status === PickingTaskStatus.COMPLETED) {
      throw new BadRequest("Nhiệm vụ đã hoàn thành, không cần bàn giao");
    }

    const nextStaff = await User.getByIdOrFail(nextStaffId);
    if (nextStaff.role !== UserRole.STAFF) {
      throw new BadRequest("Chỉ có thể bàn giao nhiệm vụ cho nhân viên (Staff) khác");
    }

    const oldStaffId = task.assignedUserId;
    task.assignedUserId = nextStaffId;
    await task.save();

    return {
      message: "Bàn giao nhiệm vụ thành công cho nhân viên ca sau",
      taskId: task.id,
      fromStaffId: oldStaffId,
      toStaffId: nextStaffId,
      status: task.status,
    };
  }

  /**
   * 5. Truy xuất nguồn gốc hàng hóa trong container (Traceability)
   */
  async getContainerTraceability(containerCode: string) {
    const container = await Container.findOne({
      where: { code: containerCode },
    });

    if (!container) {
      throw new NotFound(`Container với mã ${containerCode} không tồn tại`);
    }

    const items = await ContainerItem.find({
      where: { containerId: container.id },
      relations: ["product", "pickedBy", "order", "order.branch"],
    });

    return {
      containerInfo: {
        id: container.id,
        code: container.code,
        name: container.name,
        capacity: container.capacity,
        currentUsage: container.currentUsage,
        status: container.status,
      },
      pickedItems: items.map((item) => ({
        itemId: item.id,
        orderId: item.orderId,
        branchName: item.order?.branch?.name || "N/A",
        product: {
          id: item.product?.id,
          name: item.product?.name,
          price: item.product?.price,
        },
        quantity: item.quantity,
        status: item.status,
        pickedBy: {
          id: item.pickedBy?.id,
          name: item.pickedBy?.name,
          username: item.pickedBy?.username,
          phoneNumber: item.pickedBy?.phoneNumber,
        },
        pickedAt: item.createdAt,
      })),
    };
  }

  /**
   * 6. Ghi nhận lỗi hỏng/mất mát và quy trách nhiệm phạt nhân viên
   */
  async reportContainerItemIssue(itemId: number, status: "damaged" | "lost") {
    const item = await ContainerItem.getByIdOrFail(itemId, {
      relations: ["pickedBy", "product"],
    });

    item.status = status === "damaged" ? ContainerItemStatus.DAMAGED : ContainerItemStatus.LOST;
    await item.save();

    return {
      message: "Ghi nhận lỗi hỏng/thiếu số lượng thành công. Đã định danh nhân viên chịu trách nhiệm.",
      culprit: {
        id: item.pickedBy?.id,
        name: item.pickedBy?.name,
        username: item.pickedBy?.username,
        phoneNumber: item.pickedBy?.phoneNumber,
      },
      itemDetails: {
        productId: item.productId,
        productName: item.product?.name,
        quantity: item.quantity,
        issue: item.status,
      },
    };
  }
}
