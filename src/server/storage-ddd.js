/**
 * Updated Storage Module - Uses DDD modules with backward compatibility
 * 
 * This replaces the old storage.js while maintaining the same API
 */

const { getModules } = require('../modules/bootstrap');

let adapter = null;

function getAdapter() {
  if (!adapter) {
    const modules = getModules();
    adapter = modules.compatibilityAdapter;
  }
  return adapter;
}

async function createCollection(name, schema) {
  return await getAdapter().createCollection(name, schema);
}

async function getCollections() {
  return await getAdapter().getCollections();
}

async function getCollectionById(id) {
  return await getAdapter().getCollectionById(id);
}

async function updateCollection(id, updates) {
  return await getAdapter().updateCollection(id, updates);
}

async function deleteCollection(id) {
  return await getAdapter().deleteCollection(id);
}

async function addItemToCollection(collectionId, item) {
  return await getAdapter().addItemToCollection(collectionId, item);
}

async function updateItemInCollection(collectionId, itemId, updates) {
  return await getAdapter().updateItemInCollection(collectionId, itemId, updates);
}

async function deleteItemFromCollection(collectionId, itemId) {
  return await getAdapter().deleteItemFromCollection(collectionId, itemId);
}

// Webhooks - Keep old implementation for now (will be moved to Publishing Context later)
const db = require("./db/connection");

async function getWebhooks(collectionId) {
  const webhooks = await db("webhooks")
    .where({collection_id: collectionId})
    .select("*");
  return webhooks.map(function (webhook) {
    if (typeof webhook.events === "string") {
      try {
        webhook.events = JSON.parse(webhook.events);
      } catch (e) {
        webhook.events = [];
      }
    }
    return webhook;
  });
}

async function addWebhook(collectionId, url, events) {
  const webhook = {
    id: Date.now().toString(),
    collection_id: collectionId,
    url: url,
    events: JSON.stringify(events),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db("webhooks").insert(webhook);
  return {
    ...webhook,
    events: events,
  };
}

async function deleteWebhook(webhookId) {
  const deleted = await db("webhooks").where({id: webhookId}).delete();
  return deleted > 0;
}

async function initializeStorage() {
  await db.migrate.latest();
}

module.exports = {
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
