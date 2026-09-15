from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pranshu's AI"
    VERSION: str = "2.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Core C++ Engine URL if running as sidecar
    CPP_CORE_URL: str = "http://localhost:8080"
    
    # Groq API Configuration (Fast Inference ~500 tps)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    # Ollama Local Settings (Optional)
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    OLLAMA_GEN_MODEL: str = os.getenv("OLLAMA_GEN_MODEL", "llama3.2")
    
    # Other Providers
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vectordb.sqlite3")
    DB_FILE: str = os.getenv("DB_FILE", "vectordb.sqlite3")
    
    # Advanced RAG Parameters
    DEFAULT_TOP_K: int = 4
    RRF_K: int = 60
    CHUNK_SIZE: int = 350
    CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
