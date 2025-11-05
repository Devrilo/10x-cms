import { test as base, expect, Playwright } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

// Extend basic test with custom fixture
type TestFixtures = {
  authenticatedAPI: APIRequestContext;
};

const test = base.extend<TestFixtures>({
  authenticatedAPI: async ({ playwright }: { playwright: Playwright }, use: (context: APIRequestContext) => Promise<void>) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },
});

// Interface for DDD Event structure
interface DDDEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, unknown>;
  occurredAt: string;
  version: number;
}

// Configure tests to run in parallel
test.describe.configure({ mode: 'parallel' });

// Custom matcher for DDD event structure
expect.extend({
  toHaveDDDEventStructure(received: unknown): { pass: boolean; message: () => string } {
    const hasCorrectStructure = (event: unknown): event is DDDEvent => {
      const e = event as DDDEvent;
      return typeof e?.id === 'string' &&
        typeof e?.aggregateId === 'string' &&
        typeof e?.aggregateType === 'string' &&
        typeof e?.eventType === 'string' &&
        typeof e?.eventData === 'object' &&
        typeof e?.occurredAt === 'string' &&
        !isNaN(Date.parse(e?.occurredAt)) &&
        typeof e?.version === 'number';
    };

    return {
      pass: hasCorrectStructure(received),
      message: () => hasCorrectStructure(received)
        ? 'Expected event not to have DDD structure'
        : 'Expected event to have DDD structure',
    };
  },
});

// Interfaces for API request/response types
interface ContentTypeField {
  name: string;
  type: string;
  required: boolean;
}

interface ContentTypeData {
  name: string;
  fields: ContentTypeField[];
}

interface ContentData {
  contentTypeId: string;
  data: {
    title: string;
    content: string;
  };
}

interface ContentTypeResponse {
  id: string;
  name: string;
  fields: ContentTypeField[];
}

interface ContentItemResponse {
  id: string;
  data: {
    title: string;
    content: string;
  };
}

interface PublishResponse {
  status: string;
}

test.describe('Content Management API', () => {
  let contentTypeId: string;
  let contentItemId: string;

  test('should create a content type', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const contentTypeData: ContentTypeData = {
      name: 'blogPost',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'content', type: 'text', required: true }
      ]
    };

    const response = await authenticatedAPI.post('/api/v2/content-types', {
      data: contentTypeData
    });

    const data = await response.json() as ContentTypeResponse;
    
    expect.soft(response.status()).toBe(201);
    expect.soft(data.name).toBe(contentTypeData.name);
    expect.soft(data.fields).toHaveLength(2);
    
    contentTypeId = data.id;
  });

  test('should create a content item', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const contentData: ContentData = {
      contentTypeId: contentTypeId,
      data: {
        title: 'My First Blog Post',
        content: 'This is the content of my first blog post.'
      }
    };

    const response = await authenticatedAPI.post('/api/v2/content', {
      data: contentData
    });

    const data = await response.json() as ContentItemResponse;
    
    expect.soft(response.status()).toBe(201);
    expect.soft(data.data.title).toBe(contentData.data.title);
    expect.soft(data.data.content).toBe(contentData.data.content);
    
    contentItemId = data.id;
  });

  test('should publish a content item', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const response = await authenticatedAPI.post(`/api/v2/content/${contentItemId}/publish`);
    const data = await response.json() as PublishResponse;
    
    expect.soft(response.status()).toBe(200);
    expect.soft(data.status).toBe('published');
  });

  test('should get event history with correct DDD structure', async ({ authenticatedAPI }: { authenticatedAPI: APIRequestContext }) => {
    const response = await authenticatedAPI.get(`/api/v2/events/${contentItemId}`);
    const events = await response.json() as DDDEvent[];
    
    expect.soft(response.status()).toBe(200);
    expect.soft(Array.isArray(events)).toBeTruthy();
    expect.soft(events.length).toBeGreaterThan(0);
    
    events.forEach((event: DDDEvent) => {
      expect.soft(event).toHaveDDDEventStructure();
    });
  });
});