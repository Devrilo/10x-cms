/**
 * Content Catalog Context - Application Service
 * Orchestrates use cases for content management
 * 
 * This is the public API of the Content Catalog Context
 */

const { ContentItem, ContentState } = require('../domain/ContentItem');
const { Result, generateId, DomainEvent } = require('../../shared/types');

class ContentCatalogService {
  constructor(contentItemRepository, modelingService, eventBus) {
    this.repository = contentItemRepository;
    this.modelingService = modelingService;
    this.eventBus = eventBus;
  }

  /**
   * Create new content
   */
  async createContent(config) {
    try {
      // Validate ContentType exists
      const typeResult = await this.modelingService.getContentType(config.typeId);
      if (!typeResult.isSuccess) {
        return Result.failure({ 
          code: 'INVALID_TYPE', 
          message: `ContentType '${config.typeId}' not found` 
        });
      }

      const contentType = typeResult.value;

      // Validate data against schema (skip for draft content)
      if (!config.skipValidation) {
        const validationResult = await this.modelingService.validateContent(config.typeId, config.data);
        if (!validationResult.isSuccess) {
          return validationResult;
        }

        if (!validationResult.value.isValid) {
          return Result.failure({ 
            code: 'VALIDATION_ERROR', 
            message: 'Content validation failed',
            errors: validationResult.value.errors
          });
        }
      }

      // Create ContentItem
      const contentItem = new ContentItem({
        id: generateId('content'),
        typeId: config.typeId,
        typeName: contentType.name,
        title: config.title || '',
        slug: config.slug || '',
        data: config.data,
        metadata: config.metadata || {},
        authorId: config.authorId,
        organizationId: config.organizationId,
        state: ContentState.DRAFT
      });

      // Save to repository
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'content.created',
        contentItem.id,
        {
          contentId: contentItem.id,
          typeId: contentItem.typeId,
          typeName: contentItem.typeName,
          createdBy: contentItem.authorId,
          organizationId: contentItem.organizationId,
          initialState: contentItem.state
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentItem);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId, data, userId, changeDescription = '') {
    try {
      // Find content
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;

      // Check if can edit
      if (!contentItem.canEdit()) {
        return Result.failure({ 
          code: 'INVALID_STATE', 
          message: `Cannot edit content in '${contentItem.state}' state` 
        });
      }

      // Validate data against schema
      const validationResult = await this.modelingService.validateContent(contentItem.typeId, data);
      if (!validationResult.isSuccess) {
        return validationResult;
      }

      if (!validationResult.value.isValid) {
        return Result.failure({ 
          code: 'VALIDATION_ERROR', 
          message: 'Content validation failed',
          errors: validationResult.value.errors
        });
      }

      // Update content (creates new version)
      const version = contentItem.update(data, userId, changeDescription);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'content.updated',
        contentItem.id,
        {
          contentId: contentItem.id,
          versionId: version.id,
          versionNumber: version.versionNumber,
          updatedBy: userId
        }
      );
      await this.eventBus.publish(event);

      return Result.success({ contentItem, version });
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Change content state
   */
  async changeContentState(contentId, newState, userId, reason = '') {
    try {
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;
      const stateChange = contentItem.changeState(newState, userId, reason);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'content.state_changed',
        contentItem.id,
        {
          contentId: contentItem.id,
          oldState: stateChange.oldState,
          newState: stateChange.newState,
          reason: stateChange.reason,
          changedBy: userId
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentItem);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Publish content
   */
  async publishContent(contentId, userId, channels = ['api']) {
    try {
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;

      // Can only publish approved content
      if (!contentItem.canPublish()) {
        return Result.failure({ 
          code: 'INVALID_STATE', 
          message: `Cannot publish content in '${contentItem.state}' state. Must be 'approved'` 
        });
      }

      // Change state to published
      contentItem.publish(userId);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event (Publishing Context will consume this)
      const event = new DomainEvent(
        'content.published',
        contentItem.id,
        {
          contentId: contentItem.id,
          versionId: contentItem.currentVersion,
          publishedBy: userId,
          publishedAt: contentItem.publishedAt,
          channels
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentItem);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Add relationship between content items
   */
  async addRelationship(sourceId, targetId, type, metadata = {}) {
    try {
      const result = await this.repository.findById(sourceId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;

      // Verify target exists
      const targetResult = await this.repository.findById(targetId);
      if (!targetResult.isSuccess) {
        return Result.failure({ 
          code: 'TARGET_NOT_FOUND', 
          message: `Target content '${targetId}' not found` 
        });
      }

      // Add relationship
      const relationship = contentItem.addRelationship(type, targetId, metadata);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'content.relationship_created',
        contentItem.id,
        {
          sourceId,
          targetId,
          relationshipType: type,
          metadata
        }
      );
      await this.eventBus.publish(event);

      return Result.success({ contentItem, relationship });
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Get content by ID
   */
  async getContent(contentId) {
    return await this.repository.findById(contentId);
  }

  /**
   * Get content by state
   */
  async getContentByState(state, options = {}) {
    return await this.repository.findByState(state, options);
  }

  /**
   * Get content for organization
   */
  async getContentForOrganization(organizationId, options = {}) {
    return await this.repository.findByOrganization(organizationId, options);
  }

  /**
   * Get related content
   */
  async getRelatedContent(contentId) {
    return await this.repository.findRelatedContent(contentId);
  }

  /**
   * Get version history
   */
  async getVersionHistory(contentId) {
    try {
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;
      return Result.success(contentItem.versions);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Rollback to previous version
   */
  async rollbackVersion(contentId, versionNumber, userId) {
    try {
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;
      const version = contentItem.rollback(versionNumber, userId);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      return Result.success({ contentItem, version });
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Delete content (soft delete - archive)
   */
  async deleteContent(contentId, userId, reason = '') {
    try {
      const result = await this.repository.findById(contentId);
      if (!result.isSuccess) {
        return result;
      }

      const contentItem = result.value;
      contentItem.archive(userId, reason);

      // Save changes
      const saveResult = await this.repository.save(contentItem);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'content.archived',
        contentItem.id,
        {
          contentId: contentItem.id,
          archivedBy: userId,
          reason,
          softDelete: true
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentItem);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }
}

module.exports = { ContentCatalogService };
