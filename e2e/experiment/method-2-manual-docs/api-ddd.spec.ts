import { test as base, expect, APIRequestContext, PlaywrightTestConfig, Playwright } from '@playwright/test';

// Types for our domain
interface ContentType {
  name: string;
  fields: Array<{
    name: string;
    type: string;
  }>;
}

interface ContentItem {
  contentTypeId: string;
  data: Record<string, any>;
}

interface DDDEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, any>;
  occurredAt: string;
  version: number;
}

// Custom matcher for DDD event structure
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveDDDEventStructure(): R;
    }
  }
}

expect.extend({
  toHaveDDDEventStructure(received: any) {
    const hasValidStructure = 
      typeof received.id === 'string' &&
      typeof received.aggregateId === 'string' &&
      typeof received.aggregateType === 'string' &&
      typeof received.eventType === 'string' &&
      typeof received.eventData === 'object' &&
      typeof received.occurredAt === 'string' &&
      !isNaN(new Date(received.occurredAt).getTime()) && // Valid ISO date
      typeof received.version === 'number';

    if (hasValidStructure) {
      return {
        message: () => 'expected event not to have DDD structure',
        pass: true,
      };
    } else {
      return {
        message: () => `expected event to have DDD structure, but got: ${JSON.stringify(received, null, 2)}`,
        pass: false,
      };
    }
  },
});

// Custom fixture type
type Fixtures = {
  authenticatedAPI: APIRequestContext;
};

// Test extension with custom fixture
export const test = base.extend<Fixtures>({
  authenticatedAPI: async ({ playwright }: { playwright: Playwright }, use: (r: APIRequestContext) => Promise<void>) => {
    // Create new API context with authentication
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer test-token' // Replace with actual auth token
      }
    });

    // Save authentication state
    await context.storageState({ path: './auth.json' });

    // Use the fixture
    await use(context);

    // Cleanup
    await context.dispose();
  }
});

// Configure parallel execution
test.describe.configure({ mode: 'parallel' });

// Test suite
test.describe('Content Management API Tests', () => {
  let contentTypeId: string;
  let contentItemId: string;

  test('should create a content type', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const contentType: ContentType = {
      name: 'blogPost',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'text' }
      ]
    };

    const response = await authenticatedAPI.post('/api/v2/content-types', {
      data: contentType
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Soft assertions for response validation
    expect.soft(data.id).toBeDefined();
    expect.soft(data.name).toBe(contentType.name);
    expect.soft(data.fields).toHaveLength(2);

    contentTypeId = data.id;
  });

  test('should create a content item', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const contentItem: ContentItem = {
      contentTypeId,
      data: {
        title: 'Test Blog Post',
        content: 'This is a test blog post content.'
      }
    };

    const response = await authenticatedAPI.post('/api/v2/content', {
      data: contentItem
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Soft assertions for content item
    expect.soft(data.id).toBeDefined();
    expect.soft(data.contentTypeId).toBe(contentTypeId);
    expect.soft(data.data.title).toBe(contentItem.data.title);
    expect.soft(data.data.content).toBe(contentItem.data.content);

    contentItemId = data.id;
  });

  test('should publish content item', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const response = await authenticatedAPI.post(`/api/v2/content/${contentItemId}/publish`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Soft assertions for publish response
    expect.soft(data.status).toBe('published');
    expect.soft(data.publishedAt).toBeDefined();
  });

  test('should get event history with proper DDD structure', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const response = await authenticatedAPI.get(`/api/v2/events/${contentItemId}`);

    expect(response.ok()).toBeTruthy();
    const events = await response.json();

    expect(Array.isArray(events)).toBeTruthy();
    expect(events.length).toBeGreaterThan(0);

    // Validate each event has proper DDD structure using custom matcher
    for (const event of events) {
      expect.soft(event).toHaveDDDEventStructure();
    }

    // Additional soft assertions for specific event types
    const createEvent = events.find((e: DDDEvent) => e.eventType === 'ContentItemCreated');
    const publishEvent = events.find((e: DDDEvent) => e.eventType === 'ContentItemPublished');

    expect.soft(createEvent).toBeDefined();
    expect.soft(publishEvent).toBeDefined();
  });
});