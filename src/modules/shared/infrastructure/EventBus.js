/**
 * Event Bus - Infrastructure
 * Handles event publishing and subscription
 * 
 * For MVP: In-memory event bus with PostgreSQL LISTEN/NOTIFY for persistence
 * Future: Kafka/EventBridge for distributed systems
 */

class EventBus {
  constructor(db) {
    this.db = db;
    this.subscribers = new Map(); // eventType -> array of handlers
    this.eventLog = []; // In-memory event log for development
  }

  /**
   * Subscribe to an event type
   */
  subscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType).push(handler);
    
    return () => {
      // Return unsubscribe function
      const handlers = this.subscribers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Publish an event
   */
  async publish(event) {
    try {
      // Log event for audit trail
      this.eventLog.push({
        ...event,
        publishedAt: new Date().toISOString()
      });

      // Store event in database (persistent event log)
      if (this.db) {
        await this.storeEvent(event);
      }

      // Notify all subscribers
      const handlers = this.subscribers.get(event.eventType) || [];
      const wildcardHandlers = this.subscribers.get('*') || []; // Catch-all handlers

      const allHandlers = [...handlers, ...wildcardHandlers];

      // Execute handlers asynchronously (fire-and-forget for performance)
      const promises = allHandlers.map(handler => 
        this.executeHandler(handler, event)
      );

      // Don't wait for handlers to complete (eventual consistency)
      Promise.allSettled(promises).catch(error => {
        console.error('Error in event handlers:', error);
      });

      return true;
    } catch (error) {
      console.error('Error publishing event:', error);
      return false;
    }
  }

  /**
   * Execute event handler with error handling
   */
  async executeHandler(handler, event) {
    try {
      await handler(event);
    } catch (error) {
      console.error(`Error in event handler for ${event.eventType}:`, error);
      // Log to error tracking service (Sentry, etc.)
    }
  }

  /**
   * Store event in database for audit trail
   */
  async storeEvent(event) {
    try {
      await this.db('domain_events').insert({
        id: event.eventId,
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        data: JSON.stringify(event.data),
        version: event.version,
        timestamp: event.timestamp,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing event:', error);
      // Don't throw - event publishing should not fail because of storage issues
    }
  }

  /**
   * Get event history for an aggregate
   */
  async getEventHistory(aggregateId) {
    try {
      const events = await this.db('domain_events')
        .where({ aggregate_id: aggregateId })
        .orderBy('timestamp', 'asc');

      return events.map(row => ({
        eventId: row.id,
        eventType: row.event_type,
        aggregateId: row.aggregate_id,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        version: row.version,
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('Error retrieving event history:', error);
      return [];
    }
  }

  /**
   * Get recent events (for debugging/monitoring)
   */
  getRecentEvents(limit = 100) {
    return this.eventLog.slice(-limit);
  }

  /**
   * Clear event log (for testing)
   */
  clearEventLog() {
    this.eventLog = [];
  }

  /**
   * Get subscriber count for monitoring
   */
  getSubscriberCount() {
    let total = 0;
    this.subscribers.forEach(handlers => {
      total += handlers.length;
    });
    return total;
  }
}

module.exports = { EventBus };
