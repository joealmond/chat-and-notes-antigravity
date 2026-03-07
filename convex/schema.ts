import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Chat app messages
  messages: defineTable({
    content: v.string(),
    channelId: v.optional(v.id('channels')),
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()), // Legacy field
    createdAt: v.optional(v.number()), // Legacy field
  }).index('by_channel', ['channelId']),

  // Note-Taking App
  notes: defineTable({
    title: v.string(),
    content: v.string(), // Markdown string
    folderId: v.optional(v.id('folders')),
    isPublished: v.boolean(),
    publishedSlug: v.optional(v.string()),
    
    // Frontmatter & SEO Fields
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    readingTime: v.optional(v.number()),

    updatedAt: v.number(),
    authorId: v.string(),
  })
    .index('by_author', ['authorId'])
    .index('by_folder', ['folderId'])
    .index('by_slug', ['publishedSlug']),

  folders: defineTable({
    name: v.string(),
    parentId: v.optional(v.id('folders')),
    authorId: v.string(),
  })
    .index('by_author', ['authorId'])
    .index('by_parent', ['parentId']),

  // Chat App Channels
  channels: defineTable({
    name: v.optional(v.string()),
    type: v.union(v.literal('channel'), v.literal('dm')),
    members: v.array(v.string()), // user IDs
  }).index('by_members', ['members']),

  // File uploads example
  files: defineTable({
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index('by_uploader', ['uploadedBy']),
})
