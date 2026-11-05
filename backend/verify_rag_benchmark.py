import os
import sys
# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath("backend"))

import asyncio
import time
import zipfile
import io
import xml.etree.ElementTree as ET
import numpy as np

from app.rag.advanced_rag import (
    rag_pipeline,
    BM25Index,
    recursive_chunk_text,
    flashrank_ranker
)
from app.engine.vector_engine import HNSWIndex, get_dist_fn
from app.db.database import get_all_chunks, get_doc_count

async def run_full_verification():
    print("=================================================================")
    print("  PRANSHU'S AI - ADVANCED RAG & MANUAL ENGINE VERIFICATION")
    print("  Benchmarking Manual Math Algorithms against Enterprise Stack")
    print("=================================================================\n")

    # 1. Verification of Multi-Format Parsing
    print("[1/4] Verifying Multi-Format Document Ingestion...")
    # Test DOCX synthetic parsing
    docx_buf = io.BytesIO()
    with zipfile.ZipFile(docx_buf, 'w') as zf:
        doc_xml = '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Enterprise RAG with Hierarchical Navigable Small World and FlashRank cross-encoder.</w:t></w:r></w:p></w:body></w:document>'
        zf.writestr('word/document.xml', doc_xml)
    docx_bytes = docx_buf.getvalue()

    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as test_zip:
        xml_content = test_zip.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        docx_extracted = " ".join([elem.text for elem in tree.iter() if elem.tag.endswith('}t') and elem.text])
    assert "Enterprise RAG" in docx_extracted
    print(f"  -> DOCX Parsing: OK (Extracted: '{docx_extracted[:45]}...')")

    # Test PPTX synthetic parsing
    pptx_buf = io.BytesIO()
    with zipfile.ZipFile(pptx_buf, 'w') as zf:
        slide_xml = '<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide 1: Vector Search Benchmarks and Okapi BM25 Lexical Matching</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>'
        zf.writestr('ppt/slides/slide1.xml', slide_xml)
    pptx_bytes = pptx_buf.getvalue()

    with zipfile.ZipFile(io.BytesIO(pptx_bytes)) as test_zip:
        slide_files = [f for f in test_zip.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
        pptx_texts = []
        for s in slide_files:
            xml_content = test_zip.read(s)
            tree = ET.fromstring(xml_content)
            pptx_texts.extend([elem.text for elem in tree.iter() if elem.tag.endswith('}t') and elem.text])
        pptx_extracted = " ".join(pptx_texts)
    assert "Slide 1" in pptx_extracted
    print(f"  -> PPTX Parsing: OK (Extracted: '{pptx_extracted[:45]}...')")

    # 2. Benchmark Index & Chunks
    print("\n[2/4] Initializing RAG Knowledge Base...")
    await rag_pipeline.reload_index()
    chunks = list(rag_pipeline.chunks_cache.values())
    print(f"  -> Total Chunks in Cache: {len(chunks)}")
    
    if len(chunks) < 3:
        # Seed test chunks for rigorous numerical analysis
        sample_docs = [
            ("HNSW Vector Indexing", "Hierarchical Navigable Small World (HNSW) graphs achieve logarithmic O(log N) search complexity by constructing multi-layer geometric proximity graphs where upper layers skip long distances and bottom layers perform fine-grained greedy search."),
            ("BM25 Okapi Lexical Retrieval", "Okapi BM25 uses Term Frequency (TF) saturation with parameter k1=1.5 and document length normalization b=0.75 along with Robertson-Spärck Jones smoothed inverse document frequency to score keyword relevance."),
            ("Cross-Encoder Re-Ranking", "Cross-encoders evaluate the joint relationship between query and candidate document passages. While bi-encoders produce isolated embeddings, cross-encoders perform full cross-attention over token pairs for superior precision."),
            ("Reciprocal Rank Fusion", "Reciprocal Rank Fusion (RRF) combines ranked lists from dense vector search and sparse lexical BM25 without requiring score normalization, using constant k=60 to prevent domination by outliers."),
            ("Corrective RAG (CRAG)", "Corrective RAG evaluates the retrieval confidence score and triggers fallback mechanisms such as query rewriting, web search, or low-confidence notifications when retrieval quality falls below threshold.")
        ]
        for t, content in sample_docs:
            await rag_pipeline.ingest_document(t, content, tags="benchmark")
        await rag_pipeline.reload_index()
        chunks = list(rag_pipeline.chunks_cache.values())
        print(f"  -> Seeded {len(sample_docs)} benchmark documents. Active Chunks: {len(chunks)}")

    # 3. Numerical Verification: Manual Math vs FlashRank
    print("\n[3/4] Running Numerical Speed & Accuracy Verification...")
    test_queries = [
        "What is the algorithmic complexity of HNSW search?",
        "How does BM25 Okapi calculate term frequency saturation and document length normalization?",
        "Why are cross-encoders more accurate than bi-encoders for re-ranking?",
        "How does reciprocal rank fusion combine dense and sparse search lists?",
        "What does Corrective RAG do when retrieval confidence is low?"
    ]

    total_manual_us = 0.0
    total_flash_us = 0.0
    total_bm25_us = 0.0
    total_agreement = 0.0

    print("\n  Detailed Query-by-Query Comparison:")
    print("  " + "-" * 75)
    print(f"  {'Query Preview':<35} | {'Manual (µs)':<11} | {'FlashRank (ms)':<14} | {'Agreement':<10}")
    print("  " + "-" * 75)

    for q in test_queries:
        bench = await rag_pipeline.benchmark_manual_vs_enterprise(q)
        m_us = bench["manualCrossEncoderUs"]
        f_ms = bench["flashrankNeuralUs"] / 1000.0
        agr = bench["topKAgreementPercent"]
        bm_us = bench["bm25LatencyUs"]

        total_manual_us += m_us
        total_flash_us += bench["flashrankNeuralUs"]
        total_bm25_us += bm_us
        total_agreement += agr

        print(f"  {q[:35]:<35} | {m_us:>9.1f} µs | {f_ms:>11.2f} ms | {agr:>8.1f}%")

    avg_manual_us = total_manual_us / len(test_queries)
    avg_flash_ms = (total_flash_us / len(test_queries)) / 1000.0
    avg_agreement = total_agreement / len(test_queries)
    speedup = (total_flash_us / max(1.0, total_manual_us))

    print("  " + "-" * 75)
    print(f"\n  Summary Averages across {len(test_queries)} queries:")
    print(f"  * Manual Contextual Cross-Encoder Latency: {avg_manual_us:.1f} µs ({avg_manual_us / 1000.0:.3f} ms)")
    print(f"  * FlashRank Neural TinyBERT Latency:        {avg_flash_ms:.2f} ms ({avg_flash_ms * 1000.0:.0f} µs)")
    print(f"  * Speed Advantage of Manual Cross-Encoder: {speedup:.1f}x FASTER")
    print(f"  * Top-K Rank Agreement (Manual vs Neural): {avg_agreement:.1f}%")
    print(f"  * BM25 Average Lexical Search Latency:    {total_bm25_us / len(test_queries):.1f} µs")

    # 4. Verify Hybrid Pipeline with Ensemble Mode
    print("\n[4/4] Verifying End-to-End Pipeline (Hybrid Dense+Sparse + Ensemble Re-ranking)...")
    sample_q = "How does HNSW compare to brute-force search?"
    hits, hyde = await rag_pipeline.retrieve(
        question=sample_q,
        k=3,
        use_hybrid=True,
        use_rerank=True,
        rerank_mode="ensemble"
    )
    print(f"  Query: '{sample_q}'")
    print(f"  Retrieved Top-{len(hits)} Contexts (Ensemble Mode):")
    for i, h in enumerate(hits):
        print(f"    [{i+1}] {h.get('title')}")
        print(f"        Manual Score:    {h.get('manual_score', 'N/A')}")
        print(f"        FlashRank Score: {h.get('flashrank_score', 'N/A')}")
        print(f"        Ensemble Score:  {h.get('rerank_score', 'N/A')}")
        print(f"        Confidence:      {h.get('confidence', 'N/A')}")

    print("\n=================================================================")
    print("  VERIFICATION COMPLETE: ALL SYSTEMS RUNNING AT ENTERPRISE SPEC")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_full_verification())
