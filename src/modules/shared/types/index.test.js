/**
 * Unit tests for shared domain types
 */

const { DomainEvent, Result, ValidationResult, Entity, generateId } = require('./index');

describe('Result Pattern', () => {
  describe('Success', () => {
    it('should create successful result with value', () => {
      const result = Result.success({ id: 123 });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({ id: 123 });
      expect(result.error).toBeNull();
    });

    it('should create successful result without value', () => {
      const result = Result.success();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });
  });

  describe('Failure', () => {
    it('should create failed result with error', () => {
      const error = { code: 'NOT_FOUND', message: 'Resource not found' };
      const result = Result.failure(error);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.value).toBeNull();
    });
  });

  describe('Railway Oriented Programming', () => {
    it('should chain successful operations', () => {
      const result1 = Result.success(5);
      const result2 = result1.isSuccess ? Result.success(result1.value * 2) : result1;
      const result3 = result2.isSuccess ? Result.success(result2.value + 10) : result2;

      expect(result3.isSuccess).toBe(true);
      expect(result3.value).toBe(20);
    });

    it('should short-circuit on first failure', () => {
      const result1 = Result.success(5);
      const result2 = Result.failure({ code: 'ERROR', message: 'Something went wrong' });
      const result3 = result2.isSuccess ? Result.success(result2.value + 10) : result2;

      expect(result3.isSuccess).toBe(false);
      expect(result3.error.code).toBe('ERROR');
    });
  });
});

describe('ValidationResult', () => {
  it('should create valid validation result', () => {
    const result = ValidationResult.valid();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should create invalid validation result with errors', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const result = ValidationResult.invalid(errors);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(errors);
  });

  it('should add errors dynamically', () => {
    const result = new ValidationResult(true);
    result.addError('username', 'Username is required');

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('username');
    expect(result.errors[0].message).toBe('Username is required');
  });
});

describe('DomainEvent', () => {
  it('should create domain event with required fields', () => {
    const event = new DomainEvent('user.created', 'user_123', { name: 'John' });

    expect(event.eventType).toBe('user.created');
    expect(event.aggregateId).toBe('user_123');
    expect(event.data).toEqual({ name: 'John' });
    expect(event.timestamp).toBeTruthy();
    expect(event.eventId).toBeTruthy();
    expect(event.version).toBe(1);
  });

  it('should generate unique event IDs', () => {
    const event1 = new DomainEvent('test', 'id1', {});
    const event2 = new DomainEvent('test', 'id1', {});

    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it('should have ISO timestamp', () => {
    const event = new DomainEvent('test', 'id1', {});
    const timestamp = new Date(event.timestamp);

    expect(timestamp.toISOString()).toBe(event.timestamp);
  });
});

describe('Entity Base Class', () => {
  class TestEntity extends Entity {
    constructor(config) {
      super(config.id);
      this.name = config.name;
    }
  }

  it('should create entity with ID', () => {
    const entity = new TestEntity({ id: 'test_123', name: 'Test' });

    expect(entity.id).toBe('test_123');
    expect(entity.name).toBe('Test');
  });

  it('should track creation timestamp', () => {
    const before = new Date().toISOString();
    const entity = new TestEntity({ id: 'test_123', name: 'Test' });
    const after = new Date().toISOString();

    // Entity stores timestamps as ISO strings
    expect(entity.createdAt).toBeDefined();
    expect(typeof entity.createdAt).toBe('string');
    expect(entity.createdAt >= before).toBe(true);
    expect(entity.createdAt <= after).toBe(true);
  });

  it('should track update timestamp', () => {
    const entity = new TestEntity({ id: 'test_123', name: 'Test' });
    const originalUpdatedAt = entity.updatedAt;

    // Small delay to ensure timestamp changes
    setTimeout(() => {
      entity.updateTimestamp();
      expect(entity.updatedAt).not.toBe(originalUpdatedAt);
    }, 10);
  });

  it('should compare entities by ID', () => {
    const entity1 = new TestEntity({ id: 'test_123', name: 'Test1' });
    const entity2 = new TestEntity({ id: 'test_123', name: 'Test2' });
    const entity3 = new TestEntity({ id: 'test_456', name: 'Test3' });

    expect(entity1.equals(entity2)).toBe(true);
    expect(entity1.equals(entity3)).toBe(false);
  });

  it('should not equal non-Entity objects', () => {
    const entity = new TestEntity({ id: 'test_123', name: 'Test' });
    
    expect(entity.equals(null)).toBe(false);
    expect(entity.equals({ id: 'test_123' })).toBe(false);
  });

  it('should throw error if ID is missing', () => {
    expect(() => new TestEntity({ name: 'Test' })).toThrow('Entity must have an id');
  });
});

describe('ID Generator', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId('test');
    const id2 = generateId('test');

    expect(id1).not.toBe(id2);
  });

  it('should include prefix in ID', () => {
    const id = generateId('user');

    expect(id).toContain('user_');
  });

  it('should generate IDs with timestamp component', () => {
    const id = generateId('test');
    const parts = id.split('_');

    expect(parts).toHaveLength(3);
    expect(Number(parts[1])).toBeGreaterThan(0);
  });

  it('should generate IDs with random component', () => {
    const id = generateId('test');
    const parts = id.split('_');

    expect(parts[2]).toBeTruthy();
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('should handle different prefixes', () => {
    const userId = generateId('user');
    const postId = generateId('post');

    expect(userId).toContain('user_');
    expect(postId).toContain('post_');
    expect(userId).not.toBe(postId);
  });
});
