import { Client, type RecordApi } from "trailbase";

// Wrapper to add createBulk method to TrailBase RecordApi
export function wrapRecordApi<T>(recordApi: RecordApi<T>): RecordApi<T> & { createBulk: (records: T[]) => Promise<number[]> } {
  return {
    ...recordApi,
    createBulk: async (records: T[]) => {
      // Create records one by one and collect IDs
      const ids: number[] = [];
      for (const record of records) {
        const response = await recordApi.createId(record);
        ids.push(response as number);
      }
      return ids;
    }
  } as RecordApi<T> & { createBulk: (records: T[]) => Promise<number[]> };
}

// Export a wrapper for the client that patches all record APIs
export function createClient(url: string): Client {
  const client = new Client(url);
  const originalRecords = client.records.bind(client);

  // Override the records method to return wrapped APIs
  client.records = function<T>(name: string) {
    const recordApi = originalRecords<T>(name);
    return wrapRecordApi(recordApi);
  };

  return client;
}