/**
 * Modeling Context - Application Service
 * Orchestrates use cases for ContentType management
 * 
 * This is the public API of the Modeling Context
 */

const { ContentType, FieldTypes } = require('../domain/ContentType');
const { Result, generateId } = require('../../shared/types');
const { DomainEvent } = require('../../shared/types');

class ModelingService {
  constructor(contentTypeRepository, eventBus) {
    this.repository = contentTypeRepository;
    this.eventBus = eventBus;
  }

  /**
   * Define a new ContentType
   */
  async defineContentType(config) {
    try {
      // Check if ContentType with same name exists
      const existingResult = await this.repository.findByName(config.name);
      if (existingResult.isSuccess) {
        return Result.failure({ 
          code: 'DUPLICATE_NAME', 
          message: `ContentType with name '${config.name}' already exists` 
        });
      }

      // Create ContentType
      const contentType = new ContentType({
        id: generateId('type'),
        ...config
      });

      // Save to repository
      const saveResult = await this.repository.save(contentType);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'contentType.created',
        contentType.id,
        {
          typeId: contentType.id,
          name: contentType.name,
          version: contentType.version,
          fields: contentType.fields.map(f => f.toJSON())
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Update an existing ContentType
   */
  async updateContentType(typeId, updates) {
    try {
      // Find existing ContentType
      const result = await this.repository.findById(typeId);
      if (!result.isSuccess) {
        return result;
      }

      const contentType = result.value;
      const oldVersion = contentType.version;

      // Apply updates
      if (updates.displayName) contentType.displayName = updates.displayName;
      if (updates.description) contentType.description = updates.description;
      if (updates.metadata) contentType.metadata = { ...contentType.metadata, ...updates.metadata };

      contentType.updateTimestamp();
      contentType.incrementVersion();

      // Save changes
      const saveResult = await this.repository.save(contentType);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'contentType.updated',
        contentType.id,
        {
          typeId: contentType.id,
          oldVersion,
          newVersion: contentType.version,
          breaking: false
        }
      );
      await this.eventBus.publish(event);

      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Add a field to ContentType
   */
  async addField(typeId, fieldConfig) {
    try {
      const result = await this.repository.findById(typeId);
      if (!result.isSuccess) {
        return result;
      }

      const contentType = result.value;
      
      // Add field (domain logic handles validation)
      const field = contentType.addField(fieldConfig);

      // Save changes
      const saveResult = await this.repository.save(contentType);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'contentType.field_added',
        contentType.id,
        {
          typeId: contentType.id,
          fieldName: field.name,
          fieldType: field.type,
          required: field.required
        }
      );
      await this.eventBus.publish(event);

      return Result.success({ contentType, field });
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Deprecate a field
   */
  async deprecateField(typeId, fieldName, reason, alternatives) {
    try {
      const result = await this.repository.findById(typeId);
      if (!result.isSuccess) {
        return result;
      }

      const contentType = result.value;
      const field = contentType.deprecateField(fieldName, reason, alternatives);

      // Save changes
      const saveResult = await this.repository.save(contentType);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      // Emit domain event
      const event = new DomainEvent(
        'contentType.field_deprecated',
        contentType.id,
        {
          typeId: contentType.id,
          fieldName,
          reason,
          alternatives
        }
      );
      await this.eventBus.publish(event);

      return Result.success({ contentType, field });
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Validate content against ContentType schema
   */
  async validateContent(typeId, data) {
    try {
      const result = await this.repository.findById(typeId);
      if (!result.isSuccess) {
        return result;
      }

      const contentType = result.value;
      const validationResult = contentType.validate(data);

      return Result.success(validationResult);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /**
   * Get ContentType by ID
   */
  async getContentType(typeId) {
    return await this.repository.findById(typeId);
  }

  /**
   * Get ContentType by name
   */
  async getContentTypeByName(name) {
    return await this.repository.findByName(name);
  }

  /**
   * List all ContentTypes
   */
  async listContentTypes(options = {}) {
    return await this.repository.findAll(options);
  }

  /**
   * Deprecate entire ContentType
   */
  async deprecateContentType(typeId, reason) {
    try {
      const result = await this.repository.findById(typeId);
      if (!result.isSuccess) {
        return result;
      }

      const contentType = result.value;
      contentType.deprecate(reason);

      const saveResult = await this.repository.save(contentType);
      if (!saveResult.isSuccess) {
        return saveResult;
      }

      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'INTERNAL_ERROR', message: error.message });
    }
  }
}

module.exports = { ModelingService, FieldTypes };
