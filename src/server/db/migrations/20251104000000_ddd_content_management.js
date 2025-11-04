/**
 * Migration: DDD Content Management Schema
 * Creates tables for Bounded Contexts: Modeling, ContentCatalog, Events
 * 
 * This migration adds new tables while keeping old ones for backward compatibility
 */

exports.up = function (knex) {
  return Promise.all([
    // Content Types (Modeling Context)
    knex.schema.createTable("content_types", function (table) {
      table.string("id").primary();
      table.string("name").notNullable().unique();
      table.string("display_name").notNullable();
      table.text("description");
      table.integer("version").defaultTo(1);
      table.json("fields").notNullable();
      table.json("metadata");
      table.boolean("is_deprecated").defaultTo(false);
      table.text("deprecation_reason");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
      
      table.index("name");
      table.index("is_deprecated");
    }),

    // Content Items (Content Catalog Context)
    knex.schema.createTable("content_items", function (table) {
      table.string("id").primary();
      table.string("type_id").notNullable();
      table.string("type_name").notNullable();
      table.string("title");
      table.string("slug");
      table.string("state").notNullable().defaultTo("draft");
      table.integer("current_version").defaultTo(1);
      table.json("data").notNullable();
      table.json("metadata");
      table.string("author_id").notNullable();
      table.string("last_modified_by").notNullable();
      table.timestamp("published_at");
      table.timestamp("archived_at");
      table.string("organization_id").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
      
      table.foreign("type_id").references("content_types.id").onDelete("RESTRICT");
      
      table.index("type_id");
      table.index("state");
      table.index("organization_id");
      table.index("author_id");
      table.index(["organization_id", "state"]);
      table.index("slug");
    }),

    // Content Versions (Content Catalog Context)
    knex.schema.createTable("content_versions", function (table) {
      table.string("id").primary();
      table.string("content_id").notNullable();
      table.integer("version_number").notNullable();
      table.json("data").notNullable();
      table.string("author_id").notNullable();
      table.text("change_description");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      
      table.foreign("content_id").references("content_items.id").onDelete("CASCADE");
      
      table.index("content_id");
      table.unique(["content_id", "version_number"]);
    }),

    // Content Relationships (Content Catalog Context)
    knex.schema.createTable("content_relationships", function (table) {
      table.string("id").primary();
      table.string("source_id").notNullable();
      table.string("target_id").notNullable();
      table.string("relationship_type").notNullable(); // 'related', 'parent', 'referenced', 'variant'
      table.json("metadata");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      
      table.foreign("source_id").references("content_items.id").onDelete("CASCADE");
      table.foreign("target_id").references("content_items.id").onDelete("CASCADE");
      
      table.index("source_id");
      table.index("target_id");
      table.index(["source_id", "relationship_type"]);
    }),

    // Domain Events (Event Sourcing / Audit Trail)
    knex.schema.createTable("domain_events", function (table) {
      table.string("id").primary();
      table.string("event_type").notNullable();
      table.string("aggregate_id").notNullable();
      table.json("data").notNullable();
      table.integer("version").defaultTo(1);
      table.timestamp("timestamp").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      
      table.index("event_type");
      table.index("aggregate_id");
      table.index("timestamp");
    })
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("domain_events"),
    knex.schema.dropTableIfExists("content_relationships"),
    knex.schema.dropTableIfExists("content_versions"),
    knex.schema.dropTableIfExists("content_items"),
    knex.schema.dropTableIfExists("content_types")
  ]);
};
