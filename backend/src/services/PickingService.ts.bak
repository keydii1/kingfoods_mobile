import { Service } from "@tsed/di";
import { Order, OrderStatus } from "../Entity/Order";
import { OrderDetail } from "../Entity/OrderDetail";
import { Container, ContainerStatus } from "../Entity/Container";
import { ContainerItem, ContainerItemStatus } from "../Entity/ContainerItem";
import { User, UserRole } from "../Entity/User";
import { Product } from "../Entity/Product";
import { PickingTask, PickingTaskStatus } from "../Entity/PickingTask";
import { NotFound, BadRequest } from "../core/ErrorResponse";
import { TypeORMService } from "@tsed/typeorm";

@Service()
export class PickingService {
  constructor(private typeORMService: TypeORMService) {}

  /**
   * 1. Quản lý: Nhận đơn hàng sỉ của chi nhánh và chia tách/phân công nhiệm vụ pick hàng cho nhân viên
   * Ví dụ: Chi nhánh đặt 100 món A, Quản lý phân chia thành:
   * - Nhân viên 1: Pick 50 món A
   * - Nhân viên 2: Pick 50 món A
   */
  async assignAndSplitTasks(
    orderId: number,
    tasks: { productId: number; staffId: number; quantity: number }[]
  ) {
    const order = await Order.getByIdOrFail(orderId);

    return await this.typeORMService.get().transaction(
      async (transactionalEntityManager) => {
        const createdTasks: PickingTask[] = [];

        for (const taskData of tasks) {
          const { productId, staffId, quantity } = taskData;

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

          const orderDetail = await transactionalEntityManager.findOne(OrderDetail, {
            where: { orderId: order.id, productId }
          });
          if (!orderDetail) {
            throw new NotFound(`Sản phẩm với ID ${productId} không nằm trong đơn hàng này`);
          }

          // Tạo nhiệm vụ pick hàng chi tiết
          const pickingTask = transactionalEntityManager.create(PickingTask, {
            orderDetailId: orderDetail.id,
            assignedUserId: staffId,
            quantityToPick: quantity,
            quantityPicked: 0,
            status: PickingTaskStatus.PENDING,
            locationId: product?.category?.location?.id || 1,
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
      relations: ["orderDetail", "orderDetail.product", "orderDetail.product.category", "orderDetail.product.category.location", "orderDetail.order", "orderDetail.order.branch", "location"],
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
          relations: ["orderDetail"],
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

        // Tạo ContainerItem lưu vết: task nào đã được bỏ vào
        const containerItem = transactionalEntityManager.create(ContainerItem, {
          containerId: container.id,
          taskId: task.id,
          quantity,
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
      relations: ["task", "task.orderDetail", "task.orderDetail.product", "task.assignedUser", "task.orderDetail.order", "task.orderDetail.order.branch"],
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
        orderId: item.task?.orderDetail?.orderId,
        branchName: item.task?.orderDetail?.order?.branch?.name || "N/A",
        product: {
          id: item.task?.orderDetail?.product?.id,
          name: item.task?.orderDetail?.product?.name,
          price: item.task?.orderDetail?.product?.price,
        },
        quantity: item.quantity,
        status: item.status,
        pickedBy: {
          id: item.task?.assignedUser?.id,
          name: item.task?.assignedUser?.name,
          username: item.task?.assignedUser?.username,
          phoneNumber: item.task?.assignedUser?.phoneNumber,
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
      relations: ["task", "task.assignedUser", "task.orderDetail", "task.orderDetail.product"],
    });

    item.status = status === "damaged" ? ContainerItemStatus.DAMAGED : ContainerItemStatus.LOST;
    await item.save();

    return {
      message: "Ghi nhận lỗi hỏng/thiếu số lượng thành công. Đã định danh nhân viên chịu trách nhiệm.",
      culprit: {
        id: item.task?.assignedUser?.id,
        name: item.task?.assignedUser?.name,
        username: item.task?.assignedUser?.username,
        phoneNumber: item.task?.assignedUser?.phoneNumber,
      },
      itemDetails: {
        productId: item.task?.orderDetail?.productId,
        productName: item.task?.orderDetail?.product?.name,
        quantity: item.quantity,
        issue: item.status,
      },
    };
  }

  /**
   * 7. Di chuyển sản phẩm từ thùng cũ (Origin) sang thùng mới (Target)
   */
  async moveContainerItem(data: {
    productId: number;
    oldContainerCode: string;
    newContainerCode: string;
    quantity: number;
    staffId: number;
  }) {
    const { productId, oldContainerCode, newContainerCode, quantity, staffId } = data;

    return await this.typeORMService.get().transaction(
      async (transactionalEntityManager) => {
        // 1. Tìm container cũ
        const oldContainer = await transactionalEntityManager.findOne(Container, {
          where: { code: oldContainerCode },
        });
        if (!oldContainer) {
          throw new NotFound(`Thùng hàng cũ #${oldContainerCode} không tồn tại`);
        }

        // 2. Tìm container item cũ khớp với sản phẩm
        const oldItem = await transactionalEntityManager.createQueryBuilder(ContainerItem, "item")
          .innerJoinAndSelect("item.task", "task")
          .innerJoinAndSelect("task.orderDetail", "detail")
          .where("item.containerId = :containerId", { containerId: oldContainer.id })
          .andWhere("detail.productId = :productId", { productId })
          .andWhere("task.assignedUserId = :staffId", { staffId })
          .getOne();

        if (!oldItem || oldItem.quantity < quantity) {
          throw new BadRequest(`Không tìm thấy sản phẩm hoặc số lượng sản phẩm trong thùng cũ không đủ để chuyển`);
        }

        // 3. Tìm hoặc tạo container mới
        let newContainer = await transactionalEntityManager.findOne(Container, {
          where: { code: newContainerCode },
        });
        if (!newContainer) {
          newContainer = transactionalEntityManager.create(Container, {
            code: newContainerCode,
            name: `Thùng hàng ${newContainerCode}`,
            capacity: 50,
            currentUsage: 0,
            status: ContainerStatus.ACTIVE,
          });
          newContainer = await transactionalEntityManager.save(newContainer);
        }

        // Kiểm tra sức chứa mới
        const remainingCapacity = newContainer.capacity - newContainer.currentUsage;
        if (quantity > remainingCapacity) {
          throw new BadRequest(`Thùng mới #${newContainerCode} không đủ sức chứa! Sức chứa còn lại: ${remainingCapacity}`);
        }

        // 4. Khấu trừ ở container cũ
        oldItem.quantity -= quantity;
        if (oldItem.quantity === 0) {
          await transactionalEntityManager.remove(oldItem);
        } else {
          await transactionalEntityManager.save(oldItem);
        }
        oldContainer.currentUsage -= quantity;
        await transactionalEntityManager.save(oldContainer);

        // 5. Thêm vào container mới
        let newItem = await transactionalEntityManager.createQueryBuilder(ContainerItem, "item")
          .innerJoinAndSelect("item.task", "task")
          .innerJoinAndSelect("task.orderDetail", "detail")
          .where("item.containerId = :containerId", { containerId: newContainer.id })
          .andWhere("detail.productId = :productId", { productId })
          .andWhere("task.assignedUserId = :staffId", { staffId })
          .getOne();

        if (newItem) {
          newItem.quantity += quantity;
          await transactionalEntityManager.save(newItem);
        } else {
          newItem = transactionalEntityManager.create(ContainerItem, {
            containerId: newContainer.id,
            taskId: oldItem.taskId,
            quantity,
            status: ContainerItemStatus.GOOD,
          });
          await transactionalEntityManager.save(newItem);
        }

        newContainer.currentUsage += quantity;
        await transactionalEntityManager.save(newContainer);

        return {
          message: `Di chuyển ${quantity} sản phẩm thành công sang thùng mới #${newContainerCode}`,
          oldContainer,
          newContainer,
        };
      }
    );
  }
}
