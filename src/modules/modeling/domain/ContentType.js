/**
 * Modeling Context - Core Domain
 * ContentType Aggregate Root
 * 
 * Responsibility: Define and manage content type schemas
 * Ubiquitous Language: ContentType, FieldDefinition, ValidationRule
 */

const { Entity, ValidationResult, generateId } = require('../../shared/types');

/**
 * Field Types supported by the CMS
 */
const FieldTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  RICH_TEXT: 'richText',
  RELATION: 'relation',
  MEDIA: 'media',
  ARRAY: 'array',
  OBJECT: 'object'
};

/**
 * Field Definition - Entity
 * Represents a single field in a ContentType
 */
class FieldDefinition extends Entity {
  constructor(config) {
    super(config.id || generateId('field'));
    this.name = config.name;
    this.type = config.type;
    this.required = config.required || false;
    this.defaultValue = config.defaultValue;
    this.description = config.description || '';
    this.validations = config.validations || [];
    this.metadata = config.metadata || {};
  }

  /**
   * Validate a value against this field definition
   */
  validate(value) {
    const result = new ValidationResult(true);

    // Required check
    if (this.required && (value === null || value === undefined || value === '')) {
      result.addError(this.name, `Field '${this.name}' is required`);
      return result;
    }

    // Skip validation if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return result;
    }

    // Type validation
    const typeValid = this.validateType(value);
    if (!typeValid.isValid) {
      result.addError(this.name, typeValid.error);
      return result;
    }

    // Custom validations
    for (const validation of this.validations) {
      const validationResult = this.applyValidation(value, validation);
      if (!validationResult.isValid) {
        result.addError(this.name, validationResult.error);
      }
    }

    return result;
  }

  validateType(value) {
    switch (this.type) {
      case FieldTypes.STRING:
        if (typeof value !== 'string') {
          return { isValid: false, error: `Expected string, got ${typeof value}` };
        }
        break;
      case FieldTypes.NUMBER:
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: `Expected number, got ${typeof value}` };
        }
        break;
      case FieldTypes.BOOLEAN:
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `Expected boolean, got ${typeof value}` };
        }
        break;
      case FieldTypes.DATE:
        if (isNaN(Date.parse(value))) {
          return { isValid: false, error: 'Invalid date format' };
        }
        break;
      case FieldTypes.ARRAY:
        if (!Array.isArray(value)) {
          return { isValid: false, error: 'Expected array' };
        }
        break;
      case FieldTypes.OBJECT:
        if (typeof value !== 'object' || Array.isArray(value)) {
          return { isValid: false, error: 'Expected object' };
        }
        break;
    }
    return { isValid: true };
  }

  applyValidation(value, validation) {
    switch (validation.type) {
      case 'minLength':
        if (value.length < validation.value) {
          return { isValid: false, error: `Minimum length is ${validation.value}` };
        }
        break;
      case 'maxLength':
        if (value.length > validation.value) {
          return { isValid: false, error: `Maximum length is ${validation.value}` };
        }
        break;
      case 'min':
        if (value < validation.value) {
          return { isValid: false, error: `Minimum value is ${validation.value}` };
        }
        break;
      case 'max':
        if (value > validation.value) {
          return { isValid: false, error: `Maximum value is ${validation.value}` };
        }
        break;
      case 'pattern':
        if (!new RegExp(validation.value).test(value)) {
          return { isValid: false, error: validation.message || 'Pattern validation failed' };
        }
        break;
      case 'enum':
        if (!validation.value.includes(value)) {
          return { isValid: false, error: `Value must be one of: ${validation.value.join(', ')}` };
        }
        break;
    }
    return { isValid: true };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      required: this.required,
      defaultValue: this.defaultValue,
      description: this.description,
      validations: this.validations,
      metadata: this.metadata
    };
  }
}

/**
 * ContentType - Aggregate Root
 * Defines the structure and validation rules for content
 */
class ContentType extends Entity {
  constructor(config) {
    super(config.id || generateId('type'));
    this.name = config.name;
    this.displayName = config.displayName || config.name;
    this.description = config.description || '';
    this.version = config.version || 1;
    this.fields = (config.fields || []).map(f => 
      f instanceof FieldDefinition ? f : new FieldDefinition(f)
    );
    this.metadata = config.metadata || {};
    this.isDeprecated = config.isDeprecated || false;
    this.deprecationReason = config.deprecationReason || null;
  }

  /**
   * Add a field to this ContentType
   */
  addField(fieldConfig) {
    // Check if field with same name exists
    const existingField = this.fields.find(f => f.name === fieldConfig.name);
    if (existingField) {
      throw new Error(`Field with name '${fieldConfig.name}' already exists`);
    }

    const field = new FieldDefinition(fieldConfig);
    this.fields.push(field);
    this.updateTimestamp();
    this.incrementVersion();
    
    return field;
  }

  /**
   * Update an existing field
   */
  updateField(fieldName, updates) {
    const field = this.fields.find(f => f.name === fieldName);
    if (!field) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    // Update field properties
    Object.assign(field, updates);
    field.updateTimestamp();
    this.updateTimestamp();
    this.incrementVersion();

    return field;
  }

  /**
   * Remove a field from this ContentType
   */
  removeField(fieldName) {
    const index = this.fields.findIndex(f => f.name === fieldName);
    if (index === -1) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    this.fields.splice(index, 1);
    this.updateTimestamp();
    this.incrementVersion();
  }

  /**
   * Deprecate a field (soft delete)
   */
  deprecateField(fieldName, reason, alternatives) {
    const field = this.fields.find(f => f.name === fieldName);
    if (!field) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    field.metadata.deprecated = true;
    field.metadata.deprecationReason = reason;
    field.metadata.alternatives = alternatives;
    this.updateTimestamp();

    return field;
  }

  /**
   * Validate content data against this schema
   */
  validate(data) {
    const result = new ValidationResult(true);

    // Validate all fields
    for (const field of this.fields) {
      const value = data[field.name];
      const fieldResult = field.validate(value);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
    }

    // Check for unknown fields
    const definedFields = new Set(this.fields.map(f => f.name));
    for (const key of Object.keys(data)) {
      if (!definedFields.has(key)) {
        result.addError(key, `Unknown field '${key}' not defined in schema`);
      }
    }

    return result;
  }

  /**
   * Get field definition by name
   */
  getField(fieldName) {
    return this.fields.find(f => f.name === fieldName);
  }

  /**
   * Mark this ContentType as deprecated
   */
  deprecate(reason) {
    this.isDeprecated = true;
    this.deprecationReason = reason;
    this.updateTimestamp();
  }

  /**
   * Increment version (for schema evolution tracking)
   */
  incrementVersion() {
    this.version += 1;
  }

  /**
   * Export to plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      version: this.version,
      fields: this.fields.map(f => f.toJSON()),
      metadata: this.metadata,
      isDeprecated: this.isDeprecated,
      deprecationReason: this.deprecationReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  ContentType,
  FieldDefinition,
  FieldTypes
};
