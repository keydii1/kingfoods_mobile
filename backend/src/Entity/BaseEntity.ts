import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity as TypeORMBaseEntity,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from "typeorm";
import { Property } from "@tsed/schema";
import { NotFound } from "../core/ErrorResponse";

/**
 * BaseEntity - Kiến trúc Active Record Core
 * Cung cấp đầy đủ các phương thức bổ trợ cho CRUD và Query
 */
export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn()
  @Property()
  id: number;

  @CreateDateColumn({ name: "created_at" })
  @Property()
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  @Property()
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", select: false })
  deletedAt: Date | null;

  constructor(partial?: Partial<any>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /* ==========================================================================
     Instance Methods
     ========================================================================== */

  /**
   * Lưu hoặc cập nhật bản ghi
   */
  async save(): Promise<this> {
    return await super.save();
  }

  /**
   * Cập nhật nhanh dữ liệu
   */
  async update(data: Partial<this>): Promise<this> {
    Object.assign(this, data);
    return await this.save();
  }

  /**
   * Xóa mềm
   */
  async softDelete(): Promise<this> {
    return await super.softRemove();
  }

  /**
   * Khôi phục
   */
  async restore(): Promise<this> {
    this.deletedAt = null;
    return await super.save();
  }

  /* ==========================================================================
     Static Methods (Custom Helpers)
     ========================================================================== */

  /**
   * Tìm theo ID hoặc ném lỗi 404
   */
  static async getByIdOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof TypeORMBaseEntity,
    id: number,
    options?: FindOneOptions<T>,
  ): Promise<T> {
    const result = await (this as any).findOne({
      where: { id },
      ...options,
    });
    if (!result) {
      throw new NotFound(`Entity with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Tìm kiếm một bản ghi theo điều kiện và tự động kèm theo cột password (vốn bị select: false)
   */
  static async findOneAndIncludePassword<T extends BaseEntity>(
    this: { new (): T } & typeof TypeORMBaseEntity,
    conditions: Partial<Record<string, any>>,
  ): Promise<T | null> {
    const alias = this.name.toLowerCase();
    const query = (this as any).createQueryBuilder(alias);

    Object.entries(conditions).forEach(([key, value], index) => {
      if (index === 0) {
        query.where(`${alias}.${key} = :value`, { value });
      } else {
        query.andWhere(`${alias}.${key} = :value`, { value });
      }
    });

    return await query.addSelect(`${alias}.password`).getOne();
  }

  /**
   * Kiểm tra tồn tại
   */
  static async isExists<T extends BaseEntity>(
    this: { new (): T } & typeof TypeORMBaseEntity,
    conditions: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<boolean> {
    const count = await (this as any).count({ where: conditions });
    return count > 0;
  }

  /**
   * Phân trang tự động
   */
  static async paginate<T extends BaseEntity>(
    this: { new (): T } & typeof TypeORMBaseEntity,
    query: { page?: any; limit?: any; sortKey?: string; sortValue?: string },
    options: FindManyOptions<T> = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortKey = query.sortKey || "id";
    const sortValue = (query.sortValue || "DESC").toUpperCase() as
      | "ASC"
      | "DESC";

    const [rows, count] = await (this as any).findAndCount({
      ...options,
      order: { [sortKey]: sortValue } as any,
      take: limit,
      skip: offset,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Tạo và lưu nhanh
   */
  static async createAndSave<T extends BaseEntity>(
    this: { new (data?: any): T } & typeof TypeORMBaseEntity,
    data: any,
  ): Promise<T> {
    const entity = new this(data);
    return await (entity as any).save();
  }
}
