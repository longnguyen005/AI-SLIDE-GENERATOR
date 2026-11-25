<div align="center">

# DeckAI — AI Slide Generator

**Fullstack presentation builder that turns prompts into structured outlines, editable slide decks, and downloadable `.pptx` files.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-slide-generator-omega.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)

</div>

---

## Overview

**DeckAI** streamlines presentation creation through a guided, human-editable workflow rather than one-shot black-box generation:

1. **Prompt to Outline:** Describe your topic, audience, and slide count to generate a structured presentation outline.
2. **Review & Refine:** Adjust the outline before committing to full slide generation.
3. **Interactive Canvas & Per-Slide Regeneration:** Edit slide content in the workspace canvas or selectively regenerate individual slides with AI instructions.
4. **Native PowerPoint Export:** Export the finished deck directly as a `.pptx` file via `pptxgenjs`.

**Live Application:** [https://ai-slide-generator-omega.vercel.app](https://ai-slide-generator-omega.vercel.app)

---

## Key Engineering Highlights

- **Stage-Gated Generation Flow:** Separate `outline`, `deck`, `slide`, and `export` API controllers keep generation predictable and let users edit intermediate structure before rendering slides.
- **Resilient LLM Provider Layer:** Supports multi-key rotation (`GEMINI_API_KEYS`) and automatic model fallback chains (`gemini-2.5-flash` → `gemini-2.5-pro` → `gemini-2.0-flash`) to handle quota spikes gracefully.
- **Secured REST API:** Stateless JWT authentication (`jsonwebtoken` + `bcryptjs` password hashing), route-level rate limiting (`express-rate-limit`), and request payload validation.
- **Modular React 19 Workspace:** Built with React 19, Vite 8, and React Router v7 featuring dedicated views for Dashboard metrics, Creation Wizard, Outline Editor, Interactive Slide Canvas, Regenerate Modal, and Fullscreen Preview.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, Custom Modular CSS |
| **Backend** | Node.js (ESM), Express 4, RESTful MVC Architecture |
| **Database & Auth** | MongoDB, Mongoose 8, JWT (`jsonwebtoken`), `bcryptjs`, `express-rate-limit` |
| **AI & Document Export** | `@google/generative-ai` (Gemini API with key rotation & model fallback), `pptxgenjs` |

---

## Project Structure

```text
AI-SLIDE-GENERATOR/
├── Backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection & environment configuration
│   │   ├── controllers/    # auth, outline, deck, slide, and export handlers
│   │   ├── middleware/     # JWT auth guard & rate-limiting middleware
│   │   ├── models/         # Mongoose schemas (users, decks, slides)
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Gemini AI orchestration & PPTX builder services
│   │   └── validators/     # Input validation rules
│   └── package.json
└── Frontend/
    └── vite-project/
        ├── src/
        │   ├── components/ # SlideCanvas, RegenerateModal, ProgressSteps, SideBar, Topbar
        │   ├── pages/      # Landing, Auth, Dashboard, CreatePresentation, Outline, Editor, Preview
        │   └── service/    # Centralized API client
        └── package.json
```

---

## Local Development Setup

### Prerequisites

- **Node.js** >= 20
- **MongoDB** (local instance or MongoDB Atlas URI)
- **Google Gemini API Key**

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
| `MONGODB_URI` | MongoDB connection string (e.g., `mongodb://localhost:27017/deckai`) |
| `JWT_SECRET` | Secret key used to sign authentication tokens |
| `CORS_ORIGIN` | Allowed frontend origin (default: `http://localhost:5173`) |
| `GEMINI_API_KEY` | Single Gemini API key (or use `GEMINI_API_KEYS` for comma-separated rotation) |
| `GEMINI_MODELS` | Comma-separated fallback chain (default: `gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash`) |

Start the backend server:

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd Frontend/vite-project
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
