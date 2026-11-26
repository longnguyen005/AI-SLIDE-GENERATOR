<div align="center">

# DeckAI — AI Slide Generator

**Fullstack presentation builder that turns prompts into structured outlines, editable 5-layout slide decks, version-controlled revisions, and downloadable `.pptx` files.**

[![CI](https://github.com/longnguyen005/AI-SLIDE-GENERATOR/actions/workflows/ci.yml/badge.svg)](https://github.com/longnguyen005/AI-SLIDE-GENERATOR/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?logo=vercel&logoColor=white)](https://ai-slide-generator-omega.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22_%2F_Express_4-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7_%2F_Mongoose_8-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

---

## Overview

**DeckAI** streamlines presentation creation through a stage-gated, human-editable workflow rather than one-shot black-box generation:

1. **Instant Demo Workspace:** Launch into pre-seeded sample decks in one click (`POST /api/auth/demo`) with an automatic <3.5s browser-local fallback when running frontend-only or during backend cold starts.
2. **Prompt to Outline:** Describe your topic, audience, language, tone, and slide count to generate a structured presentation outline.
3. **Review & Refine:** Reorder, edit, add, or remove outline sections before committing to slide generation.
4. **Interactive 5-Layout Slide Canvas, Brand Themes & AI Regeneration:** Edit titles, bullets, layouts (`title`, `section`, `content`, `two_column`, `summary`), speaker notes, and 4 presentation palettes (`Executive Indigo`, `Venture Emerald`, `Editorial Amber`, `Keynote Coral`) directly in the Studio, duplicate decks or slides in one click, or selectively regenerate individual slides with custom AI instructions.
5. **Slide Version History & Restore:** Every AI regeneration and restore automatically snapshots the slide state so previous revisions can be inspected and restored non-destructively (`POST /api/slides/:slideId/versions/:versionId/restore`), alongside per-slide draft preservation across slide switches and `Ctrl/Cmd+S` shortcuts.
6. **Presenter View, PDF Handout & Native PowerPoint Export:** Rehearse or present live in **Presenter View** (elapsed timer with pause/reset, "Up Next" slide card, teleprompter speaker notes, and keyboard controls), print clean 16:9 landscape PDF handouts, or download themed `.pptx` files via `pptxgenjs` (both server-side and offline browser-demo export).

**Live Application:** [https://ai-slide-generator-omega.vercel.app](https://ai-slide-generator-omega.vercel.app)

---

## Key Engineering Highlights

- **Hybrid Instant Demo Architecture:** `POST /api/auth/demo` idempotently provisions a demo account with two realistic decks (`ready` 5-layout deck + `outline_ready` deck). If the backend is unreachable or cold-starting beyond 3.5 seconds, `apiClient` transparently activates an in-browser demo store with client-side `.pptx` export so visitors never hit a dead end.
- **Resilient Gemini Orchestration:** Supports multi-key rotation (`GEMINI_API_KEYS`), fenced JSON extraction, per-slot retry, automatic model fallback (`gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash-lite`), and deterministic template generation when no API key is configured.
- **Non-Destructive Slide Version Restore:** `SlideVersion` snapshots preserve `title`, `content`, `speakerNotes`, and `layout`. Restoring any historical version via `POST /api/slides/:slideId/versions/:versionId/restore` first snapshots the live slide so zero edits are lost.
- **Production-Hardened Express API:** Helmet security headers, Zod schema validation on every write route, ObjectId route parameter guards, strict per-user deck ownership checks, `bcryptjs` + JWT auth with production `JWT_SECRET` enforcement, and dedicated rate limiters (`api`, `auth`, `ai`, and `export`).
- **Open Design `linear-app` UI System (`Light / Dark`):** Semantic CSS custom-property token architecture (`src/styles/tokens.css`) powering an interactive 5-layout Hero Showcase, accessible Tone selector cards (`Professional`, `Academic`, `Simple`, `Persuasive`), inline Outline section editor (add, reorder, delete, and blank-title normalization), and monoline SVG iconography with zero external UI library bloat.
- **Containerized & CI-Verified:** Multi-stage Docker builds with Nginx SPA routing + `/api/` reverse proxy (`docker-compose.yml`), verified on every push via GitHub Actions (Node 22 + MongoDB 7 service container + Vitest + ESLint + Vite production build).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Open Design `linear-app` semantic CSS tokens (`Light / Dark`), `pptxgenjs` (offline demo export), Vitest + Testing Library |
| **Backend** | Node.js 22 (ESM), Express 4, Zod 4, Helmet, `express-rate-limit`, Vitest + Supertest |
| **Database & Auth** | MongoDB 7, Mongoose 8, Stateless JWT (`jsonwebtoken`), `bcryptjs` |
| **AI & Export** | `@google/generative-ai` (Gemini API key rotation & fallback), `pptxgenjs` 5-layout `.pptx` builder |
| **DevOps** | Docker, Docker Compose, Nginx 1.27 Alpine, GitHub Actions CI, Vercel |

---

## Project Structure

```text
AI-SLIDE-GENERATOR/
├── .github/workflows/ci.yml    # GitHub Actions CI (Backend tests + Frontend lint/tests/build)
├── docker-compose.yml          # Fullstack Mongo 7 + Express API + Nginx SPA stack
├── Backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── config/             # MongoDB connection & validated environment loader (env.js)
│   │   ├── controllers/        # auth, deck, outline, slide, version restore & export handlers
│   │   ├── middleware/         # JWT auth guard, Zod validation & centralized error middleware
│   │   ├── models/             # User, Deck, Slide, SlideVersion & ExportJob schemas
│   │   ├── routes/             # Express route definitions & rate limiters
│   │   ├── services/           # Gemini fallback pool, 5-layout PPTX builder & demo seeder
│   │   └── validators/         # Zod request payload schemas
│   └── tests/                  # Supertest + Vitest integration & repo hygiene suites
└── Frontend/
    └── vite-project/
        ├── Dockerfile
        ├── nginx.conf          # SPA fallback + /api/ reverse proxy to backend:5000
        └── src/
            ├── components/     # 5-layout SlideCanvas, HeroShowcase, RegenerateModal, SideBar, Topbar, etc.
            ├── context/        # AuthContext (JWT + Instant Demo) & ThemeContext (Light / Dark persistence)
            ├── pages/          # Landing, Auth, Dashboard, Create (Tone selector), Outline, Editor & Preview
            ├── service/        # apiClient, browser demoStore & clientPptxExport
            ├── styles/         # Open Design linear-app semantic tokens (tokens.css)
            └── test/           # Vitest + React Testing Library UI & flow tests
```

---

## Quick Start with Docker Compose

Run the complete MongoDB 7 + Backend API + Nginx Frontend stack with zero manual configuration:

```bash
docker compose up --build
```

Once healthy:
- **Frontend Workspace:** [http://localhost:5173](http://localhost:5173) (Nginx serves the React SPA and proxies `/api/*` to `backend:5000`)
- **Backend Healthcheck:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

> **Optional Live Gemini Generation:** Without a Gemini key, DeckAI runs cleanly using built-in structured templates and Instant Demo decks. To enable live Gemini LLM generation in Docker Compose:
> ```bash
> GEMINI_API_KEY=your_key_here docker compose up --build
> ```
> For production container deployments, set `NODE_ENV=production` alongside a strong `JWT_SECRET`.

---

## Local Development Setup (Without Docker)

### Prerequisites

- **Node.js** >= 20 (Node 22 LTS recommended)
- **MongoDB** 7+ (local instance or MongoDB Atlas URI)
- **Google Gemini API Key** *(optional — falls back to deterministic template mode if omitted)*

### 1. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
```

Configure `Backend/.env`:

| Variable | Description |
| :--- | :--- |
| `PORT` | API server port (default: `5000`) |
| `NODE_ENV` | Runtime mode (`development` or `production`; `production` requires a strong non-default `JWT_SECRET`) |
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://localhost:27017/deckai`) |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins (default: `http://localhost:5173`) |
| `GEMINI_API_KEY` | Single Gemini API key (or set `GEMINI_API_KEYS` for comma-separated multi-key rotation) |
| `GEMINI_MODELS` | Comma-separated fallback chain (default: `gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash-lite`) |

Start the backend API server:

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd Frontend/vite-project
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. (Optional: set `VITE_API_URL` if your backend runs somewhere other than `http://localhost:5000/api`.)

---

## Key API Endpoints

| Method & Endpoint | Description |
| :--- | :--- |
| `GET /api/health` | Service & MongoDB connection health check |
| `POST /api/auth/register` / `POST /api/auth/login` | Account registration & JWT sign-in |
| `POST /api/auth/demo` | Instant Demo login with idempotent sample deck seeding |
| `GET /api/decks` / `POST /api/decks` | List user decks or create a new draft presentation (with `tone` and `theme`) |
| `POST /api/decks/:deckId/duplicate` | Clone an existing presentation, its outline, theme, and ordered slides |
| `POST /api/decks/:deckId/outline/generate` | Generate structured presentation outline |
| `PUT /api/decks/:deckId/outline` | Save edited & reordered outline sections |
| `POST /api/decks/:deckId/slides/generate` | Generate (or re-generate) deck slides across 5 layouts |
| `PATCH /api/decks/:deckId/slides/reorder` | Full-permutation slide reordering |
| `POST /api/slides/:slideId/duplicate` | Duplicate a slide in-place and renumber the deck (`<= 10` slides) |
| `POST /api/slides/:slideId/regenerate` | AI-regenerate a single slide and snapshot prior version |
| `GET /api/slides/:slideId/versions` | List saved historical snapshots for a slide |
| `POST /api/slides/:slideId/versions/:versionId/restore` | Snapshot current slide and restore a prior version |
| `POST /api/decks/:deckId/export/pptx` | Stream generated 5-layout PowerPoint `.pptx` file |

---

## Verification & Testing

Run the full automated verification suites from the repository root:

```bash
# Backend integration, security, PPTX export & repo hygiene tests
npm --prefix Backend test
npm --prefix Backend run check

# Frontend unit/integration tests, ESLint & production build
npm --prefix Frontend/vite-project test
npm --prefix Frontend/vite-project run lint
npm --prefix Frontend/vite-project run build
```
