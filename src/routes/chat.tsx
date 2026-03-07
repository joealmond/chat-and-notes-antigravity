import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Hash, Loader2, Send, MessageSquare, User, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatRelativeTime } from '@/lib/utils'
import { useConvexMutation } from '@convex-dev/react-query'

export const Route = createFileRoute('/chat')({
  component: ChatApp,
})

function ChatApp() {
  const channels = useQuery(api.channels.list)
  const [activeChannelId, setActiveChannelId] = useState<Id<'channels'> | null>(null)
  
  const createChannel = useConvexMutation(api.channels.create)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)

  // Auto-select first channel initially
  useEffect(() => {
    if (channels && channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0]?._id as Id<'channels'>)
    }
  }, [channels, activeChannelId])

  const handleCreateChannel = async () => {
    const name = prompt('Channel Name:')
    if (!name) return
    setIsCreatingChannel(true)
    try {
      const newChannelId = await createChannel({ name, type: 'channel' })
      setActiveChannelId(newChannelId as Id<'channels'>)
    } finally {
      setIsCreatingChannel(false)
    }
  }

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* Channels Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-card/50 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Channels</h2>
          <button 
            onClick={handleCreateChannel}
            disabled={isCreatingChannel}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            +
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {channels === undefined ? (
            <div className="p-4 flex justify-center"><Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /></div>
          ) : channels.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">No channels yet</div>
          ) : (
            <ul className="space-y-0.5 px-2">
              {channels.map((ch: any) => (
                <li key={ch._id}>
                  <button
                    onClick={() => setActiveChannelId(ch._id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      activeChannelId === ch._id 
                        ? 'bg-primary/10 text-foreground font-medium border-l-2 border-primary' 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Hash className="w-4 h-4 flex-shrink-0 opacity-50" />
                    <span className="truncate">{ch.name || 'Unnamed'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full bg-background min-w-0">
        {activeChannelId ? (
          <ChannelChat channelId={activeChannelId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a channel to start chatting
          </div>
        )}
      </main>
    </div>
  )
}

function ChannelChat({ channelId }: { channelId: Id<'channels'> }) {
  const messages = useQuery(api.messages.list, { channelId })
  const user = useQuery(api.auth.getCurrentUser)
  const sendMessage = useConvexMutation(api.messages.send)
  const deleteMessage = useConvexMutation(api.messages.remove)
  
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSending(true)
    try {
      await sendMessage({ content: content.trim(), channelId })
      setContent('')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-border flex items-center px-4 bg-card/30">
        <Hash className="w-5 h-5 text-muted-foreground mr-2" />
        <span className="font-semibold text-foreground">Chat</span>
      </header>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages === undefined ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageEmptyState />
          </div>
        ) : (
          messages.map((msg: any) => (
            <div key={msg._id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-none border border-border bg-card flex-shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{msg.authorName || 'Unknown User'}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(msg._creationTime)}</span>
                  
                  {user && msg.authorId === user._id && (
                    <button
                      onClick={() => deleteMessage({ id: msg._id })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-foreground/90 prose prose-zinc dark:prose-invert prose-p:my-0 prose-pre:my-1 prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border max-w-none break-words">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/30 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder="Type a message... (Markdown supported)"
            className="w-full bg-background border border-input rounded-md px-4 py-3 min-h-[50px] max-h-[200px] resize-y focus:outline-none focus:ring-1 focus:ring-primary text-sm shadow-none"
            rows={2}
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="absolute bottom-3 right-3 p-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="text-[10px] text-muted-foreground mt-2 text-right">
          <strong>*bold*</strong> _italic_ `code`
        </div>
      </div>
    </div>
  )
}

function MessageEmptyState() {
  return (
    <>
      <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-4 bg-muted/20">
        <MessageSquare className="w-5 h-5 opacity-50 text-foreground" />
      </div>
      <p className="font-medium text-foreground">Welcome to the channel!</p>
      <p className="text-sm mt-1">This is the start of the conversation.</p>
    </>
  )
}
