import { createRootRouteWithContext, useRouteContext, Navigate } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ImpersonateProvider } from '@/hooks/use-impersonate'
import { AdminToolbar } from '@/components/AdminToolbar'
import { AppSidebar } from '@/components/AppSidebar'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import { LogIn } from 'lucide-react'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexQueryClient } from '@convex-dev/react-query'

import '../styles/globals.css'

// Get auth information for SSR using available cookies
const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Convex + TanStack + Cloudflare' },
      { name: 'description', content: 'Production-ready full-stack template' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
    scripts: [
      {
        // Enforce dark mode permanently
        children: `document.documentElement.classList.add('dark');`,
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    const token = await getAuth()

    // All queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return {
      isAuthenticated: !!token,
      token,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang="en" suppressHydrationWarning className="dark">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background antialiased flex flex-col h-screen overflow-hidden">
          <ImpersonateProvider>
            <ErrorBoundary>
              {!context.isAuthenticated ? (
                <div className="flex flex-1 items-center justify-center bg-background">
                  <div className="max-w-md w-full p-8 border border-border bg-card shadow-none">
                    <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Sign In Required</h1>
                    <p className="text-muted-foreground text-center mb-8">
                      You must be signed in to access the Productivity Ecosystem.
                    </p>
                    <button
                      onClick={() => authClient.signIn.social({ provider: 'google' })}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign in with Google
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex w-full h-full">
                  <AppSidebar />
                  <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <Outlet />
                  </main>
                </div>
              )}
            </ErrorBoundary>
            <AdminToolbar />
            <Toaster />
          </ImpersonateProvider>
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}

