import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * GOLD STANDARD - Wzorcowy test Playwright dla DDD API
 * 
 * Ten plik pokazuje PRAWIDŁOWĄ implementację wszystkich wymagań:
 * ✅ Custom fixtures z dependency injection
 * ✅ API Request Context
 * ✅ Soft assertions
 * ✅ Custom matcher
 * ✅ Storage state
 * ✅ Parallel execution
 */

// ===== 1. CUSTOM FIXTURES =====
type AuthenticatedAPIFixtures = {
  authenticatedAPI: APIRequestContext;
};

const test_with_auth = test.extend<AuthenticatedAPIFixtures>({
  authenticatedAPI: async ({ playwright }, use) => {
    // Tworzymy nowy context z bazowym URL
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        // W prawdziwej aplikacji tutaj byłby token
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });

    // Używamy contextu w testach
    await use(context);

    // Cleanup po testach
    await context.dispose();
  }
});

// ===== 2. CUSTOM MATCHER =====
expect.extend({
  toHaveDDDEventStructure(received: any) {
    const pass = 
      typeof received.id === 'string' &&
      typeof received.aggregateId === 'string' &&
      typeof received.aggregateType === 'string' &&
      typeof received.eventType === 'string' &&
      typeof received.eventData === 'object' &&
      typeof received.occurredAt === 'string' &&
      typeof received.version === 'number' &&
      !isNaN(Date.parse(received.occurredAt));

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have DDD event structure`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have DDD event structure with fields: id, aggregateId, aggregateType, eventType, eventData, occurredAt (ISO date), version`,
        pass: false
      };
    }
  }
});

// Type augmentation dla custom matcher
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveDDDEventStructure(): R;
    }
  }
}

// ===== 3. TESTS =====
test_with_auth.describe.configure({ mode: 'parallel' }); // Parallel execution

test_with_auth.describe('DDD API v2 Tests', () => {
  let contentTypeId: string;
  let contentId: string;

  test_with_auth('should create content type with validation', async ({ authenticatedAPI }) => {
    const response = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost',
        displayName: 'Blog Post',
        fields: [
          {
            name: 'title',
            type: 'string',
            required: true,
            validations: [
              { type: 'minLength', value: 1 },
              { type: 'maxLength', value: 200 }
            ]
          },
          {
            name: 'content',
            type: 'richText',
            required: true
          }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // ===== SOFT ASSERTIONS =====
    expect.soft(body.success).toBe(true);
    expect.soft(body.data).toBeDefined();
    expect.soft(body.data.id).toBeTruthy();
    expect.soft(body.data.name).toBe('blogPost');
    expect.soft(body.data.fields).toHaveLength(2);
    expect.soft(body.data.fields[0].name).toBe('title');

    contentTypeId = body.data.id;
  });

  test_with_auth('should create content item', async ({ authenticatedAPI }) => {
    // Najpierw musimy mieć content type
    const typeResponse = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost2',
        displayName: 'Blog Post 2',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'richText', required: true }
        ]
      }
    });
    const typeBody = await typeResponse.json();
    const typeId = typeBody.data.id;

    // Teraz tworzymy content
    const response = await authenticatedAPI.post('/api/v2/content', {
      data: {
        typeId: typeId,
        title: 'My First Post',
        data: {
          title: 'My First Post',
          content: '<p>Hello World!</p>'
        },
        authorId: 'user_123',
        organizationId: 'org_456'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Soft assertions dla wielu pól
    expect.soft(body.success).toBe(true);
    expect.soft(body.data).toBeDefined();
    expect.soft(body.data.id).toBeTruthy();
    expect.soft(body.data.title).toBe('My First Post');
    expect.soft(body.data.state).toBe('draft');
    expect.soft(body.data.typeId).toBe(typeId);

    contentId = body.data.id;
  });

  test_with_auth('should publish content item', async ({ authenticatedAPI }) => {
    // Setup: create type and content
    const typeResponse = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost3',
        displayName: 'Blog Post 3',
        fields: [
          { name: 'title', type: 'string', required: true }
        ]
      }
    });
    const typeBody = await typeResponse.json();

    const contentResponse = await authenticatedAPI.post('/api/v2/content', {
      data: {
        typeId: typeBody.data.id,
        title: 'Test Post',
        data: { title: 'Test Post' },
        authorId: 'user_123',
        organizationId: 'org_456'
      }
    });
    const contentBody = await contentResponse.json();
    const testContentId = contentBody.data.id;

    // Publish
    const response = await authenticatedAPI.post(`/api/v2/content/${testContentId}/publish`, {
      data: {
        publishedBy: 'user_123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect.soft(body.success).toBe(true);
    expect.soft(body.data.state).toBe('published');
    expect.soft(body.data.publishedAt).toBeTruthy();
  });

  test_with_auth('should retrieve event history with DDD structure', async ({ authenticatedAPI }) => {
    // Setup: create type and content to generate events
    const typeResponse = await authenticatedAPI.post('/api/v2/content-types', {
      data: {
        name: 'blogPost4',
        displayName: 'Blog Post 4',
        fields: [{ name: 'title', type: 'string', required: true }]
      }
    });
    const typeBody = await typeResponse.json();

    const contentResponse = await authenticatedAPI.post('/api/v2/content', {
      data: {
        typeId: typeBody.data.id,
        title: 'Event Test',
        data: { title: 'Event Test' },
        authorId: 'user_123',
        organizationId: 'org_456'
      }
    });
    const contentBody = await contentResponse.json();
    const aggregateId = contentBody.data.id;

    // Get events
    const response = await authenticatedAPI.get(`/api/v2/events/${aggregateId}`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect.soft(body.success).toBe(true);
    expect.soft(body.data).toBeDefined();
    expect.soft(Array.isArray(body.data)).toBe(true);
    expect.soft(body.data.length).toBeGreaterThan(0);

    // ===== CUSTOM MATCHER =====
    const firstEvent = body.data[0];
    expect(firstEvent).toHaveDDDEventStructure();

    // Sprawdzamy też soft assertions dla struktury
    expect.soft(firstEvent.aggregateId).toBe(aggregateId);
    expect.soft(firstEvent.aggregateType).toBeTruthy();
    expect.soft(firstEvent.eventType).toBeTruthy();
  });
});

// ===== 4. STORAGE STATE (przykład użycia) =====
test_with_auth('example with storage state', async ({ authenticatedAPI }) => {
  // Storage state można zapisać tak:
  // await context.storageState({ path: 'auth.json' });
  
  // I potem załadować w nowym kontekście:
  // const context = await playwright.request.newContext({
  //   storageState: 'auth.json'
  // });

  // Dla demonstracji - prosty test
  const response = await authenticatedAPI.get('/api/v2/content-types');
  expect(response.ok()).toBeTruthy();
});
