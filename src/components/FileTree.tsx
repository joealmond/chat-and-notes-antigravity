import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder as FolderIcon, Plus } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  activeNoteId: string | null
  onSelectNote: (id: string) => void
  parentId?: Id<'folders'>
  level?: number
}

export function FileTree({ activeNoteId, onSelectNote, parentId, level = 0 }: FileTreeProps) {
  const folders = useQuery(api.folders.list, { parentId })
  const notes = useQuery(api.notes.list, { folderId: parentId })
  const createNote = useMutation(api.notes.create)
  const createFolder = useMutation(api.folders.create)

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newItemState, setNewItemState] = useState<{
    type: 'note' | 'folder'
    parentId?: Id<'folders'>
  } | null>(null)
  const [newItemName, setNewItemName] = useState('')

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders)
    if (next.has(folderId)) {
      next.delete(folderId)
    } else {
      next.add(folderId)
    }
    setExpandedFolders(next)
  }

  const submitNewItem = async () => {
    if (!newItemState || !newItemName.trim()) {
      setNewItemState(null)
      setNewItemName('')
      return
    }

    if (newItemState.type === 'note') {
      const id = await createNote({ title: newItemName.trim(), folderId: newItemState.parentId })
      onSelectNote(id)
    } else {
      await createFolder({ name: newItemName.trim(), parentId: newItemState.parentId })
    }

    if (newItemState.parentId) {
      const next = new Set(expandedFolders)
      next.add(newItemState.parentId as string)
      setExpandedFolders(next)
    }
    
    setNewItemState(null)
    setNewItemName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitNewItem()
    if (e.key === 'Escape') {
      setNewItemState(null)
      setNewItemName('')
    }
  }

  if (folders === undefined || notes === undefined) {
    return <div className="px-4 py-2 text-sm text-muted-foreground animate-pulse">Loading...</div>
  }

  return (
    <ul className="space-y-0.5">
      {folders.map((folder: any) => (
        <li key={folder._id}>
          <div
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted rounded-none cursor-pointer group"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <button onClick={() => toggleFolder(folder._id)} className="p-0.5 hover:bg-accent rounded text-muted-foreground">
              {expandedFolders.has(folder._id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 truncate text-foreground select-none" onDoubleClick={() => toggleFolder(folder._id)}>
              {folder.name}
            </span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center">
              <button 
                onClick={(e) => { e.stopPropagation(); setNewItemState({ type: 'note', parentId: folder._id }) }} 
                className="p-1 hover:bg-accent rounded text-muted-foreground" 
                title="New Note"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {expandedFolders.has(folder._id) && (
            <FileTree
              activeNoteId={activeNoteId}
              onSelectNote={onSelectNote}
              parentId={folder._id}
              level={level + 1}
            />
          )}
        </li>
      ))}

      {notes.map((note) => (
        <li key={note._id}>
          <button
            onClick={() => onSelectNote(note._id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-none text-left group",
              activeNoteId === note._id ? "bg-primary/10 text-foreground font-medium border-l-2 border-primary" : "text-muted-foreground"
            )}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
          >
            <File className="w-4 h-4" />
            <span className="text-sm truncate flex-1 leading-tight">{note.title}</span>
            {note.isPublished && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Published" />
            )}
          </button>
        </li>
      ))}

      {newItemState && newItemState.parentId === parentId && (
        <li style={{ paddingLeft: `${level * 12 + (newItemState.type === 'note' ? 24 : 8)}px` }}>
          <div className="flex items-center gap-2 px-2 py-1.5 w-full">
            {newItemState.type === 'note' ? <File className="w-4 h-4 text-muted-foreground" /> : <FolderIcon className="w-4 h-4 text-muted-foreground" />}
            <input
              autoFocus
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newItemName.trim()) {
                  setNewItemState(null)
                  setNewItemName('')
                } else {
                  submitNewItem()
                }
              }}
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground"
              placeholder={`New ${newItemState.type} name...`}
            />
          </div>
        </li>
      )}

      {level === 0 && folders.length === 0 && notes.length === 0 && !newItemState && (
        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
          <p className="mb-4">No notes here.</p>
        </div>
      )}
      
      {level === 0 && (
        <div className="flex items-center gap-2 px-4 py-4 mt-4 border-t border-border">
          <button 
            onClick={() => setNewItemState({ type: 'note' })} 
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            + New Note
          </button>
          <button 
            onClick={() => setNewItemState({ type: 'folder' })} 
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            + New Folder
          </button>
        </div>
      )}
    </ul>
  )
}
