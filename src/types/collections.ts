/**
 * Collection schema defines field types for items
 * Key: field name, Value: field type
 */
export type CollectionSchema = Record<string, FieldType>;

/**
 * Supported field types in collection schema
 */
export type FieldType = 'string' | 'number' | 'text' | 'date' | 'media';

/**
 * Base collection interface
 */
export interface Collection {
  id: string;
  name: string;
  schema: CollectionSchema | string; // string when from DB (JSON)
  created_at: string;
  updated_at: string;
}

/**
 * Collection with populated items
 */
export interface CollectionWithItems extends Collection {
  items: Item[];
}

/**
 * Item data - dynamic based on collection schema
 */
export type ItemData = Record<string, string | number | boolean | null>;

/**
 * Item in a collection
 */
export interface Item {
  id: string;
  collection_id: string;
  data: ItemData | string; // string when from DB (JSON)
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
  name: string;
  fieldName?: string[];
  fieldType?: FieldType[];
}

/**
 * Input for creating/updating an item
 */
export type ItemInput = Record<string, any>;
