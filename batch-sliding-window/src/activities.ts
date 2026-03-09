export interface SingleRecord {
  id: number;
}

export interface GetRecordsInput {
  pageSize: number;
  offset: number;
  maxOffset: number;
}

export interface GetRecordsOutput {
  records: SingleRecord[];
}

/**
 * Factory that creates record-loader activities with a fixed total record count.
 * The sample returns fake records; a real application would load from a database
 * or other external data source.
 */
export function createActivities(recordCount: number) {
  return {
    async getRecordCount(): Promise<number> {
      return recordCount;
    },

    async getRecords(input: GetRecordsInput): Promise<GetRecordsOutput> {
      if (input.maxOffset > recordCount) {
        throw new Error(`maxOffset(${input.maxOffset}) > recordCount(${recordCount})`);
      }
      const limit = Math.min(input.offset + input.pageSize, input.maxOffset);
      const records: SingleRecord[] = [];
      for (let i = input.offset; i < limit; i++) {
        records.push({ id: i });
      }
      return { records };
    },
  };
}
