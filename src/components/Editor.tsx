import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

interface EditorProps {
  initialContent: string
  onChange: (markdown: string) => void
}

export function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Start typing... Use # for headings.',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange((editor.storage as any).markdown.getMarkdown())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-full pb-32 text-foreground',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="w-full h-full max-w-4xl mx-auto px-8 py-12">
      <EditorContent editor={editor} className="w-full h-full" />
    </div>
  )
}
