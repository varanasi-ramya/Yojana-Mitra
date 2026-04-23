from sentence_transformers import SentenceTransformer
import numpy as np

# Multilingual model — works well for English + Telugu + Hindi
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

class EmbeddingService:
    def __init__(self):
        self._model = None

    def _load(self):
        if self._model is None:
            self._model = SentenceTransformer(MODEL_NAME)

    def embed(self, texts: list[str]) -> np.ndarray:
        self._load()
        return self._model.encode(texts, normalize_embeddings=True)

    def embed_one(self, text: str) -> np.ndarray:
        return self.embed([text])[0]


embedding_service = EmbeddingService()
