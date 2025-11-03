import * as storage from './storage';
// @ts-ignore - TODO: Add type definitions for @10xdevspl/http-client
import * as httpClient from '@10xdevspl/http-client';
import {
  Webhook,
  WebhookEvent,
  WebhookPayload,
  Item,
} from '../types';

async function getWebhooksForEvent(
  collectionId: string,
  eventType: WebhookEvent
): Promise<Webhook[]> {
  const webhooks = await storage.getWebhooks(collectionId);

  return webhooks.filter((webhook) => {
    const events = typeof webhook.events === 'string'
      ? JSON.parse(webhook.events)
      : webhook.events;
    return events.includes(eventType);
  });
}

async function callWebhook(webhook: Webhook, data: WebhookPayload): Promise<any> {
  return await httpClient.post(webhook.url, data, {
    'Content-Type': 'application/json',
    'User-Agent': '10xCMS-Webhook-Service/1.0',
    'X-Webhook-Event': data.event,
  });
}

async function notifyWebhooks(
  collectionId: string,
  eventType: WebhookEvent,
  data: any
): Promise<void> {
  const webhooks = await getWebhooksForEvent(collectionId, eventType);

  if (!webhooks || webhooks.length === 0) {
    return;
  }

  const collection = await storage.getCollectionById(collectionId);
  if (!collection) {
    console.error(
      `Collection not found for webhook notification: ${collectionId}`
    );
    return;
  }

  const payload: WebhookPayload = {
    event: eventType,
    collection: {
      id: collection.id,
      name: collection.name,
    },
    data: data,
    timestamp: new Date().toISOString(),
  };

  console.log(
    `Notifying ${webhooks.length} webhooks for ${collection.name} - ${eventType}`
  );

  const promises = webhooks.map((webhook) => callWebhook(webhook, payload));

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Error calling webhook: ${webhooks[index].url}`,
        result.reason
      );
    }
  });

  console.log(
    'Webhook notification complete with results:',
    results.map((r) => r.status).join(', ')
  );
}

export async function onItemCreated(collectionId: string, item: Item): Promise<void> {
  await notifyWebhooks(collectionId, 'create', item);
}

export async function onItemUpdated(collectionId: string, item: Item): Promise<void> {
  await notifyWebhooks(collectionId, 'update', item);
}

export async function onItemDeleted(collectionId: string, itemId: string): Promise<void> {
  await notifyWebhooks(collectionId, 'delete', { id: itemId });
}
