import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Property, Enum } from "@tsed/schema";
import { BaseEntity } from "./BaseEntity";
import { PickingTask } from "./PickingTask";
import { User } from "./User";

export enum IncidentStatus {
  PENDING = "pending",
  RESOLVED = "resolved",
}

@Entity("incident_reports")
export class IncidentReport extends BaseEntity {
  @Column({ name: "task_id", nullable: false })
  @Property()
  taskId: number;

  @Column({ name: "reporter_id", nullable: false })
  @Property()
  reporterId: number;

  @Column({ name: "photo_url", nullable: true })
  @Property()
  photoUrl: string;

  @Column({ nullable: false })
  @Property()
  reason: string; // "Kệ trống", "Hàng hỏng", "Sai vị trí"

  @Column({ type: "enum", enum: IncidentStatus, default: IncidentStatus.PENDING })
  @Enum(IncidentStatus)
  status: IncidentStatus;

  @ManyToOne(() => PickingTask)
  @JoinColumn({ name: "task_id" })
  task: PickingTask;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporter_id" })
  reporter: User;

  constructor(partial?: Partial<IncidentReport>) {
    super(partial);
    if (partial) Object.assign(this, partial);
  }
}

export default IncidentReport;
