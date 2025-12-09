# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NanoDraw (branded as "Nano Banana Pro") is a frontend-only React web application for interacting with Google's Gemini API. It provides a multi-modal chat interface (text + images), real-time API balance tracking, and mini-games during AI thinking time.

## Development Commands

```bash
# Install dependencies (Bun or pnpm)
bun install
# or
pnpm install

# Development server (localhost:3000)
bun dev
# or
pnpm dev

# Production build
bun build
# or
pnpm build

# Preview production build
bun preview
# or
pnpm preview
```

## Tech Stack

- **Framework**: React 19 via Preact compatibility layer
- **Build**: Vite 7 + TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **State**: Zustand with IndexedDB persistence (idb-keyval)
- **AI SDK**: @google/genai (Gemini API)
- **Markdown**: react-markdown + remark-gfm

## Architecture

### State Management (Zustand)

Two separate stores in `src/store/`:
- **useAppStore.ts** - Persistent: API key, messages, image history, settings → saved to IndexedDB
- **useUiStore.ts** - Transient: toasts, dialogs, panel toggles → not persisted

### Data Persistence Strategy

- Large data (messages, full images) stored in IndexedDB via idb-keyval
- Thumbnails (150x150) kept in Zustand state for UI performance
- IDB key pattern: `image_data_{imageId}`

### Key Directories

```
src/
├── components/           # UI Components
│   ├── games/           # Mini-games (Snake, Dino, 2048, Life)
│   └── ui/              # Reusable Toast, Dialog
├── services/            # API logic (geminiService, balanceService)
├── store/               # Zustand stores
└── utils/               # Helpers (image, message, sound, lazyLoad)
```

### Message Flow

1. User input (text + up to 14 images) → `ChatInterface.handleSend()`
2. Creates user message in store
3. Calls geminiService (streaming or batch)
4. Updates model message parts incrementally
5. Extracts images, filters thinking parts before next API turn

### Lazy Loading

Heavy components use `lazyWithRetry()` utility in `src/utils/lazyLoadUtils.ts` for code splitting with retry logic on failed imports.

## Conventions

- **Message IDs**: `Date.now().toString()`
- **User-facing text**: All in Chinese
- **Thinking filter**: Remove thought parts from history before API calls
- **Component naming**: PascalCase with domain context
- **Vite chunks**: `google-genai` and `markdown-libs` isolated for optimization

## Git Info

- **Main branch**: `undy` (use for PRs)
