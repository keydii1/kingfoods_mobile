export class ColumnNumericTransformer {
  /** TypeScript → Database: giữ nguyên số */
  to(data: number): number {
    return data;
  }
  /** Database → TypeScript: MySQL trả decimal dưới dạng string, cần parse */
  from(data: string): number {
    return parseFloat(data);
  }
}
