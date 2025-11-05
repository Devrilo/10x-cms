import { test as base, expect, APIRequestContext } from '@playwright/test';

// Custom matcher type for DDD events
interface DDDEventStructure {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: object;
  occurredAt: string;
  version: number;
}

// Extend expect with custom matcher
expect.extend({
  async toHaveDDDEventStructure(received: any) {
    const pass = Boolean(
      received &&
      typeof received.id === 'string' &&
      typeof received.aggregateId === 'string' &&
      typeof received.aggregateType === 'string' &&
      typeof received.eventType === 'string' &&
      typeof received.eventData === 'object' &&
      typeof received.occurredAt === 'string' &&
      !isNaN(Date.parse(received.occurredAt)) && // Validate ISO date format
      typeof received.version === 'number'
    );

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to have DDD event structure`,
      pass,
    };
  },
});

// Custom fixtures
type Fixtures = {
  authenticatedAPI: APIRequestContext;
};

// Extend base test with custom fixture
const test = base.extend<Fixtures>({
  authenticatedAPI: async ({ request }, use) => {
    const context = await request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': 'Bearer test-token',  // You would typically get this from env or storage state
      },
    });
    
    await use(context);
    await context.dispose();
  },
});

// Configure parallel execution
test.describe.configure({ mode: 'parallel' });

// Test suite
test.describe('Content Management API Tests', () => {
  let contentTypeId: string;
  let contentId: string;

  test('should create content type "blogPost"', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'content', type: 'text' }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect.soft(data).toHaveProperty('id');
    expect.soft(data.name).toBe('blogPost');
    expect.soft(data.fields).toHaveLength(2);
    
    contentTypeId = data.id;
  });

  test('should create content item', async ({ authenticatedAPI }) => {
    test.fail(!contentTypeId, 'Content type ID is required');

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
    expect.soft(data).toHaveProperty('id');
    expect.soft(data.data.title).toBe('Test Blog Post');
    expect.soft(data.data.content).toBe('This is a test blog post content.');
    
    contentId = data.id;
  });

  test('should publish content item', async ({ authenticatedAPI }) => {
    test.fail(!contentId, 'Content ID is required');

    const response = await authenticatedAPI.post(`/api/v2/content/${contentId}/publish`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect.soft(data).toHaveProperty('status', 'published');
  });

  test('should get event history with valid DDD structure', async ({ authenticatedAPI }) => {
    test.fail(!contentId, 'Content ID is required');

    const response = await authenticatedAPI.get(`/api/v2/events/${contentId}`);

    expect(response.ok()).toBeTruthy();
    const events = await response.json();
    expect(Array.isArray(events)).toBeTruthy();
    expect(events.length).toBeGreaterThan(0);

    // Validate DDD event structure for each event
    for (const event of events) {
      await expect(event).toHaveDDDEventStructure();
    }
  });
});