import sqlite3
import asyncio
import json
import os
from typing import List, Dict, Any, Optional
from app.config import settings

DB_PATH = settings.DB_FILE

def _get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _sync_init_db():
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                tags TEXT DEFAULT 'general',
                raw_text TEXT NOT NULL,
                chunk_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                text TEXT NOT NULL,
                embedding TEXT NOT NULL,
                FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                provider TEXT NOT NULL,
                contexts TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

async def init_db():
    await asyncio.to_thread(_sync_init_db)

def _sync_insert_document(title: str, text: str, tags: str) -> int:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (title, raw_text, tags) VALUES (?, ?, ?)",
            (title, text, tags)
        )
        conn.commit()
        return cursor.lastrowid

async def insert_document(title: str, text: str, tags: str = "general") -> int:
    return await asyncio.to_thread(_sync_insert_document, title, text, tags)

def _sync_insert_chunk(doc_id: int, chunk_index: int, title: str, text: str, embedding: List[float]) -> int:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chunks (doc_id, chunk_index, title, text, embedding) VALUES (?, ?, ?, ?, ?)",
            (doc_id, chunk_index, title, text, json.dumps(embedding))
        )
        cursor.execute(
            "UPDATE documents SET chunk_count = chunk_count + 1 WHERE id = ?",
            (doc_id,)
        )
        conn.commit()
        return cursor.lastrowid

async def insert_chunk(doc_id: int, chunk_index: int, title: str, text: str, embedding: List[float]) -> int:
    return await asyncio.to_thread(_sync_insert_chunk, doc_id, chunk_index, title, text, embedding)

def _sync_get_all_documents() -> List[Dict[str, Any]]:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, title, substr(raw_text, 1, 120) as preview, chunk_count, created_at FROM documents ORDER BY id DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

async def get_all_documents() -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_sync_get_all_documents)

def _sync_get_all_chunks() -> List[Dict[str, Any]]:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, doc_id, chunk_index, title, text, embedding FROM chunks")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["embedding"] = json.loads(d["embedding"])
            result.append(d)
        return result

async def get_all_chunks() -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_sync_get_all_chunks)

def _sync_delete_document(doc_id: int) -> bool:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        return cursor.rowcount > 0

async def delete_document(doc_id: int) -> bool:
    return await asyncio.to_thread(_sync_delete_document, doc_id)

def _sync_record_chat(question: str, answer: str, provider: str, contexts: List[Dict[str, Any]]):
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_history (question, answer, provider, contexts) VALUES (?, ?, ?, ?)",
            (question, answer, provider, json.dumps(contexts))
        )
        conn.commit()

async def record_chat(question: str, answer: str, provider: str, contexts: List[Dict[str, Any]]):
    await asyncio.to_thread(_sync_record_chat, question, answer, provider, contexts)

def _sync_get_doc_count() -> int:
    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        row = cursor.fetchone()
        return row[0] if row else 0

async def get_doc_count() -> int:
    return await asyncio.to_thread(_sync_get_doc_count)
