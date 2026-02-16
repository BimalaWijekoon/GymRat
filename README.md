<p align="center">
  <img src="public/icons/icon-192x192.png" alt="GymRat AI Logo" width="80" />
</p>

<h1 align="center">GymRat AI 🏋️‍♂️</h1>

<p align="center">
  <strong>AI-Powered Fitness Companion</strong><br/>
  Plan workouts · Track weights · Crush PRs — with an intelligent AI coach by your side.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.0-4285F4?logo=google" alt="Gemini" />
</p>

---

## ✨ Features

### 🏋️ Plan-Based Workout System
- **Create Workout Plans** — Build multi-day splits (Push/Pull/Legs, Upper/Lower, etc.) with exercises, target sets, and reps
- **Daily Weight Tracking** — Select today's workout day, log actual weights and reps per set
- **Auto PR Detection** — Personal records are automatically detected using the Brzycki 1RM formula
- **Session History** — View all past sessions with volume stats, best sets, and trends
- **Progressive Overload Suggestions** — AI-driven recommendations for weight increases

### 🤖 Dual AI Chat System
- **GymRat AI Coach** — RAG-powered coaching using fitness PDFs and scientific research with context-aware responses
- **Gemini AI** — Direct access to Google Gemini 2.0 for general fitness questions
- Switchable models mid-conversation with dedicated quick actions per model

### 📊 Progress Analytics
- **Weekly Volume Charts** — Visualize training volume trends with interactive Recharts graphs
- **Personal Records Board** — Track all-time bests across every exercise
- **Streak Tracking** — Consecutive training day counter to maintain momentum

### 🔒 Authentication & Profiles
- Firebase Auth with email/password and Google sign-in
- User profiles with fitness goals, experience level, and equipment preferences
- Protected dashboard routes with auth guards

---

## 🏗️ Architecture

```
gymrat-ai/
├── src/                        # Next.js Frontend
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Main dashboard with stats & activity
│   │   │   ├── workouts/       # 3-tab workout system (Plans/Track/History)
│   │   │   ├── progress/       # Charts & PR tracking
│   │   │   └── profile/        # User profile management
│   │   ├── login/              # Auth pages
│   │   └── signup/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (Card, Button, Badge, etc.)
│   │   ├── chat/               # ChatWidget with dual-model selection
│   │   └── Navigation.tsx      # Responsive sidebar navigation
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Firebase auth state management
│   │   └── ChatContext.tsx      # Chat state with model selection
│   ├── hooks/
│   │   └── useWorkouts.ts      # Real-time Firestore subscriptions for plans/sessions/PRs
│   ├── lib/
│   │   ├── firebase/           # Firebase config & Firestore CRUD helpers
│   │   └── utils/              # PR detection, streak calc, overload suggestions, plan parser
│   └── types/
│       └── firestore.ts        # TypeScript types for all Firestore documents
│
├── backend/                    # Python FastAPI Backend
│   ├── api/
│   │   └── main.py             # REST API with /api/chat endpoint (dual-mode routing)
│   ├── rag/
│   │   ├── rag_chain.py        # LangChain RAG pipeline + direct Gemini queries
│   │   ├── pdf_processor.py    # PDF ingestion & text chunking
│   │   └── vector_store.py     # ChromaDB vector store management
│   ├── scripts/
│   │   └── download_pdfs.py    # Fitness PDF downloader for RAG knowledge base
│   └── data/                   # PDFs & ChromaDB storage (gitignored)
│
├── firestore.rules             # Firestore security rules
└── firebase.json               # Firebase project config
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | CSS Modules + Custom Design System |
| **State** | React Context + Firebase Real-time Listeners |
| **Auth** | Firebase Authentication |
| **Database** | Cloud Firestore |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI/LLM** | Google Gemini 2.0 Flash |
| **RAG** | LangChain, ChromaDB, Google Generative AI Embeddings |
| **Testing** | Jest + React Testing Library |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+
- **Firebase Project** with Firestore & Auth enabled
- **Google Gemini API Key**

### 1. Clone & Install

```bash
git clone https://github.com/BimalaWijekoon/GymRat.git
cd GymRat
npm install
```

### 2. Environment Variables

**Frontend** — Create `.env.local` in the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — Create `backend/.env`:
```env
GOOGLE_GEMINI_API_KEY=your_gemini_key
CHROMADB_PATH=./data/chroma
CORS_ORIGINS=http://localhost:3000
```

### 3. Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

**Download fitness PDFs & build vector store:**
```bash
python scripts/download_pdfs.py
python -c "from rag.pdf_processor import PDFProcessor; from rag.vector_store import VectorStore; p = PDFProcessor(); chunks = p.process_all(); vs = VectorStore(); vs.add_documents(chunks); print(f'Indexed {len(chunks)} chunks')"
```

### 4. Run

**Backend (Terminal 1):**
```bash
cd backend
uvicorn api.main:app --reload --port 8000
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📱 Data Model

### Firestore Collections

```
users/{userId}
├── personalRecords/{exerciseId}    # Auto-detected PRs

workoutPlans/{planId}               # Workout plan templates
├── name, days[], isActive, generatedBy

workoutSessions/{sessionId}         # Daily tracking logs
├── planId, dayName, exercises[].sets[].weight
```

| Collection | Purpose |
|-----------|---------|
| `users` | Profile, goals, preferences |
| `users/{id}/personalRecords` | Best lifts per exercise |
| `workoutPlans` | Reusable workout templates |
| `workoutSessions` | Daily weight tracking logs |
| `chats` | Chat conversation history |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🔐 Security

- All Firestore collections are protected by security rules — users can only access their own data
- API keys stored in environment variables (never committed)
- Firebase Auth tokens validated on all operations
- CORS restricted to frontend origin

---

## 📄 License

MIT © [Bimala Wijekoon](https://github.com/BimalaWijekoon)
