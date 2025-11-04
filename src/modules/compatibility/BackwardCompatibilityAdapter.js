/**
 * Backward Compatibility Adapter
 * Maps old "collections" and "items" API to new DDD bounded contexts
 * 
 * This maintains API compatibility while using new domain model underneath
 */

const { FieldTypes } = require('../modeling/application/ModelingService');
const { generateId } = require('../shared/types');

class BackwardCompatibilityAdapter {
  constructor(modelingService, contentCatalogService) {
    this.modelingService = modelingService;
    this.contentCatalogService = contentCatalogService;
  }

  /**
   * Get all collections (maps to ContentTypes)
   */
  async getCollections() {
    const result = await this.modelingService.listContentTypes({ includeDeprecated: false });
    
    if (!result.isSuccess) {
      throw new Error(result.error.message);
    }

    // Map ContentTypes to old collection format
    return result.value.map(contentType => this.mapContentTypeToCollection(contentType));
  }

  /**
   * Get single collection by ID
   */
  async getCollectionById(id) {
    const result = await this.modelingService.getContentType(id);
    
    if (!result.isSuccess) {
      return null;
    }

    const contentType = result.value;
    
    // Get all content items for this type
    const itemsResult = await this.contentCatalogService.getContentByState('published', { typeId: id });
    const draftItemsResult = await this.contentCatalogService.getContentByState('draft', { typeId: id });
    
    const items = [
      ...(itemsResult.isSuccess ? itemsResult.value : []),
      ...(draftItemsResult.isSuccess ? draftItemsResult.value : [])
    ];

    const collection = this.mapContentTypeToCollection(contentType);
    collection.items = items.map(item => this.mapContentItemToItem(item));

    return collection;
  }

  /**
   * Create new collection (creates ContentType)
   */
  async createCollection(name, schema) {
    // Convert old schema format to new ContentType format
    const fields = this.convertSchemaToFields(schema);

    const result = await this.modelingService.defineContentType({
      name,
      displayName: name,
      fields
    });

    if (!result.isSuccess) {
      throw new Error(result.error.message);
    }

    return this.mapContentTypeToCollection(result.value);
  }

  /**
   * Update collection (updates ContentType)
   */
  async updateCollection(id, updates) {
    const result = await this.modelingService.updateContentType(id, {
      displayName: updates.name,
      description: updates.description
    });

    if (!result.isSuccess) {
      throw new Error(result.error.message);
    }

    // Return full collection with items
    return await this.getCollectionById(id);
  }

  /**
   * Delete collection (deprecates ContentType)
   */
  async deleteCollection(id) {
    const result = await this.modelingService.deprecateContentType(id, 'Deleted via API');
    return result.isSuccess;
  }

  /**
   * Add item to collection (creates ContentItem)
   */
  async addItemToCollection(collectionId, itemData, userId = 'system', organizationId = 'default') {
    const result = await this.contentCatalogService.createContent({
      typeId: collectionId,
      title: itemData.title || 'Untitled',
      slug: itemData.slug || '',
      data: itemData,
      authorId: userId,
      organizationId
    });

    if (!result.isSuccess) {
      throw new Error(result.error.message);
    }

    return this.mapContentItemToItem(result.value);
  }

  /**
   * Update item in collection
   */
  async updateItemInCollection(collectionId, itemId, updates, userId = 'system') {
    const result = await this.contentCatalogService.updateContent(
      itemId,
      updates,
      userId,
      'Updated via API'
    );

    if (!result.isSuccess) {
      throw new Error(result.error.message);
    }

    return this.mapContentItemToItem(result.value.contentItem);
  }

  /**
   * Delete item from collection
   */
  async deleteItemFromCollection(collectionId, itemId, userId = 'system') {
    const result = await this.contentCatalogService.deleteContent(
      itemId,
      userId,
      'Deleted via API'
    );

    return result.isSuccess;
  }

  /**
   * Get items from collection
   */
  async getCollectionItems(collectionId) {
    const publishedResult = await this.contentCatalogService.getContentByState('published', { typeId: collectionId });
    const draftResult = await this.contentCatalogService.getContentByState('draft', { typeId: collectionId });
    
    const items = [
      ...(publishedResult.isSuccess ? publishedResult.value : []),
      ...(draftResult.isSuccess ? draftResult.value : [])
    ];

    return items.map(item => this.mapContentItemToItem(item));
  }

  /**
   * Get single item
   */
  async getItem(itemId) {
    const result = await this.contentCatalogService.getContent(itemId);
    
    if (!result.isSuccess) {
      return null;
    }

    return this.mapContentItemToItem(result.value);
  }

  /**
   * Map ContentType to old collection format
   */
  mapContentTypeToCollection(contentType) {
    return {
      id: contentType.id,
      name: contentType.displayName,
      schema: this.mapFieldsToSchema(contentType.fields),
      created_at: contentType.createdAt,
      updated_at: contentType.updatedAt,
      items: [] // Will be populated if requested
    };
  }

  /**
   * Map ContentItem to old item format
   */
  mapContentItemToItem(contentItem) {
    return {
      id: contentItem.id,
      collection_id: contentItem.typeId,
      data: contentItem.data,
      created_at: contentItem.createdAt,
      updated_at: contentItem.updatedAt,
      // Additional metadata for transparency
      _state: contentItem.state,
      _version: contentItem.currentVersion
    };
  }

  /**
   * Convert old schema format to new fields format
   */
  convertSchemaToFields(schema) {
    if (!schema || Object.keys(schema).length === 0) {
      // Default schema for backward compatibility
      return [
        {
          name: 'title',
          type: FieldTypes.STRING,
          required: false
        },
        {
          name: 'content',
          type: FieldTypes.RICH_TEXT,
          required: false
        }
      ];
    }

    // Convert each schema property to field definition
    return Object.entries(schema).map(([name, config]) => ({
      name,
      type: this.mapSchemaTypeToFieldType(config.type),
      required: config.required || false,
      description: config.description || '',
      validations: config.validations || []
    }));
  }

  /**
   * Map old schema types to new field types
   */
  mapSchemaTypeToFieldType(oldType) {
    const typeMap = {
      'string': FieldTypes.STRING,
      'text': FieldTypes.STRING,
      'number': FieldTypes.NUMBER,
      'boolean': FieldTypes.BOOLEAN,
      'date': FieldTypes.DATE,
      'richtext': FieldTypes.RICH_TEXT,
      'relation': FieldTypes.RELATION,
      'media': FieldTypes.MEDIA,
      'array': FieldTypes.ARRAY,
      'object': FieldTypes.OBJECT
    };

    return typeMap[oldType] || FieldTypes.STRING;
  }

  /**
   * Map new fields to old schema format
   */
  mapFieldsToSchema(fields) {
    const schema = {};
    
    fields.forEach(field => {
      schema[field.name] = {
        type: this.mapFieldTypeToSchemaType(field.type),
        required: field.required,
        description: field.description
      };
    });

    return schema;
  }

  /**
   * Map new field types to old schema types
   */
  mapFieldTypeToSchemaType(fieldType) {
    const typeMap = {
      [FieldTypes.STRING]: 'string',
      [FieldTypes.NUMBER]: 'number',
      [FieldTypes.BOOLEAN]: 'boolean',
      [FieldTypes.DATE]: 'date',
      [FieldTypes.RICH_TEXT]: 'richtext',
      [FieldTypes.RELATION]: 'relation',
      [FieldTypes.MEDIA]: 'media',
      [FieldTypes.ARRAY]: 'array',
      [FieldTypes.OBJECT]: 'object'
    };

    return typeMap[fieldType] || 'string';
  }
}

module.exports = { BackwardCompatibilityAdapter };
