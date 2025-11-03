import db from './db/connection';
import type {
  Collection,
  CollectionWithItems,
  CollectionSchema,
  Item,
  ItemInput,
  Webhook,
  WebhookEvent,
} from '../types';

async function createCollection(
  name: string,
  schema?: CollectionSchema
): Promise<Collection> {
  const collection: Collection = {
    id: Date.now().toString(),
    name: name,
    schema: schema || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db<Collection>('collections').insert(collection);
  return collection;
}

async function getCollections(): Promise<Collection[]> {
  return await db<Collection>('collections').select('*');
}

async function getCollectionById(id: string): Promise<CollectionWithItems | null> {
  const collection = await db<Collection>('collections').where({ id }).first();
  if (!collection) {
    return null;
  }
  const items = await db<Item>('items').where({ collection_id: id });
  return {
    ...collection,
    items,
  };
}

async function updateCollection(
  id: string,
  updates: Partial<Collection>
): Promise<CollectionWithItems | null> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db<Collection>('collections').where({ id }).update(updateData);

  return await getCollectionById(id);
}

async function deleteCollection(id: string): Promise<boolean> {
  const deleted = await db<Collection>('collections').where({ id }).delete();

  return deleted > 0;
}

async function addItemToCollection(
  collectionId: string,
  item: ItemInput
): Promise<Item> {
  const newItem: Item = {
    id: Date.now().toString(),
    collection_id: collectionId,
    data: item,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db<Item>('items').insert(newItem);
  return newItem;
}

async function updateItemInCollection(
  collectionId: string,
  itemId: string,
  updates: ItemInput
): Promise<Item | null> {
  const updateData = {
    data: JSON.stringify(updates),
    updated_at: new Date().toISOString(),
  };

  await db<Item>('items')
    .where({
      id: itemId,
      collection_id: collectionId,
    })
    .update(updateData);

  const result = await db<Item>('items').where({ id: itemId }).first();
  return result || null;
}

async function deleteItemFromCollection(
  collectionId: string,
  itemId: string
): Promise<boolean> {
  const deleted = await db<Item>('items')
    .where({
      id: itemId,
      collection_id: collectionId,
    })
    .delete();

  return deleted > 0;
}

async function getWebhooks(collectionId: string): Promise<Webhook[]> {
  const webhooks = await db<Webhook>('webhooks')
    .where({ collection_id: collectionId })
    .select('*');
  return webhooks.map((webhook) => {
    if (typeof webhook.events === 'string') {
      try {
        webhook.events = JSON.parse(webhook.events) as WebhookEvent[];
      } catch (e) {
        webhook.events = [];
      }
    }
    return webhook;
  });
}

async function addWebhook(
  collectionId: string,
  url: string,
  events: WebhookEvent[]
): Promise<Webhook> {
  const webhook: Webhook = {
    id: Date.now().toString(),
    collection_id: collectionId,
    url: url,
    events: JSON.stringify(events),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db<Webhook>('webhooks').insert(webhook);
  return {
    ...webhook,
    events: events, // Return the original array for the response
  };
}

async function deleteWebhook(webhookId: string): Promise<boolean> {
  const deleted = await db<Webhook>('webhooks').where({ id: webhookId }).delete();

  return deleted > 0;
}

async function initializeStorage(): Promise<void> {
  await db.migrate.latest();
}

export {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  updateItemInCollection,
  deleteItemFromCollection,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  initializeStorage,
};
