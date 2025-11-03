/**
 * Webhook event types
 */
export type WebhookEvent = 'create' | 'update' | 'delete';

/**
 * Webhook configuration
 */
export interface Webhook {
  id: string;
  collection_id: string;
  url: string;
  events: WebhookEvent[] | string; // string when from DB (JSON)
  created_at: string;
  updated_at: string;
}

/**
 * Webhook payload sent to external URL
 */
export interface WebhookPayload<T = any> {
  event: WebhookEvent;
  collection: {
    id: string;
    name: string;
  };
  data: T;
  timestamp: string;
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
  collection: string;
  url: string;
  events: WebhookEvent[];
}
