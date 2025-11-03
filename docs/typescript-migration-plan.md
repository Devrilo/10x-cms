# Plan Migracji TypeScript - Podejście Hybrydowe dla AI Agent

## Meta informacje
- **Data utworzenia:** 2025-11-03
- **Projekt:** 10x-CMS
- **Wykonawca:** AI Agent (GitHub Copilot lub podobny)
- **Metoda:** Hybrydowa (ts-migrate + manual typing)
- **Szacowany czas:** 30-40 godzin pracy agenta

---

## 🎯 Cele migracji

### Cele podstawowe:
1. ✅ Projekt kompiluje się bez błędów TypeScript
2. ✅ Wszystkie pliki .js zamienione na .ts/.tsx
3. ✅ Baza typów dla core business logic
4. ✅ Testy E2E nadal działają

### Cele jakościowe:
1. ⚠️ Maximum 10% użycia `any` w finalnym kodzie
2. ⚠️ Wszystkie `$TSFixMe` zastąpione prawdziwymi typami
3. ⚠️ Strict mode ready (ale nieaktywny na start)
4. ⚠️ Zero `@ts-ignore` w production code

---

## 📋 Fazy migracji (dla AI Agent)

### **FAZA 0: Przygotowanie środowiska** ⏱️ 30 min
**Status:** Do wykonania  
**AI Context:** Setup przed migracją

#### 0.1. Instalacja dependencies
```bash
# Types dla external libraries
npm install --save-dev @types/express
npm install --save-dev @types/node
npm install --save-dev @types/multer
npm install --save-dev @types/body-parser
npm install --save-dev @types/cors
npm install --save-dev @types/jquery
```

#### 0.2. Backup projektu
```bash
# AI: Stwórz branch dla migracji
git checkout -b feature/typescript-migration
git add .
git commit -m "chore: backup before TypeScript migration"
```

#### 0.3. Weryfikacja ts-migrate
```bash
# AI: Sprawdź czy ts-migrate działa
npx ts-migrate --help
```

**AI Checkpoint:** ✓ Wszystkie dependencies zainstalowane, branch utworzony

---

### **FAZA 1: Definicje typów bazowych** ⏱️ 2-3h
**Status:** Do wykonania  
**AI Context:** Ręczne tworzenie core interfaces

#### 1.1. Struktura katalogów
**AI Task:** Utwórz następującą strukturę:
```
src/
  types/
    index.ts          # Re-exports
    collections.ts    # Collection & Item types
    webhooks.ts       # Webhook types
    media.ts          # Media types
    express.d.ts      # Express augmentation
    knex.d.ts         # Knex helpers
    templating.ts     # Template types
```

#### 1.2. Plik: `src/types/collections.ts`
**AI Task:** Stwórz następujące typy bazując na analizie `storage.js`:

```typescript
/**
 * Collection schema defines field types for items
 * Key: field name, Value: field type
 */
export type CollectionSchema = Record<string, FieldType>;

/**
 * Supported field types in collection schema
 */
export type FieldType = 'string' | 'number' | 'text' | 'date' | 'media';

/**
 * Base collection interface
 */
export interface Collection {
  id: string;
  name: string;
  schema: CollectionSchema | string; // string when from DB (JSON)
  created_at: string;
  updated_at: string;
}

/**
 * Collection with populated items
 */
export interface CollectionWithItems extends Collection {
  items: Item[];
}

/**
 * Item data - dynamic based on collection schema
 */
export type ItemData = Record<string, string | number | boolean | null>;

/**
 * Item in a collection
 */
export interface Item {
  id: string;
  collection_id: string;
  data: ItemData | string; // string when from DB (JSON)
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
  name: string;
  fieldName?: string[];
  fieldType?: FieldType[];
}

/**
 * Input for creating/updating an item
 */
export type ItemInput = Record<string, any>;
```

#### 1.3. Plik: `src/types/webhooks.ts`
**AI Task:** Stwórz typy dla webhooks bazując na `webhooks.js`:

```typescript
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
```

#### 1.4. Plik: `src/types/media.ts`
**AI Task:** Stwórz typy dla media library:

```typescript
/**
 * Media item (uploaded file)
 */
export interface MediaItem {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  description: string;
  uploadDate: string;
}

/**
 * Input for uploading media
 */
export interface UploadMediaInput {
  description?: string;
}

/**
 * Multer file type (from multer middleware)
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
```

#### 1.5. Plik: `src/types/express.d.ts`
**AI Task:** Extend Express types dla custom middleware:

```typescript
import { Express } from 'express';

declare global {
  namespace Express {
    /**
     * Extended Request with custom properties
     */
    interface Request {
      /**
       * Parsed cookies from cookie header
       */
      cookies: Record<string, string>;
    }

    /**
     * Extended Response with custom methods
     */
    interface Response {
      /**
       * Set cookie helper method
       */
      setCookie(
        name: string,
        value: string,
        options?: {
          maxAge?: number;
          path?: string;
          httpOnly?: boolean;
          secure?: boolean;
        }
      ): this;
    }
  }
}
```

#### 1.6. Plik: `src/types/templating.ts`
**AI Task:** Typy dla templating engine:

```typescript
import { Request } from 'express';

/**
 * Template variables passed to renderPage
 */
export interface TemplateVariables {
  title?: string;
  currentYear?: number;
  isAuthenticated?: boolean;
  [key: string]: any; // Allow custom variables
}

/**
 * Meta tags parsed from HTML comments
 */
export interface TemplateMeta {
  title?: string;
  layout?: string;
  [key: string]: string | undefined;
}

/**
 * Parameters for rendering a page
 */
export interface RenderPageParams {
  pageName: string;
  req: Request;
  customVariables?: Record<string, any>;
}
```

#### 1.7. Plik: `src/types/index.ts`
**AI Task:** Re-export wszystkich typów:

```typescript
// Collections
export * from './collections';

// Webhooks
export * from './webhooks';

// Media
export * from './media';

// Templating
export * from './templating';

// Express augmentation is auto-included via reference
```

**AI Checkpoint:** ✓ Wszystkie core types zdefiniowane, kompilują się bez błędów

---

### **FAZA 2: Migracja Database Layer (Manual)** ⏱️ 8-10h
**Status:** Do wykonania  
**AI Context:** Ręczna migracja z proper typing

#### 2.1. Plik: `src/server/db/connection.ts`
**AI Task:** Zmigruj `connection.js` → `connection.ts`

**Kroki:**
1. Rename file: `connection.js` → `connection.ts`
2. Dodaj Knex types:

```typescript
import knex, { Knex } from 'knex';
const config = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

const db: Knex = knex(connectionConfig);

export default db;
```

#### 2.2. Plik: `src/server/storage.ts`
**AI Task:** Zmigruj `storage.js` → `storage.ts` z full typing

**Strategia:**
1. Import types z `src/types/collections.ts`
2. Type każdą funkcję z proper return types
3. Handle JSON parsing dla `schema` i `data` fields

**Przykład transformacji:**

```typescript
import { Knex } from 'knex';
import db from './db/connection';
import {
  Collection,
  CollectionWithItems,
  CollectionSchema,
  Item,
  ItemInput,
  Webhook,
  WebhookEvent,
  CreateWebhookInput,
} from '../types';

/**
 * Create a new collection
 */
export async function createCollection(
  name: string,
  schema?: CollectionSchema
): Promise<Collection> {
  const collection: Collection = {
    id: Date.now().toString(),
    name: name,
    schema: schema || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db('collections').insert(collection);
  return collection;
}

/**
 * Get all collections
 */
export async function getCollections(): Promise<Collection[]> {
  return await db<Collection>('collections').select('*');
}

/**
 * Get collection by ID with items
 */
export async function getCollectionById(
  id: string
): Promise<CollectionWithItems | null> {
  const collection = await db<Collection>('collections')
    .where({ id })
    .first();
  
  if (!collection) {
    return null;
  }

  const items = await db<Item>('items').where({ collection_id: id });

  return {
    ...collection,
    items,
  };
}

// AI: Continue for all other functions...
// - updateCollection
// - deleteCollection
// - addItemToCollection
// - updateItemInCollection
// - deleteItemFromCollection
// - getWebhooks
// - addWebhook
// - deleteWebhook
// - initializeStorage
```

**AI Note:** Każda funkcja musi mieć:
- ✅ Explicit return type
- ✅ Typed parameters
- ✅ Typed Knex queries (`db<Type>('table')`)
- ✅ Proper null handling

#### 2.3. Type helper dla Knex
**AI Task:** Opcjonalnie stwórz `src/types/knex.d.ts`:

```typescript
import { Knex } from 'knex';
import { Collection, Item, Webhook } from './index';

declare module 'knex/types/tables' {
  interface Tables {
    collections: Collection;
    collections_composite: Collection;
    items: Item;
    items_composite: Item;
    webhooks: Webhook;
    webhooks_composite: Webhook;
  }
}
```

**AI Checkpoint:** ✓ Database layer fully typed, wszystkie queries typesafe

---

### **FAZA 3: Migracja Server Modules (Manual)** ⏱️ 6-8h
**Status:** Do wykonania  
**AI Context:** Ręczna migracja utility modules

#### 3.1. Plik: `src/server/media.ts`
**AI Task:** Zmigruj `media.js` → `media.ts`

**Kroki:**
1. Import types: `MediaItem`, `MulterFile`
2. Type wszystkie funkcje
3. Handle file system operations z proper error handling

**Przykład:**

```typescript
import fs from 'fs';
import path from 'path';
import { MediaItem, MulterFile } from '../types';

const MEDIA_DIR = path.join(process.cwd(), 'src/server/data');
const MEDIA_FILE = 'media.json';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

function ensureDirectoriesExist(): void {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function getMediaFilePath(): string {
  return path.join(MEDIA_DIR, MEDIA_FILE);
}

export function getAllMedia(): MediaItem[] {
  ensureDirectoriesExist();

  const mediaPath = getMediaFilePath();

  if (!fs.existsSync(mediaPath)) {
    fs.writeFileSync(mediaPath, JSON.stringify([], null, 2));
    return [];
  }

  try {
    const data = fs.readFileSync(mediaPath, 'utf8');
    return JSON.parse(data) as MediaItem[];
  } catch (err) {
    console.error('Error reading media data:', err);
    return [];
  }
}

export function addMedia(file: MulterFile, description?: string): MediaItem {
  ensureDirectoriesExist();

  const media = getAllMedia();
  
  const newMedia: MediaItem = {
    id: Date.now().toString(),
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${file.filename}`,
    description: description || '',
    uploadDate: new Date().toISOString(),
  };
  
  media.push(newMedia);
  
  fs.writeFileSync(getMediaFilePath(), JSON.stringify(media, null, 2));
  
  return newMedia;
}

// AI: Continue with deleteMedia, getMediaById, initializeMediaStorage...
```

#### 3.2. Plik: `src/server/webhooks.ts`
**AI Task:** Zmigruj `webhooks.js` → `webhooks.ts`

**Strategia:**
1. Import wszystkich webhook types
2. Type http client responses
3. Proper error handling

**Przykład:**

```typescript
import * as storage from './storage';
import * as httpClient from '@10xdevspl/http-client';
import {
  Webhook,
  WebhookEvent,
  WebhookPayload,
  CollectionWithItems,
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

async function callWebhook(
  webhook: Webhook,
  data: WebhookPayload
): Promise<any> {
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
    console.error(`Collection not found for webhook notification: ${collectionId}`);
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
```

#### 3.3. Plik: `src/server/templating.ts`
**AI Task:** Zmigruj `templating.js` → `templating.ts`

**Note:** Ten plik jest bardziej złożony ze względu na string manipulation

**Strategia:**
1. Type wszystkie helper functions
2. Handle null cases properly
3. Template variables jako typed object

```typescript
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { TemplateVariables, TemplateMeta } from '../types';

function readFileSync(filepath: string): string | null {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    console.error('Error reading file:', filepath, err);
    return null;
  }
}

function parseMetaTags(content: string): TemplateMeta {
  const meta: TemplateMeta = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('<!-- @')) {
      const tag = trimmed.replace('<!-- @', '').replace(' -->', '');
      const parts = tag.split(':');
      if (parts.length === 2) {
        meta[parts[0]] = parts[1];
      }
    }
  }

  return meta;
}

function injectComponent(
  content: string,
  componentName: string,
  variables: TemplateVariables
): string {
  const componentPath = path.join(
    process.cwd(),
    'src/components',
    `${componentName}.html`
  );
  let componentContent = readFileSync(componentPath);
  
  if (!componentContent) {
    return content;
  }

  componentContent = renderTemplate(componentContent, variables);

  return content.replace(
    `<!-- @inject:${componentName} -->`,
    componentContent
  );
}

function renderWithLayout(
  content: string,
  layoutName: string,
  variables: TemplateVariables
): string {
  const layoutPath = path.join(
    process.cwd(),
    'src/layout',
    `${layoutName}.html`
  );
  let layoutContent = readFileSync(layoutPath);
  
  if (!layoutContent) {
    return content;
  }

  layoutContent = layoutContent.replace('<!-- @content -->', content);
  layoutContent = injectComponent(layoutContent, 'topbar', variables);
  layoutContent = injectComponent(layoutContent, 'footer', variables);

  return renderTemplate(layoutContent, variables);
}

function processConditionals(
  content: string,
  variables: TemplateVariables
): string {
  const ifRegex = /<!-- @if:(\w+) -->([\s\S]*?)<!-- @endif -->/g;
  let match;

  while ((match = ifRegex.exec(content)) !== null) {
    const condition = match[1];
    const conditionalContent = match[2];

    if (variables[condition]) {
      content = content.replace(match[0], conditionalContent);
    } else {
      content = content.replace(match[0], '');
    }
  }

  return content;
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let content = template;

  content = processConditionals(content, variables);

  for (const key in variables) {
    const value = variables[key];
    if (typeof value === 'string' || typeof value === 'number') {
      content = content.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value)
      );
    }
  }

  return content;
}

export function renderPage(
  pageName: string,
  req: Request,
  customVariables?: Record<string, any>
): string | null {
  const pagePath = path.join(
    process.cwd(),
    'src/pages',
    `${pageName}.html`
  );
  let content = readFileSync(pagePath);

  if (!content) {
    return null;
  }

  const meta = parseMetaTags(content);
  const variables: TemplateVariables = {
    title: meta.title || '10xCMS',
    currentYear: new Date().getFullYear(),
    isAuthenticated: !!(req.cookies && req.cookies.auth),
  };

  if (customVariables) {
    Object.assign(variables, customVariables);
  }

  content = content
    .split('\n')
    .filter((line) => !line.trim().startsWith('<!-- @'))
    .join('\n');

  if (meta.layout) {
    content = renderWithLayout(content, meta.layout, variables);
  }

  return content;
}

// Export other functions...
export { renderWithLayout, parseMetaTags };
```

**AI Checkpoint:** ✓ Server modules fully typed

---

### **FAZA 4: Migracja API Routes (Partial ts-migrate + manual)** ⏱️ 4-6h
**Status:** Do wykonania  
**AI Context:** Użyj ts-migrate dla basic structure, potem manual typing

#### 4.1. Plik: `src/server/api.ts`
**AI Task:** Zmigruj `api.js` → `api.ts`

**Kroki:**
1. Rename: `api.js` → `api.ts`
2. Uruchom ts-migrate tylko na tym pliku:
   ```bash
   npx ts-migrate-full src/server/api.ts
   ```
3. Manual fix wszystkich `any` types
4. Type Express Request/Response properly

**Przykład jednego route:**

```typescript
import express, { Request, Response, Router } from 'express';
import * as storageModule from './storage';
import { Collection, CollectionWithItems, Item } from '../types';

const router: Router = express.Router();

// Get all collections
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const collections: Collection[] = await storageModule.getCollections();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single collection
router.get('/collections/:id', async (req: Request, res: Response) => {
  try {
    const collection: CollectionWithItems | null = 
      await storageModule.getCollectionById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI: Continue for all other routes...

export default router;
```

**AI Checkpoint:** ✓ API routes typed

---

### **FAZA 5: Migracja Main App (Manual + Careful)** ⏱️ 8-10h
**Status:** Do wykonania  
**AI Context:** Najbardziej złożony plik - wymaga szczególnej uwagi

#### 5.1. Plik: `index.ts`
**AI Task:** Zmigruj `index.js` → `index.ts`

**Strategia:**
1. **NIE używaj** ts-migrate na tym pliku - zbyt złożony
2. Manual migration od góry do dołu
3. Dziel na sekcje

**Sekcja 1: Imports & Setup**

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

import type { MulterFile } from './src/types';

// Multer configuration
const multerStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Load environment
if (fs.existsSync('.env.development')) {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}

const app: Express = express();
```

**Sekcja 2: Middleware**

```typescript
// Static files
app.use(express.static('public'));
app.use('/vendor', express.static('public/vendor'));
app.use('/images', express.static('public/images'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// API routes
app.use('/api', apiRoutes);

// Custom cookie middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }

  req.cookies = cookies;

  res.setCookie = function (
    name: string,
    value: string,
    options?: {
      maxAge?: number;
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
    }
  ) {
    options = options || {};
    let cookieStr = `${name}=${value}`;

    if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
    if (options.path) cookieStr += `; Path=${options.path}`;
    if (options.httpOnly) cookieStr += '; HttpOnly';
    if (options.secure) cookieStr += '; Secure';

    this.setHeader('Set-Cookie', cookieStr);
    return this;
  };

  next();
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies.auth) {
    res.redirect('/login');
    return;
  }
  next();
}

// Render helper
function renderPage(req: Request, res: Response): void {
  const pageName = req.path === '/' ? 'home' : req.path.substring(1);
  const content = templating.renderPage(pageName, req);

  if (!content) {
    res.status(500).send('Error loading template');
    return;
  }

  res.send(content);
}
```

**AI Note:** `index.ts` ma ~700 linii. Podziel na mniejsze sekcje:
- ✅ Imports & config
- ✅ Middleware setup
- ✅ Auth routes
- ✅ Collection routes (GET)
- ✅ Collection routes (POST/PUT/DELETE)
- ✅ Media routes
- ✅ Webhook routes
- ✅ Server initialization

**Dla każdego route:**
1. Type `req`, `res` parameters
2. Handle async errors properly
3. Type wszystkie local variables
4. Use imported types dla responses

**AI Checkpoint:** ✓ Main app file migrated and typed

---

### **FAZA 6: Partial ts-migrate na pozostałe pliki** ⏱️ 2h
**Status:** Do wykonania  
**AI Context:** Quick migration dla prostych utility files

#### 6.1. Files do ts-migrate
**AI Task:** Uruchom ts-migrate na:
- `src/server/db/knexfile.js` → `knexfile.ts`
- Inne helper files (jeśli istnieją)

```bash
# AI: Dla każdego pliku
npx ts-migrate rename src/server/db/knexfile.js
npx ts-migrate-full src/server/db/knexfile.ts
```

**AI Checkpoint:** ✓ Utility files migrated

---

### **FAZA 7: Frontend (Opcjonalnie - low priority)** ⏱️ 4-6h
**Status:** Opcjonalne  
**AI Context:** Frontend może pozostać jako JS lub migrować później

#### 7.1. public/app.js
**AI Decision Point:**

**Opcja A:** Zostaw jako `.js` (REKOMENDOWANE)
- Frontend JavaScript może działać bez TypeScript
- Mniejszy scope migracji
- Focus na backend first

**Opcja B:** Migruj do TypeScript
- Rename: `app.js` → `app.ts`
- Type jQuery operations (trudne)
- Compile z webpack/esbuild

**AI Task:** Jeśli wybrano Opcję B:
```bash
npx ts-migrate rename public/app.js
npx ts-migrate-full public/app.ts
# Potem manual fix jQuery types
```

**AI Checkpoint:** ✓ Frontend decision made

---

### **FAZA 8: Cleanup & Quality** ⏱️ 4-6h
**Status:** Do wykonania  
**AI Context:** Remove technical debt

#### 8.1. Find & Replace all `any`
**AI Task:** Search projekt dla wszystkich `any`:

```bash
# AI: Search for 'any' usage
grep -r ": any" src/
grep -r "any\[\]" src/
grep -r "Record<string, any>" src/
```

**Dla każdego znalezionego `any`:**
1. Sprawdź czy można użyć `unknown`
2. Sprawdź czy można stworzyć specific type
3. Jeśli musi być `any`, dodaj komentarz `// @ts-expect-error TODO: type this`

#### 8.2. Remove all `$TSFixMe`
**AI Task:** Search i replace:

```bash
# AI: Find all $TSFixMe
grep -r "\$TSFixMe" src/

# For each occurrence:
# 1. Analyze context
# 2. Replace with proper type
# 3. If complex, use 'unknown' temporarily
```

#### 8.3. Update tsconfig.json
**AI Task:** Update compiler options:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "allowJs": false,           // Changed: no more JS files
    "checkJs": false,
    "jsx": "preserve",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "removeComments": true,
    "strict": false,            // Keep false for now
    "noImplicitAny": true,      // Enable this
    "strictNullChecks": false,  // Keep false for now
    "noUnusedLocals": true,     // Enable this
    "noUnusedParameters": true, // Enable this
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*",
    "index.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "public/vendor",
    "test-results",
    "playwright-report"
  ]
}
```

#### 8.4. Lint & Format
**AI Task:**

```bash
# AI: Run TypeScript compiler
npx tsc --noEmit

# Fix all errors before proceeding
# Common errors:
# - Missing return types
# - Implicit any
# - Untyped imports
```

**AI Checkpoint:** ✓ No compilation errors, clean codebase

---

### **FAZA 9: Testing & Verification** ⏱️ 2-3h
**Status:** Do wykonania  
**AI Context:** Verify everything works

#### 9.1. Run existing tests
**AI Task:**

```bash
# Unit tests
npm test

# E2E tests (already in TypeScript)
npm run test:e2e

# Should all pass without changes
```

#### 9.2. Manual testing checklist
**AI Task:** Test critical paths:

- [ ] Login/logout works
- [ ] Create collection
- [ ] Add items to collection
- [ ] Edit items
- [ ] Delete items
- [ ] Upload media
- [ ] Delete media
- [ ] Create webhook
- [ ] Delete webhook
- [ ] Webhook triggers on item create/update/delete

#### 9.3. Build test
**AI Task:**

```bash
# Compile TypeScript
npx tsc

# Check dist/ folder
ls dist/

# Try running compiled code
node dist/index.js
```

**AI Checkpoint:** ✓ All tests pass, app runs successfully

---

### **FAZA 10: Documentation & Commit** ⏱️ 1h
**Status:** Do wykonania  
**AI Context:** Finalize migration

#### 10.1. Update package.json scripts
**AI Task:**

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node index.ts",
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "mocha \"src/**/*.test.ts\"",
    "test:e2e": "playwright test"
  }
}
```

#### 10.2. Update README.md
**AI Task:** Add TypeScript section:

```markdown
## TypeScript Migration

This project has been migrated to TypeScript.

### Development
```bash
npm run dev        # Run with ts-node
npm run build      # Compile TypeScript
npm start          # Run compiled code
```

### Type Definitions
Core types are located in `src/types/`:
- `collections.ts` - Collection and Item types
- `webhooks.ts` - Webhook types
- `media.ts` - Media types
- `express.d.ts` - Express augmentation
```

#### 10.3. Create migration summary
**AI Task:** Create `docs/typescript-migration-summary.md`:

```markdown
# TypeScript Migration Summary

## Migration Date
[Date]

## Files Migrated
- Total files: X
- Manual migrations: Y
- ts-migrate assisted: Z

## Type Coverage
- Explicit types: ~90%
- Any usage: ~10%
- Unknown usage: ~5%

## Known Issues / Technical Debt
- [ ] Some HTML generation still uses string concatenation
- [ ] A few complex middleware functions have loose typing
- [ ] Frontend (public/app.js) not migrated

## Next Steps
1. Enable `strict: true` in tsconfig.json
2. Enable `strictNullChecks: true`
3. Migrate frontend to TypeScript
4. Add runtime validation with Zod/Joi
```

#### 10.4. Git commit
**AI Task:**

```bash
git add .
git commit -m "feat: migrate project to TypeScript

- Migrated all backend files to TypeScript
- Added comprehensive type definitions
- Updated build scripts and configuration
- All tests passing

BREAKING CHANGE: Project now requires TypeScript compilation before running"

git push origin feature/typescript-migration
```

**AI Checkpoint:** ✓ Migration complete and documented

---

## 📊 Success Criteria

### Must Have (Required for completion):
- [x] All `.js` files renamed to `.ts`
- [x] Project compiles without errors (`tsc --noEmit`)
- [x] All existing tests pass
- [x] Core types defined in `src/types/`
- [x] Database layer fully typed
- [x] API routes typed
- [x] Express middleware typed
- [x] No `$TSFixMe` in codebase
- [x] `noImplicitAny: true` enabled

### Nice to Have (Quality goals):
- [ ] Less than 10% `any` usage
- [ ] Frontend migrated to TypeScript
- [ ] `strict: true` enabled
- [ ] Runtime validation added
- [ ] JSDoc comments for public APIs

### Documentation:
- [x] README updated
- [x] Migration summary created
- [x] Type definitions documented
- [x] Known issues listed

---

## 🚨 Common Pitfalls for AI Agent

### ❌ DON'T:
1. **Don't use ts-migrate on complex files** like `index.js` - too risky
2. **Don't leave `$TSFixMe` uncommented** - always add TODO
3. **Don't use `any` for Knex queries** - use `db<Type>('table')`
4. **Don't ignore Express type augmentation** - req.cookies needs typing
5. **Don't skip testing after migration** - verify app still works
6. **Don't enable strict mode too early** - gradual strictness
7. **Don't forget JSON.parse handling** - type the parsed data

### ✅ DO:
1. **Do commit frequently** - after each phase
2. **Do test incrementally** - don't wait until end
3. **Do add comments** - especially for complex types
4. **Do use `unknown` over `any`** - safer default
5. **Do handle null/undefined explicitly** - avoid runtime errors
6. **Do use type guards** - for JSON parsing and conditionals
7. **Do reference this plan** - when stuck, check the checklist

---

## 🔧 AI Agent Commands Cheatsheet

### TypeScript compilation:
```bash
npx tsc --noEmit                    # Check for errors
npx tsc                             # Compile to dist/
npx tsc --watch                     # Watch mode
```

### ts-migrate:
```bash
npx ts-migrate rename <file>        # Rename .js to .ts
npx ts-migrate-full <file>          # Full migration
npx ts-migrate init <folder>        # Initialize config
```

### Finding issues:
```bash
grep -r "any" src/                  # Find any types
grep -r "\$TSFixMe" src/            # Find TSFixMe
grep -r "@ts-ignore" src/           # Find ts-ignore
grep -r "as any" src/               # Find type assertions
```

### Testing:
```bash
npm test                            # Unit tests
npm run test:e2e                    # E2E tests
node dist/index.js                  # Test compiled code
```

---

## 📈 Progress Tracking

| Faza | Status | Czas | Notatki |
|------|--------|------|---------|
| 0. Przygotowanie | ⏳ Pending | 30 min | - |
| 1. Definicje typów | ⏳ Pending | 2-3h | - |
| 2. Database Layer | ⏳ Pending | 8-10h | - |
| 3. Server Modules | ⏳ Pending | 6-8h | - |
| 4. API Routes | ⏳ Pending | 4-6h | - |
| 5. Main App | ⏳ Pending | 8-10h | - |
| 6. Pozostałe pliki | ⏳ Pending | 2h | - |
| 7. Frontend | ⏳ Optional | 4-6h | - |
| 8. Cleanup | ⏳ Pending | 4-6h | - |
| 9. Testing | ⏳ Pending | 2-3h | - |
| 10. Dokumentacja | ⏳ Pending | 1h | - |

**Total Estimated Time:** 30-40 godzin

---

## 🎓 Learning Resources for AI Agent

### When stuck on types:
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Express types: https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express
- Knex types: https://knexjs.org/guide/typescript.html

### Common patterns:
```typescript
// Type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Generic function
function identity<T>(value: T): T {
  return value;
}

// Async function
async function fetchData(): Promise<Data> {
  return await db.query();
}

// Middleware
function middleware(req: Request, res: Response, next: NextFunction): void {
  // ...
  next();
}
```

---

## 📞 Contact & Support

If AI Agent encounters blocking issues:
1. Check this plan's "Common Pitfalls" section
2. Check TypeScript compiler error message
3. Search for similar issue in project history
4. Document the blocker in migration summary
5. Skip and mark as TODO, continue with next phase

**Remember:** Perfection is not required. Working, type-safe code is the goal.

---

**Plan Version:** 1.0  
**Last Updated:** 2025-11-03  
**Status:** Ready for AI Agent execution  
**Estimated Completion:** 30-40 hours
