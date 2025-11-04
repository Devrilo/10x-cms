/**
 * Content Management API - DDD Implementation
 * 
 * New RESTful API endpoints for full DDD features
 * Provides more granular control than backward-compatible API
 */

const express = require('express');
const router = express.Router();
const { getModules } = require('../modules/bootstrap');

// Get modules singleton
let modules = null;
function getServices() {
  if (!modules) {
    modules = getModules();
  }
  return modules;
}

// ========== ContentType Management (Modeling Context) ==========

/**
 * GET /api/v2/content-types
 * List all content types
 */
router.get('/content-types', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const includeDeprecated = req.query.includeDeprecated === 'true';
    
    const result = await modelingService.listContentTypes({ includeDeprecated });
    
    if (!result.isSuccess) {
      return res.status(500).json({ error: result.error.message });
    }

    res.json({
      success: true,
      contentTypes: result.value.map(ct => ct.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/v2/content-types/:id
 * Get single content type
 */
router.get('/content-types/:id', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const result = await modelingService.getContentType(req.params.id);
    
    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }

    res.json({
      success: true,
      contentType: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content-types
 * Create new content type
 */
router.post('/content-types', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const { name, displayName, description, fields } = req.body;

    const result = await modelingService.defineContentType({
      name,
      displayName,
      description,
      fields
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({
      success: true,
      contentType: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /api/v2/content-types/:id
 * Update content type
 */
router.put('/content-types/:id', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const updates = req.body;

    const result = await modelingService.updateContentType(req.params.id, updates);

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content-types/:id/fields
 * Add field to content type
 */
router.post('/content-types/:id/fields', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const fieldConfig = req.body;

    const result = await modelingService.addField(req.params.id, fieldConfig);

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({
      success: true,
      data: {
        contentType: result.value.contentType.toJSON(),
        field: result.value.field.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content-types/:id/validate
 * Validate content against schema
 */
router.post('/content-types/:id/validate', async (req, res) => {
  try {
    const { modelingService } = getServices();
    const data = req.body;

    const result = await modelingService.validateContent(req.params.id, data);

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ========== Content Management (Content Catalog Context) ==========

/**
 * POST /api/v2/content
 * Create new content
 */
router.post('/content', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const { typeId, title, slug, data, metadata, organizationId } = req.body;
    
    // TODO: Get userId from authentication middleware
    const userId = req.headers['x-user-id'] || 'system';

    const result = await contentCatalogService.createContent({
      typeId,
      title,
      slug,
      data,
      metadata,
      authorId: userId,
      organizationId: organizationId || 'default',
      skipValidation: true // Allow creating draft content without full validation
    });

    if (!result.isSuccess) {
      return res.status(400).json({ 
        error: result.error.message,
        errors: result.error.errors 
      });
    }

    res.status(201).json({
      success: true,
      content: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/v2/content/:id
 * Get content by ID
 */
router.get('/content/:id', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const result = await contentCatalogService.getContent(req.params.id);

    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }

    res.json({
      success: true,
      content: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /api/v2/content/:id
 * Update content
 */
router.put('/content/:id', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const { data, changeDescription } = req.body;
    const userId = req.headers['x-user-id'] || 'system';

    const result = await contentCatalogService.updateContent(
      req.params.id,
      data,
      userId,
      changeDescription
    );

    if (!result.isSuccess) {
      return res.status(400).json({ 
        error: result.error.message,
        errors: result.error.errors 
      });
    }

    res.json({
      success: true,
      data: {
        contentItem: result.value.contentItem.toJSON(),
        version: result.value.version.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content/:id/publish
 * Publish content
 */
router.post('/content/:id/publish', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const userId = req.headers['x-user-id'] || 'system';
    const channels = req.body.channels || ['api'];

    const result = await contentCatalogService.publishContent(req.params.id, userId, channels);

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content/:id/state
 * Change content state
 */
router.post('/content/:id/state', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const { state, reason } = req.body;
    const userId = req.headers['x-user-id'] || 'system';

    const result = await contentCatalogService.changeContentState(
      req.params.id,
      state,
      userId,
      reason
    );

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/v2/content/:id/versions
 * Get version history
 */
router.get('/content/:id/versions', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const result = await contentCatalogService.getVersionHistory(req.params.id);

    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value.map(v => v.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/v2/content/:id/relationships
 * Add relationship
 */
router.post('/content/:id/relationships', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const { targetId, type, metadata } = req.body;

    const result = await contentCatalogService.addRelationship(
      req.params.id,
      targetId,
      type,
      metadata
    );

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({
      success: true,
      data: result.value.relationship.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/v2/content/:id/related
 * Get related content
 */
router.get('/content/:id/related', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const result = await contentCatalogService.getRelatedContent(req.params.id);

    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }

    res.json({
      success: true,
      data: result.value.map(c => c.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/v2/content
 * Query content
 */
router.get('/content', async (req, res) => {
  try {
    const { contentCatalogService } = getServices();
    const { state, typeId, organizationId, limit, offset } = req.query;

    let result;
    if (state) {
      result = await contentCatalogService.getContentByState(state, { 
        typeId,
        organizationId 
      });
    } else if (organizationId) {
      result = await contentCatalogService.getContentForOrganization(organizationId, {
        state,
        typeId,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });
    } else {
      // No filters - return all content (useful for admin)
      // We'll query with a default org or combine results
      result = await contentCatalogService.getContentForOrganization('org_default', {
        state,
        typeId,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      });
    }

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      content: result.value.map(c => c.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// ========== Event History ==========

/**
 * GET /api/v2/events/:aggregateId
 * Get event history for an aggregate
 */
router.get('/events/:aggregateId', async (req, res) => {
  try {
    const { eventBus } = getServices();
    const events = await eventBus.getEventHistory(req.params.aggregateId);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
