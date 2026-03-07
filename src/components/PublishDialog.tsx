import { useState, useEffect } from 'react'
import type { Id } from '@convex/_generated/dataModel'
import { X, Globe } from 'lucide-react'

interface Note {
  _id: Id<'notes'>
  title: string
  isPublished: boolean
  publishedSlug?: string
  tags?: string[]
  category?: string
  excerpt?: string
  coverImage?: string
  metaDescription?: string
  readingTime?: number
}

interface PublishDialogProps {
  note: Note
  isOpen: boolean
  onClose: () => void
  onPublish: (updates: Partial<Note>) => Promise<void>
}

export function PublishDialog({ note, isOpen, onClose, onPublish }: PublishDialogProps) {
  const [slug, setSlug] = useState(note.publishedSlug || '')
  const [tags, setTags] = useState(note.tags?.join(', ') || '')
  const [category, setCategory] = useState(note.category || '')
  const [excerpt, setExcerpt] = useState(note.excerpt || '')
  const [coverImage, setCoverImage] = useState(note.coverImage || '')
  const [metaDescription, setMetaDescription] = useState(note.metaDescription || '')
  const [readingTime, setReadingTime] = useState(note.readingTime?.toString() || '')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSlug(note.publishedSlug || '')
      setTags(note.tags?.join(', ') || '')
      setCategory(note.category || '')
      setExcerpt(note.excerpt || '')
      setCoverImage(note.coverImage || '')
      setMetaDescription(note.metaDescription || '')
      setReadingTime(note.readingTime?.toString() || '')
    }
  }, [isOpen, note])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent, publishState?: boolean) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let finalSlug = slug
      if ((publishState || note.isPublished) && !finalSlug) {
        finalSlug = note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)
      }
      
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      
      await onPublish({
        isPublished: publishState !== undefined ? publishState : note.isPublished,
        publishedSlug: finalSlug,
        tags: tagArray.length > 0 ? tagArray : undefined,
        category: category || undefined,
        excerpt: excerpt || undefined,
        coverImage: coverImage || undefined,
        metaDescription: metaDescription || undefined,
        readingTime: readingTime ? parseInt(readingTime, 10) : undefined
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Publish Settings</h2>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">URL Slug</label>
            <input 
              type="text" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="Leave blank to auto-generate"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Excerpt / Summary</label>
            <textarea 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Category</label>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tags} 
                onChange={e => setTags(e.target.value)} 
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Cover Image URL</label>
            <input 
              type="text" 
              value={coverImage} 
              onChange={e => setCoverImage(e.target.value)} 
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">SEO Meta Description</label>
            <textarea 
              value={metaDescription} 
              onChange={e => setMetaDescription(e.target.value)} 
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Reading Time (minutes)</label>
            <input 
              type="number" 
              value={readingTime} 
              onChange={e => setReadingTime(e.target.value)} 
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div>
            {note.isPublished && (
              <button 
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Unpublish
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            
            <button 
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : (note.isPublished ? 'Save & Update' : 'Publish to Web')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
