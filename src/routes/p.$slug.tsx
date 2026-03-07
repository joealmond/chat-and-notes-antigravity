import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import ReactMarkdown from 'react-markdown'
import { Globe } from 'lucide-react'

// Define the route with Edge Caching headers natively supported by Cloudflare Workers & TanStack Start SSR
export const Route = createFileRoute('/p/$slug')({
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params }) => {
    // Wait for the query on the server side so it streams down as HTML
    const note = await context.queryClient.ensureQueryData(
      convexQuery(api.notes.getBySlug, { slug: params.slug })
    )
    
    if (!note) {
      throw notFound()
    }
    
    return { note }
  },
  headers: () => {
    return {
      // 10 minute edge cache (stale-while-revalidate for an extra hour)
      'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
    }
  },
  component: PublicNotePage,
})

function PublicNotePage() {
  const { slug } = Route.useParams()
  // Data is fetched and hydrated from loader ensuring zero layout shift
  const { data: note } = useSuspenseQuery(convexQuery(api.notes.getBySlug, { slug }))
  
  if (!note) return null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <header className="w-full max-w-3xl py-8 px-6 flex items-center justify-between border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-none text-sm select-none">
          <Globe className="w-4 h-4" />
          <span>Public</span>
        </div>
      </header>
      
      <main className="w-full max-w-3xl py-12 px-6">
        <article className="prose prose-zinc dark:prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-headings:font-semibold">
          <ReactMarkdown>
            {note.content || '*This note is empty.*'}
          </ReactMarkdown>
        </article>
      </main>
      
      <footer className="w-full py-8 mt-auto border-t border-border flex items-center justify-center text-muted-foreground text-sm">
        Published via Obsidian-inspired Ecosystem
      </footer>
    </div>
  )
}
