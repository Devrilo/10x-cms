import express, { Request, Response, Router } from 'express';
import * as storageModule from './storage';
import { Collection, CollectionWithItems, Item } from '../types';

const router: Router = express.Router();

// Get all collections
router.get('/collections', async (_req: Request, res: Response) => {
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

// Get collection items
router.get('/collections/:id/items', async (req: Request, res: Response) => {
  try {
    const collection: CollectionWithItems | null = 
      await storageModule.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection.items);
  } catch (error) {
    console.error('Error fetching collection items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single item
router.get(
  '/collections/:collectionId/items/:itemId',
  async (req: Request, res: Response) => {
    try {
      const collection: CollectionWithItems | null = 
        await storageModule.getCollectionById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      const item: Item | undefined = collection.items.find(
        (item) => item.id === req.params.itemId
      );

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
