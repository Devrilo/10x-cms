import { test as base, expect, APIRequestContext } from '@playwright/test';

// Define the Event interface for DDD events
interface DDDEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, unknown>;
  occurredAt: string;
  version: number;
}

// Extend expect matchers with custom DDD event structure validator
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveDDDEventStructure(): R;
    }
  }
}

expect.extend({
  toHaveDDDEventStructure(received: unknown) {
    const pass = Boolean(
      received &&
      typeof received === 'object' &&
      'id' in received &&
      typeof received.id === 'string' &&
      'aggregateId' in received &&
      typeof received.aggregateId === 'string' &&
      'aggregateType' in received &&
      typeof received.aggregateType === 'string' &&
      'eventType' in received &&
      typeof received.eventType === 'string' &&
      'eventData' in received &&
      typeof received.eventData === 'object' &&
      'occurredAt' in received &&
      typeof received.occurredAt === 'string' &&
      !isNaN(Date.parse(received.occurredAt)) &&
      'version' in received &&
      typeof received.version === 'number'
    );

    return {
      pass,
      message: () =>
        pass
          ? 'Expected event not to have DDD event structure'
          : 'Expected event to have DDD event structure with valid id, aggregateId, aggregateType, eventType, eventData, occurredAt (ISO date), and version',
    };
  },
});

// Define test fixtures
type Fixtures = {
  authenticatedAPI: APIRequestContext;
};

// Create test with custom fixture
const test = base.extend<Fixtures>({
  authenticatedAPI: async ({ playwright }, use: (r: APIRequestContext) => Promise<void>) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });

    // Save initial auth state
    await context.storageState({ path: 'e2e/.auth/state.json' });

    await use(context);
    await context.dispose();
  },
});

// Configure parallel execution
test.describe.configure({ mode: 'parallel' });

test.describe('Content Management API Tests', () => {
  let contentTypeId: string;
  let contentItemId: string;

  test('should create a content type', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'text', required: true }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    await expect.soft(data).toHaveProperty('id');
    await expect.soft(data.name).toBe('blogPost');
    await expect.soft(data.fields).toHaveLength(2);
    
    contentTypeId = data.id;
  });

  test('should create a content item', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.post('/api/v2/content', {
      data: {
        contentTypeId: contentTypeId,
        data: {
          title: 'Test Blog Post',
          content: 'This is a test blog post content.'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    await expect.soft(data).toHaveProperty('id');
    await expect.soft(data.data.title).toBe('Test Blog Post');
    await expect.soft(data.data.content).toBe('This is a test blog post content.');
    
    contentItemId = data.id;
  });

  test('should publish a content item', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.post(`/api/v2/content/${contentItemId}/publish`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    await expect.soft(data).toHaveProperty('publishedAt');
    await expect.soft(data.status).toBe('published');
  });

  test('should get event history with valid DDD structure', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.get(`/api/v2/events/${contentItemId}`);
    
    expect(response.ok()).toBeTruthy();
    const events = (await response.json()) as DDDEvent[];
    
    expect(Array.isArray(events)).toBeTruthy();
    expect(events.length).toBeGreaterThan(0);
    
    // Validate each event has proper DDD structure using custom matcher
    for (const event of events) {
      await expect.soft(event).toHaveDDDEventStructure();
    }
    
    // Additional validation of specific events
    const createEvent = events.find((e: DDDEvent) => e.eventType === 'ContentItemCreated');
    const publishEvent = events.find((e: DDDEvent) => e.eventType === 'ContentItemPublished');
    
    await expect.soft(createEvent).toBeTruthy();
    await expect.soft(publishEvent).toBeTruthy();
  });
});