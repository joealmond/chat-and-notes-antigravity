import { v } from 'convex/values'
import { authMutation, authQuery, publicQuery } from './lib/customFunctions'

export const list = authQuery({
  args: { folderId: v.optional(v.id('folders')) },
  handler: async (ctx, args) => {
    let qBase = ctx.db.query('notes').withIndex('by_author', (q) => q.eq('authorId', ctx.userId))
    
    if (args.folderId !== undefined) {
      qBase = qBase.filter((q) => q.eq(q.field('folderId'), args.folderId))
    } else {
      qBase = qBase.filter((q) => q.eq(q.field('folderId'), undefined))
    }
    
    return await qBase.collect()
  },
})

export const get = authQuery({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.authorId !== ctx.userId) return null
    return note
  },
})

export const getBySlug = publicQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query('notes')
      .withIndex('by_slug', (q) => q.eq('publishedSlug', args.slug))
      .unique()
      
    if (!note || !note.isPublished) return null
    return note
  },
})

export const create = authMutation({
  args: { 
    title: v.string(), 
    folderId: v.optional(v.id('folders')) 
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notes', {
      title: args.title,
      content: '', // Initial markdown content
      folderId: args.folderId,
      isPublished: false,
      updatedAt: Date.now(),
      authorId: ctx.userId,
    })
  },
})

export const update = authMutation({
  args: {
    id: v.id('notes'),
    title: v.optional(v.string()),
    content: v.optional(v.string()), // markdown string
    folderId: v.optional(v.id('folders')),
    isPublished: v.optional(v.boolean()),
    publishedSlug: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    readingTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.authorId !== ctx.userId) {
      throw new Error('Not found or unauthorized')
    }
    const { id, ...updates } = args
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() })
  },
})

export const remove = authMutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.authorId !== ctx.userId) {
      throw new Error('Not found or unauthorized')
    }
    await ctx.db.delete(args.id)
  },
})
