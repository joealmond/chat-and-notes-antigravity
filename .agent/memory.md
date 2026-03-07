# Project Architecture & AI Memory

This document serves as the repository memory for Agentic AI assistants working on this project. It outlines the technology stack, specific design language, and architectural decisions made for the Scalable Productivity Ecosystem.

## The Goal
A highly scalable, Obsidian-like productivity ecosystem consisting of a Note-Taking Engine, a Publishing Engine, and a Real-Time Chat Tool.

## Technology Stack
- **Frontend Framework**: React, TanStack Start (File-based routing, Edge SSR).
- **Backend/Database**: Convex (Real-time sync, WebSockets, Serverless functions).
- **Authentication**: Better Auth with Google OAuth (integrated directly with Convex via `@convex-dev/better-auth`).
- **Styling**: Tailwind CSS (v4)
- **Editor**: Tiptap (chosen for full DOM control to implement markdown/slash-commands over Novel).
- **Icons**: Lucide-React
- **State/Debouncing**: `use-debounce` for optimistic auto-saving to Convex.

## Strict Design Aesthetics (CRITICAL)
- **Vibe**: Obsidian-inspired strict, minimalist "Dark Mode".
- **Color Palette**: Slate / Zinc monochromatic grays.
- **Borders & Corners**: Flat borders (`border-border`), sharp or very slightly rounded (`rounded-sm` or `rounded-md`) corners.
- **NEVER USE**: Drop shadows, heavy gradients, bright un-curated colors, or bubbly/rounded UI (e.g., `rounded-xl`, `rounded-full` except for specific avatars/toggles). Everything must feel like native, high-contrast, flat desktop software.
- **Layout**: Unified, collapsible `<AppSidebar />` that manages navigation between the Notes, Chat, and Publishing domains.

## Core Features & Logic
1. **Note-Taking Engine**:
   - File explorer tree (`<FileTree />`) allows deeply nested folders.
   - Folder/Note creation uses inline `<input>` fields bounded by React state (never use native `prompt()`).
   - Tiptap editor parses and renders Markdown equivalents natively using `@tailwindcss/typography` (`prose prose-invert`).
   - Notes auto-save via `useDebouncedCallback` to prevent socket flooding.
2. **Publishing / SEO**:
   - Notes have extensive optional frontmatter: `slug`, `tags`, `category`, `excerpt`, `coverImage`, `metaDescription`, `readingTime`.
   - A dedicated `<PublishDialog />` modal populates these fields before generating a Live route.
   - Public published notes are served via `/p/$slug` using TanStack Start's Edge SSR with aggressive caching headers `s-maxage=600, stale-while-revalidate=3600`.
3. **Chat Tool**:
   - Distinct Channels vs DMs paradigm.
   - Messages support markdown natively (via `react-markdown`).
   - Users can delete their own live messages (optimistic UI updates).

## Known Gotchas
- **Auth Secrets**: When deploying or testing locally alongside a deployed Convex backend, ensure the `.env.local` `BETTER_AUTH_SECRET` perfectly matches the one set in the Convex dashboard (`npx convex env set`), otherwise `Unauthenticated` errors will block hydration and Hot-Module Replacement.
- **Z-Index Hit Targets**: When building toolbars with `flex-1` elements (like title inputs), carefully bound them and apply `z-index` so they don't overlap clickable action buttons.
