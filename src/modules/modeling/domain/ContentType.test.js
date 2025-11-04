/**
 * Unit tests for ContentType aggregate
 */

const { ContentType, FieldDefinition, FieldTypes } = require('./ContentType');

describe('ContentType Aggregate', () => {
  describe('Creation', () => {
    it('should create a valid ContentType', () => {
      const contentType = new ContentType({
        name: 'article',
        displayName: 'Article',
        description: 'Blog article'
      });

      expect(contentType.name).toBe('article');
      expect(contentType.displayName).toBe('Article');
      expect(contentType.description).toBe('Blog article');
      expect(contentType.version).toBe(1);
      expect(contentType.fields).toHaveLength(0);
      expect(contentType.isDeprecated).toBe(false);
    });
  });

  describe('Field Management', () => {
    let contentType;

    beforeEach(() => {
      contentType = new ContentType({
        name: 'article',
        displayName: 'Article'
      });
    });

    it('should add a valid field', () => {
      const field = contentType.addField({
        name: 'title',
        type: FieldTypes.STRING,
        required: true
      });

      expect(contentType.fields).toHaveLength(1);
      expect(contentType.fields[0].name).toBe('title');
      expect(field).toBe(contentType.fields[0]);
    });

    it('should throw error for duplicate field names', () => {
      contentType.addField({
        name: 'title',
        type: FieldTypes.STRING
      });

      expect(() => {
        contentType.addField({
          name: 'title',
          type: FieldTypes.NUMBER
        });
      }).toThrow('already exists');
    });

    it('should update existing field', () => {
      contentType.addField({
        name: 'title',
        type: FieldTypes.STRING,
        description: 'Original'
      });

      const field = contentType.updateField('title', {
        description: 'The article title',
        required: true
      });

      expect(contentType.fields[0].description).toBe('The article title');
      expect(contentType.fields[0].required).toBe(true);
    });

    it('should throw error updating non-existent field', () => {
      expect(() => {
        contentType.updateField('nonexistent', {
          displayName: 'New Name'
        });
      }).toThrow('not found');
    });

    it('should deprecate field', () => {
      contentType.addField({
        name: 'oldField',
        type: FieldTypes.STRING
      });

      const field = contentType.deprecateField('oldField', 'Use newField instead', ['newField']);

      expect(field.metadata.deprecated).toBe(true);
      expect(field.metadata.deprecationReason).toBe('Use newField instead');
      expect(field.metadata.alternatives).toEqual(['newField']);
    });

    it('should not remove deprecated fields', () => {
      contentType.addField({
        name: 'oldField',
        type: FieldTypes.STRING
      });

      contentType.deprecateField('oldField', 'Deprecated');

      expect(contentType.fields).toHaveLength(1);
      expect(contentType.fields[0].metadata.deprecated).toBe(true);
    });
  });

  describe('Content Validation', () => {
    let contentType;

    beforeEach(() => {
      contentType = new ContentType({
        name: 'article',
        displayName: 'Article'
      });

      contentType.addField({
        name: 'title',
        type: FieldTypes.STRING,
        required: true
      });

      contentType.addField({
        name: 'views',
        type: FieldTypes.NUMBER,
        required: false
      });
    });

    it('should validate correct content', () => {
      const result = contentType.validate({
        title: 'My Article',
        views: 100
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const result = contentType.validate({
        views: 100
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('title');
    });

    it('should validate string length constraints', () => {
      contentType.addField({
        name: 'summary',
        type: FieldTypes.STRING,
        validations: [
          { type: 'minLength', value: 10 },
          { type: 'maxLength', value: 100 }
        ]
      });

      const result1 = contentType.validate({
        title: 'Test',
        summary: 'Too short'
      });
      expect(result1.isValid).toBe(false);

      const result2 = contentType.validate({
        title: 'Test',
        summary: 'This is a valid summary with enough characters to pass'
      });
      expect(result2.isValid).toBe(true);
    });

    it('should validate number constraints', () => {
      contentType.addField({
        name: 'rating',
        type: FieldTypes.NUMBER,
        validations: [
          { type: 'min', value: 1 },
          { type: 'max', value: 5 }
        ]
      });

      const result1 = contentType.validate({
        title: 'Test',
        rating: 0
      });
      expect(result1.isValid).toBe(false);

      const result2 = contentType.validate({
        title: 'Test',
        rating: 3
      });
      expect(result2.isValid).toBe(true);
    });

    it('should accept missing optional fields', () => {
      const result = contentType.validate({
        title: 'My Article'
      });

      expect(result.isValid).toBe(true);
    });

    it('should validate field types', () => {
      const result = contentType.validate({
        title: 'Test',
        views: 'not a number'
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('Deprecation', () => {
    let contentType;

    beforeEach(() => {
      contentType = new ContentType({
        name: 'oldType',
        displayName: 'Old Type'
      });
    });

    it('should mark ContentType as deprecated', () => {
      contentType.deprecate('Use newType instead');

      expect(contentType.isDeprecated).toBe(true);
      expect(contentType.deprecationReason).toBe('Use newType instead');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const contentType = new ContentType({
        name: 'article',
        displayName: 'Article',
        description: 'Blog article'
      });

      contentType.addField({
        name: 'title',
        type: FieldTypes.STRING,
        required: true
      });

      const json = contentType.toJSON();

      expect(json.name).toBe('article');
      expect(json.displayName).toBe('Article');
      expect(json.description).toBe('Blog article');
      expect(json.version).toBeGreaterThan(0);
      expect(json.fields).toHaveLength(1);
      expect(json.fields[0].name).toBe('title');
    });
  });
});

describe('FieldDefinition Entity', () => {
  describe('Validation', () => {
    it('should validate string field', () => {
      const field = new FieldDefinition({
        name: 'title',
        type: FieldTypes.STRING,
        validations: [
          { type: 'minLength', value: 1 },
          { type: 'maxLength', value: 100 }
        ]
      });

      const result1 = field.validate('Valid Title');
      expect(result1.isValid).toBe(true);

      const result2 = field.validate('x'.repeat(101));
      expect(result2.isValid).toBe(false);
    });

    it('should validate number field', () => {
      const field = new FieldDefinition({
        name: 'age',
        type: FieldTypes.NUMBER,
        validations: [
          { type: 'min', value: 0 },
          { type: 'max', value: 150 }
        ]
      });

      expect(field.validate(25).isValid).toBe(true);
      expect(field.validate(-5).isValid).toBe(false);
      expect(field.validate(200).isValid).toBe(false);
    });

    it('should validate boolean field', () => {
      const field = new FieldDefinition({
        name: 'published',
        type: FieldTypes.BOOLEAN
      });

      expect(field.validate(true).isValid).toBe(true);
      expect(field.validate(false).isValid).toBe(true);
      expect(field.validate('true').isValid).toBe(false);
    });

    it('should validate date field', () => {
      const field = new FieldDefinition({
        name: 'publishedAt',
        type: FieldTypes.DATE
      });

      expect(field.validate('2024-01-01').isValid).toBe(true);
      expect(field.validate('2024-01-01T10:00:00Z').isValid).toBe(true);
      expect(field.validate('invalid-date').isValid).toBe(false);
    });

    it('should validate array field', () => {
      const field = new FieldDefinition({
        name: 'tags',
        type: FieldTypes.ARRAY
      });

      expect(field.validate([]).isValid).toBe(true);
      expect(field.validate(['tag1', 'tag2']).isValid).toBe(true);
      expect(field.validate('not an array').isValid).toBe(false);
    });

    it('should validate object field', () => {
      const field = new FieldDefinition({
        name: 'metadata',
        type: FieldTypes.OBJECT
      });

      expect(field.validate({}).isValid).toBe(true);
      expect(field.validate({ key: 'value' }).isValid).toBe(true);
      expect(field.validate('not an object').isValid).toBe(false);
      // Arrays are objects in JS, but should fail validation
      expect(field.validate([]).isValid).toBe(false);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate email pattern', () => {
      const field = new FieldDefinition({
        name: 'email',
        type: FieldTypes.STRING,
        validations: [
          { type: 'pattern', value: '^[^@]+@[^@]+\\.[^@]+$' }
        ]
      });

      expect(field.validate('user@example.com').isValid).toBe(true);
      expect(field.validate('invalid-email').isValid).toBe(false);
    });

    it('should validate custom pattern', () => {
      const field = new FieldDefinition({
        name: 'zipCode',
        type: FieldTypes.STRING,
        validations: [
          { type: 'pattern', value: '^\\d{5}$', message: 'Must be 5 digits' }
        ]
      });

      expect(field.validate('12345').isValid).toBe(true);
      expect(field.validate('1234').isValid).toBe(false);
      expect(field.validate('abcde').isValid).toBe(false);
    });
  });
});
