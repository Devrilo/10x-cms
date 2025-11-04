/**
 * Shared types and value objects for 10x-CMS
 * Following DDD principles: Value Objects are immutable
 */

/**
 * Domain Event base structure
 * All domain events should extend this structure
 */
class DomainEvent {
  constructor(eventType, aggregateId, data) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.timestamp = new Date().toISOString();
    this.data = data;
    this.version = 1;
  }
}

/**
 * Result pattern for operations
 * Follows Railway Oriented Programming
 */
class Result {
  constructor(isSuccess, value, error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  static success(value) {
    return new Result(true, value, null);
  }

  static failure(error) {
    return new Result(false, null, error);
  }
}

/**
 * Validation Result
 */
class ValidationResult {
  constructor(isValid, errors = []) {
    this.isValid = isValid;
    this.errors = errors;
  }

  static valid() {
    return new ValidationResult(true, []);
  }

  static invalid(errors) {
    return new ValidationResult(false, errors);
  }

  addError(field, message) {
    this.errors.push({ field, message });
    this.isValid = false;
  }
}

/**
 * Entity base class
 * All entities have identity and lifecycle
 */
class Entity {
  constructor(id) {
    if (!id) {
      throw new Error('Entity must have an id');
    }
    this.id = id;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  updateTimestamp() {
    this.updatedAt = new Date().toISOString();
  }

  equals(other) {
    if (!other || !(other instanceof Entity)) {
      return false;
    }
    return this.id === other.id;
  }
}

/**
 * Generate unique IDs
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  DomainEvent,
  Result,
  ValidationResult,
  Entity,
  generateId
};
