/**
 * Migration: Seed Default ContentTypes
 * Creates default content types for common use cases
 * 
 * This provides immediate value for users migrating from old system
 */

const { generateId } = require('../../../modules/shared/types');

exports.up = async function (knex) {
  const now = new Date().toISOString();

  // Blog Post ContentType
  const blogPostType = {
    id: generateId('type'),
    name: 'blogPost',
    display_name: 'Blog Post',
    description: 'Standard blog post with title, content, author, and metadata',
    version: 1,
    fields: JSON.stringify([
      {
        id: generateId('field'),
        name: 'title',
        type: 'string',
        required: true,
        description: 'Post title',
        validations: [
          { type: 'minLength', value: 1 },
          { type: 'maxLength', value: 200 }
        ]
      },
      {
        id: generateId('field'),
        name: 'slug',
        type: 'string',
        required: true,
        description: 'URL-friendly slug',
        validations: [
          { type: 'pattern', value: '^[a-z0-9-]+$', message: 'Slug must be lowercase alphanumeric with hyphens' }
        ]
      },
      {
        id: generateId('field'),
        name: 'excerpt',
        type: 'string',
        required: false,
        description: 'Short summary',
        validations: [
          { type: 'maxLength', value: 500 }
        ]
      },
      {
        id: generateId('field'),
        name: 'content',
        type: 'richText',
        required: true,
        description: 'Main content'
      },
      {
        id: generateId('field'),
        name: 'featuredImage',
        type: 'media',
        required: false,
        description: 'Featured image'
      },
      {
        id: generateId('field'),
        name: 'author',
        type: 'string',
        required: true,
        description: 'Author name'
      },
      {
        id: generateId('field'),
        name: 'tags',
        type: 'array',
        required: false,
        description: 'Post tags'
      },
      {
        id: generateId('field'),
        name: 'publishedDate',
        type: 'date',
        required: false,
        description: 'Publication date'
      }
    ]),
    metadata: JSON.stringify({}),
    is_deprecated: false,
    deprecation_reason: null,
    created_at: now,
    updated_at: now
  };

  // Landing Page ContentType
  const landingPageType = {
    id: generateId('type'),
    name: 'landingPage',
    display_name: 'Landing Page',
    description: 'Marketing landing page with hero, features, and CTA',
    version: 1,
    fields: JSON.stringify([
      {
        id: generateId('field'),
        name: 'title',
        type: 'string',
        required: true,
        description: 'Page title',
        validations: [
          { type: 'minLength', value: 1 },
          { type: 'maxLength', value: 100 }
        ]
      },
      {
        id: generateId('field'),
        name: 'slug',
        type: 'string',
        required: true,
        description: 'URL slug'
      },
      {
        id: generateId('field'),
        name: 'heroTitle',
        type: 'string',
        required: true,
        description: 'Hero section title'
      },
      {
        id: generateId('field'),
        name: 'heroSubtitle',
        type: 'string',
        required: false,
        description: 'Hero section subtitle'
      },
      {
        id: generateId('field'),
        name: 'heroImage',
        type: 'media',
        required: false,
        description: 'Hero background image'
      },
      {
        id: generateId('field'),
        name: 'ctaText',
        type: 'string',
        required: true,
        description: 'Call to action button text'
      },
      {
        id: generateId('field'),
        name: 'ctaLink',
        type: 'string',
        required: true,
        description: 'Call to action URL'
      },
      {
        id: generateId('field'),
        name: 'features',
        type: 'array',
        required: false,
        description: 'Feature list'
      },
      {
        id: generateId('field'),
        name: 'seoTitle',
        type: 'string',
        required: false,
        description: 'SEO title tag'
      },
      {
        id: generateId('field'),
        name: 'seoDescription',
        type: 'string',
        required: false,
        description: 'SEO meta description'
      }
    ]),
    metadata: JSON.stringify({}),
    is_deprecated: false,
    deprecation_reason: null,
    created_at: now,
    updated_at: now
  };

  // Announcement ContentType
  const announcementType = {
    id: generateId('type'),
    name: 'announcement',
    display_name: 'Announcement',
    description: 'System-wide announcement or notification',
    version: 1,
    fields: JSON.stringify([
      {
        id: generateId('field'),
        name: 'title',
        type: 'string',
        required: true,
        description: 'Announcement title',
        validations: [
          { type: 'minLength', value: 1 },
          { type: 'maxLength', value: 100 }
        ]
      },
      {
        id: generateId('field'),
        name: 'message',
        type: 'string',
        required: true,
        description: 'Announcement message',
        validations: [
          { type: 'maxLength', value: 1000 }
        ]
      },
      {
        id: generateId('field'),
        name: 'type',
        type: 'string',
        required: true,
        description: 'Announcement type',
        validations: [
          { type: 'enum', value: ['info', 'warning', 'error', 'success'] }
        ]
      },
      {
        id: generateId('field'),
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Priority level',
        validations: [
          { type: 'enum', value: ['low', 'medium', 'high', 'urgent'] }
        ],
        defaultValue: 'medium'
      },
      {
        id: generateId('field'),
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Start display date'
      },
      {
        id: generateId('field'),
        name: 'endDate',
        type: 'date',
        required: false,
        description: 'End display date'
      },
      {
        id: generateId('field'),
        name: 'targetAudience',
        type: 'array',
        required: false,
        description: 'Target user roles'
      }
    ]),
    metadata: JSON.stringify({}),
    is_deprecated: false,
    deprecation_reason: null,
    created_at: now,
    updated_at: now
  };

  // Insert content types
  await knex('content_types').insert([
    blogPostType,
    landingPageType,
    announcementType
  ]);

  return true;
};

exports.down = async function (knex) {
  // Remove seeded content types
  await knex('content_types')
    .whereIn('name', ['blogPost', 'landingPage', 'announcement'])
    .delete();

  return true;
};
