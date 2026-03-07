import { v } from 'convex/values'
import { authMutation, authQuery } from './lib/customFunctions'

export const list = authQuery({
  args: {},
  handler: async (ctx) => {
    // Return all channels for simplicity; you could filter by `members` array in a real app
    return await ctx.db
      .query('channels')
      .order('desc')
      .collect()
  },
})

export const create = authMutation({
  args: { 
    name: v.string(), 
    type: v.union(v.literal('channel'), v.literal('dm')) 
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('channels', {
      name: args.name,
      type: args.type,
      members: [ctx.userId],
    })
  },
})
