# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NanoDraw (branded as "Nano Banana Pro") is a frontend-only React web application for interacting with Google's Gemini API. It provides a multi-modal chat interface (text + images), real-time API balance tracking, and mini-games during AI thinking time. Includes PWA support for installable app experience.

## Development Commands

```bash
# Install dependencies (Bun >= 1.2.1 or pnpm >= 8, Node >= 18)
bun install   # or pnpm install

# Development server (localhost:3000)
bun dev       # or pnpm dev

# Production build
bun build     # or pnpm build

# Preview production build
bun preview   # or pnpm preview
```

## Tech Stack

- **Framework**: React 19 via Preact compatibility layer (`@preact/preset-vite`)
- **Build**: Vite 7 + TypeScript 5.9 + vite-plugin-pwa
- **Styling**: Tailwind CSS 4
- **State**: Zustand with IndexedDB persistence (idb-keyval)
- **AI SDK**: @google/genai (Gemini API)
- **Markdown**: react-markdown + remark-gfm

## Architecture

### Path Alias

Use `@/` to import from `src/` directory (configured in vite.config.ts).

### State Management (Zustand)

Two separate stores in `src/store/`:
- **useAppStore.ts** - Persistent (IndexedDB): API key, settings, imageHistory. Non-persistent: messages, isLoading, inputText, balance
- **useUiStore.ts** - Transient: toasts, dialogs, panel toggles

### Data Persistence Strategy

- **Persisted to IndexedDB**: API key, settings, image history thumbnails
- **NOT persisted**: Chat messages (cleared on page reload), balance info
- Full images stored separately in IDB with key pattern: `image_data_{imageId}`
- Thumbnails (150x150) kept in Zustand state for UI performance

### Message Flow

1. User input (text + up to 14 images) → `ChatInterface.handleSend()`
2. Creates user message in store
3. Calls geminiService (streaming or batch based on `settings.streamResponse`)
4. Updates model message parts incrementally
5. Extracts images, filters thinking parts (`part.thought`) before next API turn

### Lazy Loading

Heavy components use `lazyWithRetry()` utility in `src/utils/lazyLoadUtils.ts` for code splitting with retry logic on failed imports.

## Conventions

- **Message IDs**: `Date.now().toString()`
- **User-facing text**: All in Chinese
- **Thinking filter**: Remove `thought` parts from history before API calls (see `geminiService.ts`)
- **Vite manual chunks**: `google-genai` and `markdown-libs` isolated for optimization
