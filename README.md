# Ollama RAG

This project is a Retrieval-Augmented Generation (RAG) system that uses local LLMs via Ollama, LangChain, and ChromaDB. It features a FastAPI backend for document processing and querying, and a modern React frontend (Vite) with a sleek user interface for interacting with your data.

## Features

- **Local LLM Integration:** Uses Ollama for running open-source models like `llama3.2` and `nomic-embed-text` locally, ensuring privacy.
- **Document Ingestion:** Supports uploading and parsing PDF documents via the FastAPI backend, storing them in a local Chroma vector database.
- **RAG Pipeline:** Utilizes LangChain to split text, create embeddings, retrieve relevant context, and generate answers based on user queries.
- **Modern UI:** Built with React, Vite, Tailwind CSS, Framer Motion, and Three.js for a highly interactive and visually appealing chat interface.

## Prerequisites

- Python 3.8+
- Node.js & npm
- [Ollama](https://ollama.ai/) installed locally
- Required Ollama models pulled:
  ```bash
  ollama pull llama3.2:1b
  ollama pull nomic-embed-text
  ```

## Setup Instructions

### 1. Backend Setup (FastAPI)

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:
   ```bash
   uvicorn api:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup (React / Vite)

1. Navigate to the UI directory:
   ```bash
   cd rag-ui
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Project Structure

- `api.py`: Main FastAPI application with `/upload` and `/chat` endpoints.
- `local_rag.py`: A standalone script demonstrating a simple LangChain RAG pipeline using a webpage loader.
- `requirements.txt`: Python dependencies.
- `data/`: Directory where uploaded PDF documents are stored for ingestion.
- `rag-ui/`: Frontend React application.

## Usage

1. Open the frontend in your browser.
2. Upload your PDF documents using the UI.
3. Start asking questions! The system will retrieve relevant context from your uploaded documents and use the local LLM to generate an answer.

## Roadmap

**P0 - Must Fix (1 week)**
- Persistence + incremental ingests + SSE streaming `OllamaLLM.stream()` -> `StreamingResponse` for token-by-token UX.
- Env config + Docker Compose: ollama, fastapi, chroma services + Dockerfile for both ends.

**P1 - High ROI Features**
1. Multi-Format Ingest: PyPDF only. Add `UnstructuredFileLoader` for docx/txt/md/csv/html + OCR pytesseract for scanned PDFs.
2. Hybrid Search + Reranking: `BM25Retriever` + Chroma ensemble + CrossEncoder (`ms-marco-MiniLM`) reranker. biggest accuracy win. `k=3` `api.py:52` too low -> `k=8` then rerank to 3.
3. Chat Memory: Currently stateless. Pass `chat_history` to prompt. Use `create_history_aware_retriever`.
4. Citations + PDF Viewer: Return `page_content` + `page` + `boundingBox` and highlight in viewer (react-pdf).
5. Document Management: `GET /documents`, `DELETE`, `GET /health` (Ollama ping).
6. Chunk Strategy Upgrade: `chunk_size=800-1000` with `RecursiveCharacterTextSplitter` + add `SemanticChunker` option.

**P2 - Advanced / Differentiators**
- Agentic RAG: Tool calling (Tavily web search fallback when confidence < 0.6), LangGraph agent for multi-step QA.
- GraphRAG: Neo4j or NetworkX for entity linking — answers How are X and Y related?
- Eval Harness: RAGAS (faithfulness, answer relevancy) + `GET /eval` dataset.
- Auth + Multi-User: Supabase Auth + per-user collections `chroma_collection = f"user_{id}"`.
- Observability: LangSmith tracing + logging + rate limit.
- Export: Export chat to md/pdf + share link.
- Voice: Whisper STT + TTS for voice chat.
