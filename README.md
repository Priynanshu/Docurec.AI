# DocuRec AI 🚀
### Intelligent Indian Document Processing Platform

> *"Turn any scan into structured intelligence — in any Indian language."*

---

## What It Does

DocuRec AI is a full-stack agentic AI platform that processes Indian government, legal, and citizen-service documents (Aadhaar, PAN, land records, court notices, etc.) using OCR + Claude AI to extract structured data, detect languages, mask PII, enable AI chat over documents, and export results — all in a production-grade web app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion, shadcn/ui, lucide-react |
| State | Zustand + React Query |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Cache + Queue | Redis (ioredis) + Bull |
| AI | Claude Sonnet (Anthropic) |
| OCR | Tesseract.js |
| Storage | ImageKit (CDN + transforms) |
| Security | Helmet, express-rate-limit, JWT, bcrypt, CORS, express-validator |
| Logging | Winston + daily rotate |

---

## Project Structure

```
docurec/
├── backend/
│   └── src/
│       ├── config/         # DB, Redis, ImageKit, AI clients
│       ├── controllers/    # Request handlers (thin)
│       ├── services/       # Business logic (OCR, AI, documents)
│       ├── routes/         # Versioned API routes (/api/v1/...)
│       ├── middleware/     # Auth, rate limiter, error handler, upload, validators
│       ├── models/         # Mongoose schemas (User, Document, ChatSession)
│       ├── utils/          # Logger, response helpers, error classes, email
│       ├── app.js          # Express app setup
│       └── server.js       # Entry point with graceful shutdown
│
└── frontend/
    └── src/
        ├── components/
        │   ├── common/     # AppLayout, Sidebar, MobileNav
        │   └── features/   # DocumentCard, UploadZone
        ├── pages/          # Dashboard, Documents, DocumentDetail, Chat, Upload, Compare
        ├── hooks/          # useDebounce
        ├── services/       # Axios API layer (authAPI, documentAPI, chatAPI, userAPI)
        ├── store/          # Zustand slices (authStore, uiStore)
        └── utils/
```

---

## Features

### Core
- 📤 **Smart Document Ingestion** — Drag-drop or batch upload (JPEG, PNG, TIFF, PDF), ImageKit CDN storage
- 🤖 **Agentic OCR Pipeline** — Tesseract + Claude AI correction, language detection (12+ Indian languages), document type classification
- 📊 **Intelligence Dashboard** — Confidence arc gauge, health score, extracted fields with inline editing
- 💬 **AI Chat (RAG)** — Ask questions about any document or your entire library
- 🔍 **Full-text Search** — MongoDB text index across all documents
- 📦 **Batch Processing** — Upload up to 50 documents with per-doc progress

### Standout
- 🛡️ **PII Anonymizer** — Auto-detects Aadhaar, PAN, phone, DOB — one-click mask/unmask
- 🔄 **Document Comparison** — Field-level diff between two document versions
- 🌐 **Multilingual Translation** — Translate extracted text to any Indian language via Claude AI
- ✅ **Human-in-the-Loop Review** — Inline field correction with correction log
- 📈 **Analytics Panel** — Processing stats, language distribution, document type charts

### Security
- Helmet HTTP headers
- Rate limiting per route (auth: 10/15min, upload: 10/min, chat: 20/min)
- JWT access + refresh token rotation
- bcrypt password hashing
- MongoDB sanitization (NoSQL injection prevention)
- CORS whitelist

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- Anthropic API key
- ImageKit account

### Backend
```bash
cd backend
cp .env.example .env
# Fill in all env vars
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker (everything at once)
```bash
cp backend/.env.example backend/.env
# Fill in API keys
docker-compose up --build
```

---

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/documents
POST   /api/v1/documents/upload
POST   /api/v1/documents/batch-upload
POST   /api/v1/documents/compare
GET    /api/v1/documents/analytics
GET    /api/v1/documents/:id
GET    /api/v1/documents/:id/status  (SSE)
POST   /api/v1/documents/:id/mask-pii
PATCH  /api/v1/documents/:id/correct
POST   /api/v1/documents/:id/translate
DELETE /api/v1/documents/:id

POST   /api/v1/chat/sessions
GET    /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:id
POST   /api/v1/chat/sessions/:id/message
DELETE /api/v1/chat/sessions/:id
```

---

## Hackathon Demo Flow

1. Upload a blurry Aadhaar scan (drag-drop)
2. Watch the **blue scan animation** sweep the document
3. Extracted structured data appears side-by-side (name, DOB, address, ID)
4. Confidence arc shows 94% — amber field clicked → inline correction
5. Click **"Mask PII"** → Aadhaar number masked — "Safe Share" mode active
6. Ask AI: *"What is the date of birth?"* → streaming answer
7. Show analytics: 6 docs, 3 languages, 89% avg confidence
8. Compare two land records → field-level diff appears instantly

> *"This is what digitizing Bharat looks like."*
