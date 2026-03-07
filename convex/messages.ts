import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { publicQuery, publicMutation, authMutation, adminMutation } from './lib/customFunctions'
import { getAuthUserSafe } from './lib/authHelpers'
import { rateLimiter } from './lib/services/rateLimitService'
import type { Id } from './_generated/dataModel'

// List all messages (public)
export const list = publicQuery({
  args: { channelId: v.optional(v.id('channels')) },
  handler: async (ctx, args) => {
    if (args.channelId !== undefined) {
      const channelId = args.channelId as Id<'channels'>
      return await ctx.db.query('messages')
        .withIndex('by_channel', (q) => q.eq('channelId', channelId))
        .order('asc')
        .take(100)
    }
    return await ctx.db.query('messages').order('asc').take(100)
  },
})

// Send a new message (anyone can send, rate limited)
// Uses publicMutation because anonymous users can also post
export const send = publicMutation({
  args: {
    content: v.string(),
    channelId: v.optional(v.id('channels')),
  },
  handler: async (ctx, args) => {
    // Content validation
    const trimmed = args.content.trim()
    if (trimmed.length === 0) throw new ConvexError('Message cannot be empty')
    if (trimmed.length > 2000) throw new ConvexError('Message too long (max 2000 characters)')

    // Get user if authenticated (but don't require it)
    const user = await getAuthUserSafe(ctx)

    // Rate limit: use user ID if authenticated, otherwise use a generic key
    const rateLimitKey = user?._id || 'anonymous'
    await rateLimiter.limit(ctx, 'sendMessage', { key: rateLimitKey })

    const payload: any = {
      content: trimmed,
      authorId: user?._id,
      authorName: user?.name ?? 'Anonymous',
    }
    if (args.channelId !== undefined) {
      payload.channelId = args.channelId
    }

    return await ctx.db.insert('messages', payload)
  },
})

// Delete own message (author only)
// ctx.user and ctx.userId are injected by authMutation
export const remove = authMutation({
  args: {
    id: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) {
      throw new ConvexError('Message not found')
    }

    if (message.authorId !== ctx.userId) {
      throw new ConvexError('Not authorized to delete this message')
    }

    await ctx.db.delete(args.id)
  },
})

// Delete any message (admin only)
// ctx.user and ctx.userId are injected by adminMutation after verifying admin role
export const deleteAny = adminMutation({
  args: {
    id: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) {
      throw new ConvexError('Message not found')
    }

    await ctx.db.delete(args.id)
  },
})
