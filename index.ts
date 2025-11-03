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

import type { MulterFile, Collection, CollectionWithItems, Webhook, CollectionSchema, WebhookEvent } from './src/types';

// Multer configuration
const multerStorage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
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

// Webhooks page
app.get('/webhooks', requireAuth, async (req: Request, res: Response) => {
  try {
    let webhooksListHtml = '';
    const collections: Collection[] = await storageModule.getCollections();
    let collectionsDropdownHtml = '';

    if (collections.length === 0) {
      collectionsDropdownHtml = '<option value="">No collections available</option>';
    } else {
      collectionsDropdownHtml = '<option value="">Select collection...</option>';
      for (const collection of collections) {
        collectionsDropdownHtml += `<option value="${collection.id}">${collection.name}</option>`;
      }

      let hasWebhooks = false;
      for (const collection of collections) {
        const webhooks: Webhook[] = await storageModule.getWebhooks(collection.id);

        if (webhooks.length > 0) {
          hasWebhooks = true;
          webhooksListHtml += '<div class="mb-4">';
          webhooksListHtml += `<h6 class="mb-3">${collection.name}</h6>`;

          for (const webhook of webhooks) {
            const events = typeof webhook.events === 'string' 
              ? JSON.parse(webhook.events) 
              : webhook.events;
            
            webhooksListHtml += '<div class="card mb-2">';
            webhooksListHtml += '<div class="card-body">';
            webhooksListHtml += '<div class="d-flex justify-content-between align-items-center">';
            webhooksListHtml += '<div>';
            webhooksListHtml += `<p class="mb-1"><strong>URL:</strong> ${webhook.url}</p>`;
            webhooksListHtml += `<p class="mb-0"><small class="text-muted">Events: ${events.join(', ')}</small></p>`;
            webhooksListHtml += '</div>';
            webhooksListHtml += `<button class="btn btn-danger btn-sm delete-webhook" data-id="${webhook.id}">Delete</button>`;
            webhooksListHtml += '</div>';
            webhooksListHtml += '</div>';
            webhooksListHtml += '</div>';
          }

          webhooksListHtml += '</div>';
        }
      }

      if (!hasWebhooks) {
        webhooksListHtml = "<p class='alert alert-info text-dark'>No webhooks configured yet.</p>";
      }
    }

    const content = templating.renderPage('webhooks', req, {
      webhooksListHtml,
      collectionsDropdownHtml,
    });

    if (!content) {
      res.status(500).send('Error loading template');
      return;
    }

    res.send(content);
  } catch (error) {
    console.error('Error loading webhooks page:', error);
    res.status(500).send('Error loading webhooks');
  }
});

app.post('/api/webhooks', requireAuth, async (req: Request, res: Response) => {
  try {
    const collectionId: string = req.body.collection;
    const url: string = req.body.url;
    const events: string[] = req.body.events || [];

    if (!collectionId || !url || events.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that events only contain allowed values
    const allowedEvents: WebhookEvent[] = ['create', 'update', 'delete'];
    const validEvents = events.every((event) => allowedEvents.includes(event as WebhookEvent));

    if (!validEvents) {
      return res.status(400).json({ error: 'Invalid event types provided' });
    }

    const webhook = await storageModule.addWebhook(collectionId, url, events as WebhookEvent[]);
    res.json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Error creating webhook' });
  }
});

app.delete('/api/webhooks/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await storageModule.deleteWebhook(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Webhook not found' });
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Error deleting webhook' });
  }
});

// Collections page
app.get('/collections', requireAuth, async (req: Request, res: Response) => {
  try {
    const collections: Collection[] = await storageModule.getCollections();
    let collectionsHtml = '';

    if (collections.length === 0) {
      collectionsHtml = '<div class="col-12"><p class="alert alert-info text-dark">No collections found. Create your first collection to get started.</p></div>';
    } else {
      for (const collection of collections) {
        const collectionWithItems: CollectionWithItems | null = 
          await storageModule.getCollectionById(collection.id);
        const itemsCount = collectionWithItems?.items?.length || 0;

        collectionsHtml += '<div class="col-md-4 mb-4">';
        collectionsHtml += '<div class="card">';
        collectionsHtml += '<div class="card-body">';
        collectionsHtml += `<!-- @collectionId:${collection.id} -->`;
        collectionsHtml += `<h5 class="card-title">${collection.name}</h5>`;
        collectionsHtml += `<p class="card-text">Items: ${itemsCount}</p>`;
        collectionsHtml += '<div class="d-flex justify-content-between">';
        collectionsHtml += `<a href="/collections/${collection.id}" class="btn btn-primary">View Collection</a>`;
        collectionsHtml += `<button class="btn btn-danger delete-collection-btn" data-id="${collection.id}" data-name="${collection.name}">Delete</button>`;
        collectionsHtml += '</div>';
        collectionsHtml += '</div></div></div>';
      }
    }

    const content = templating.renderPage('collections', req, {
      collectionsHtml,
    });

    if (!content) {
      res.status(500).send('Error loading template');
      return;
    }

    res.send(content);
  } catch (error) {
    console.error('Error loading collections page:', error);
    res.status(500).send('Error loading collections');
  }
});

// Single collection page
app.get('/collections/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const collectionId = req.params.id;
    const collection: CollectionWithItems | null = 
      await storageModule.getCollectionById(collectionId);

    if (!collection) {
      res.status(404).send('Collection not found');
      return;
    }

    let itemsHtml = '';
    let formFieldsHtml = '';

    // Only iterate over actual schema fields, not system fields
    let schema: CollectionSchema;
    if (typeof collection.schema === 'string') {
      try {
        schema = JSON.parse(collection.schema);
      } catch (e) {
        console.error('Error parsing schema:', e);
        schema = {};
      }
    } else {
      schema = collection.schema;
    }

    for (const field in schema) {
      const fieldType = schema[field];
      let inputType = 'text';

      if (fieldType === 'number') {
        inputType = 'number';
      } else if (fieldType === 'date') {
        inputType = 'date';
      }

      formFieldsHtml += '<div class="mb-3">';
      formFieldsHtml += `<label for="${field}" class="form-label">${field}</label>`;

      if (fieldType === 'text') {
        formFieldsHtml += `<textarea class="form-control" id="${field}" name="${field}" rows="3"></textarea>`;
      } else if (fieldType === 'media') {
        formFieldsHtml += 
          `<div class="input-group">` +
          `<input type="hidden" id="${field}" name="${field}" class="media-field-input">` +
          `<input type="text" class="form-control media-field-display" id="${field}_display" readonly placeholder="No image selected">` +
          `<button type="button" class="btn btn-primary media-selector-btn" data-field="${field}">Select Image</button>` +
          `</div>` +
          `<div class="mt-2 media-preview-container" id="${field}_preview"></div>`;
      } else {
        formFieldsHtml += `<input type="${inputType}" class="form-control" id="${field}" name="${field}">`;
      }

      formFieldsHtml += '</div>';
    }

    if (!collection.items || collection.items.length === 0) {
      itemsHtml = '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>';
    } else {
      itemsHtml = '<div class="table-responsive"><table class="table table-striped">';
      itemsHtml += '<thead><tr>';

      // Only show schema fields in table headers
      for (const field in schema) {
        itemsHtml += `<th>${field}</th>`;
      }
      itemsHtml += '<th>Actions</th></tr></thead>';

      itemsHtml += '<tbody>';
      for (const item of collection.items) {
        itemsHtml += `<tr data-id="${item.id}">`;

        // Only show schema fields in table cells
        for (const field in schema) {
          const fieldType = schema[field];
          let fieldValue = '';

          // Handle item.data which is stored as JSON in the database
          if (item.data) {
            // If item.data is a string (from JSON), parse it
            if (typeof item.data === 'string') {
              try {
                const parsedData = JSON.parse(item.data);
                fieldValue = String(parsedData[field] || '');
              } catch (e) {
                console.error('Error parsing item data:', e);
              }
            } else {
              // If item.data is already an object
              fieldValue = String(item.data[field] || '');
            }
          }

          // Convert fieldValue to string for display (already done above)
          fieldValue = String(fieldValue || '');

          if (fieldType === 'media' && fieldValue) {
            itemsHtml += `<td><img src="${fieldValue}" alt="Media" class="img-thumbnail" style="max-width: 50px; max-height: 50px;"></td>`;
          } else {
            itemsHtml += `<td>${fieldValue}</td>`;
          }
        }

        itemsHtml += '<td>';
        itemsHtml += '<button class="btn btn-sm btn-primary edit-item-btn">Edit</button> ';
        itemsHtml += '<button class="btn btn-sm btn-danger delete-item-btn">Delete</button>';
        itemsHtml += '</td></tr>';
      }

      itemsHtml += '</tbody></table></div>';
    }

    const variables = {
      collectionName: collection.name,
      itemsHtml,
      formFieldsHtml,
      collectionId: collection.id,
    };

    const content = templating.renderPage('collection', req, variables);

    if (!content) {
      res.status(500).send('Error loading template');
      return;
    }

    res.send(content);
  } catch (error) {
    console.error('Error loading collection page:', error);
    res.status(500).send('Error loading collection');
  }
});

// API routes for collections
app.post('/api/collections', requireAuth, async (req: Request, res: Response) => {
  try {
    const name: string = req.body.name;
    const schema: CollectionSchema = {};

    if (req.body.fieldName && req.body.fieldType) {
      for (let i = 0; i < req.body.fieldName.length; i++) {
        schema[req.body.fieldName[i]] = req.body.fieldType[i];
      }
    }

    const collection = await storageModule.createCollection(name, schema);
    res.json({ success: true, collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Error creating collection' });
  }
});

app.post('/api/collections/:id/items', requireAuth, async (req: Request, res: Response) => {
  try {
    const collectionId = req.params.id;
    const collection = await storageModule.getCollectionById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const addedItem = await storageModule.addItemToCollection(
      collectionId,
      req.body
    );

    try {
      await webhooksModule.onItemCreated(collectionId, addedItem);
    } catch (error) {
      console.error('Error calling webhook for item creation:', error);
    }

    res.json({ success: true, item: addedItem });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Error creating item' });
  }
});

app.put(
  '/api/collections/:collectionId/items/:itemId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { collectionId, itemId } = req.params;
      const collection = await storageModule.getCollectionById(collectionId);

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      const result = await storageModule.updateItemInCollection(
        collectionId,
        itemId,
        req.body
      );

      if (!result) {
        return res.status(404).json({ error: 'Item not found' });
      }

      try {
        await webhooksModule.onItemUpdated(collectionId, result);
      } catch (error) {
        console.error('Error calling webhook for item update:', error);
      }

      res.json({ success: true, item: result });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Error updating item' });
    }
  }
);

app.delete(
  '/api/collections/:collectionId/items/:itemId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const collectionId = req.params.collectionId;
      const itemId = req.params.itemId;

      const success = await storageModule.deleteItemFromCollection(
        collectionId,
        itemId
      );

      if (success) {
        try {
          await webhooksModule.onItemDeleted(collectionId, itemId);
        } catch (error) {
          console.error('Error calling webhook for item deletion:', error);
        }

        res.json({ success: true, message: 'Item deleted successfully' });
      } else {
        res.status(404).json({ error: 'Collection or item not found' });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Error deleting item' });
    }
  }
);

app.delete('/api/collections/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const collectionId = req.params.id;

    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID is required' });
    }

    const success = await storageModule.deleteCollection(collectionId);

    if (success) {
      res.json({ success: true, message: 'Collection deleted successfully' });
    } else {
      res.status(404).json({ error: 'Collection not found' });
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Error deleting collection' });
  }
});

// Login routes
app.get('/login', (req: Request, res: Response) => {
  if (req.cookies.auth) {
    res.redirect('/home');
    return;
  }
  renderPage(req, res);
});

app.post('/login', (req: Request, res: Response) => {
  const username: string = req.body.username;
  const password: string = req.body.password;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.setCookie('auth', 'authenticated', {
      maxAge: 3600, // 1 hour
      path: '/',
      httpOnly: true,
    });

    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/logout', (_req: Request, res: Response) => {
  res.setCookie('auth', '', {
    maxAge: -1,
    path: '/',
  });

  res.redirect('/login');
});

// Protected routes
app.get('/', requireAuth, renderPage);
app.get('/home', requireAuth, renderPage);

// Media Library routes
app.get('/media', requireAuth, (req: Request, res: Response) => {
  const mediaItems = mediaModule.getAllMedia();
  let mediaHtml = '';

  if (mediaItems.length === 0) {
    mediaHtml = '<div class="col-12"><p class="alert alert-info text-dark">No images found. Upload your first image to get started.</p></div>';
  } else {
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      mediaHtml += '<div class="col-md-3 mb-4">';
      mediaHtml += '<div class="card h-100">';
      mediaHtml += `<img src="${item.path}" class="card-img-top" alt="${item.originalname}" style="height: 150px; object-fit: cover;">`;
      mediaHtml += '<div class="card-body">';
      mediaHtml += `<!-- @mediaId:${item.id} -->`;
      mediaHtml += `<h6 class="card-title text-truncate">${item.originalname}</h6>`;
      mediaHtml += `<p class="card-text small text-muted">${item.description || 'No description'}</p>`;
      mediaHtml += '<div class="d-flex justify-content-between">';
      mediaHtml += `<button class="btn btn-sm btn-primary preview-image-btn" data-id="${item.id}" data-path="${item.path}" data-name="${item.originalname}" data-description="${item.description || ''}">Preview</button>`;
      mediaHtml += `<button class="btn btn-sm btn-danger delete-image-btn" data-id="${item.id}">Delete</button>`;
      mediaHtml += '</div>';
      mediaHtml += '</div></div></div>';
    }
  }

  const variables = {
    mediaHtml,
  };

  const content = templating.renderPage('media', req, variables);

  if (!content) {
    res.status(500).send('Error loading template');
    return;
  }

  res.send(content);
});

// API routes for media
app.post(
  '/api/media',
  requireAuth,
  upload.single('image'),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const description = req.body.description || '';
      const mediaItem = mediaModule.addMedia(req.file as MulterFile, description);

      res.json({ success: true, media: mediaItem });
    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: `Error uploading image: ${errorMessage}` });
    }
  }
);

app.get('/api/media', requireAuth, (_req: Request, res: Response) => {
  try {
    const mediaItems = mediaModule.getAllMedia();
    res.json({ success: true, media: mediaItems });
  } catch (err) {
    console.error('Error retrieving media:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Error retrieving media: ${errorMessage}` });
  }
});

app.delete('/api/media/:id', requireAuth, (req: Request, res: Response) => {
  const mediaId = req.params.id;

  if (!mediaId) {
    return res.status(400).json({ error: 'Media ID is required' });
  }

  const success = mediaModule.deleteMedia(mediaId);

  if (success) {
    res.json({ success: true, message: 'Media deleted successfully' });
  } else {
    res.status(404).json({ error: 'Media not found or could not be deleted' });
  }
});

// Initialize storage and start server
(async (): Promise<void> => {
  try {
    await storageModule.initializeStorage();
    console.log('Database initialized successfully');

    // Initialize media storage
    mediaModule.initializeMediaStorage();

    // Start server
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();
