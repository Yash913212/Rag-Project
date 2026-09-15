# Local RAG System with Ollama & FastAPI

A complete, locally-hosted Retrieval-Augmented Generation (RAG) system that allows you to chat with your documents, visualize your knowledge base in 3D, and generate study materials. Built with privacy in mind, it uses local LLMs via Ollama so your data never leaves your machine.

## ✨ Key Features

- **Private & Local**: Powered by Ollama (`gpt-oss:20b-cloud` and `nomic-embed-text`). No external API calls.
- **Interactive Chat UI**: Real-time streaming responses, source citations, and smart follow-up suggestions.
- **Document Library**: Upload interface for PDFs and Markdown files with progress tracking. Manage and delete documents easily.
- **3D Knowledge Map**: A Three.js powered interactive 3D scatter plot visualizing your document chunks using semantic embeddings, PCA, and K-Means clustering.
- **Study Mode**: Interactive UI for automatically generating multiple-choice quizzes and flashcards based on document context.
- **In-App Document Viewer**: Integrated PDF viewing utilizing `react-pdf` to view source documents directly within the app.

## 🛠️ Tech Stack

**Backend**
- **Framework**: FastAPI & Uvicorn
- **Orchestration**: LangChain (for pipelines, text splitting, and integration)
- **Vector Database**: ChromaDB (local persistence)
- **Data Processing**: Scikit-learn & Numpy (for PCA & Clustering)

**Frontend**
- **Framework**: React 19 & Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **3D Rendering**: Three.js, `@react-three/fiber`, and `@react-three/drei`
- **PDF Rendering**: `react-pdf`
- **Markdown parsing**: `react-markdown` & `remark-gfm`
- **Routing**: React Router DOM (`react-router-dom`)

## 🚀 Getting Started

### Prerequisites
1. Python 3.8+
2. Node.js (v18+)
3. [Ollama](https://ollama.ai/) installed and running on your machine.

Pull the required models:
```bash
ollama pull gpt-oss:20b-cloud
ollama pull nomic-embed-text
```

### 1. Backend Setup
Open a terminal in the root directory:

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
The backend API will run on `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal in the `rag-ui` directory:

```bash
cd rag-ui

# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 📁 Project Structure

### Root Directory
- `api.py`: The core FastAPI application (handles `/chat`, `/upload`, `/documents`, `/quiz`, `/map`).
- `local_rag.py`: A simple standalone LangChain CLI script example.
- `requirements.txt`: Python dependencies.
- `chroma_db/`: Persistent local vector storage.
- `data/`: Uploaded raw files.

### Frontend Directory (`rag-ui/`)
- `src/components/`: Reusable UI elements (Chat, PdfViewer, etc.)
- `src/pages/`: Main application views (Chat, Library, Map, Study)
- `src/context/`: React context providers (e.g., `RagContext` for global state)
- `src/hooks/`: Custom React hooks (e.g., `useRAG`)
- `src/lib/`: Utility functions and helpers
