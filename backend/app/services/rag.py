"""
RAG Service for Yojana Mitra.
Strictly limited to 9 government scheme documents for Telangana farmers.
"""

import os
import glob
import numpy as np
from typing import Optional, List
from app.core.config import settings
from app.services.embeddings import embedding_service
from app.services.llm import llm_service

# Mapping of file names to human-readable names
SCHEME_MAPPING = {
    "tmip": "TMIP (Drip/Sprinkler)",
    "soil_health_card": "Soil Health Card",
    "rythu_bima": "Rythu Bima",
    "rythu_bharosa": "Rythu Bharosa",
    "pmkisan": "PM-KISAN",
    "pmfby": "PMFBY Crop Insurance",
    "pm_maan_dhan": "PM Kisan Maan Dhan",
    "kisan_credit_card": "Kisan Credit Card",
    "indiramma_atmiya_bharosa": "Indiramma Atmiya Bharosa"
}

# ──────────────────────────────────────────
# In-memory vector store
# ──────────────────────────────────────────
class MemoryVectorStore:
    def __init__(self):
        self.docs: list[dict] = []
        self.embeddings: Optional[np.ndarray] = None

    def add(self, documents: list[dict]):
        if not documents:
            return
        texts = [d["text"] for d in documents]
        embs = embedding_service.embed(texts)
        self.docs.extend(documents)
        if self.embeddings is None:
            self.embeddings = embs
        else:
            self.embeddings = np.vstack([self.embeddings, embs])

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        if not self.docs or self.embeddings is None:
            return []
        q_emb = embedding_service.embed_one(query)
        # Cosine similarity (normalized embeddings)
        scores = self.embeddings @ q_emb
        top_idx = np.argsort(scores)[::-1][:top_k]
        return [self.docs[i] for i in top_idx]


# ──────────────────────────────────────────
# Document loader (Strictly 9 files)
# ──────────────────────────────────────────
def load_scheme_documents() -> list[dict]:
    """Load matching .txt files from backend/data/schemes/"""
    base = os.path.join(os.path.dirname(__file__), "../../data/schemes")
    base = os.path.abspath(base)
    
    docs = []
    # Only load files that are in our target mapping
    for base_filename, human_name in SCHEME_MAPPING.items():
        path = os.path.join(base, f"{base_filename}.txt")
        if not os.path.exists(path):
            print(f"[RAG] Warning: Document {path} not found.")
            continue
            
        with open(path, encoding="utf-8") as f:
            content = f.read()
        
        # Split into ~500 char chunks (optimized for token limits)
        chunks = chunk_text(content, size=500, overlap=100)
        for i, chunk in enumerate(chunks):
            docs.append({
                "id": f"{base_filename}_{i}",
                "text": chunk,
                "source": f"{base_filename}.txt",
                "scheme": human_name,
            })
            
    if not docs:
        print("[RAG] ERROR: No documents loaded from data/schemes!")
        
    return docs


def chunk_text(text: str, size: int = 500, overlap: int = 100) -> list[str]:
    # Simple chunking by words to maintain meaning
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start += size - overlap
    return chunks


# ──────────────────────────────────────────
# Main RAG Service
# ──────────────────────────────────────────
class RAGService:
    def __init__(self):
        self._store = None
        self._loaded = False
        self._raw_schemes = {} 
        self._last_schemes = {}
        
        # Translation Map for High-Fidelity Multilingual Support
        self._translations = {
            "en": {
                "BENEFITS": "CATEGORY: KEY BENEFITS",
                "ELIGIBILITY": "CATEGORY: ELIGIBILITY",
                "DOCUMENTS": "CATEGORY: DOCUMENTS NEEDED",
                "PROCESS": "CATEGORY: HOW TO APPLY",
                "NO_MATCH": "No details found. Try asking about PM-Kisan or Rythu Bima.",
                "SCHEME_INTRO": "SCHEME: "
            },
            "te": {
                "BENEFITS": "విభాగం: ముఖ్యమైన ప్రయోజనాలు",
                "ELIGIBILITY": "విభాగం: అర్హత",
                "DOCUMENTS": "విభాగం: అవసరమైన పత్రాలు",
                "PROCESS": "విభాగం: దరఖాస్తు విధానం",
                "NO_MATCH": "వివరాలు కనుగొనబడలేదు. PM-Kisan లేదా Rythu Bima గురించి అడగండి.",
                "SCHEME_INTRO": "పథకం: "
            },
            "hi": {
                "BENEFITS": "श्रेणी: मुख्य लाभ",
                "ELIGIBILITY": "श्रेणी: पात्रता",
                "DOCUMENTS": "श्रेणी: आवश्यक दस्तावेज",
                "PROCESS": "श्रेणी: आवेदन कैसे करें",
                "NO_MATCH": "विवरण नहीं मिला। PM-Kisan या Rythu Bima के बारे में पूछें।",
                "SCHEME_INTRO": "योजना: "
            }
        }

    def _get_store(self):
        if self._store is None:
            self._store = MemoryVectorStore()
        return self._store

    def _ensure_loaded(self):
        if not self._loaded:
            store = self._get_store()
            docs = load_scheme_documents()
            store.add(docs)
            
            base = os.path.join(os.path.dirname(__file__), "../../data/schemes")
            for filename in SCHEME_MAPPING.keys():
                path = os.path.join(base, f"{filename}.txt")
                if os.path.exists(path):
                    with open(path, encoding="utf-8") as f:
                        self._raw_schemes[SCHEME_MAPPING[filename]] = f.read()
            
            self._loaded = True
            print(f"[RAG] Loaded {len(docs)} document chunks and {len(self._raw_schemes)} raw schemes.")

    def _clean_point(self, text: str) -> str:
        """Cleans and shortens a text point gently for readability."""
        text = text.replace("**", "").replace("__", "").replace("##", "")
        text = text.strip(" -•*")
        # Remove common noise
        if text.lower().startswith("note:") or text.lower().startswith("important:"):
            text = text.split(":", 1)[-1].strip()
        # Ensure it doesn't end abruptly
        if len(text) > 150 and "." in text:
            sentences = text.split(".")
            text = (sentences[0] + ".").strip()
        return text.capitalize()

    def _create_crisp_summary(self, scheme_name: str, lang: str = "en", filter_keyword: str = None) -> str:
        """Extracts key sections and turns them into a high-precision response."""
        
        t = self._translations.get(lang, self._translations["en"])
        
        # Expanded categories with human-like preambles
        categories = {
            "BENEFITS": {
                "title": t["BENEFITS"],
                "keywords": ["BENEFIT", "AMOUNT", "WHAT IT IS", "SUBSIDY", "MONEY", "₹", "RS", "PAYMENT"],
                "preamble": "Regarding benefits and financial support:"
            },
            "ELIGIBILITY": {
                "title": t["ELIGIBILITY"],
                "keywords": ["ELIGIB", "WHO IS ELIGIBLE", "WHO CAN APPLY", "AGE", "ACRE", "RESTRICTION", "LIMIT"],
                "preamble": "Here are the specific eligibility requirements:"
            },
            "DOCUMENTS": {
                "title": t["DOCUMENTS"],
                "keywords": ["DOCUMENTS", "REQUIRED", "LIST", "PROOF", "AADHAAR", "PASSBOOK", "CERTIFICATE"],
                "preamble": "You will need the following documents:"
            },
            "PROCESS": {
                "title": t["PROCESS"],
                "keywords": ["HOW TO ENROL", "HOW TO APPLY", "STEPS", "PROCESS", "CLAIM", "METHOD", "ENROLL"],
                "preamble": "The application process is as follows:"
            },
            "DEADLINE": {
                "title": "📅 DATES & DEADLINES",
                "keywords": ["DEADLINE", "DATE", "LAST DATE", "TIMELINE", "PERIOD", "WHEN", "MONTHS", "DAYS", "JULY", "JUNE", "DECEMBER", "YEAR", "SCHEDULE"],
                "preamble": "Please note these time-sensitive details and deadlines:"
            }
        }
        
        source_text = self._raw_schemes.get(scheme_name, "")
        if not source_text: return t["NO_MATCH"]
        
        lines = source_text.splitlines()
        clean_name = scheme_name.split("(")[0].strip().upper()
        
        is_follow_up = False
        target_cat = None
        if filter_keyword:
            fk_up = filter_keyword.upper()
            is_follow_up = True
            for cat_id, cat_info in categories.items():
                if any(k in fk_up for k in cat_info["keywords"]) or cat_id in fk_up:
                    target_cat = cat_id
                    break

        output = [f"🌾 {clean_name}\n"]
        found_any = False
        seen_points = set()
        
        cats_to_check = [target_cat] if target_cat else list(categories.keys())

        for cat_id in cats_to_check:
            if not cat_id: continue
            cat_info = categories[cat_id]
            keywords = cat_info["keywords"]
            
            content = []
            found_header = False
            
            # Step 1: Look for specific header match
            for line in lines:
                l_up = line.strip().upper()
                if not l_up: continue
                
                if any(k in l_up for k in keywords) and len(l_up) < 45:
                    found_header = True
                    continue
                
                if found_header:
                    if l_up.isupper() and len(l_up) > 6 and not any(k in l_up for k in keywords):
                        break
                    
                    clean = self._clean_point(line)
                    if clean and len(clean) > 3 and clean.lower() not in seen_points:
                        content.append(f"• {clean}")
                        seen_points.add(clean.lower())
                    
                    if len(content) >= 8: break
            
            # Step 2: If no header found for a specific follow-up, do a keyword search
            if not content and is_follow_up:
                for line in lines:
                    l_up = line.strip().upper()
                    if any(k in l_up for k in keywords) and len(l_up) < 200:
                        clean = self._clean_point(line)
                        if clean and len(clean) > 5 and clean.lower() not in seen_points:
                            content.append(f"• {clean}")
                            seen_points.add(clean.lower())
                    if len(content) >= 4: break
            
            if content:
                output.append(cat_info["title"].upper())
                output.append(cat_info["preamble"])
                output.extend(content)
                output.append("") 
                found_any = True
        
        if not found_any or len(output) < 3:
            # Clean overview without "Couldn't find" or "I do not know"
            cleaned_lines = [self._clean_point(l) for l in lines if 30 < len(l.strip()) < 180 and l.lower() not in seen_points][:5]
            return f"🌾 {clean_name}\n\nHere are the most relevant details for this scheme:\n" + "\n".join([f"• {l}" for l in cleaned_lines])
            
        return "\n".join(output).strip()

    async def query(self, query: str, language: str, context: dict, session_id: str = None, scheme: str = None) -> dict:
        self._ensure_loaded()
        store = self._get_store()
        lang = language if language in ["en", "te", "hi"] else "en"

        q_upper = query.strip().upper()
        
        # Support Guided Keys directly
        intent_keyword = query
        if "GUIDED." in q_upper:
            key_map = {
                "GUIDED.DOCS": "DOCUMENTS",
                "GUIDED.MONEY": "BENEFITS",
                "GUIDED.ELIGIBILITY": "ELIGIBILITY",
                "GUIDED.PROCESS": "PROCESS",
                "GUIDED.DEADLINE": "DEADLINE"
            }
            intent_keyword = key_map.get(q_upper, query)
        
        # 1. Detect Intent/Scheme
        matched_scheme = scheme
        REV_MAPPING = {display: key for key, display in SCHEME_MAPPING.items()}
        
        if not matched_scheme:
            for key, display in SCHEME_MAPPING.items():
                if key.upper().replace("_", " ") in q_upper or display.upper() in q_upper:
                    matched_scheme = display
                    break
        
        # 2. Context Handle
        if not matched_scheme and session_id and session_id in self._last_schemes:
            matched_scheme = self._last_schemes[session_id]
        
        if matched_scheme and session_id:
            self._last_schemes[session_id] = matched_scheme

        # 3. Search
        top_docs = store.search(query, top_k=settings.TOP_K)
        sources = list({d.get("source", "") for d in top_docs if d.get("source")})
        
        # Ensure active scheme's source is included and primary
        if matched_scheme:
            primary_file = f"{REV_MAPPING[matched_scheme]}.txt"
            if primary_file not in sources:
                sources.insert(0, primary_file)
            else:
                # Move to front
                sources.remove(primary_file)
                sources.insert(0, primary_file)

        valid_sources = [s for s in sources if s.replace(".txt", "") in SCHEME_MAPPING][:3]


        # 5. Crisp Response
        if matched_scheme:
            summary = self._create_crisp_summary(matched_scheme, lang=lang, filter_keyword=intent_keyword)
            return {"answer": summary, "sources": valid_sources}
        
        elif top_docs:
            best_text = top_docs[0]["text"]
            answer = "• " + "\n• ".join([self._clean_point(l) for l in best_text.split(".") if len(l) > 20][:3])
            return {"answer": answer, "sources": valid_sources}
        else:
            t = self._translations.get(lang, self._translations["en"])
            return {"answer": t["NO_MATCH"], "sources": []}

rag_service = RAGService()
