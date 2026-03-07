import { Link } from '@tanstack/react-router'
import { Book, MessageSquare, Globe, LogOut, LogIn, ChevronLeft, Menu } from 'lucide-react'
import { useSession, signIn, signOut } from '@/lib/auth-client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={cn(
      "flex flex-col border-r border-border bg-card transition-all duration-300",
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="p-4 flex items-center justify-between border-b border-border h-16">
        {!isCollapsed && <span className="font-bold text-foreground truncate">Ecosystem</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground ml-auto"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2 overflow-y-auto">
        <SidebarLink to="/notes" icon={<Book className="w-5 h-5" />} label="Notes" isCollapsed={isCollapsed} />
        <SidebarLink to="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Chat" isCollapsed={isCollapsed} />
        <SidebarLink to="/publish" icon={<Globe className="w-5 h-5" />} label="Publish Manager" isCollapsed={isCollapsed} />
      </nav>

      <div className="p-4 border-t border-border mt-auto flex flex-col gap-4">
        {session?.user ? (
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name ?? 'User'} className="w-8 h-8 rounded-none object-cover border border-border flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-muted flex flex-shrink-0 items-center justify-center border border-border">
                <span className="text-muted-foreground text-xs font-semibold">{session.user.name?.charAt(0) || 'U'}</span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
              </div>
            )}
          </div>
        ) : null}

        <button
          onClick={session?.user ? () => signOut() : () => signIn.social({ provider: 'google' })}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-none hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
            isCollapsed && "justify-center"
          )}
          title={session?.user ? 'Sign Out' : 'Sign In'}
        >
          {session?.user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          {!isCollapsed && <span>{session?.user ? 'Sign Out' : 'Sign In'}</span>}
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ to, icon, label, isCollapsed }: { to: string, icon: React.ReactNode, label: string, isCollapsed: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 mx-2 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        "[&.active]:bg-primary/10 [&.active]:text-foreground [&.active]:border-l-2 [&.active]:border-primary",
        isCollapsed && "justify-center"
      )}
      activeProps={{ className: 'active' }}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex-shrink-0">{icon}</div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
