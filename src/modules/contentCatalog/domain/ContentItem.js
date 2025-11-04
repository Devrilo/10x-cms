/**
 * Content Catalog Context - Core Domain
 * ContentItem Aggregate Root
 * 
 * Responsibility: Manage content lifecycle, versioning, and state
 * Ubiquitous Language: ContentItem, ContentVersion, ContentState, ContentMetadata
 */

const { Entity, ValidationResult, generateId } = require('../../shared/types');

/**
 * Content States in the lifecycle
 */
const ContentState = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

/**
 * Valid state transitions
 */
const StateTransitions = {
  [ContentState.DRAFT]: [ContentState.IN_REVIEW, ContentState.ARCHIVED],
  [ContentState.IN_REVIEW]: [ContentState.DRAFT, ContentState.APPROVED, ContentState.ARCHIVED],
  [ContentState.APPROVED]: [ContentState.PUBLISHED, ContentState.DRAFT, ContentState.ARCHIVED],
  [ContentState.PUBLISHED]: [ContentState.ARCHIVED, ContentState.DRAFT],
  [ContentState.ARCHIVED]: [ContentState.DRAFT]
};

/**
 * ContentVersion - Entity
 * Represents a snapshot of content at a point in time
 */
class ContentVersion extends Entity {
  constructor(config) {
    super(config.id || generateId('version'));
    this.versionNumber = config.versionNumber;
    this.data = config.data;
    this.authorId = config.authorId;
    this.changeDescription = config.changeDescription || '';
  }

  toJSON() {
    return {
      id: this.id,
      versionNumber: this.versionNumber,
      data: this.data,
      authorId: this.authorId,
      changeDescription: this.changeDescription,
      createdAt: this.createdAt
    };
  }
}

/**
 * ContentMetadata - Value Object
 */
class ContentMetadata {
  constructor(config) {
    this.tags = config.tags || [];
    this.category = config.category || null;
    this.featuredImage = config.featuredImage || null;
    this.seoTitle = config.seoTitle || null;
    this.seoDescription = config.seoDescription || null;
    this.customFields = config.customFields || {};
  }

  toJSON() {
    return {
      tags: this.tags,
      category: this.category,
      featuredImage: this.featuredImage,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      customFields: this.customFields
    };
  }
}

/**
 * RelationshipLink - Value Object
 * Represents a relationship between content items
 */
class RelationshipLink {
  constructor(config) {
    this.type = config.type; // 'related', 'parent', 'referenced', 'variant'
    this.targetId = config.targetId;
    this.metadata = config.metadata || {};
  }

  toJSON() {
    return {
      type: this.type,
      targetId: this.targetId,
      metadata: this.metadata
    };
  }
}

/**
 * ContentItem - Aggregate Root
 * The main entity representing a piece of content
 */
class ContentItem extends Entity {
  constructor(config) {
    super(config.id || generateId('content'));
    this.typeId = config.typeId;
    this.typeName = config.typeName;
    this.title = config.title || '';
    this.slug = config.slug || '';
    this.state = config.state || ContentState.DRAFT;
    this.currentVersion = config.currentVersion || 1;
    this.data = config.data || {};
    this.metadata = new ContentMetadata(config.metadata || {});
    this.authorId = config.authorId;
    this.lastModifiedBy = config.lastModifiedBy || config.authorId;
    this.publishedAt = config.publishedAt || null;
    this.archivedAt = config.archivedAt || null;
    this.versions = config.versions || [];
    this.relationships = (config.relationships || []).map(r => 
      r instanceof RelationshipLink ? r : new RelationshipLink(r)
    );
    this.organizationId = config.organizationId;
  }

  /**
   * Update content data (creates new version)
   */
  update(data, authorId, changeDescription = '') {
    // Validate state - can only update draft or in_review
    if (this.state !== ContentState.DRAFT && this.state !== ContentState.IN_REVIEW) {
      throw new Error(`Cannot update content in '${this.state}' state`);
    }

    // Create new version
    const version = new ContentVersion({
      versionNumber: this.currentVersion + 1,
      data: { ...data },
      authorId,
      changeDescription
    });

    this.versions.push(version);
    this.data = { ...data };
    this.currentVersion = version.versionNumber;
    this.lastModifiedBy = authorId;
    this.updateTimestamp();

    return version;
  }

  /**
   * Change content state (lifecycle management)
   */
  changeState(newState, userId, reason = '') {
    // Validate transition
    const allowedTransitions = StateTransitions[this.state] || [];
    if (!allowedTransitions.includes(newState)) {
      throw new Error(`Invalid state transition from '${this.state}' to '${newState}'`);
    }

    const oldState = this.state;
    this.state = newState;
    this.lastModifiedBy = userId;

    // Handle state-specific logic
    if (newState === ContentState.PUBLISHED) {
      this.publishedAt = new Date().toISOString();
    }

    if (newState === ContentState.ARCHIVED) {
      this.archivedAt = new Date().toISOString();
    }

    this.updateTimestamp();

    return { oldState, newState, reason };
  }

  /**
   * Submit for review (Draft → InReview)
   */
  submitForReview(userId) {
    return this.changeState(ContentState.IN_REVIEW, userId, 'Submitted for review');
  }

  /**
   * Approve content (InReview → Approved)
   */
  approve(userId) {
    return this.changeState(ContentState.APPROVED, userId, 'Approved for publishing');
  }

  /**
   * Reject content (InReview → Draft)
   */
  reject(userId, reason) {
    return this.changeState(ContentState.DRAFT, userId, `Rejected: ${reason}`);
  }

  /**
   * Publish content (Approved → Published)
   */
  publish(userId) {
    return this.changeState(ContentState.PUBLISHED, userId, 'Published');
  }

  /**
   * Archive content
   */
  archive(userId, reason = '') {
    return this.changeState(ContentState.ARCHIVED, userId, `Archived: ${reason}`);
  }

  /**
   * Add relationship to another content item
   */
  addRelationship(type, targetId, metadata = {}) {
    // Check if relationship already exists
    const existing = this.relationships.find(
      r => r.type === type && r.targetId === targetId
    );
    
    if (existing) {
      throw new Error(`Relationship of type '${type}' to '${targetId}' already exists`);
    }

    const relationship = new RelationshipLink({ type, targetId, metadata });
    this.relationships.push(relationship);
    this.updateTimestamp();

    return relationship;
  }

  /**
   * Remove relationship
   */
  removeRelationship(type, targetId) {
    const index = this.relationships.findIndex(
      r => r.type === type && r.targetId === targetId
    );

    if (index === -1) {
      throw new Error(`Relationship not found`);
    }

    this.relationships.splice(index, 1);
    this.updateTimestamp();
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata) {
    this.metadata = new ContentMetadata({ ...this.metadata.toJSON(), ...metadata });
    this.updateTimestamp();
  }

  /**
   * Get specific version
   */
  getVersion(versionNumber) {
    return this.versions.find(v => v.versionNumber === versionNumber);
  }

  /**
   * Rollback to a previous version
   */
  rollback(versionNumber, userId) {
    const version = this.getVersion(versionNumber);
    if (!version) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    // Can only rollback draft content
    if (this.state !== ContentState.DRAFT) {
      throw new Error(`Can only rollback draft content`);
    }

    this.data = { ...version.data };
    this.lastModifiedBy = userId;
    this.updateTimestamp();

    return version;
  }

  /**
   * Check if content can be edited
   */
  canEdit() {
    return this.state === ContentState.DRAFT || this.state === ContentState.IN_REVIEW;
  }

  /**
   * Check if content can be published
   */
  canPublish() {
    return this.state === ContentState.APPROVED;
  }

  /**
   * Export to plain object
   */
  toJSON() {
    return {
      id: this.id,
      typeId: this.typeId,
      typeName: this.typeName,
      title: this.title,
      slug: this.slug,
      state: this.state,
      currentVersion: this.currentVersion,
      data: this.data,
      metadata: this.metadata.toJSON(),
      authorId: this.authorId,
      lastModifiedBy: this.lastModifiedBy,
      publishedAt: this.publishedAt,
      archivedAt: this.archivedAt,
      versions: this.versions.map(v => v.toJSON()),
      relationships: this.relationships.map(r => r.toJSON()),
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  ContentItem,
  ContentVersion,
  ContentMetadata,
  RelationshipLink,
  ContentState,
  StateTransitions
};
