/**
 * Example Usage - DDD Content Management
 * 
 * This file demonstrates how to use the new DDD implementation
 */

const { getModules } = require('../src/modules/bootstrap');

async function exampleUsage() {
  console.log('=== 10x-CMS DDD Implementation Example ===\n');

  // Get all services
  const { modelingService, contentCatalogService, eventBus } = getModules();

  // ========== 1. Define ContentType ==========
  console.log('1. Defining ContentType (Blog Post)...');
  
  const typeResult = await modelingService.defineContentType({
    name: 'exampleBlogPost',
    displayName: 'Example Blog Post',
    description: 'Example blog post for demonstration',
    fields: [
      {
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
        name: 'slug',
        type: 'string',
        required: true,
        description: 'URL slug',
        validations: [
          { type: 'pattern', value: '^[a-z0-9-]+$', message: 'Must be lowercase with hyphens' }
        ]
      },
      {
        name: 'content',
        type: 'richText',
        required: true,
        description: 'Post content'
      },
      {
        name: 'author',
        type: 'string',
        required: true,
        description: 'Author name'
      },
      {
        name: 'tags',
        type: 'array',
        required: false,
        description: 'Post tags'
      }
    ]
  });

  if (!typeResult.isSuccess) {
    console.error('❌ Failed to create ContentType:', typeResult.error);
    return;
  }

  const contentType = typeResult.value;
  console.log('✅ ContentType created:', contentType.id);
  console.log('   Name:', contentType.name);
  console.log('   Fields:', contentType.fields.length);
  console.log('');

  // ========== 2. Create Content (Draft) ==========
  console.log('2. Creating content in DRAFT state...');

  const contentResult = await contentCatalogService.createContent({
    typeId: contentType.id,
    title: 'My First Post',
    slug: 'my-first-post',
    data: {
      title: 'My First Post',
      slug: 'my-first-post',
      content: '<p>This is my first blog post using 10x-CMS with DDD!</p>',
      author: 'John Doe',
      tags: ['introduction', 'ddd', 'cms']
    },
    metadata: {
      seoTitle: 'My First Post - 10x-CMS',
      seoDescription: 'Introduction to DDD-based CMS'
    },
    authorId: 'user_demo_123',
    organizationId: 'org_demo'
  });

  if (!contentResult.isSuccess) {
    console.error('❌ Failed to create content:', contentResult.error);
    return;
  }

  const content = contentResult.value;
  console.log('✅ Content created:', content.id);
  console.log('   State:', content.state);
  console.log('   Version:', content.currentVersion);
  console.log('');

  // ========== 3. Update Content (creates version 2) ==========
  console.log('3. Updating content (creates new version)...');

  const updateResult = await contentCatalogService.updateContent(
    content.id,
    {
      title: 'My First Post - Updated',
      slug: 'my-first-post',
      content: '<p>This is my first blog post using 10x-CMS with DDD! <strong>Updated with more info.</strong></p>',
      author: 'John Doe',
      tags: ['introduction', 'ddd', 'cms', 'updated']
    },
    'user_demo_123',
    'Added more information and updated title'
  );

  if (!updateResult.isSuccess) {
    console.error('❌ Failed to update content:', updateResult.error);
    return;
  }

  console.log('✅ Content updated');
  console.log('   New version:', updateResult.value.contentItem.currentVersion);
  console.log('   Change description:', updateResult.value.version.changeDescription);
  console.log('');

  // ========== 4. Workflow: Submit for Review ==========
  console.log('4. Submitting content for review...');

  const reviewResult = await contentCatalogService.changeContentState(
    content.id,
    'in_review',
    'user_demo_123',
    'Ready for review'
  );

  if (!reviewResult.isSuccess) {
    console.error('❌ Failed to submit for review:', reviewResult.error);
    return;
  }

  console.log('✅ Content submitted for review');
  console.log('   State:', reviewResult.value.state);
  console.log('');

  // ========== 5. Approve Content ==========
  console.log('5. Approving content...');

  const approveResult = await contentCatalogService.changeContentState(
    content.id,
    'approved',
    'user_reviewer_456',
    'Looks good, approved!'
  );

  if (!approveResult.isSuccess) {
    console.error('❌ Failed to approve content:', approveResult.error);
    return;
  }

  console.log('✅ Content approved');
  console.log('   State:', approveResult.value.state);
  console.log('');

  // ========== 6. Publish Content ==========
  console.log('6. Publishing content...');

  const publishResult = await contentCatalogService.publishContent(
    content.id,
    'user_publisher_789',
    ['api', 'website']
  );

  if (!publishResult.isSuccess) {
    console.error('❌ Failed to publish content:', publishResult.error);
    return;
  }

  console.log('✅ Content published!');
  console.log('   State:', publishResult.value.state);
  console.log('   Published at:', publishResult.value.publishedAt);
  console.log('');

  // ========== 7. Get Version History ==========
  console.log('7. Retrieving version history...');

  const historyResult = await contentCatalogService.getVersionHistory(content.id);

  if (historyResult.isSuccess) {
    console.log('✅ Version history retrieved');
    historyResult.value.forEach(version => {
      console.log(`   v${version.versionNumber}:`, version.changeDescription || 'Initial version');
      console.log('      Author:', version.authorId);
      console.log('      Created:', version.createdAt);
    });
  }
  console.log('');

  // ========== 8. Get Event History (Audit Trail) ==========
  console.log('8. Retrieving event history (audit trail)...');

  const events = await eventBus.getEventHistory(content.id);
  
  console.log('✅ Event history retrieved');
  console.log(`   Total events: ${events.length}`);
  events.forEach(event => {
    console.log(`   - ${event.eventType} at ${event.timestamp}`);
  });
  console.log('');

  // ========== 9. Query Published Content ==========
  console.log('9. Querying published content...');

  const publishedResult = await contentCatalogService.getContentByState('published', {
    organizationId: 'org_demo'
  });

  if (publishedResult.isSuccess) {
    console.log('✅ Published content retrieved');
    console.log(`   Found ${publishedResult.value.length} published items`);
    publishedResult.value.forEach(item => {
      console.log(`   - ${item.title} (${item.typeName})`);
    });
  }
  console.log('');

  // ========== 10. Create Related Content ==========
  console.log('10. Creating related content...');

  const relatedContentResult = await contentCatalogService.createContent({
    typeId: contentType.id,
    title: 'Related Post',
    slug: 'related-post',
    data: {
      title: 'Related Post',
      slug: 'related-post',
      content: '<p>This post is related to the first one.</p>',
      author: 'Jane Smith',
      tags: ['related']
    },
    authorId: 'user_demo_123',
    organizationId: 'org_demo'
  });

  if (relatedContentResult.isSuccess) {
    const relatedContent = relatedContentResult.value;
    
    // Add relationship
    const relationshipResult = await contentCatalogService.addRelationship(
      content.id,
      relatedContent.id,
      'related',
      { context: 'example' }
    );

    if (relationshipResult.isSuccess) {
      console.log('✅ Relationship created');
      console.log('   Type:', relationshipResult.value.relationship.type);
      console.log('   From:', content.id);
      console.log('   To:', relatedContent.id);
    }
  }
  console.log('');

  console.log('=== Example completed successfully! ===');
  console.log('');
  console.log('Next steps:');
  console.log('- Check REST API: /api/v2/content-types');
  console.log('- Check REST API: /api/v2/content');
  console.log('- View documentation: docs/DDD_IMPLEMENTATION.md');
  console.log('');
}

// Run example
if (require.main === module) {
  exampleUsage()
    .then(() => {
      console.log('Example finished. Press Ctrl+C to exit.');
    })
    .catch(error => {
      console.error('Error running example:', error);
      process.exit(1);
    });
}

module.exports = { exampleUsage };
