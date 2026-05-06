import { Property, Required, Description, CollectionOf, Enum } from "@tsed/schema";

export class PickingTaskItemDto {
  @Property()
  @Required()
  @Description("ID của sản phẩm cần pick")
  productId: number;

  @Property()
  @Required()
  @Description("ID của nhân viên được giao")
  staffId: number;

  @Property()
  @Required()
  @Description("Số lượng sản phẩm cần pick")
  quantity: number;

  @Property()
  @Description("Vị trí kệ hàng (Tự động lấy theo Location của Category nếu để trống)")
  location?: string;
}

export class AssignTasksDto {
  @Property()
  @Required()
  @Description("ID của đơn hàng sỉ từ chi nhánh")
  orderId: number;

  @CollectionOf(PickingTaskItemDto)
  @Required()
  @Description("Danh sách phân chia nhiệm vụ pick hàng cho nhân viên")
  tasks: PickingTaskItemDto[];
}

export class PackItemDto {
  @Property()
  @Required()
  @Description("ID của nhiệm vụ pick hàng (PickingTask)")
  taskId: number;

  @Property()
  @Required()
  @Description("Số lượng sản phẩm bỏ vào container")
  quantity: number;

  @Property()
  @Required()
  @Description("Mã thùng hàng (Container Code)")
  containerCode: string;
}

export class HandoverTaskDto {
  @Property()
  @Required()
  @Description("ID của nhiệm vụ pick hàng cần bàn giao")
  taskId: number;

  @Property()
  @Required()
  @Description("ID của nhân viên nhận bàn giao ca tiếp theo")
  nextStaffId: number;
}

export class ReportIssueDto {
  @Property()
  @Required()
  @Description("Trạng thái lỗi hỏng hoặc mất mát")
  @Enum("damaged", "lost")
  status: "damaged" | "lost";
}
export default AssignTasksDto;
