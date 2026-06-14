<div align="center">

# 🧠 DocuRec AI
### Intelligent Indian Document Intelligence Platform

**Turn any blurry scan into structured, searchable, AI-queryable data — in any Indian language.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)

</div>

---

## The Problem

India processes **crores of paper documents daily** — Aadhaar cards, PAN cards, land records, court notices, ration cards, certificates. Most are:

- Physically stored or scanned as low-quality images
- In multiple Indian languages (Hindi, Tamil, Telugu, Bengali, and more)
- Impossible to search, compare, or extract data from at scale
- Full of private information (PII) that needs protection before sharing
- Managed by **CSC (Common Service Centre) operators** who handle documents for hundreds of different villagers — not just their own

**DocuRec AI solves this end-to-end** — from upload to structured intelligence, for individuals and operators managing many people's documents.

---

## What It Does

Upload a document image → our 2-stage AI pipeline kicks in:

1. **Tesseract OCR** reads raw text from the scan (handles blurry, low-res, mixed-language scans)
2. **Gemini 2.5 Flash via LangChain** corrects OCR errors, classifies the document, extracts structured fields, detects languages, identifies PII fields, and scores document health

The result: a fully structured document with extracted fields, a confidence score, a health score, and full-text search — all stored securely and queryable via AI chat.

On top of this, an operator can organize documents under **Citizens** — separate folders for each person they serve — so one account scales from "my own documents" to "100 villagers' documents."

---

## Key Features

### 👥 Multi-User Citizen Management (for CSC Operators)
- Add **Citizens** (villagers/clients) under your operator account — name, phone, village, district, state, notes
- Each citizen gets their own document folder, completely separate from your personal documents
- Upload documents directly into a citizen's folder, or pick a citizen from a dropdown on the main Upload page
- **"My Documents Only"** toggle on the Documents page — instantly separate your own files from citizen-assigned ones
- Citizen profile page with inline-editable fields and live document count
- Search citizens by name, phone, village, or district
- Deleting a citizen never deletes their documents — documents simply become unassigned, protecting against accidental data loss

### 📤 Smart Document Ingestion
- Drag-and-drop or batch upload (JPEG, PNG, TIFF, PDF)
- Single file or up to 50 documents at once with per-document progress tracking
- Optionally tag any upload with a `citizenId` to file it under that person's folder
- Stored on **ImageKit CDN** with automatic thumbnail generation

### 🤖 2-Stage AI OCR Pipeline
- **Stage 1 — Tesseract:** Fast local OCR, supports `eng+hin` out of the box (traineddata files included in repo)
- **Stage 2 — Gemini 2.5 Flash:** Corrects errors, detects 12+ Indian languages, classifies 16 document types, extracts structured fields with confidence scores, flags PII
- Even heavily degraded scans extract partial data (confidence 55–70) rather than failing

### 📊 Document Intelligence Dashboard
- Per-document confidence bar and health score with suggestions
- All extracted fields displayed with individual confidence levels
- Inline field correction — click any field to edit, correction logged with timestamp
- Full extracted text view — the AI-cleaned, human-readable version
- Real-time status updates (`queued → processing → completed`) via polling — no manual refresh needed

### 💬 AI Chat (RAG)
- Ask questions about a single document or your entire library
- Powered by **LangChain + Gemini** with full conversation history
- AI cites which document each answer came from
- Works in Hindi and English — responds in whichever language you use
- Chat sessions persist across navigation — switching pages or reloading won't lose your conversation

### 🛡️ PII Anonymizer
- Auto-detects Aadhaar numbers, PAN, phone numbers, DOB, addresses
- One-click mask/unmask per document
- Safe-share mode: export or display with private fields hidden

### 🔄 Document Comparison
- Select any two documents → AI returns a field-level diff (added, removed, changed)
- Useful for comparing two versions of a land record or certificate

### 🌐 Multilingual Translation
- Translate extracted document text to any target language via Gemini AI
- Original text preserved; translation stored separately

### 🔍 Full-Text Search
- MongoDB text index across all documents, extracted text, and field values
- Falls back to most-recent documents if text search returns no results
- Citizen search across name, phone, village, and district

### 📈 Analytics Panel
- Total documents, processed count, avg confidence, languages breakdown
- Document type distribution (pie chart via Recharts)
- Processing trends over time (area chart)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR, ESM native |
| **State** | Redux Toolkit + React Query | Predictable auth state + server cache |
| **UI** | TailwindCSS + shadcn/ui + Framer Motion | Custom dark design system with animations |
| **Backend** | Node.js + Express.js | Lightweight, flexible |
| **Database** | MongoDB 8 + Mongoose | Flexible schema for heterogeneous doc types |
| **Cache + Queue** | Redis 7 + Bull | Response caching + async OCR job queue |
| **AI** | Gemini 2.5 Flash via `@langchain/google-genai` | Fast, multilingual, structured output |
| **OCR** | Tesseract.js (eng+hin traineddata bundled) | Local, offline-capable first-pass OCR |
| **Storage** | ImageKit CDN | CDN delivery + image transforms |
| **Auth** | JWT (7-day) + bcryptjs | Simple, stateless, no refresh token complexity |
| **Security** | Helmet, express-rate-limit, mongoSanitize, xss-clean | Production hardened |
| **Logging** | Winston + daily-rotate | Structured logs, auto-rotation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                      │
│  Redux (auth token) → Axios interceptor → All API calls         │
│  Pages: Home, Dashboard, Documents, Upload, Chat, Compare,      │
│         Citizens, CitizenDetail                                 │
│  Components: DocumentCard, UploadZone, Skeleton, AppLayout      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS  /api/v1/*
┌────────────────────────▼────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│                                                                 │
│  Middleware chain:                                              │
│  Helmet → CORS → Rate Limiter → JWT Auth → Controllers          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │   /auth     │  │  /documents │  │    /chat     │           │
│  │  register   │  │  upload     │  │  sessions    │           │
│  │  login      │  │  batch      │  │  messages    │           │
│  │  logout     │  │  mask-pii   │  │  (RAG)       │           │
│  │  /me        │  │  compare    │  └──────────────┘           │
│  └─────────────┘  │  translate  │  ┌──────────────┐           │
│                   │  analytics  │  │  /citizens   │           │
│                   └─────────────┘  │  CRUD        │           │
│                                     │  documents   │           │
│                                     └──────────────┘           │
│                                                                 │
│  Services:                                                      │
│  documentService → ocrService (Tesseract → Gemini) → Document  │
│  aiService (chat, translate, compare) → ChatSession            │
│  citizenService (CRUD, document linking, doc count refresh)    │
└────────────┬───────────────┬────────────────┬───────────────────┘
             │               │                │
        ┌────▼────┐    ┌─────▼────┐    ┌──────▼──────┐
        │ MongoDB │    │  Redis   │    │  ImageKit   │
        │ (docs,  │    │ (cache,  │    │  (CDN file  │
        │ users,  │    │  queues) │    │   storage)  │
        │ chats,  │    └──────────┘    └─────────────┘
        │ citizens)│
        └─────────┘
             │ LangChain calls
        ┌────▼────────────────┐
        │  Gemini 2.5 Flash   │
        │  (OCR correction,   │
        │   chat, translate,  │
        │   comparison)       │
        └─────────────────────┘
```

---

## Project Structure

```
Docurec.ai/
├── backend/
│   ├── eng.traineddata          ← Tesseract English data (bundled)
│   ├── hin.traineddata          ← Tesseract Hindi data (bundled)
│   └── src/
│       ├── config/
│       │   ├── ai.js            ← Gemini client (generateText, generateWithSystem, generateWithHistory)
│       │   ├── database.js      ← MongoDB connection
│       │   ├── imagekit.js      ← ImageKit upload/delete helpers
│       │   └── redis.js         ← Redis cache helpers (get, set, del, delPattern)
│       ├── controllers/
│       │   ├── authController.js      ← register, login, logout, getMe
│       │   ├── documentController.js  ← upload, batchUpload, getDocuments, maskPII, compare, translate, analytics
│       │   ├── chatController.js      ← createSession, getSessions, sendMessage, deleteSession
│       │   └── citizenController.js   ← create, getAll, getOne, update, remove, getDocuments
│       ├── middleware/
│       │   ├── auth.js          ← JWT authenticate + generateToken
│       │   ├── errorHandler.js  ← Global error + 404 handlers
│       │   ├── rateLimiter.js   ← auth (10/15min), upload (10/min), chat (20/min), api (100/15min)
│       │   ├── upload.js        ← Multer (single + batch, memory storage)
│       │   └── validators.js    ← express-validator rules + validate() helper
│       ├── models/
│       │   ├── User.js          ← name, email, password (hashed), role, stats, lastLoginAt
│       │   ├── Document.js      ← full document schema with fieldSchema (isPII, isMasked) + optional citizenId
│       │   ├── Citizen.js       ← name, phone, village, district, state, notes, documentCount
│       │   └── ChatSession.js   ← messages[], documentId, isGlobal, lastMessageAt
│       ├── routes/
│       │   ├── auth.js          ← POST /register, /login, /logout · GET /me
│       │   ├── documents.js     ← CRUD + upload, mask, correct, translate, compare, analytics
│       │   ├── chat.js          ← session CRUD + POST /sessions/:id/message
│       │   ├── users.js         ← GET/PATCH profile, PATCH password
│       │   └── citizens.js      ← CRUD + GET /:id/documents
│       ├── services/
│       │   ├── ocrService.js    ← runTesseract() → processWithGemini() → processDocument()
│       │   ├── documentService.js ← createDocument, processDocumentById, maskPIIFields, etc.
│       │   ├── aiService.js     ← chat(), translateDocument(), compareDocuments()
│       │   └── citizenService.js ← createCitizen, getUserCitizens, getCitizenDocuments, refreshCitizenDocumentCount
│       ├── utils/
│       │   ├── ApiError.js      ← Custom error class with status code
│       │   ├── response.js      ← sendSuccess, sendCreated, sendError, sendPaginated helpers
│       │   └── email.js         ← Stub (not used — no email verification in this version)
│       ├── app.js               ← Express app setup (middleware chain + route mounting)
│       └── server.js            ← HTTP server + graceful shutdown (SIGTERM/SIGINT)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── common/
        │   │   ├── AppLayout.jsx   ← Sidebar + main content wrapper
        │   │   ├── Sidebar.jsx     ← Navigation with collapse support (incl. Citizens link)
        │   │   └── MobileNav.jsx   ← Bottom nav for mobile (incl. Citizens link)
        │   ├── features/
        │   │   ├── DocumentCard.jsx    ← Card + DocumentCardSkeleton
        │   │   └── UploadZone.jsx      ← Drag-drop + progress tracking, optional citizenId
        │   └── ui/
        │       └── skeleton.jsx        ← shadcn/ui-style Skeleton component
        ├── pages/
        │   ├── Home.jsx           ← Landing page (features, stats, how-it-works, CTA)
        │   ├── Login.jsx          ← Email + password, single JWT, Redux setAuth
        │   ├── Register.jsx       ← Name, email, password → immediately logged in
        │   ├── Dashboard.jsx      ← Analytics charts (Recharts) + recent documents + quick actions
        │   ├── Documents.jsx      ← Searchable, filterable document list + "My Documents Only" toggle
        │   ├── DocumentDetail.jsx ← Extracted fields, PII toggle, field correction, translate, live status
        │   ├── Upload.jsx         ← Single / Batch mode switcher + citizen selector
        │   ├── Chat.jsx           ← Multi-session AI chat with document context (persists across navigation)
        │   ├── Compare.jsx        ← Select two docs → field-level diff
        │   ├── Citizens.jsx       ← Citizen directory: search, add, remove
        │   └── CitizenDetail.jsx  ← Citizen profile + their document folder + scoped upload
        ├── services/
        │   └── api.js             ← Axios instance, request interceptor (token), authAPI, documentAPI, chatAPI, userAPI, citizenAPI
        ├── store/
        │   ├── index.js           ← Redux store (auth + ui reducers)
        │   ├── authSlice.js       ← setAuth, updateUser, logout + localStorage persistence
        │   └── uiSlice.js         ← Sidebar collapsed state
        ├── hooks/
        │   └── useDebounce.js     ← Generic debounce hook (used in document/citizen search)
        └── utils/
            └── cn.js              ← clsx + tailwind-merge utility
```

---

## API Reference

### Auth — `/api/v1/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Create account → returns `token` + `user` immediately |
| POST | `/login` | — | Login → returns `token` + `user` |
| POST | `/logout` | ✅ | Clears Redis cache for user |
| GET | `/me` | ✅ | Get logged-in user info |

### Documents — `/api/v1/documents`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | List documents (pagination, search, filter by type/status/citizen, `unassignedOnly`) |
| POST | `/upload` | ✅ | Upload single document → triggers OCR pipeline. Optional `citizenId` in body |
| POST | `/batch-upload` | ✅ | Upload up to 50 documents at once. Optional `citizenId` in body |
| GET | `/analytics` | ✅ | Stats: counts, language distribution, type breakdown |
| POST | `/compare` | ✅ | Field-level AI diff between two documents |
| GET | `/:id` | ✅ | Full document with extracted fields and text |
| GET | `/:id/status` | ✅ | Server-Sent Events stream for processing status |
| POST | `/:id/mask-pii` | ✅ | Toggle PII masking on/off |
| PATCH | `/:id/correct` | ✅ | Manually correct a field value (logged) |
| POST | `/:id/translate` | ✅ | AI translate extracted text to target language |
| DELETE | `/:id` | ✅ | Soft delete document (refreshes citizen doc count if assigned) |

### Citizens — `/api/v1/citizens`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | List citizens for the logged-in operator (pagination, search by name/phone/village/district) |
| POST | `/` | ✅ | Add a new citizen (name required; phone, email, village, district, state, notes optional) |
| GET | `/:id` | ✅ | Get a single citizen's profile |
| PATCH | `/:id` | ✅ | Update citizen profile fields |
| DELETE | `/:id` | ✅ | Soft delete citizen (their documents remain, become unassigned) |
| GET | `/:id/documents` | ✅ | List all documents in this citizen's folder (pagination, filter by status/type) |

### Chat — `/api/v1/chat`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sessions` | ✅ | Create chat session (global or document-specific) |
| GET | `/sessions` | ✅ | List all sessions |
| GET | `/sessions/:id` | ✅ | Get session with full message history |
| POST | `/sessions/:id/message` | ✅ | Send message → Gemini responds with doc context |
| DELETE | `/sessions/:id` | ✅ | Soft delete session |

---

## Security

| Layer | Implementation |
|---|---|
| HTTP headers | `helmet` (CSP disabled for CDN images, CORP cross-origin) |
| CORS | Whitelist via `CLIENT_URL` env var |
| Auth | JWT signed with `JWT_SECRET`, 7-day expiry, verified on every protected route |
| Password | `bcryptjs` with 12 salt rounds |
| Rate limiting | Auth: 10 req/15min · Upload: 10 req/min · Chat: 20 req/min · API: 100 req/15min |
| NoSQL injection | `express-mongo-sanitize` on all request bodies |
| XSS | `xss-clean` middleware |
| Input validation | `express-validator` on all auth + document routes |
| Data isolation | Every citizen and document query is scoped to `userId` — operators can only see their own citizens and documents |
| Cache invalidation | Redis keys cleared on every write (doc update, delete, PII toggle, citizen create/update/delete) |

---

## Document Types Supported

`aadhaar` · `pan` · `voter_id` · `passport` · `driving_license` · `land_record` · `court_notice` · `ration_card` · `birth_certificate` · `school_certificate` · `income_certificate` · `caste_certificate` · `medical_record` · `bank_statement` · `legal_notice` · `other`

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/docurec

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Auth — change this in production!
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRES=7d

# Google Gemini AI — get free key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# ImageKit — get from https://imagekit.io/dashboard
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- ImageKit account (free tier works)

### 1. Backend
```bash
cd backend
cp .env.example .env      # fill in your API keys
npm install
npm run dev               # starts on http://localhost:5000
```

> **Note:** `eng.traineddata` and `hin.traineddata` are already included in the repo — no separate Tesseract installation needed.

### 2. Frontend
```bash
cd frontend
cp .env.example .env      # set VITE_API_URL
npm install
npm run dev               # starts on http://localhost:5173
```

### 3. Docker (all services in one command)
```bash
# Copy and fill in your API keys
cp backend/.env.example backend/.env

# Start MongoDB + Redis + Backend + Frontend
docker-compose up --build
```

Services:
- Frontend → `http://localhost:80`
- Backend API → `http://localhost:5000`
- MongoDB → `localhost:27017`
- Redis → `localhost:6379`

---

## Demo Walkthrough (for judges)

1. **Register** → account created, immediately logged in (no OTP, no email verification)
2. **Upload** an Aadhaar scan (drag-drop to the Upload page) — optionally select "My Documents" or a citizen from the dropdown
3. Watch status update live: `queued → processing → completed` (no manual refresh needed)
4. Open the document → see extracted fields: name, DOB, Aadhaar number, address
5. Click **"Mask PII"** → Aadhaar and DOB are hidden — safe to share
6. Click any field → inline edit, correction logged
7. Go to **Chat** → ask *"What is the date of birth on my Aadhaar?"* in Hindi or English — and ask directly from a document's "Ask AI" button too
8. Go to **Compare** → pick two documents → see field-level diff
9. Go to **Citizens** → add a citizen (e.g. "Suresh Kumar, Rampur village"), open their profile, upload a document directly into their folder
10. Back on **Documents**, toggle **"My Documents Only"** to see your own files separate from citizens' files
11. **Dashboard** → see charts: languages detected, document types, processing stats, and a "Manage Citizens" quick action

---

## Design System

The frontend uses a custom dark design system defined in `tailwind.config.js` and `index.css`:

- **Colors:** `--sky` (`#38BDF8`), `--bg-primary` (`#0A0F1A`), semantic text/border tokens
- **Components:** `.card`, `.btn-primary`, `.input`, `.badge-sky` utility classes
- **Animations:** Framer Motion page transitions, Skeleton pulse loading states
- **Charts:** Recharts (PieChart for doc types, AreaChart for processing trends)
- **Icons:** Lucide React throughout

---

## What Makes This Different

- **Built for real CSC workflows** — one operator account can manage documents for hundreds of citizens, each in their own folder, without losing the ability to keep personal documents separate
- **No fake demo data** — every feature works end-to-end with real files
- **Tesseract traineddata bundled** — works offline for OCR, no external service dependency
- **Never fails silently** — even a completely garbled scan returns partial data with a low confidence score rather than an error
- **LangChain abstraction** — model name changed in one file (`config/ai.js`) — easy to swap Gemini version
- **Token never drops** — Redux interceptor reads token from store on every request, not from a closure — no stale token bugs
- **Production patterns** — rate limiting per route type, Redis cache invalidation on writes, graceful shutdown, structured logging

---

<div align="center">

**Built for Bharat. Designed for scale.**

*DocuRec AI — Making India's documents intelligent.*

</div>
