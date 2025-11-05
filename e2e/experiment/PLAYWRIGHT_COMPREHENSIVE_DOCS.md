# Comprehensive Playwright Documentation for LLMs
# Simulating llms.txt - Complete Reference

This document provides comprehensive documentation for Playwright Test, optimized for LLM context.

---

## TABLE OF CONTENTS

1. Test Fixtures (Complete)
2. APIRequestContext (Full API)
3. Assertions and Matchers
4. Test Configuration
5. Parallel Execution
6. Storage State
7. TypeScript Types

---

## 1. TEST FIXTURES (COMPLETE)

### Philosophy

Playwright Test is based on test fixtures. Test fixtures establish the environment for each test, giving the test everything it needs and nothing else. Fixtures are isolated between tests.

### Built-in Fixtures

| Fixture | Type | Description |
|---------|------|-------------|
| page | Page | Isolated page for this test run |
| context | BrowserContext | Isolated context for this test run |
| browser | Browser | Browsers are shared across tests |
| browserName | string | chromium, firefox, or webkit |
| request | APIRequestContext | Isolated API request context |

### Creating Custom Fixtures

Use `test.extend()` to create custom fixtures:

```typescript
import { test as base } from '@playwright/test';

type MyFixtures = {
  todoPage: TodoPage;
};

export const test = base.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    // Setup phase
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    
    // Provide fixture to test
    await use(todoPage);
    
    // Teardown phase
    await todoPage.removeAll();
  },
});
```

### Fixture Scope

**Test-scoped** (default): Set up for each test
**Worker-scoped**: Set up once per worker process

```typescript
export const test = base.extend<{}, { account: Account }>({
  account: [async ({ browser }, use, workerInfo) => {
    const username = 'user' + workerInfo.workerIndex;
    const password = 'secret';
    
    // Setup once per worker
    const page = await browser.newPage();
    await page.goto('/signup');
    await page.getByLabel('User Name').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByText('Sign up').click();
    await page.close();
    
    await use({ username, password });
  }, { scope: 'worker' }],
});
```

### Automatic Fixtures

Fixtures that run automatically for each test, even if not listed:

```typescript
export const test = base.extend<{ autoFixture: void }>({
  autoFixture: [async ({}, use, testInfo) => {
    console.log('Before test:', testInfo.title);
    await use();
    console.log('After test:', testInfo.title);
  }, { auto: true }],
});
```

### Fixture Dependencies

Fixtures can depend on other fixtures:

```typescript
export const test = base.extend<{
  database: Database;
  user: User;
}>({
  database: async ({}, use) => {
    const db = await Database.connect();
    await use(db);
    await db.close();
  },
  
  user: async ({ database }, use) => {
    // user depends on database
    const user = await database.createUser();
    await use(user);
    await database.deleteUser(user.id);
  },
});
```

### Fixture Timeout

Set custom timeout for slow fixtures:

```typescript
export const test = base.extend<{ slowFixture: string }>({
  slowFixture: [async ({}, use) => {
    // Slow operation
    await use('result');
  }, { timeout: 60000 }],
});
```

---

## 2. APIREQUESTCONTEXT (FULL API)

### Creating Context

```typescript
const context = await playwright.request.newContext({
  baseURL: 'http://localhost:3000',
  extraHTTPHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  storageState: 'auth.json', // Optional: load cookies
  ignoreHTTPSErrors: true,    // Optional: ignore SSL
  timeout: 30000,             // Optional: default 30s
});
```

### HTTP Methods

#### GET Request

```typescript
const response = await context.get(url, {
  params: { key: 'value' },
  headers: { 'Custom-Header': 'value' },
  timeout: 5000,
  failOnStatusCode: false,
});
```

#### POST Request

```typescript
const response = await context.post(url, {
  data: {
    title: 'Book',
    author: 'John'
  },
  headers: { 'Custom-Header': 'value' },
  timeout: 5000,
});
```

#### PUT Request

```typescript
const response = await context.put(url, {
  data: { /* update data */ }
});
```

#### PATCH Request

```typescript
const response = await context.patch(url, {
  data: { /* partial update */ }
});
```

#### DELETE Request

```typescript
const response = await context.delete(url);
```

#### HEAD Request

```typescript
const response = await context.head(url);
```

#### Generic Fetch

```typescript
const response = await context.fetch(url, {
  method: 'POST',
  data: { /* data */ },
  headers: { /* headers */ },
});
```

### Request Options

All methods accept these options:

- **data**: Object | string | Buffer - Request body (auto-serialized to JSON)
- **form**: Object - Form data (application/x-www-form-urlencoded)
- **multipart**: FormData | Object - Multipart form data
- **headers**: Object<string, string> - HTTP headers
- **params**: Object | URLSearchParams | string - Query parameters
- **timeout**: number - Request timeout in ms (default: 30000)
- **failOnStatusCode**: boolean - Throw on non-2xx/3xx (default: false)
- **ignoreHTTPSErrors**: boolean - Ignore SSL errors
- **maxRedirects**: number - Max redirects (default: 20)
- **maxRetries**: number - Max network retries (default: 0)

### Response API

```typescript
const response = await context.get('/api/data');

// Status
response.ok()              // boolean: status 200-299
response.status()          // number: HTTP status code
response.statusText()      // string: HTTP status text
response.headers()         // Object: response headers
response.url()            // string: final URL after redirects

// Body
await response.json()      // Parse as JSON
await response.text()      // Get as text
await response.body()      // Get as Buffer
```

### Storage State

Save and load authentication state:

```typescript
// Save state (cookies, localStorage)
await context.storageState({ path: 'auth.json' });

// Load state
const context = await playwright.request.newContext({
  storageState: 'auth.json'
});

// Get state as object
const state = await context.storageState();
// Returns: { cookies: [...], origins: [...] }
```

### Disposal

Clean up resources:

```typescript
await context.dispose();
```

After disposal, all methods throw exceptions.

---

## 3. ASSERTIONS AND MATCHERS

### Standard Expect

```typescript
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
expect(value).toBeGreaterThan(number);
expect(value).toBeLessThan(number);
expect(value).toContain(item);
expect(value).toHaveLength(number);
```

### Soft Assertions

Soft assertions don't stop test execution:

```typescript
test('soft assertions', async ({ page }) => {
  // These continue even if they fail
  await expect.soft(page.locator('.status')).toHaveText('Success');
  await expect.soft(page.locator('.count')).toHaveText('5');
  
  // Test continues...
  await page.click('button');
});
```

All failures are collected and reported at the end of the test.

### Custom Matchers

Extend expect with custom matchers:

```typescript
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false
      };
    }
  }
});

// Usage
expect(10).toBeWithinRange(5, 15);
```

### TypeScript Types for Custom Matchers

```typescript
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R;
    }
  }
}
```

### Web-First Assertions

For page elements:

```typescript
await expect(page.locator('.status')).toBeVisible();
await expect(page.locator('.title')).toHaveText('Hello');
await expect(page.locator('.count')).toContainText('5');
await expect(page).toHaveTitle(/Playwright/);
await expect(page).toHaveURL('https://example.com');
```

---

## 4. TEST CONFIGURATION

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

### Test Hooks

```typescript
test.beforeAll(async () => {
  // Runs once before all tests in the file
});

test.beforeEach(async ({ page }) => {
  // Runs before each test
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  // Runs after each test
});

test.afterAll(async () => {
  // Runs once after all tests in the file
});
```

### Test Describe Blocks

```typescript
test.describe('feature name', () => {
  test('test 1', async ({ page }) => {});
  test('test 2', async ({ page }) => {});
});
```

### Test Configuration in File

```typescript
test.use({
  baseURL: 'http://localhost:3000',
  locale: 'en-US',
  timezoneId: 'Europe/Warsaw',
  viewport: { width: 1280, height: 720 },
});
```

### Test Skip/Only

```typescript
test.skip('skipped test', async ({ page }) => {});
test.only('run only this', async ({ page }) => {});

test.skip(condition, 'skip if condition', async ({ page }) => {});
```

---

## 5. PARALLEL EXECUTION

### File-Level Parallelization

By default, test files run in parallel across multiple worker processes.

### Test-Level Parallelization

Tests in a single file normally run sequentially. To run them in parallel:

```typescript
test.describe.configure({ mode: 'parallel' });

test.describe('parallel tests', () => {
  test('test 1', async ({ page }) => {
    // Runs in parallel with test 2 and test 3
  });
  
  test('test 2', async ({ page }) => {
    // Runs in parallel with test 1 and test 3
  });
  
  test('test 3', async ({ page }) => {
    // Runs in parallel with test 1 and test 2
  });
});
```

### Serial Mode

Force tests to run one after another:

```typescript
test.describe.configure({ mode: 'serial' });

test.describe('serial tests', () => {
  test('test 1', async ({ page }) => {
    // Runs first
  });
  
  test('test 2', async ({ page }) => {
    // Runs after test 1
  });
});
```

### Worker Processes

- Each worker process is isolated
- Worker fixtures are shared within a worker
- Test fixtures are isolated per test
- Use `workerInfo.workerIndex` to get worker ID

```typescript
test('worker info', async ({}, testInfo) => {
  console.log('Worker:', testInfo.workerIndex);
  console.log('Parallel index:', testInfo.parallelIndex);
});
```

---

## 6. STORAGE STATE

### Purpose

Storage state allows you to preserve authentication and other browser state between tests and test runs.

### Saving State

```typescript
// From browser context
await context.storageState({ path: 'auth.json' });

// From API context
await apiContext.storageState({ path: 'api-auth.json' });
```

### Loading State

```typescript
// In browser context
const context = await browser.newContext({
  storageState: 'auth.json'
});

// In API context
const apiContext = await playwright.request.newContext({
  storageState: 'api-auth.json',
  baseURL: 'http://localhost:3000'
});
```

### State Structure

```json
{
  "cookies": [
    {
      "name": "session",
      "value": "abc123",
      "domain": "example.com",
      "path": "/",
      "expires": 1735689600,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        {
          "name": "theme",
          "value": "dark"
        }
      ]
    }
  ]
}
```

### Use Cases

1. **Authentication**: Login once, reuse across tests
2. **User Preferences**: Preserve settings
3. **Session Management**: Maintain user sessions
4. **API Testing**: Share auth tokens

---

## 7. TYPESCRIPT TYPES

### Test Type

```typescript
import { test } from '@playwright/test';

// test is of type: Test<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>
```

### Fixture Types

```typescript
type MyTestFixtures = {
  myFixture: string;
  myComplexFixture: MyClass;
};

type MyWorkerFixtures = {
  myWorkerFixture: Database;
};

const test = base.extend<MyTestFixtures, MyWorkerFixtures>({
  // ... fixture implementations
});
```

### Page and Context Types

```typescript
import { Page, BrowserContext, Browser } from '@playwright/test';

async function helper(page: Page) {
  await page.goto('/');
}
```

### APIRequestContext Type

```typescript
import { APIRequestContext } from '@playwright/test';

async function makeRequest(request: APIRequestContext) {
  const response = await request.get('/api/data');
  return response.json();
}
```

### TestInfo Type

```typescript
import { TestInfo } from '@playwright/test';

test('test with info', async ({}, testInfo: TestInfo) => {
  console.log(testInfo.title);
  console.log(testInfo.file);
  console.log(testInfo.line);
  console.log(testInfo.column);
  console.log(testInfo.status); // 'passed' | 'failed' | 'timedOut' | 'skipped'
});
```

### Custom Matcher Types

```typescript
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveDDDEventStructure(): R;
      toBeValidEmail(): R;
      toMatchPattern(pattern: RegExp): R;
    }
  }
}
```

---

## 8. BEST PRACTICES

### Fixture Best Practices

1. **Encapsulation**: Keep setup and teardown together in fixtures
2. **Reusability**: Define fixtures once, use in all tests
3. **Lazy Loading**: Fixtures are only set up when needed
4. **Composition**: Fixtures can depend on other fixtures
5. **Scoping**: Use worker scope for expensive setup

### API Testing Best Practices

1. **Base URL**: Always use baseURL in context
2. **Error Handling**: Use failOnStatusCode appropriately
3. **Timeouts**: Set reasonable timeouts for API calls
4. **Storage State**: Reuse authentication state
5. **Cleanup**: Always dispose contexts when done

### Assertion Best Practices

1. **Soft Assertions**: Use for multiple validations
2. **Specific Matchers**: Use most specific matcher available
3. **Custom Matchers**: Create for repeated validation logic
4. **Error Messages**: Custom matchers should have clear messages

### Parallel Testing Best Practices

1. **Isolation**: Tests should be independent
2. **Worker Fixtures**: Use for shared expensive resources
3. **Test Data**: Each test should create its own data
4. **Serial Mode**: Use only when tests must run in order

---

## 9. COMMON PATTERNS

### Authentication Pattern

```typescript
export const test = base.extend<{}, { authenticatedAPI: APIRequestContext }>({
  authenticatedAPI: [async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': 'Bearer ' + await getToken()
      }
    });
    await use(context);
    await context.dispose();
  }, { scope: 'worker' }],
});
```

### Database Pattern

```typescript
export const test = base.extend<{}, { db: Database }>({
  db: [async ({}, use) => {
    const db = await Database.connect();
    await use(db);
    await db.close();
  }, { scope: 'worker' }],
  
  cleanDb: [async ({ db }, use) => {
    await db.clean();
    await use();
    await db.clean();
  }, { auto: true }],
});
```

### Page Object Pattern

```typescript
export const test = base.extend<{ todoPage: TodoPage }>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },
});

class TodoPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/todos');
  }
  
  async addTodo(text: string) {
    await this.page.fill('input', text);
    await this.page.press('input', 'Enter');
  }
}
```

---

## END OF COMPREHENSIVE DOCUMENTATION

This document simulates an llms.txt file for Playwright Test.
Total estimated tokens: ~7000-8000
