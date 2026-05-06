import { BaseEntity, FindOptionsWhere } from "typeorm";

export class BaseMySQLModel extends BaseEntity {
  _id!: number;

  static async find(query?: any) {
    return super.find() as any;
  }

  static async findOne(query: any) {
    if (!query) return null;
    const where: any = {};
    for (const key of Object.keys(query)) {
      if (key === "_id" || key === "id") {
        where._id = Number(query[key]);
      } else {
        where[key] = query[key];
      }
    }
    return super.findOne({ where }) as any;
  }

  static async findById(id: any) {
    if (id === undefined || id === null) return null;
    return super.findOne({ where: { _id: Number(id) } as any }) as any;
  }

  static async findByIdAndUpdate(id: any, updateData: any, options?: { new?: boolean }) {
    if (id === undefined || id === null) return null;
    await super.update(Number(id), updateData);
    if (options?.new !== false) {
      return this.findById(id);
    }
    return null;
  }

  static async findByIdAndDelete(id: any) {
    if (id === undefined || id === null) return null;
    const record = await this.findById(id);
    if (record) {
      await super.remove(record);
      return record;
    }
    return null;
  }

  static async findOneAndUpdate(query: any, updateData: any, options?: { upsert?: boolean; new?: boolean }) {
    const where: any = {};
    for (const key of Object.keys(query)) {
      where[key] = query[key];
    }
    
    let record = await super.findOne({ where });
    if (!record) {
      if (options?.upsert) {
        const newRecord = this.create({ ...query, ...updateData });
        return super.save(newRecord) as any;
      }
      return null;
    }
    
    Object.assign(record, updateData);
    return super.save(record) as any;
  }

  static async deleteOne(query: any) {
    const record = await this.findOne(query);
    if (record) {
      await super.remove(record);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  static async create<T extends BaseEntity>(this: { new(): T } & typeof BaseEntity, entityLike: any): Promise<T> {
    const instance = super.create(entityLike) as any;
    return await super.save(instance);
  }
}
