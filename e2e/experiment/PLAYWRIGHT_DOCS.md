# Playwright Documentation Fragments for Method 2 (Manual Docs)

## Test Fixtures

### Introduction

Playwright Test is based on the concept of test fixtures. Test fixtures are used to establish the environment for each test, giving the test everything it needs and nothing else.

### Built-in Fixtures

The `{ page }` argument tells Playwright Test to set up the `page` fixture and provide it to your test function.

Here are the pre-defined fixtures:
- **page** (Page) - Isolated page for this test run
- **context** (BrowserContext) - Isolated context for this test run
- **browser** (Browser) - Browsers are shared across tests
- **browserName** (string) - Either chromium, firefox or webkit
- **request** (APIRequestContext) - Isolated APIRequestContext instance for this test run

### Creating Custom Fixtures

To create your own fixture, use `test.extend()` to create a new test object that will include it.

```typescript
import { test as base } from '@playwright/test';

type MyFixtures = {
  todoPage: TodoPage;
};

export const test = base.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    // Set up the fixture
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    
    // Use the fixture value in the test
    await use(todoPage);
    
    // Clean up the fixture
    await todoPage.removeAll();
  },
});
```

### Using Fixtures

Just mention a fixture in your test function argument:

```typescript
test('basic test', async ({ todoPage, page }) => {
  await todoPage.addToDo('something nice');
});
```

### Worker-Scoped Fixtures

Worker fixtures are set up for each worker process. Use the tuple syntax with `{scope: 'worker'}`:

```typescript
export const test = base.extend<{}, { account: Account }>({
  account: [async ({ browser }, use, workerInfo) => {
    // Create account
    const username = 'user' + workerInfo.workerIndex;
    const password = 'verysecure';
    
    // Setup
    const page = await browser.newPage();
    await page.goto('/signup');
    await page.getByLabel('User Name').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByText('Sign up').click();
    await page.close();
    
    // Use the account value
    await use({ username, password });
  }, { scope: 'worker' }],
});
```

### Automatic Fixtures

Automatic fixtures are set up for each test/worker, even when the test does not list them directly. Use `{ auto: true }`:

```typescript
export const test = base.extend<{ saveLogs: void }>({
  saveLogs: [async ({}, use, testInfo) => {
    // Setup
    const logs = [];
    debug.log = (...args) => logs.push(args.map(String).join(''));
    
    await use();
    
    // After the test - attach logs if failed
    if (testInfo.status !== testInfo.expectedStatus) {
      const logFile = testInfo.outputPath('logs.txt');
      await fs.promises.writeFile(logFile, logs.join('\n'), 'utf8');
      testInfo.attachments.push({ name: 'logs', contentType: 'text/plain', path: logFile });
    }
  }, { auto: true }],
});
```

---

## APIRequestContext

### Introduction

This API is used for Web API testing. Each Playwright browser context has associated APIRequestContext instance which can be accessed via `browserContext.request` or `page.request`.

It is also possible to create a new APIRequestContext instance manually by calling `apiRequest.newContext()`.

### Creating API Request Context

```typescript
const context = await playwright.request.newContext({
  baseURL: 'http://localhost:3000',
  extraHTTPHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  }
});
```

### Methods

#### get(url, options)

Sends HTTP GET request and returns its response:

```typescript
const response = await request.get('https://example.com/api/getText', {
  params: {
    'isbn': '1234',
    'page': 23
  }
});
```

#### post(url, options)

Sends HTTP POST request and returns its response:

```typescript
// JSON objects can be passed directly
await request.post('https://example.com/api/createBook', {
  data: {
    title: 'Book Title',
    author: 'John Doe'
  }
});
```

Options:
- **data** - Allows to set post data of the request. If the data parameter is an object, it will be serialized to json string and `content-type` header will be set to `application/json`
- **form** - Provides an object that will be serialized as html form using `application/x-www-form-urlencoded` encoding
- **headers** - Allows to set HTTP headers
- **params** - Query parameters to be sent with the URL
- **timeout** - Request timeout in milliseconds. Defaults to 30000 (30 seconds)
- **failOnStatusCode** - Whether to throw on response codes other than 2xx and 3xx. By default response object is returned for all status codes

#### dispose()

Discards all resources. Calling any method on disposed APIRequestContext will throw an exception:

```typescript
await context.dispose();
```

#### storageState(options)

Returns storage state for this request context, contains current cookies and local storage snapshot:

```typescript
await context.storageState({ path: 'auth.json' });
```

---

## Soft Assertions

Soft assertions do not terminate test execution. They collect all assertion failures during test execution and display them after the test finishes:

```typescript
test('soft assertions', async ({ page }) => {
  await expect.soft(page.getByTestId('status')).toHaveText('Success');
  await expect.soft(page.getByTestId('eta')).toHaveText('1 day');
  
  // Test continues even if assertions above fail
  await page.getByRole('button', { name: 'Submit' }).click();
});
```

Use `expect.soft()` instead of `expect()` to make the assertion "soft".

---

## Custom Matchers

You can extend Playwright's expect library with custom matchers:

```typescript
expect.extend({
  toHaveAmount(received: number, expected: number) {
    const pass = received === expected;
    if (pass) {
      return {
        message: () => `expected ${received} not to equal ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to equal ${expected}`,
        pass: false
      };
    }
  }
});
```

Then use it in tests:

```typescript
test('custom matcher', async () => {
  expect(10).toHaveAmount(10);
});
```

For TypeScript, you need to augment the types:

```typescript
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveAmount(expected: number): R;
    }
  }
}
```

---

## Parallel Execution

By default, test files are run in parallel. Tests in a single file are run in order, in the same worker process.

You can configure parallel execution for tests in a single file:

```typescript
test.describe.configure({ mode: 'parallel' });

test.describe('parallel suite', () => {
  test('test 1', async ({ page }) => {});
  test('test 2', async ({ page }) => {});
  test('test 3', async ({ page }) => {});
});
```

All three tests in the describe block will run in parallel in different worker processes.

---

## Storage State

You can save authentication state and reuse it in all tests:

```typescript
// Save storage state
await context.storageState({ path: 'auth.json' });

// Create context with saved state
const context = await browser.newContext({
  storageState: 'auth.json'
});
```

For API Request Context:

```typescript
const context = await playwright.request.newContext({
  storageState: 'auth.json'
});
```

---

## Summary

Key concepts for this experiment:

1. **Test Fixtures**: Use `test.extend()` to create custom fixtures with dependency injection
2. **API Request Context**: Create with `playwright.request.newContext()`, use methods like `.post()`, `.get()`
3. **Soft Assertions**: Use `expect.soft()` for non-blocking assertions
4. **Custom Matchers**: Extend `expect` with custom validation logic
5. **Parallel Execution**: Configure with `test.describe.configure({ mode: 'parallel' })`
6. **Storage State**: Save/load authentication state with `storageState()`
