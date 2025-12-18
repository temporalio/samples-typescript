export async function getRecords(pageSize: number, offset: number) {
  // This always returns 2 pages, the real implementation would iterate over an existing dataset or file.
  const PAGE_COUNT = 2;
  const result = [];
  if (offset < pageSize * PAGE_COUNT) {
    for (let i = 0; i < pageSize; i++) {
      result.push(new Record(offset + i));
    }
  }
  return result;
}

export class Record {
  public readonly id: any;
  public readonly description: string;
  constructor(id: number) {
    this.id = id;
    this.description = 'record number ' + this.id;
  }
}
