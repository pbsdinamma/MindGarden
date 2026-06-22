# 🌿 MindGarden — AI-Powered Notes Sanctuary

> An elegant, full-stack notes application with rich text editing, AI summarization, full-text search, smart tags, dark mode, and premium micro-animations.

**Stack:** Next.js 16 · Supabase · TypeScript · Tailwind CSS 4 · Framer Motion · TipTap

---

## ✨ Feature Overview

| Feature | Status |
|---|---|
| Rich text editor (TipTap) | ✅ |
| Full-text search (Ctrl+K) | ✅ |
| Relational tag system | ✅ |
| Pin notes (with optimistic UI) | ✅ |
| Autosave with status indicator | ✅ |
| Optimistic UI updates | ✅ |
| AI summarization (Gemini 2.5 Flash) | ✅ |
| Trash / soft delete | ✅ |
| Sort (updated / created / alphabetical) | ✅ |
| Keyboard shortcuts | ✅ |
| Toast notifications (react-hot-toast) | ✅ |
| Skeleton loading states | ✅ |
| Empty states (all contexts) | ✅ |
| Error boundaries (per section) | ✅ |
| Dark mode (auto + manual) | ✅ |
| Accessibility (WCAG 2.1 AA) | ✅ |
| Performance (memo, lazy, debounce) | ✅ |

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-notes-app
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# AI (optional — sandbox mode activates if missing)
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Migrations

The project uses Supabase as its database. Two migration files are included in `supabase/migrations/`.

> [!IMPORTANT]
> Run migrations in order against your Supabase project before starting the app.

### Option A — Supabase Dashboard SQL Editor

1. Open your Supabase project → **SQL Editor**
2. Run `supabase/migrations/20260622_001_add_notes_columns.sql`
3. Run `supabase/migrations/20260622_002_create_tags_tables.sql`

### Option B — Supabase CLI

```bash
supabase db push
```

### Migration Summary

| File | What it does |
|---|---|
| `20260622_001_add_notes_columns.sql` | Adds `is_deleted`, `deleted_at`, `pinned_at`, `content_text` to `notes`; creates GIN FTS index |
| `20260622_002_create_tags_tables.sql` | Creates `tags` and `note_tags` tables with RLS |

> [!WARNING]
> The app uses both `is_trashed` (legacy) and `is_deleted` (new) columns. Both are kept in sync at the application layer. Do not remove `is_trashed` without a data migration.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open search modal |
| `Ctrl+N` / `⌘N` | Create a new note |
| `Ctrl+S` / `⌘S` | Save current note immediately (bypasses autosave debounce) |
| `Delete` / `Backspace` | Move selected note to trash (when list has focus) |
| `Escape` | Close any open modal or panel |
| `?` | Open keyboard shortcuts help panel |

Press **?** in the dashboard header to see this list at any time.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── ai/route.ts              # Gemini AI summarization
│   │   ├── notes/
│   │   │   ├── route.ts             # GET list, POST create
│   │   │   ├── search/route.ts      # Full-text search
│   │   │   └── [id]/
│   │   │       ├── route.ts         # PATCH, DELETE
│   │   │       ├── pin/route.ts     # Toggle pin
│   │   │       ├── trash/route.ts   # Soft delete
│   │   │       ├── restore/route.ts # Restore from trash
│   │   │       └── tags/
│   │   │           ├── route.ts     # Assign tag
│   │   │           └── [tagId]/route.ts  # Remove tag
│   │   └── tags/
│   │       ├── route.ts             # GET list, POST create
│   │       └── [id]/route.ts        # PATCH rename/recolor, DELETE
│   ├── dashboard/page.tsx           # Main dashboard
│   ├── login/page.tsx               # Auth page
│   ├── layout.tsx                   # Root layout + Toaster
│   └── globals.css                  # Design system + TipTap styles
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx               # Top bar with search + shortcuts
│   │   ├── NoteCard.tsx             # Memoized note card
│   │   ├── NoteEditor.tsx           # Modal editor (TipTap + autosave)
│   │   ├── Sidebar.tsx              # Navigation + tag list
│   │   └── Sketchpad.tsx            # Canvas drawing pad
│   ├── editor/
│   │   ├── RichTextEditor.tsx       # TipTap controlled editor
│   │   └── EditorToolbar.tsx        # Formatting toolbar
│   ├── tags/
│   │   ├── TagBadge.tsx             # Tinted tag pill
│   │   ├── TagSelector.tsx          # Combobox tag selector
│   │   └── TagManager.tsx           # Tag CRUD modal
│   ├── search/
│   │   └── SearchModal.tsx          # Cmd+K search palette
│   ├── ui/
│   │   ├── SkeletonCard.tsx         # Shimmer skeletons
│   │   └── KeyboardShortcutsHelp.tsx
│   ├── ErrorBoundary.tsx            # Per-section error boundaries
│   └── ThemeProvider.tsx            # Dark/light/system theme
├── hooks/
│   ├── useAutosave.ts               # Debounced autosave + status
│   ├── useKeyboardShortcuts.ts      # Global shortcut registry
│   └── useOptimisticUpdate.ts       # Rollback-capable optimistic updates
├── lib/
│   ├── utils.ts                     # cn() class utility
│   └── utils/editor.ts              # extractPlainText (TipTap → plain)
├── types/
│   └── database.types.ts            # All TypeScript interfaces
└── utils/supabase/
    ├── client.ts                    # Browser Supabase client
    ├── server.ts                    # Server Supabase client
    └── middleware.ts                # Session refresh middleware
```

---

## 🔑 Key Design Decisions

### Content Format
Notes are stored as **TipTap JSON** in the `content` column. A `content_text` column stores a plain-text extraction for full-text search (populated on every save). Legacy notes stored as plain text are handled gracefully — TipTap wraps them in a paragraph node automatically.

### Tags: Dual System
- **Legacy:** `notes.tags text[]` — simple string array, still in use for backward compat and sidebar display.
- **Relational:** `tags` + `note_tags` tables — for richer tag features (colors, renaming, filtering by ID).  
Both are kept in sync at the application layer.

### Trash Column Naming
The schema uses `is_trashed` (legacy) alongside the new `is_deleted` + `deleted_at` columns. Both columns are always written together by the application so either can be used for queries.

### Optimistic UI
All mutation operations (pin, trash, restore) use the `useOptimisticUpdate` hook which immediately applies the state change and rolls back automatically on API failure.

### Autosave
The `useAutosave` hook debounces saves by 1 second, tracks the last-saved value to skip no-op saves, cancels pending debounce on note change, and warns before unload if unsaved changes exist.

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `next@16` | App framework |
| `@supabase/ssr` + `@supabase/supabase-js` | Database + Auth |
| `@tiptap/react` + extensions | Rich text editor |
| `lowlight` | Syntax highlighting in code blocks |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `react-hot-toast` | Toast notifications |
| `clsx` + `tailwind-merge` | Class utilities |
| `tailwindcss@4` | Styling |

---

## 🔒 Security

- All API routes validate the Supabase user session server-side before any DB operation.
- Row Level Security (RLS) is enabled on all tables (`notes`, `tags`, `note_tags`).
- Hard delete is gated — only permitted on notes already in the trash.
- Environment variables are never exposed to the client (anon key only).
