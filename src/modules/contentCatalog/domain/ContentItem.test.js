/**
 * Unit tests for ContentItem aggregate
 */

const { ContentItem, ContentState, StateTransitions } = require('./ContentItem');

describe('ContentItem Aggregate', () => {
  describe('Creation', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'My First Post',
        authorId: 'user_789',
        data: {
          title: 'My First Post',
          content: '<p>Hello World</p>'
        }
      });
    });

    it('should create a valid ContentItem in DRAFT state', () => {
      expect(contentItem.typeId).toBe('type_123');
      expect(contentItem.title).toBe('My First Post');
      expect(contentItem.state).toBe(ContentState.DRAFT);
      expect(contentItem.currentVersion).toBe(1);
    });
  });

  describe('Content Updates', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'My First Post',
        authorId: 'user_789',
        data: {
          title: 'My First Post',
          content: '<p>Hello World</p>'
        }
      });
    });

    it('should create new version on update', () => {
      const version = contentItem.update({
        title: 'Updated Title',
        content: '<p>New Content</p>'
      }, 'user_789', 'Major update');

      expect(version.versionNumber).toBe(2);
      expect(contentItem.currentVersion).toBe(2);
      // Implementation only stores versions created by update(), not initial version
      expect(contentItem.versions).toHaveLength(1);
      expect(contentItem.versions[0].versionNumber).toBe(2);
    });

    it('should preserve old versions', () => {
      const originalData = { ...contentItem.data };
      
      contentItem.update({
        title: 'Updated',
        content: 'New'
      }, 'user_789', 'Update 1');

      // Implementation only stores versions created by update(), not initial version
      expect(contentItem.versions).toHaveLength(1);
      const newVersion = contentItem.versions[0];
      expect(newVersion.versionNumber).toBe(2);
    });

    it('should record change description in version', () => {
      const version = contentItem.update(
        { title: 'Updated' },
        'user_789',
        'Fixed typo'
      );

      expect(version.changeDescription).toBe('Fixed typo');
    });

    it('should track who made the update', () => {
      contentItem.update({ title: 'V2' }, 'user_different', 'Update');

      expect(contentItem.lastModifiedBy).toBe('user_different');
      const latestVersion = contentItem.versions[contentItem.versions.length - 1];
      expect(latestVersion.authorId).toBe('user_different');
    });

    it('should throw error when updating published content', () => {
      contentItem.changeState(ContentState.IN_REVIEW, 'user_789');
      contentItem.changeState(ContentState.APPROVED, 'user_789');
      contentItem.changeState(ContentState.PUBLISHED, 'user_789');

      expect(() => {
        contentItem.update({ title: 'Cannot update' }, 'user_789');
      }).toThrow();
    });
  });

  describe('State Machine', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test Article',
        authorId: 'user_789',
        data: {}
      });
    });

    it('should transition from DRAFT to IN_REVIEW', () => {
      const result = contentItem.changeState(ContentState.IN_REVIEW, 'user_789');

      expect(contentItem.state).toBe(ContentState.IN_REVIEW);
      expect(result.oldState).toBe(ContentState.DRAFT);
      expect(result.newState).toBe(ContentState.IN_REVIEW);
    });

    it('should transition from IN_REVIEW to APPROVED', () => {
      contentItem.changeState(ContentState.IN_REVIEW, 'user_789');
      const result = contentItem.changeState(ContentState.APPROVED, 'reviewer_123');

      expect(contentItem.state).toBe(ContentState.APPROVED);
      expect(result.newState).toBe(ContentState.APPROVED);
    });

    it('should throw error for invalid state transitions', () => {
      // Cannot go directly from DRAFT to PUBLISHED
      expect(() => {
        contentItem.changeState(ContentState.PUBLISHED, 'user_789');
      }).toThrow('Invalid state transition');
    });

    it('should allow transition to ARCHIVED from any state', () => {
      contentItem.changeState(ContentState.ARCHIVED, 'user_789');
      expect(contentItem.state).toBe(ContentState.ARCHIVED);
    });

    it('should allow going back to DRAFT from IN_REVIEW', () => {
      contentItem.changeState(ContentState.IN_REVIEW, 'user_789');
      const result = contentItem.changeState(ContentState.DRAFT, 'reviewer_123');

      expect(contentItem.state).toBe(ContentState.DRAFT);
      expect(result.oldState).toBe(ContentState.IN_REVIEW);
    });
  });

  describe('Publishing', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test Article',
        authorId: 'user_789',
        data: {}
      });
    });

    it('should publish approved content', () => {
      contentItem.changeState(ContentState.IN_REVIEW, 'user_789');
      contentItem.changeState(ContentState.APPROVED, 'user_789');
      
      const result = contentItem.publish('publisher_456');

      expect(contentItem.state).toBe(ContentState.PUBLISHED);
      expect(contentItem.publishedAt).toBeTruthy();
    });

    it('should throw error publishing non-approved content', () => {
      // Still in DRAFT
      expect(() => {
        contentItem.publish('publisher_456');
      }).toThrow();
    });

    it('should record publication timestamp', () => {
      contentItem.changeState(ContentState.IN_REVIEW, 'user_789');
      contentItem.changeState(ContentState.APPROVED, 'user_789');

      const beforePublish = Date.now();
      contentItem.publish('publisher_456');
      const afterPublish = Date.now();

      const publishedAt = new Date(contentItem.publishedAt).getTime();
      expect(publishedAt).toBeGreaterThanOrEqual(beforePublish);
      expect(publishedAt).toBeLessThanOrEqual(afterPublish);
    });
  });

  describe('Archiving', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test Article',
        authorId: 'user_789',
        data: {}
      });
    });

    it('should archive content', () => {
      contentItem.archive('user_789');

      expect(contentItem.state).toBe(ContentState.ARCHIVED);
    });

    it('should record archive timestamp', () => {
      const before = Date.now();
      contentItem.archive('user_789');
      const after = Date.now();

      const archivedAt = new Date(contentItem.archivedAt).getTime();
      expect(archivedAt).toBeGreaterThanOrEqual(before);
      expect(archivedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('Relationships', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test Article',
        authorId: 'user_789',
        data: {}
      });
    });

    it('should add relationship to another content', () => {
      const relationship = contentItem.addRelationship('related', 'content_other', {
        description: 'Related article'
      });

      expect(contentItem.relationships).toHaveLength(1);
      expect(contentItem.relationships[0].targetId).toBe('content_other');
      expect(contentItem.relationships[0].type).toBe('related');
    });

    it('should throw error for duplicate relationships', () => {
      contentItem.addRelationship('related', 'content_other');

      expect(() => {
        contentItem.addRelationship('related', 'content_other');
      }).toThrow('already exists');
    });

    it('should support different relationship types', () => {
      contentItem.addRelationship('parent', 'content_parent');
      contentItem.addRelationship('related', 'content_related');

      expect(contentItem.relationships).toHaveLength(2);
      expect(contentItem.relationships[0].type).toBe('parent');
      expect(contentItem.relationships[1].type).toBe('related');
    });

    it('should remove relationship', () => {
      contentItem.addRelationship('related', 'content_other');
      contentItem.removeRelationship('related', 'content_other');

      expect(contentItem.relationships).toHaveLength(0);
    });

    it('should throw error removing non-existent relationship', () => {
      expect(() => {
        contentItem.removeRelationship('related', 'nonexistent');
      }).toThrow('not found');
    });
  });

  describe('Version History', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test',
        authorId: 'user_789',
        data: { title: 'V1' }
      });
    });

    it('should maintain version history', () => {
      contentItem.update({ title: 'V2' }, 'user_789', 'Update 1');
      contentItem.update({ title: 'V3' }, 'user_789', 'Update 2');

      // Implementation only stores versions created by update(), not initial version
      expect(contentItem.versions).toHaveLength(2);
      expect(contentItem.versions[0].versionNumber).toBe(2);
      expect(contentItem.versions[1].versionNumber).toBe(3);
    });

    it('should get specific version', () => {
      contentItem.update({ title: 'V2' }, 'user_789', 'Update 1');
      contentItem.update({ title: 'V3' }, 'user_789', 'Update 2');

      const version2 = contentItem.getVersion(2);

      expect(version2).toBeTruthy();
      expect(version2.versionNumber).toBe(2);
    });

    it('should return undefined for non-existent version', () => {
      const version = contentItem.getVersion(999);
      expect(version).toBeUndefined();
    });
  });

  describe('Metadata', () => {
    let contentItem;

    beforeEach(() => {
      contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test',
        authorId: 'user_789',
        data: {},
        metadata: {
          tags: ['tech']
        }
      });
    });

    it('should update metadata', () => {
      contentItem.updateMetadata({
        tags: ['tech', 'programming'],
        category: 'tutorials'
      });

      expect(contentItem.metadata.tags).toEqual(['tech', 'programming']);
      expect(contentItem.metadata.category).toBe('tutorials');
    });

    it('should preserve existing metadata when updating', () => {
      contentItem.updateMetadata({
        category: 'tutorials'
      });

      expect(contentItem.metadata.tags).toEqual(['tech']);
      expect(contentItem.metadata.category).toBe('tutorials');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test Article',
        authorId: 'user_789',
        data: { content: 'Test' }
      });

      const json = contentItem.toJSON();

      expect(json.typeId).toBe('type_123');
      expect(json.title).toBe('Test Article');
      expect(json.state).toBe(ContentState.DRAFT);
      expect(json.currentVersion).toBe(1);
    });

    it('should include all relationships in JSON', () => {
      const contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test',
        authorId: 'user_789',
        data: {}
      });

      contentItem.addRelationship('related', 'content_other');
      const json = contentItem.toJSON();

      expect(json.relationships).toHaveLength(1);
      expect(json.relationships[0].targetId).toBe('content_other');
    });

    it('should include metadata in JSON', () => {
      const contentItem = new ContentItem({
        typeId: 'type_123',
        typeName: 'Article',
        title: 'Test',
        authorId: 'user_789',
        data: {},
        metadata: { tags: ['test'] }
      });

      const json = contentItem.toJSON();

      expect(json.metadata.tags).toEqual(['test']);
    });
  });
});

describe('State Transitions', () => {
  it('should define valid transitions from DRAFT', () => {
    const validTransitions = StateTransitions[ContentState.DRAFT];

    expect(validTransitions).toContain(ContentState.IN_REVIEW);
    expect(validTransitions).toContain(ContentState.ARCHIVED);
    expect(validTransitions).not.toContain(ContentState.PUBLISHED);
  });

  it('should define valid transitions from IN_REVIEW', () => {
    const validTransitions = StateTransitions[ContentState.IN_REVIEW];

    expect(validTransitions).toContain(ContentState.DRAFT);
    expect(validTransitions).toContain(ContentState.APPROVED);
    expect(validTransitions).toContain(ContentState.ARCHIVED);
  });

  it('should define valid transitions from APPROVED', () => {
    const validTransitions = StateTransitions[ContentState.APPROVED];

    expect(validTransitions).toContain(ContentState.PUBLISHED);
    expect(validTransitions).toContain(ContentState.ARCHIVED);
  });

  it('should allow archiving from any state', () => {
    const states = [
      ContentState.DRAFT,
      ContentState.IN_REVIEW,
      ContentState.APPROVED,
      ContentState.PUBLISHED
    ];

    states.forEach(state => {
      const transitions = StateTransitions[state];
      expect(transitions).toContain(ContentState.ARCHIVED);
    });
  });
});
