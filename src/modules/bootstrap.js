/**
 * Bootstrap - Initialize DDD modules
 * 
 * This file wires up all bounded contexts and their dependencies
 */

const db = require('../server/db/connection');
const { EventBus } = require('./shared/infrastructure/EventBus');

// Repositories
const { ContentTypeRepository } = require('./modeling/repositories/ContentTypeRepository');
const { ContentItemRepository } = require('./contentCatalog/repositories/ContentItemRepository');

// Services
const { ModelingService } = require('./modeling/application/ModelingService');
const { ContentCatalogService } = require('./contentCatalog/application/ContentCatalogService');

// Compatibility
const { BackwardCompatibilityAdapter } = require('./compatibility/BackwardCompatibilityAdapter');

/**
 * Initialize all DDD modules
 */
function initializeModules() {
  // Create Event Bus (shared infrastructure)
  const eventBus = new EventBus(db);

  // Create Repositories
  const contentTypeRepository = new ContentTypeRepository(db);
  const contentItemRepository = new ContentItemRepository(db);

  // Create Application Services
  const modelingService = new ModelingService(contentTypeRepository, eventBus);
  const contentCatalogService = new ContentCatalogService(
    contentItemRepository,
    modelingService,
    eventBus
  );

  // Create Backward Compatibility Adapter
  const compatibilityAdapter = new BackwardCompatibilityAdapter(
    modelingService,
    contentCatalogService
  );

  // Setup event subscriptions (for logging/monitoring)
  setupEventSubscriptions(eventBus);

  return {
    // Core Services
    modelingService,
    contentCatalogService,
    eventBus,
    
    // Compatibility
    compatibilityAdapter,
    
    // Repositories (for advanced use cases)
    contentTypeRepository,
    contentItemRepository
  };
}

/**
 * Setup event subscriptions for cross-context communication
 */
function setupEventSubscriptions(eventBus) {
  // Log all events (for development/debugging)
  eventBus.subscribe('*', async (event) => {
    console.log('[Event]', event.eventType, {
      aggregateId: event.aggregateId,
      timestamp: event.timestamp
    });
  });

  // Content Created -> Log for analytics
  eventBus.subscribe('content.created', async (event) => {
    // In future: send to Analytics Context
    console.log('[Analytics] Content created:', event.data.contentId);
  });

  // Content Published -> Trigger webhooks
  eventBus.subscribe('content.published', async (event) => {
    // In future: Publishing Context handles this
    console.log('[Publishing] Content published:', event.data.contentId);
  });

  // ContentType Updated -> Notify dependent systems
  eventBus.subscribe('contentType.updated', async (event) => {
    if (event.data.breaking) {
      console.warn('[Warning] Breaking schema change detected for type:', event.data.typeId);
    }
  });
}

// Export singleton instance
let modulesInstance = null;

function getModules() {
  if (!modulesInstance) {
    modulesInstance = initializeModules();
  }
  return modulesInstance;
}

module.exports = {
  initializeModules,
  getModules
};
