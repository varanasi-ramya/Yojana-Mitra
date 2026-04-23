# 🌾 Yojana Mitra — योजना मित्र / యోజన మిత్ర

A multilingual RAG-powered chatbot that helps Telangana farmers access government agriculture welfare schemes — in Telugu, Hindi, and English.

**Tech Stack:** React + Vite + Tailwind (frontend) · FastAPI + Gemini 1.5 Flash + sentence-transformers (backend)

---

## 📁 Project Structure

```
yojana-mitra/
├── frontend/          ← React app (deploys to Vercel)
├── backend/           ← FastAPI app (deploys to Vercel)
├── .github/workflows/ ← CI pipeline
└── README.md
```

---

## 🚀 Run Locally (Mac)

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org) or `brew install node`
- **Python 3.11+** — [python.org](https://www.python.org) or `brew install python@3.11`
- **Git** — `brew install git`

---

### Step 1 — Get a Google Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** → copy it

---

### Step 2 — Backend setup

```bash
cd yojana-mitra/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Open .env in any editor and paste your Gemini API key:
#   GOOGLE_API_KEY=AIzaSy...your_key_here
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Test it:
```bash
curl http://localhost:8000/health
# → {"status":"healthy"}
```

---

### Step 3 — Frontend setup

Open a new terminal tab:

```bash
cd yojana-mitra/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. ✅

---

### Step 4 — (Optional) Add your own scheme documents

Drop `.txt` files into `backend/data/schemes/`. The app chunks and embeds them automatically on startup.

Example structure:
```
backend/data/schemes/
├── rythu_bharosa.txt
├── pm_kisan.txt
├── fasal_bima.txt
└── ...
```

If no files are present, the app uses its built-in knowledge base.

---

## 🐙 Push to GitHub

```bash
cd yojana-mitra

# Initialize git
git init
git add .
git commit -m "feat: initial Yojana Mitra commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/yojana-mitra.git
git branch -M main
git push -u origin main
```

---

## ▲ Deploy to Vercel

You'll deploy **frontend** and **backend** as two separate Vercel projects.

### Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

---

### Deploy Backend

```bash
cd yojana-mitra/backend
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Project name** → `yojana-mitra-backend`
- **Which directory is your code?** → `./` (current)
- **Override settings?** → No

After deploy, go to [vercel.com/dashboard](https://vercel.com/dashboard) → `yojana-mitra-backend` → **Settings → Environment Variables** and add:

| Key | Value |
|-----|-------|
| `GOOGLE_API_KEY` | `AIzaSy...your_key` |
| `VECTOR_STORE` | `memory` |
| `FRONTEND_URL` | *(set after frontend deploy)* |

Redeploy after setting env vars:
```bash
vercel --prod
```

Note your backend URL, e.g. `https://yojana-mitra-backend.vercel.app`

---

### Deploy Frontend

```bash
cd yojana-mitra/frontend
```

Edit `.env.production` and set your actual backend URL:
```
VITE_API_BASE_URL=https://yojana-mitra-backend.vercel.app
```

Then:
```bash
vercel
```

When prompted:
- **Project name** → `yojana-mitra`
- **Which directory?** → `./`
- **Override build settings?** → No

After deploy, go to **Settings → Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://yojana-mitra-backend.vercel.app` |

Redeploy:
```bash
vercel --prod
```

---

### Final step — Update CORS

Go back to `yojana-mitra-backend` on Vercel → Environment Variables → set:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://yojana-mitra.vercel.app` |

Redeploy backend once more:
```bash
cd backend
vercel --prod
```

Your app is live! 🎉

---

## 🌍 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ | — | Gemini 1.5 Flash API key |
| `VECTOR_STORE` | ❌ | `memory` | `memory` / `chroma` / `pinecone` |
| `PINECONE_API_KEY` | ❌ | — | Required if `VECTOR_STORE=pinecone` |
| `PINECONE_INDEX` | ❌ | `yojana-mitra` | Pinecone index name |
| `FRONTEND_URL` | ❌ | `*` | CORS allow-origin for your frontend |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | URL of your FastAPI backend |

---

## 🔧 Vector Store Options

| Mode | Best for | Setup |
|------|----------|-------|
| `memory` | Dev / Vercel serverless | Nothing extra needed |
| `chroma` | Self-hosted server | `pip install chromadb` |
| `pinecone` | Production scale | Get API key at [pinecone.io](https://www.pinecone.io) |

---

## 📐 API Reference

### `POST /api/v1/chat`

```json
{
  "query": "Am I eligible for Rythu Bharosa?",
  "language": "en",
  "context": {
    "district": "Nalgonda",
    "land_acres": 3
  },
  "session_id": "uuid-string"
}
```

Response:
```json
{
  "answer": "To be eligible for Rythu Bharosa...",
  "sources": ["rythu_bharosa.txt"],
  "language": "en",
  "session_id": "uuid-string"
}
```

---

## 🛠 Development Notes

- The backend is **stateless** — each request is independent. For persistent chat history, add a Redis session store.
- `VECTOR_STORE=memory` re-loads documents on every cold start (fine for Vercel serverless).
- Sentence-transformers model (`paraphrase-multilingual-MiniLM-L12-v2`) is ~120MB — downloaded on first run and cached.
- For Vercel's 250MB function limit, the memory vector store is recommended. If you need ChromaDB, deploy the backend to Railway or Render instead.

---

## 📜 Schemes Covered

1. Rythu Bharosa (రైతు భరోసా)
2. PM-KISAN
3. Rythu Bima (రైతు బీమా)
4. Pradhan Mantri Fasal Bima Yojana
5. Kisan Credit Card
6. Soil Health Card
7. PM Kisan Maan Dhan Yojana
8. Rythu Samagra
9. RKVY

---

Built with ❤️ for Telangana farmers.
