/**
 * Content Catalog Context - Repository
 * Persistence layer for ContentItem aggregate
 */

const { ContentItem, ContentState } = require('../domain/ContentItem');
const { Result } = require('../../shared/types');

class ContentItemRepository {
  constructor(db) {
    this.db = db;
    this.tableName = 'content_items';
    this.versionsTable = 'content_versions';
    this.relationshipsTable = 'content_relationships';
  }

  /**
   * Find ContentItem by ID
   */
  async findById(id) {
    try {
      const row = await this.db(this.tableName).where({ id }).first();
      if (!row) {
        return Result.failure({ code: 'NOT_FOUND', message: 'Content not found' });
      }

      // Load versions
      const versions = await this.db(this.versionsTable)
        .where({ content_id: id })
        .orderBy('version_number', 'asc');

      // Load relationships
      const relationships = await this.db(this.relationshipsTable)
        .where({ source_id: id });

      const contentItem = this.hydrate(row, versions, relationships);
      return Result.success(contentItem);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Find ContentItems by state
   */
  async findByState(state, options = {}) {
    try {
      let query = this.db(this.tableName).where({ state });

      if (options.organizationId) {
        query = query.where({ organization_id: options.organizationId });
      }

      if (options.typeId) {
        query = query.where({ type_id: options.typeId });
      }

      const rows = await query.select('*');
      
      // Load relationships for each content item
      const contentItems = await Promise.all(
        rows.map(async row => {
          const versions = await this.db(this.versionsTable)
            .where({ content_id: row.id })
            .orderBy('version_number', 'asc');

          const relationships = await this.db(this.relationshipsTable)
            .where({ source_id: row.id });

          return this.hydrate(row, versions, relationships);
        })
      );

      return Result.success(contentItems);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Find all ContentItems for an organization
   */
  async findByOrganization(organizationId, options = {}) {
    try {
      let query = this.db(this.tableName).where({ organization_id: organizationId });

      if (options.state) {
        query = query.where({ state: options.state });
      }

      if (options.typeId) {
        query = query.where({ type_id: options.typeId });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const rows = await query.select('*').orderBy('updated_at', 'desc');
      
      const contentItems = await Promise.all(
        rows.map(async row => {
          const versions = await this.db(this.versionsTable)
            .where({ content_id: row.id })
            .orderBy('version_number', 'asc');

          const relationships = await this.db(this.relationshipsTable)
            .where({ source_id: row.id });

          return this.hydrate(row, versions, relationships);
        })
      );

      return Result.success(contentItems);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Find related content
   */
  async findRelatedContent(contentId) {
    try {
      const relationships = await this.db(this.relationshipsTable)
        .where({ source_id: contentId });

      const relatedIds = relationships.map(r => r.target_id);
      
      if (relatedIds.length === 0) {
        return Result.success([]);
      }

      const rows = await this.db(this.tableName).whereIn('id', relatedIds);
      
      const contentItems = await Promise.all(
        rows.map(async row => {
          const versions = await this.db(this.versionsTable)
            .where({ content_id: row.id })
            .orderBy('version_number', 'asc');

          const rels = await this.db(this.relationshipsTable)
            .where({ source_id: row.id });

          return this.hydrate(row, versions, rels);
        })
      );

      return Result.success(contentItems);
    } catch (error) {
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Save ContentItem (create or update)
   */
  async save(contentItem) {
    const trx = await this.db.transaction();

    try {
      const data = this.dehydrate(contentItem);
      
      // Check if exists
      const existing = await trx(this.tableName).where({ id: contentItem.id }).first();
      
      if (existing) {
        // Update main content
        await trx(this.tableName)
          .where({ id: contentItem.id })
          .update(data.main);
      } else {
        // Insert main content
        await trx(this.tableName).insert(data.main);
      }

      // Update versions (delete and reinsert for simplicity)
      await trx(this.versionsTable).where({ content_id: contentItem.id }).delete();
      if (data.versions.length > 0) {
        await trx(this.versionsTable).insert(data.versions);
      }

      // Update relationships (delete and reinsert)
      await trx(this.relationshipsTable).where({ source_id: contentItem.id }).delete();
      if (data.relationships.length > 0) {
        await trx(this.relationshipsTable).insert(data.relationships);
      }

      await trx.commit();
      return Result.success(contentItem);
    } catch (error) {
      await trx.rollback();
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Delete ContentItem
   */
  async delete(id) {
    const trx = await this.db.transaction();

    try {
      // Delete relationships
      await trx(this.relationshipsTable).where({ source_id: id }).delete();
      
      // Delete versions
      await trx(this.versionsTable).where({ content_id: id }).delete();
      
      // Delete main content
      const deleted = await trx(this.tableName).where({ id }).delete();
      
      await trx.commit();

      if (deleted === 0) {
        return Result.failure({ code: 'NOT_FOUND', message: 'Content not found' });
      }

      return Result.success({ deleted: true });
    } catch (error) {
      await trx.rollback();
      return Result.failure({ code: 'DB_ERROR', message: error.message });
    }
  }

  /**
   * Convert database rows to ContentItem domain object
   */
  hydrate(row, versionRows, relationshipRows) {
    const metadata = typeof row.metadata === 'string' 
      ? JSON.parse(row.metadata) 
      : row.metadata;

    const data = typeof row.data === 'string'
      ? JSON.parse(row.data)
      : row.data;

    const versions = versionRows.map(v => ({
      id: v.id,
      versionNumber: v.version_number,
      data: typeof v.data === 'string' ? JSON.parse(v.data) : v.data,
      authorId: v.author_id,
      changeDescription: v.change_description
    }));

    const relationships = relationshipRows.map(r => ({
      type: r.relationship_type,
      targetId: r.target_id,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
    }));

    return new ContentItem({
      id: row.id,
      typeId: row.type_id,
      typeName: row.type_name,
      title: row.title,
      slug: row.slug,
      state: row.state,
      currentVersion: row.current_version,
      data,
      metadata,
      authorId: row.author_id,
      lastModifiedBy: row.last_modified_by,
      publishedAt: row.published_at,
      archivedAt: row.archived_at,
      versions,
      relationships,
      organizationId: row.organization_id
    });
  }

  /**
   * Convert ContentItem domain object to database rows
   */
  dehydrate(contentItem) {
    const main = {
      id: contentItem.id,
      type_id: contentItem.typeId,
      type_name: contentItem.typeName,
      title: contentItem.title,
      slug: contentItem.slug,
      state: contentItem.state,
      current_version: contentItem.currentVersion,
      data: JSON.stringify(contentItem.data),
      metadata: JSON.stringify(contentItem.metadata.toJSON()),
      author_id: contentItem.authorId,
      last_modified_by: contentItem.lastModifiedBy,
      published_at: contentItem.publishedAt,
      archived_at: contentItem.archivedAt,
      organization_id: contentItem.organizationId,
      created_at: contentItem.createdAt,
      updated_at: contentItem.updatedAt
    };

    const versions = contentItem.versions.map(v => ({
      id: v.id,
      content_id: contentItem.id,
      version_number: v.versionNumber,
      data: JSON.stringify(v.data),
      author_id: v.authorId,
      change_description: v.changeDescription,
      created_at: v.createdAt
    }));

    const relationships = contentItem.relationships.map(r => ({
      id: generateId('rel'),
      source_id: contentItem.id,
      target_id: r.targetId,
      relationship_type: r.type,
      metadata: JSON.stringify(r.metadata),
      created_at: new Date().toISOString()
    }));

    return { main, versions, relationships };
  }
}

// Helper function
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = { ContentItemRepository };
