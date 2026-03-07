import { v } from 'convex/values'
import { authMutation, authQuery } from './lib/customFunctions'
import type { Id } from './_generated/dataModel'

export const list = authQuery({
  args: { parentId: v.optional(v.id('folders')) },
  handler: async (ctx, args) => {
    let qBase = ctx.db.query('folders').withIndex('by_author', (q) => q.eq('authorId', ctx.userId))
    
    if (args.parentId !== undefined) {
      qBase = qBase.filter((q) => q.eq(q.field('parentId'), args.parentId))
    }
    
    return await qBase.collect()
  },
})

export const create = authMutation({
  args: { 
    name: v.string(), 
    parentId: v.optional(v.id('folders')) 
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('folders', {
      name: args.name,
      parentId: args.parentId,
      authorId: ctx.userId,
    })
  },
})

export const remove = authMutation({
  args: { id: v.id('folders') },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id)
    if (!folder || folder.authorId !== ctx.userId) {
      throw new Error('Not found or unauthorized')
    }
    // Delete all notes in this folder
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_folder', (q) => q.eq('folderId', args.id))
      .collect()
    
    for (const note of notes) {
      if (note.authorId === ctx.userId) {
        await ctx.db.delete(note._id as Id<'notes'>)
      }
    }

    if (args.id) {
      await ctx.db.delete(args.id)
    }
  },
})
