import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useDebouncedCallback } from 'use-debounce'
import { FileTree } from '@/components/FileTree'
import { Editor } from '@/components/Editor'
import { PublishDialog } from '@/components/PublishDialog'
import { Loader2, Globe, Lock, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/notes')({
  component: NotesApp,
})

function NotesApp() {
  const [activeNoteId, setActiveNoteId] = useState<Id<'notes'> | null>(null)
  
  const activeNote = useQuery(api.notes.get, activeNoteId ? { id: activeNoteId } : 'skip')
  const updateNote = useMutation(api.notes.update)
  const deleteNote = useMutation(api.notes.remove)

  const debouncedSave = useDebouncedCallback(async (id: Id<'notes'>, content: string) => {
    await updateNote({ id, content })
  }, 1000)

  const handleEditorChange = (markdown: string) => {
    if (activeNoteId) {
      debouncedSave(activeNoteId, markdown)
    }
  }

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  const handlePublishSettingsSave = async (updates: any) => {
    if (!activeNoteId) return
    await updateNote({
      id: activeNoteId,
      ...updates
    })
  }

  const handleDelete = async () => {
    if (!activeNoteId || !confirm('Are you sure you want to delete this note?')) return
    await deleteNote({ id: activeNoteId })
    setActiveNoteId(null)
  }

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* Resizable/Fixed Sidebar for Note Tree */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col h-full flex-shrink-0">
        <div className="p-3 border-b border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Explorer</h2>
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          <FileTree 
            activeNoteId={activeNoteId} 
            onSelectNote={(id) => setActiveNoteId(id as Id<'notes'>)} 
          />
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {activeNoteId ? (
          activeNote ? (
            <>
              {/* Note Header / Toolbar */}
              <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0 relative z-10">
                <div className="flex-1 min-w-0 mr-4">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateNote({ id: activeNoteId, title: e.target.value })}
                    className="bg-transparent text-lg font-semibold focus:outline-none w-full text-foreground"
                    placeholder="Untitled Note"
                  />
                </div>
                
                <div className="flex items-center gap-3 pl-4 flex-shrink-0 relative z-20">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {debouncedSave.isPending() ? 'Saving...' : 'Saved'}
                  </span>
                  
                  {activeNote.isPublished && activeNote.publishedSlug && (
                    <a
                      href={`/p/${activeNote.publishedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-500 hover:text-emerald-400 hover:underline flex items-center gap-1.5 px-2 py-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      View Live Version
                    </a>
                  )}
                  
                  <button
                    onClick={() => setIsPublishDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-border bg-card hover:bg-muted transition-colors text-foreground select-none cursor-pointer"
                    title="Publish Settings"
                  >
                    {activeNote.isPublished ? (
                      <><Globe className="w-4 h-4 text-green-500" /> Published</>
                    ) : (
                      <><Lock className="w-4 h-4 text-muted-foreground" /> Private</>
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Tiptap Editor */}
              <div className="flex-1 overflow-y-auto">
                <Editor
                  key={activeNoteId} // Force remount if ID changes completely to prevent state bleeding
                  initialContent={activeNote.content || ''}
                  onChange={handleEditorChange}
                />
              </div>

              {isPublishDialogOpen && activeNote && (
                <PublishDialog
                  note={activeNote}
                  isOpen={isPublishDialogOpen}
                  onClose={() => setIsPublishDialogOpen(false)}
                  onPublish={handlePublishSettingsSave}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 opacity-50" />
              </div>
              <p>Select a note or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
