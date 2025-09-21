import { Client, type RecordApi } from "trailbase";

// Wrapper to add createBulk method to TrailBase RecordApi
export function wrapRecordApi(recordApi: RecordApi): RecordApi & { createBulk: <T>(records: T[]) => Promise<number[]> } {
  // Create a proper wrapper that preserves all original methods
  const wrapper = Object.create(Object.getPrototypeOf(recordApi));

  // Copy all properties and methods from the original recordApi
  for (const key in recordApi) {
    if (Object.prototype.hasOwnProperty.call(recordApi, key)) {
      wrapper[key] = recordApi[key as keyof RecordApi];
    }
  }

  // Copy prototype methods
  Object.setPrototypeOf(wrapper, Object.getPrototypeOf(recordApi));

  // Bind all methods to preserve 'this' context
  const proto = Object.getPrototypeOf(recordApi);
  for (const key of Object.getOwnPropertyNames(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
      wrapper[key] = descriptor.value.bind(recordApi);
    }
  }

  // Add the createBulk method
  wrapper.createBulk = async <T>(records: T[]) => {
    // Create records one by one and collect IDs
    const ids: number[] = [];
    for (const record of records) {
      const response = await recordApi.createId(record);
      ids.push(response as number);
    }
    return ids;
  };

  return wrapper as RecordApi & { createBulk: <T>(records: T[]) => Promise<number[]> };
}

// Export a wrapper for the client that patches all record APIs
export function createClient(url: string): Client {
  const client = new Client(url);
  const originalRecords = client.records.bind(client);

  // Override the records method to return wrapped APIs
  client.records = function(name: string) {
    const recordApi = originalRecords(name);
    return wrapRecordApi(recordApi);
  };

  return client;
}