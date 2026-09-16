import asyncio
import base64
import json
import os
import re
import urllib.request
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from typing import Any, Dict, List, Optional

from ddgs import DDGS
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from huggingface_hub import InferenceClient
# pyrefly: ignore [missing-import]
from langchain_chroma import Chroma
from langchain_classic.chains.combine_documents import \
    create_stuff_documents_chain
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel

DATA_DIR = os.environ.get("DATA_DIR", "./data")
os.makedirs(DATA_DIR, exist_ok=True)

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "50"))
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
RETRIEVAL_K = 5

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-oss:20b-cloud")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
_keep_alive = os.environ.get("MODEL_KEEP_ALIVE", "0")
try:
    MODEL_KEEP_ALIVE = int(_keep_alive)
except ValueError:
    MODEL_KEEP_ALIVE = _keep_alive

vectorstore = None
qa_chain = None  # just the LLM answer chain (no retriever bundled)
llm_instance = None  # kept for reference
upload_lock = asyncio.Lock()


def _unload_ollama_model(model_name: str) -> None:
    """Ask Ollama to immediately unload a model from VRAM (keep_alive=0)."""
    try:
        payload = json.dumps(
            {
                "model": model_name,
                "keep_alive": 0,
            }
        ).encode()
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
        keep_alive=0,  # always unload after use
    )
    vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embedding)

    llm_instance = OllamaLLM(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        keep_alive=0,  # always unload after use
        num_ctx=2048,
        num_gpu=0,  # run LLM on CPU to avoid VRAM OOM on 4GB GPU
    )
    system_prompt = (
        "You are an AI assistant designed for advanced question-answering. "
        "Use the retrieved context to provide the most accurate and optimal answer. "
        "CRITICAL INSTRUCTION FOR FORMATTING: Do NOT default to using tables. You must dynamically generate the structure of your response based solely on the content and the user's request. "
        "Use paragraphs for narratives, bullet points for summaries, and numbered lists for steps. ONLY use a table if the user explicitly asks for one or if the data is strictly comparative with complete data for all columns (never create columns with null or empty '—' values). "
        "Include relevant emojis to make it visually appealing. "
        "If you don't know the answer, just say that you don't know.\n\n"
        "Context:\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    document: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


@app.post("/chat")
async def chat(request: ChatRequest):
    global qa_chain, vectorstore
    await ensure_rag_ready()

    # ── Step 1: Retrieval (loads embedding model into VRAM) ──
    search_kwargs = {"k": RETRIEVAL_K}
    if request.document:
        doc_path = os.path.join(DATA_DIR, secure_filename(request.document))
        search_kwargs["filter"] = {"source": doc_path}

    async def fetch_web_search():
        def _search():
            try:
                results = DDGS().text(request.query, max_results=3)
                docs = []
                for idx, r in enumerate(results):
                    docs.append(
                        Document(
                            page_content=r.get("body", ""),
                            metadata={"source": f"Web: {r.get('title')}", "page": -1},
                        )
                    )
                return docs
            except Exception as e:
                print(f"Web search error: {e}")
                return []

        return await asyncio.to_thread(_search)

    docs_task = asyncio.to_thread(
        vectorstore.similarity_search_with_score, request.query, **search_kwargs
    )
    web_task = fetch_web_search()

    docs_with_scores, web_docs = await asyncio.gather(docs_task, web_task)

    context_docs = [doc for doc, _score in docs_with_scores]
    context_docs.extend(web_docs)

    score_map = {doc.page_content: score for doc, score in docs_with_scores}
    for w_doc in web_docs:
        score_map[w_doc.page_content] = 0.1

    # ── Step 2: Explicitly unload embedding model from VRAM ──
    await asyncio.to_thread(_unload_ollama_model, EMBEDDING_MODEL)

    # Build source metadata for SSE
    sources = []
    for idx, doc in enumerate(context_docs):
        source_metadata = doc.metadata
        page = source_metadata.get("page", 0)
        source_name = source_metadata.get("source", "Unknown")
        filename = os.path.basename(source_name)
        page_str = f"Page {page + 1} ({filename})" if page >= 0 else source_name

        raw_score = score_map.get(doc.page_content, 0.5)
        confidence = max(0.0, min(1.0, 1.0 - raw_score))

        sources.append(
            {
                "id": idx + 1,
                "text": doc.page_content,
                "page": page_str,
                "score": confidence,
            }
        )

    # ── Step 3: Stream LLM generation (loads LLM into VRAM, embedding is gone) ──
    async def generate_sse():
        yield sse({"type": "sources", "sources": sources})

        history_tuples = []
        if request.history:
            for msg in request.history:
                history_tuples.append((msg.role, msg.content))

        full_answer = ""
        async for chunk in qa_chain.astream(
            {"input": request.query, "context": context_docs, "history": history_tuples}
        ):
            full_answer += chunk
            yield sse({"type": "content", "token": chunk})

        # Generate 3 follow-up suggestions
        try:
            suggestion_prompt = f"Based on the following conversation and answer, suggest 3 short follow-up questions the user could ask. Return ONLY a JSON array of strings.\n\nAnswer: {full_answer}\n\nQuestions:"
            sug_result = await asyncio.to_thread(llm_instance.invoke, suggestion_prompt)
            match = re.search(r"\[.*\]", sug_result, re.DOTALL)
            suggestions = (
                json.loads(match.group(0))
                if match
                else [
                    "Can you elaborate?",
                    "What are the key takeaways?",
                    "Tell me more.",
                ]
            )
        except Exception:
            suggestions = [
                "Can you elaborate?",
                "What are the key takeaways?",
                "Tell me more.",
            ]

        yield sse({"type": "end", "suggestions": suggestions})

    return StreamingResponse(generate_sse(), media_type="text/event-stream")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    await ensure_rag_ready()

    filename = secure_filename(file.filename or "")
    content_type = file.content_type or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".md", ".txt", ".csv", ".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported file format.")
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

            if ext in [".png", ".jpg", ".jpeg", ".webp"]:
                import base64

                import requests

                def describe_image(path):
                    import os
                    from dotenv import load_dotenv
                    load_dotenv()
                    hf_token = os.getenv("HF_TOKEN")
                    
                    if not hf_token:
                        return "Error: HF_TOKEN is not set in environment variables."
                    
                    headers = {
                        "Authorization": f"Bearer {hf_token}",
                        "Content-Type": "application/json"
                    }
                    # Use Qwen2.5-VL-3B via the Hugging Face OpenAI-compatible Chat API
                    API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-3B-Instruct/v1/chat/completions"
                    
                    try:
                        import requests
                        import base64
                        import mimetypes
                        
                        mime_type, _ = mimetypes.guess_type(path)
                        if not mime_type:
                            mime_type = "image/jpeg"
                            
                        with open(path, "rb") as f:
                            img_b64 = base64.b64encode(f.read()).decode("utf-8")
                            
                        image_data_url = f"data:{mime_type};base64,{img_b64}"
                        
                        ocr_prompt = (
                            "You are an image analysis and OCR system. Analyze the provided image carefully. "
                            "Tasks: 1. Detect all visible text. 2. Transcribe the text exactly as it appears. "
                            "3. Preserve numbers, symbols, punctuation and capitalization. 4. Identify the language of each text region. "
                            "5. Identify important objects in the image. 6. Describe the overall scene. "
                            "7. If the image contains a document, receipt, sign, label, poster or screenshot, extract its structured information. "
                            "8. Do not invent text that is not visible. Return ONLY valid JSON: "
                            '{ "detected_text": [], "languages": [], "objects": [], "scene_description": "", "document_type": "", "structured_data": {} }'
                        )
                        
                        payload = {
                            "model": "Qwen/Qwen2.5-VL-3B-Instruct",
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": ocr_prompt
                                        },
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": image_data_url
                                            }
                                        }
                                    ]
                                }
                            ],
                            "max_tokens": 1500
                        }
                        
                        res = requests.post(API_URL, headers=headers, json=payload, timeout=30)
                        json_res = res.json()
                        
                        if isinstance(json_res, dict) and "error" in json_res:
                            print(f"HuggingFace API error: {json_res['error']}")
                            return "Failed to generate description."
                            
                        if "choices" in json_res and len(json_res["choices"]) > 0:
                            return json_res["choices"][0]["message"]["content"]
                            
                        return "Failed to generate description."
                    except requests.exceptions.ConnectionError as e:
                        print(f"Network error reaching HuggingFace (DNS/Offline). Falling back to local moondream model...")
                        # Fallback to local Ollama if offline
                        try:
                            import base64
                            with open(path, "rb") as f:
                                img_b64 = base64.b64encode(f.read()).decode("utf-8")
                            payload = {
                                "model": "moondream",
                                "prompt": "Describe this image in detail.",
                                "images": [img_b64],
                                "stream": False,
                            }
                            res = requests.post("http://localhost:11434/api/generate", json=payload)
                            return res.json().get("response", "Failed to generate description.")
                        except Exception as fallback_e:
                            print(f"Fallback local Vision API error: {fallback_e}")
                            return "Error describing image."
                    except Exception as e:
                        print(f"Vision API error: {e}")
                        return "Error describing image."

                description = await asyncio.to_thread(describe_image, file_path)
                if not description or description.startswith("Error"):
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to process image with vision model.",
                    )

                docs = [
                    Document(
                        page_content=f"Image Description for {filename}:\n{description}",
                        metadata={"source": file_path, "page": 0},
                    )
                ]
            else:
                if ext == ".pdf":
                    loader = PyPDFLoader(file_path)
                elif ext in [".md", ".txt"]:
                    from langchain_community.document_loaders import TextLoader

                    loader = TextLoader(file_path, encoding="utf-8")
                elif ext == ".csv":
                    from langchain_community.document_loaders.csv_loader import \
                        CSVLoader

                    loader = CSVLoader(file_path, encoding="utf-8")
                else:
                    try:
                        from langchain_community.document_loaders import \
                            TextLoader

                        loader = TextLoader(file_path, encoding="utf-8")
                    except Exception:
                        raise HTTPException(
                            status_code=400, detail="Unsupported file format."
                        )

                docs = await asyncio.to_thread(loader.load)

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
            )
            splits = await asyncio.to_thread(text_splitter.split_documents, docs)

            if not splits:
                raise HTTPException(
                    status_code=400, detail="No extractable text found in PDF."
                )

            total = len(splits)
            batch_size = 5
            for i in range(0, total, batch_size):
                batch = splits[i : i + batch_size]
                async with upload_lock:
                    await asyncio.to_thread(vectorstore.add_documents, batch)
                percent = 25 + int(75 * (i + len(batch)) / total)
                yield sse(
                    {
                        "type": "progress",
                        "phase": "embedding",
                        "percent": min(percent, 100),
                    }
                )

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


import datetime


@app.get("/documents")
async def list_documents():
    await ensure_rag_ready()
    # Get all documents from Chroma
    try:
        data = vectorstore.get()
        metadatas = data["metadatas"]
    except Exception as e:
        print("Error getting documents:", e)
        return []

    docs = {}
    for meta in metadatas:
        if not meta:
            continue
        source = meta.get("source")
        if not source:
            continue

        name = os.path.basename(source)
        if name not in docs:
            docs[name] = {
                "name": name,
                "chunks": 0,
                "pages": set(),
                "size": 0,
                "type": "unknown",
                "uploaded_at": None,
                "source": source,
            }

        docs[name]["chunks"] += 1
        page = meta.get("page")
        if page is not None:
            docs[name]["pages"].add(page)

    # Enrich with file stats
    for name, info in docs.items():
        info["pages"] = len(info["pages"])
        file_path = os.path.join(DATA_DIR, name)
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            info["size"] = stat.st_size
            info["uploaded_at"] = datetime.datetime.fromtimestamp(
                stat.st_mtime
            ).isoformat()
            info["type"] = os.path.splitext(name)[1].lower()

    return list(docs.values())


@app.delete("/documents/{name}")
async def delete_document(name: str):
    await ensure_rag_ready()
    file_path = os.path.join(DATA_DIR, secure_filename(name))

    # 1. Delete from Chroma
    try:
        data = vectorstore.get()
        ids_to_delete = []
        for i, meta in enumerate(data["metadatas"]):
            if meta and meta.get("source", "").endswith(name):
                ids_to_delete.append(data["ids"][i])
        if ids_to_delete:
            vectorstore.delete(ids_to_delete)
    except Exception as e:
        print("Error deleting from Chroma:", e)

    # 2. Delete file
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"status": "success", "deleted": name}


@app.get("/files/{name}")
async def get_file(name: str):
    file_path = os.path.join(DATA_DIR, secure_filename(name))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/search")
async def search_documents(q: str):
    await ensure_rag_ready()
    docs_with_scores = await asyncio.to_thread(
        vectorstore.similarity_search_with_score, q, k=5
    )
    results = []
    for doc, score in docs_with_scores:
        meta = doc.metadata
        results.append(
            {
                "text": doc.page_content,
                "source": os.path.basename(meta.get("source", "")),
                "page": meta.get("page", 0) + 1,
                "score": max(0.0, min(1.0, 1.0 - score)),
            }
        )
    return results


class QuizRequest(BaseModel):
    document: str
    count: int = 5
    kind: str = "quiz"  # or "flashcards"


@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    await ensure_rag_ready()
    data = vectorstore.get()
    chunks = []
    for i, meta in enumerate(data["metadatas"]):
        if meta and meta.get("source", "").endswith(request.document):
            chunks.append(data["documents"][i])

    if not chunks:
        raise HTTPException(status_code=404, detail="Document chunks not found")

    import random

    selected_chunks = random.sample(chunks, min(len(chunks), 10))
    context_str = "\n---\n".join(selected_chunks)

    if request.kind == "quiz":
        prompt = f"Based on the following document context, generate a multiple-choice quiz with {request.count} questions. Return ONLY a JSON array of objects. Each object must have 'question', 'options' (array of 4 strings), 'answer' (exact match to one option), 'explanation', and 'source' (brief excerpt). Do not include markdown formatting like ```json.\n\nContext:\n{context_str}"
    else:
        prompt = f"Based on the following document context, generate {request.count} flashcards. Return ONLY a JSON array of objects. Each object must have 'front' (concept or question), 'back' (definition or answer), and 'source' (brief excerpt). Do not include markdown formatting like ```json.\n\nContext:\n{context_str}"

    result = await asyncio.to_thread(llm_instance.invoke, prompt)

    try:
        match = re.search(r"\[.*\]", result, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(result)
    except Exception as e:
        print("Quiz parse error:", e, "\nResult:", result)
        raise HTTPException(status_code=500, detail="Failed to parse LLM response")


@app.get("/map")
async def get_knowledge_map():
    await ensure_rag_ready()
    data = vectorstore.get(include=["embeddings", "metadatas", "documents"])
    embeddings = data.get("embeddings")
    if embeddings is None or len(embeddings) == 0:
        return {"points": [], "clusters": []}

    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA

    X = np.array(embeddings)

    n_components = min(3, len(X))
    if n_components < 3:
        pca = PCA(n_components=n_components)
        X_3d = pca.fit_transform(X)
        if n_components < 3:
            X_3d = np.pad(X_3d, ((0, 0), (0, 3 - n_components)))
    else:
        pca = PCA(n_components=3)
        X_3d = pca.fit_transform(X)

    n_clusters = min(5, len(X))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(X)

    async def fetch_cluster(i):
        indices = np.where(labels == i)[0]
        sample_docs = [data["documents"][idx] for idx in indices[:3]]
        sample_text = "\n---\n".join(sample_docs)
        prompt = f"Give a 2-4 word summarizing title for the following texts:\n\n{sample_text}\n\nTitle:"
        title = await asyncio.to_thread(llm_instance.invoke, prompt)
        return {
            "id": int(i),
            "label": title.strip().replace('"', ""),
            "count": len(indices),
        }

    clusters = []
    for i in range(n_clusters):
        clusters.append(await fetch_cluster(i))

    points = []
    for i, meta in enumerate(data["metadatas"]):
        points.append(
            {
                "id": data["ids"][i],
                "x": float(X_3d[i, 0]),
                "y": float(X_3d[i, 1]),
                "z": float(X_3d[i, 2]),
                "cluster": int(labels[i]),
                "source": os.path.basename(meta.get("source", "")),
                "text": data["documents"][i],
            }
        )

    return {"points": points, "clusters": clusters}
