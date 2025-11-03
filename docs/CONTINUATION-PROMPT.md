# TypeScript Migration Continuation Prompt

## Context
You are continuing a TypeScript migration for the 10x-CMS project. Previous work has been completed and committed to the `feature/typescript-migration` branch.

## Project Overview
- **Project:** 10x-CMS (Content Management System)
- **Tech Stack:** Node.js, Express, Knex, SQLite, Playwright
- **Branch:** `feature/typescript-migration`
- **Migration Strategy:** Hybrid approach (manual typing for core logic, selective ts-migrate usage)

## What Has Been Completed ✅

### FAZA 0 - Environment Setup ✅
- Branch `feature/typescript-migration` created
- Installed packages: `@types/express`, `@types/node`, `@types/multer`, `@types/body-parser`, `@types/cors`
- `tsconfig.json` and `ts-migrate-config.json` configured

### FAZA 1 - Core Type Definitions ✅
Created complete type system in `src/types/`:
- ✅ `collections.ts` - Collection, Item, CollectionSchema, FieldType interfaces
- ✅ `webhooks.ts` - Webhook, WebhookEvent, WebhookPayload interfaces
- ✅ `media.ts` - MediaItem, MulterFile interfaces
- ✅ `express.d.ts` - Extended Express types (cookies, setCookie)
- ✅ `templating.ts` - TemplateVariables, TemplateMeta interfaces
- ✅ `index.ts` - Re-exports all types

### FAZA 2 - Database Layer Migration ✅
Fully migrated with complete typing:
- ✅ `src/server/db/connection.ts` - Knex connection with typed instance
- ✅ `src/server/storage.ts` - All 13 functions fully typed:
  - `createCollection(name, schema): Promise<Collection>`
  - `getCollections(): Promise<Collection[]>`
  - `getCollectionById(id): Promise<CollectionWithItems | null>`
  - `updateCollection(id, updates): Promise<CollectionWithItems | null>`
  - `deleteCollection(id): Promise<boolean>`
  - `addItemToCollection(collectionId, item): Promise<Item>`
  - `updateItemInCollection(collectionId, itemId, updates): Promise<Item | null>`
  - `deleteItemFromCollection(collectionId, itemId): Promise<boolean>`
  - `getWebhooks(collectionId): Promise<Webhook[]>`
  - `addWebhook(collectionId, url, events): Promise<Webhook>`
  - `deleteWebhook(webhookId): Promise<boolean>`
  - `initializeStorage(): Promise<void>`

### FAZA 3 - Server Modules (Partial) ✅
- ✅ `src/server/media.ts` - Fully typed (5 functions):
  - `getAllMedia(): MediaItem[]`
  - `addMedia(file, description?): MediaItem`
  - `deleteMedia(id): boolean`
  - `getMediaById(id): MediaItem | null`
  - `initializeMediaStorage(): void`

- ✅ `src/server/webhooks.ts` - Fully typed (3 exported functions + 3 helpers):
  - `onItemCreated(collectionId, item): Promise<void>`
  - `onItemUpdated(collectionId, item): Promise<void>`
  - `onItemDeleted(collectionId, itemId): Promise<void>`

### Commit Status
Last commit: `07f46af` - "wip: TypeScript migration - Phases 0-3 partial"

## What Needs To Be Done ⏳

### IMMEDIATE NEXT STEPS (Priority Order):

### 1. FAZA 3 - Complete Server Modules (1-2h)
**File:** `src/server/templating.ts`
**Status:** NOT STARTED
**Complexity:** MEDIUM (string manipulation heavy)

**Task:**
1. Rename: `src/server/templating.js` → `src/server/templating.ts`
2. Add imports:
```typescript
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { TemplateVariables, TemplateMeta } from '../types';
```

3. Type all functions:
```typescript
function readFileSync(filepath: string): string | null
function parseMetaTags(content: string): TemplateMeta
function injectComponent(content: string, componentName: string, variables: TemplateVariables): string
function renderWithLayout(content: string, layoutName: string, variables: TemplateVariables): string
function processConditionals(content: string, variables: TemplateVariables): string
export function renderTemplate(template: string, variables: TemplateVariables): string
export function renderPage(pageName: string, req: Request, customVariables?: Record<string, any>): string | null
```

4. Replace all `var` with `const`/`let`
5. Use template literals instead of string concatenation where possible
6. Export functions using ES6 syntax

### 2. FAZA 4 - API Routes Migration (1h)
**File:** `src/server/api.ts`
**Status:** NOT STARTED
**Complexity:** LOW (simple routes)

**Task:**
1. Rename: `src/server/api.js` → `src/server/api.ts`
2. Add imports:
```typescript
import express, { Request, Response, Router } from 'express';
import * as storageModule from './storage';
import { Collection, CollectionWithItems, Item } from '../types';
```

3. Create typed router:
```typescript
const router: Router = express.Router();
```

4. Type all route handlers:
```typescript
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const collections: Collection[] = await storageModule.getCollections();
    res.json(collections);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

5. Export: `export default router;`

### 3. FAZA 5 - Main Application File (4-6h)
**File:** `index.ts`
**Status:** NOT STARTED
**Complexity:** HIGH (~700 lines, many routes)

**CRITICAL:** Do NOT use ts-migrate on this file - manual migration only!

**Task Breakdown:**

#### Part A: Imports & Setup (30 min)
```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import multer, { StorageEngine } from 'multer';

import * as templating from './src/server/templating';
import * as storageModule from './src/server/storage';
import * as mediaModule from './src/server/media';
import apiRoutes from './src/server/api';
import * as webhooksModule from './src/server/webhooks';
```

#### Part B: Multer & App Setup (30 min)
- Type multer configuration
- Type Express app instance
- Type middleware functions

#### Part C: Custom Middleware (1h)
- Type cookie parser middleware
- Type `requireAuth` function
- Type `renderPage` helper

#### Part D: Route Migration (2-3h)
Migrate routes in this order:
1. Auth routes (`/login`, `/logout`)
2. Collections routes (`/collections`, `/collections/:id`)
3. Media routes (`/media`, `/api/media`)
4. Webhook routes (`/webhooks`, `/api/webhooks`)
5. API routes (POST/PUT/DELETE for collections/items)

For each route:
- Add types: `(req: Request, res: Response)`
- Type all local variables
- Use proper error handling
- Replace `var` with `const`/`let`

#### Part E: Server Initialization (30 min)
```typescript
(async (): Promise<void> => {
  try {
    await storageModule.initializeStorage();
    console.log('Database initialized successfully');

    mediaModule.initializeMediaStorage();

    const server = app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();
```

### 4. FAZA 8 - Cleanup (2-3h)

**Task A: Find and Replace `any` types**
```bash
grep -r ": any" src/
grep -r "any\[\]" src/
grep -r "Record<string, any>" src/
```

For each `any`:
- Can it be `unknown`?
- Can it be a specific type?
- If it must be `any`, add comment: `// TODO: type this properly`

**Task B: Remove all `$TSFixMe`**
```bash
grep -r "\$TSFixMe" src/
```
Replace each with proper type.

**Task C: Update tsconfig.json**
Enable stricter settings:
```json
{
  "compilerOptions": {
    "allowJs": false,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Task D: Run TypeScript compiler**
```bash
npx tsc --noEmit
```
Fix all errors.

### 5. FAZA 9 - Testing (1-2h)

**Task A: Compilation Test**
```bash
npx tsc
```
Must succeed without errors.

**Task B: Unit Tests**
```bash
npm test
```
All tests must pass.

**Task C: E2E Tests**
```bash
npm run test:e2e
```
All Playwright tests must pass.

**Task D: Manual Testing Checklist**
- [ ] Login/logout
- [ ] Create collection
- [ ] Add item to collection
- [ ] Edit item
- [ ] Delete item
- [ ] Upload media
- [ ] Delete media
- [ ] Create webhook
- [ ] Trigger webhook

### 6. FAZA 10 - Documentation & Final Commit (30 min)

**Task A: Update package.json**
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node index.ts",
    "build": "tsc",
    "watch": "tsc --watch"
  }
}
```

**Task B: Create migration summary**
File: `docs/typescript-migration-summary.md`
- List all migrated files
- Note any remaining issues
- Document breaking changes

**Task C: Final commit**
```bash
git add .
git commit -m "feat: complete TypeScript migration

- Migrated all backend files to TypeScript
- Added comprehensive type definitions
- All tests passing
- Zero compilation errors

BREAKING CHANGE: Project requires TypeScript compilation"

git push origin feature/typescript-migration
```

## Important Files Reference

### Key Type Definitions (Already Created)
- `src/types/collections.ts` - Use `Collection`, `Item`, `ItemInput`
- `src/types/webhooks.ts` - Use `Webhook`, `WebhookEvent`, `WebhookPayload`
- `src/types/media.ts` - Use `MediaItem`, `MulterFile`
- `src/types/express.d.ts` - Extended `Request` (has `cookies`), `Response` (has `setCookie`)

### Migration Patterns (Use These)

**Pattern 1: Converting functions**
```typescript
// Before
async function getFoo(id) {
  return await db('table').where({id}).first();
}

// After
async function getFoo(id: string): Promise<Foo | null> {
  const result = await db<Foo>('table').where({ id }).first();
  return result || null;
}
```

**Pattern 2: Express routes**
```typescript
// Before
app.get('/path', async function (req, res) {
  var data = await something();
  res.json(data);
});

// After
app.get('/path', async (req: Request, res: Response) => {
  try {
    const data: DataType = await something();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Pattern 3: JSON.parse with typing**
```typescript
// Before
var data = JSON.parse(str);

// After
const data = JSON.parse(str) as MyType;
// Or with validation:
const parsed = JSON.parse(str);
const data: MyType = parsed; // Let TS check
```

## Commands Cheatsheet

```bash
# Check for compilation errors (without building)
npx tsc --noEmit

# Build TypeScript
npx tsc

# Find issues
grep -r "any" src/
grep -r "\$TSFixMe" src/

# Run tests
npm test
npm run test:e2e

# Run development server
npm run dev
```

## Common Pitfalls to Avoid

❌ **DON'T:**
- Use `any` unless absolutely necessary
- Leave `$TSFixMe` in code
- Skip error handling in routes
- Use `var` - always use `const`/`let`
- Ignore TypeScript errors

✅ **DO:**
- Use `unknown` instead of `any` when possible
- Add explicit return types to functions
- Type all parameters
- Use Knex generics: `db<Type>('table')`
- Handle null/undefined explicitly
- Test after each major file migration

## Progress Tracking

**Completed:** ~40%
- [x] FAZA 0: Setup
- [x] FAZA 1: Type definitions
- [x] FAZA 2: Database layer
- [x] FAZA 3: Server modules (partial)

**Remaining:** ~60%
- [ ] FAZA 3: templating.ts
- [ ] FAZA 4: api.ts
- [ ] FAZA 5: index.ts (LARGEST)
- [ ] FAZA 8: Cleanup
- [ ] FAZA 9: Testing
- [ ] FAZA 10: Documentation

**Estimated Time:** 8-12 hours remaining

## Your Task
Continue the TypeScript migration starting with `src/server/templating.ts`. Follow the detailed steps above for each phase. All the foundational work (types, database layer) is complete - you're building on solid ground.

The code is on branch `feature/typescript-migration` and ready for you to continue. Good luck! 🚀
