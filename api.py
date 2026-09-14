import asyncio
import json
import os
import re
import urllib.request
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

DATA_DIR = os.environ.get("DATA_DIR", "./data")
os.makedirs(DATA_DIR, exist_ok=True)

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "50"))
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
RETRIEVAL_K = 5

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.environ.get("LLM_MODEL", "llama3.2:3b")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
_keep_alive = os.environ.get("MODEL_KEEP_ALIVE", "0")
try:
    MODEL_KEEP_ALIVE = int(_keep_alive)
except ValueError:
    MODEL_KEEP_ALIVE = _keep_alive

vectorstore = None
qa_chain = None          # just the LLM answer chain (no retriever bundled)
llm_instance = None      # kept for reference
upload_lock = asyncio.Lock()


def _unload_ollama_model(model_name: str) -> None:
    """Ask Ollama to immediately unload a model from VRAM (keep_alive=0)."""
    try:
        payload = json.dumps({
            "model": model_name,
            "keep_alive": 0,
        }).encode()
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()  # drain
    except Exception as exc:
        print(f"Warning: failed to unload {model_name}: {exc}")


def init_rag_pipeline():
    global vectorstore, qa_chain, llm_instance
    print("Initializing RAG pipeline...")

    embedding = OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=OLLAMA_BASE_URL,
        keep_alive=0,          # always unload after use
    )
    vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embedding)

    llm_instance = OllamaLLM(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        keep_alive=0,          # always unload after use
        num_ctx=2048,
        num_gpu=0,             # run LLM on CPU to avoid VRAM OOM on 4GB GPU
    )
    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer the question. "
        "If you don't know the answer, say that you don't know.\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    qa_chain = create_stuff_documents_chain(llm_instance, prompt)
    print("RAG pipeline initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await asyncio.to_thread(init_rag_pipeline)
    except Exception as exc:
        print(f"RAG pipeline not ready at startup: {exc}")
    yield


app = FastAPI(lifespan=lifespan)

cors_origins = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def secure_filename(name: str) -> str:
    name = os.path.basename(name.replace("\\", "/"))
    name = re.sub(r"[^\w\-. ]", "_", name)
    return name.strip() or "upload.pdf"


async def ensure_rag_ready():
    global qa_chain
    if qa_chain is None:
        try:
            await asyncio.to_thread(init_rag_pipeline)
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"RAG pipeline unavailable (is Ollama running?). {exc}",
            )


@app.post("/clear")
async def clear_db():
    global vectorstore
    await ensure_rag_ready()
    try:
        if vectorstore:
            vectorstore.delete_collection()
            await asyncio.to_thread(init_rag_pipeline)
            
        for filename in os.listdir(DATA_DIR):
            file_path = os.path.join(DATA_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                
        return {"status": "cleared"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/health")
async def health():
    ollama_ok = False
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE_URL}/api/tags", timeout=2) as resp:
            ollama_ok = resp.status == 200
    except Exception:
        ollama_ok = False

    return {
        "status": "ok" if qa_chain is not None else "degraded",
        "rag_initialized": qa_chain is not None,
        "ollama": ollama_ok,
        "model": LLM_MODEL,
    }


class ChatRequest(BaseModel):
    query: str


@app.post("/chat")
async def chat(request: ChatRequest):
    global qa_chain, vectorstore
    await ensure_rag_ready()

    # ── Step 1: Retrieval (loads embedding model into VRAM) ──
    docs_with_scores = await asyncio.to_thread(
        vectorstore.similarity_search_with_score, request.query, k=RETRIEVAL_K
    )
    context_docs = [doc for doc, _score in docs_with_scores]
    score_map = {doc.page_content: score for doc, score in docs_with_scores}

    # ── Step 2: Explicitly unload embedding model from VRAM ──
    await asyncio.to_thread(_unload_ollama_model, EMBEDDING_MODEL)

    # Build source metadata for SSE
    sources = []
    for idx, doc in enumerate(context_docs):
        source_metadata = doc.metadata
        page = source_metadata.get("page", 0)
        source_name = source_metadata.get("source", "Unknown")
        filename = os.path.basename(source_name)
        page_str = f"Page {page + 1} ({filename})"

        raw_score = score_map.get(doc.page_content, 0.5)
        confidence = max(0.0, min(1.0, 1.0 - raw_score))

        sources.append({
            "id": idx + 1,
            "text": doc.page_content,
            "page": page_str,
            "score": confidence,
        })

    # ── Step 3: Stream LLM generation (loads LLM into VRAM, embedding is gone) ──
    async def generate_sse():
        yield sse({"type": "sources", "sources": sources})

        async for chunk in qa_chain.astream({"input": request.query, "context": context_docs}):
            yield sse({"type": "content", "token": chunk})

        yield sse({"type": "end"})

    return StreamingResponse(generate_sse(), media_type="text/event-stream")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    await ensure_rag_ready()

    filename = secure_filename(file.filename or "")
    content_type = file.content_type or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".md"]:
        raise HTTPException(status_code=400, detail="Only PDF and MD files are supported.")

    file_path = os.path.join(DATA_DIR, filename)

    async def upload_stream():
        size = 0
        try:
            with open(file_path, "wb") as buffer:
                while True:
                    chunk = await file.read(1 << 20)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_UPLOAD_MB * 1024 * 1024:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds {MAX_UPLOAD_MB}MB limit.",
                        )
                    buffer.write(chunk)

            yield sse({"type": "progress", "phase": "upload", "percent": 25})

            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
            elif ext == ".md":
                from langchain_community.document_loaders import TextLoader
                loader = TextLoader(file_path, encoding='utf-8')
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format.")
                
            docs = await asyncio.to_thread(loader.load)

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
            )
            splits = await asyncio.to_thread(text_splitter.split_documents, docs)

            if not splits:
                raise HTTPException(status_code=400, detail="No extractable text found in PDF.")

            total = len(splits)
            batch_size = 5
            for i in range(0, total, batch_size):
                batch = splits[i : i + batch_size]
                async with upload_lock:
                    await asyncio.to_thread(vectorstore.add_documents, batch)
                percent = 25 + int(75 * (i + len(batch)) / total)
                yield sse({
                    "type": "progress",
                    "phase": "embedding",
                    "percent": min(percent, 100),
                })

            yield sse({"type": "done", "filename": filename, "chunks_added": total})

        except HTTPException as exc:
            if os.path.exists(file_path):
                os.remove(file_path)
            yield sse({"type": "error", "message": str(exc.detail)})
        except Exception as exc:
            print("Upload error:", exc)
            if os.path.exists(file_path):
                os.remove(file_path)
            yield sse({"type": "error", "message": "Failed to process PDF."})

    return StreamingResponse(upload_stream(), media_type="text/event-stream")