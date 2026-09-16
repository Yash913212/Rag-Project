# Advanced Personal Knowledge Base (RAG) with Multimodal Vision

A complete, premium-grade Retrieval-Augmented Generation (RAG) system that allows you to chat with your documents, visualize your knowledge base in stunning 3D, and generate study materials. 

This project integrates powerful local LLMs (via Ollama) and Cloud Vision models (via Hugging Face) to process both text and images flawlessly, all wrapped in a stunning, highly polished web interface.

## ✨ Key Features

- **Premium UI/UX**: Built with a "High-Tech AI Startup" aesthetic. Features responsive layouts, dark/light modes, customizable theme accents (Brass, Rust, Moss, Indigo), fluid micro-animations, and a unified typography stack (Space Grotesk, Plus Jakarta Sans, Fira Code).
- **Multimodal Document Processing**: Seamlessly handles PDFs, Markdown, TXT, CSV, and Images. Integrates Hugging Face's `Qwen2.5-VL-3B-Instruct` vision model for deep image analysis and text extraction.
- **Interactive Chat Interface**: Dynamic structuring, auto-expanding text areas, animated typing indicators, and smart follow-up suggestions.
- **Document Library**: Global drag-and-drop upload interface with progress tracking. Easily manage, monitor, and delete documents.
- **3D Knowledge Map**: A stunning Three.js-powered interactive 3D scatter plot visualizing your document chunks using semantic embeddings, PCA, and K-Means clustering—complete with post-processing Bloom (glow) effects.
- **Study Mode**: Automatically generate multiple-choice quizzes and flashcards based on document context.

## 🛠️ Tech Stack

**Backend**
- **Framework**: FastAPI & Uvicorn
- **Orchestration**: LangChain (Pipelines, Chunking, Integration)
- **Local LLM & Embeddings**: Ollama (`gpt-oss:20b-cloud`, `nomic-embed-text`)
- **Cloud Vision**: Hugging Face Inference API
- **Vector Database**: ChromaDB
- **Data Processing**: Scikit-learn & Numpy (PCA & Clustering)

**Frontend**
- **Framework**: React 19 & Vite
- **Styling**: Tailwind CSS v4
- **Animations & Effects**: Framer Motion, `@react-three/postprocessing`
- **3D Rendering**: Three.js, `@react-three/fiber`, and `@react-three/drei`
- **Notifications**: `react-hot-toast`
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites

1. Python 3.8+
2. Node.js (v18+)
3. [Ollama](https://ollama.ai/) installed and running on your machine.
4. A Hugging Face account and API Token.

**Pull the required Ollama models:**
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

# Set up your environment variables
# Create a .env file in the root and add your Hugging Face Token:
# HF_TOKEN=your_huggingface_token_here

# Start the FastAPI server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
The backend API will run on `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal in the `rag-ui` directory:

```bash
cd rag-ui

# Install dependencies
# NOTE: Use --legacy-peer-deps to avoid React 19 peer dependency conflicts
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 📁 Project Structure

### Root Directory
- `api.py`: The core FastAPI application (handles `/chat`, `/upload`, `/documents`, `/quiz`, `/map`).
- `requirements.txt`: Python dependencies.
- `chroma_db/`: Persistent local vector storage.
- `data/`: Uploaded raw files.

### Frontend Directory (`rag-ui/`)
- `src/components/`: Reusable UI elements (Rail, ThemeSettings, etc.)
- `src/pages/`: Main application views (Chat, Library, KnowledgeMap, StudyMode)
- `src/context/`: React context providers (`ThemeContext`, `UIContext`)
- `src/config.js`: API routing configurations.
