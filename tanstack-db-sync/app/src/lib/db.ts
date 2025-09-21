import { createCollection } from "@tanstack/svelte-db";
import { trailBaseCollectionOptions } from "@tanstack/trailbase-db-collection";
import { createClient } from "./trailbase-adapter";

// Create TrailBase client with wrapper
const client = createClient("http://localhost:4000");

// Define types
export type Todo = {
  id: number;
  text: string;
  completed: boolean;
  created_at: number;
  updated_at: number;
};

export type Config = {
  id: number;
  key: string;
  value: string;
  created_at: number;
  updated_at: number;
};

// Create collections with TrailBase sync
export const todoCollection = createCollection(
  trailBaseCollectionOptions<Todo>({
    recordApi: client.records("todos"),
    getKey: (item) => item.id ?? -1,
    parse: {},
    serialize: {},
  }),
);

export const configCollection = createCollection(
  trailBaseCollectionOptions<Config>({
    recordApi: client.records("config"),
    getKey: (item) => item.id ?? -1,
    parse: {},
    serialize: {},
  }),
);

// Helper functions
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function generateId(): number {
  return Math.round(Math.random() * 1000000);
}