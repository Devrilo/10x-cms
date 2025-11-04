/**
 * Modeling Context - Repository
 * Persistence layer for ContentType aggregate
 * 
 * Following Repository pattern: separates domain logic from data access
 */

const { ContentType } = require('../domain/ContentType');
const { Result } = require('../../shared/types');

class ContentTypeRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'content_types';
  }

  /**
   * Find ContentType by ID
   */
  async findById(id) {
    try {
      const row = await this.db(this.tableName).where({ id }).first();
      if (!row) {
        return Result.failure({ code: 'NOT_FOUND', message: 'ContentType not found' });
      }

      const contentType = this.hydrate(row);
      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Find ContentType by name
   */
  async findByName(name) {
    try {
      const row = await this.db(this.tableName).where({ name }).first();
      if (!row) {
        return Result.failure({ code: 'NOT_FOUND', message: 'ContentType not found' });
      }

      const contentType = this.hydrate(row);
      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Find all ContentTypes
   */
  async findAll(options = {}) {
    try {
      let query = this.db(this.tableName);

      // Filter by deprecated status
      if (options.includeDeprecated === false) {
        query = query.where({ is_deprecated: false });
      }

      const rows = await query.select('*');
      const contentTypes = rows.map(row => this.hydrate(row));
      
      return Result.success(contentTypes);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Save ContentType (create or update)
   */
  async save(contentType) {
    try {
      const data = this.dehydrate(contentType);
      
      // Check if exists
      const existing = await this.db(this.tableName).where({ id: contentType.id }).first();
      
      if (existing) {
        // Update
        await this.db(this.tableName)
          .where({ id: contentType.id })
          .update(data);
      } else {
        // Insert
        await this.db(this.tableName).insert(data);
      }

      return Result.success(contentType);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Delete ContentType
   */
  async delete(id) {
    try {
      const deleted = await this.db(this.tableName).where({ id }).delete();
      
      if (deleted === 0) {
        return Result.failure({ code: 'NOT_FOUND', message: 'ContentType not found' });
      }

      return Result.success({ deleted: true });
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Convert database row to ContentType domain object
   */
  hydrate(row) {
    const fieldsData = typeof row.fields === 'string' 
      ? JSON.parse(row.fields) 
      : row.fields;

    const metadataData = typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata;

    return new ContentType({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      version: row.version,
      fields: fieldsData,
      metadata: metadataData,
      isDeprecated: row.is_deprecated,
      deprecationReason: row.deprecation_reason
    });
  }

  /**
   * Convert ContentType domain object to database row
   */
  dehydrate(contentType) {
    return {
      id: contentType.id,
      name: contentType.name,
      display_name: contentType.displayName,
      description: contentType.description,
      version: contentType.version,
      fields: JSON.stringify(contentType.fields.map(f => f.toJSON())),
      metadata: JSON.stringify(contentType.metadata),
      is_deprecated: contentType.isDeprecated,
      deprecation_reason: contentType.deprecationReason,
      created_at: contentType.createdAt,
      updated_at: contentType.updatedAt
    };
  }
}

module.exports = { ContentTypeRepository };
