# Advanced Personal Knowledge Base (RAG) with Multimodal Vision

A complete, premium-grade Retrieval-Augmented Generation (RAG) system that allows you to chat with your documents, visualize your knowledge base in stunning 3D, and generate study materials. 

This project integrates powerful cloud LLMs (Groq & OpenRouter) and cloud embedding/vision models (Hugging Face) with a robust Supabase vector database, all wrapped in a stunning, highly polished web interface.

## ✨ Key Features

- **Premium UI/UX**: Built with a "High-Tech AI Startup" aesthetic. Features responsive layouts, dark/light modes, customizable theme accents (Brass, Rust, Moss, Indigo), fluid micro-animations, and a unified typography stack (Space Grotesk, Plus Jakarta Sans, Fira Code).
- **Multimodal Document Processing**: Seamlessly handles PDFs, Markdown, TXT, CSV, and Images. Integrates Hugging Face's `Qwen2.5-VL-3B-Instruct` vision model for deep image analysis and text extraction.
- **Interactive Chat Interface**: Dynamic structuring, auto-expanding text areas, animated typing indicators, and smart follow-up suggestions.
- **Document Library**: Global drag-and-drop upload interface with progress tracking. Easily manage, monitor, and delete documents.
- **3D Knowledge Map**: A stunning Three.js-powered interactive 3D scatter plot visualizing your document chunks using semantic embeddings, PCA, and K-Means clustering—complete with post-processing Bloom (glow) effects.
- **Study Mode**: Automatically generate multiple-choice quizzes and flashcards based on document context.

## 🛠️ Tech Stack

**Backend (Cloud AI & Vector DB)**
- **Framework**: FastAPI & Uvicorn (Hosted on **Render**)
- **Orchestration**: LangChain (Pipelines, Chunking, Integration)
- **Primary LLM**: **Groq** (`llama-3.1-70b-versatile` for ultra-fast inference)
- **Fallback LLM**: **OpenRouter** (`openai/gpt-4o-mini` for high-availability)
- **Embeddings & Vision**: **Hugging Face** Inference API (`all-mpnet-base-v2`, `Qwen2.5-VL-3B-Instruct`)
- **Vector Database**: **Supabase** (PostgreSQL with `pgvector`)
- **Data Processing**: Scikit-learn & Numpy (PCA & Clustering)

**Frontend**
- **Framework**: React 19 & Vite (Hosted on **Vercel**)
- **Styling**: Tailwind CSS v4
- **Animations & Effects**: Framer Motion, `@react-three/postprocessing`
- **3D Rendering**: Three.js, `@react-three/fiber`, and `@react-three/drei`
- **Notifications**: `react-hot-toast`
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites

1. Python 3.8+
2. Node.js (v18+)
3. API Keys for **Groq**, **OpenRouter**, **Hugging Face**, and **Supabase**.

### 1. Environment Setup

Create a `.env` file in the root of your project directory and add your keys:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-key
GROQ_API_KEY=your-groq-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
HF_TOKEN=your-huggingface-token
```

### 2. Backend Setup

Open a terminal in the root directory:

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip3 install -r requirements.txt

# Start the FastAPI server
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
The backend API will run on `http://localhost:8000`.

### 3. Frontend Setup

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

## 🌍 Cloud Deployment

- **Frontend**: The `rag-ui` folder is configured for seamless deployment on **Vercel**. Just import your GitHub repository and set the Root Directory to `rag-ui`.
- **Backend**: The root folder containing `api.py` is configured for **Render**. Ensure you add the environment variables from your `.env` file to your Render dashboard!

## 📁 Project Structure

### Root Directory
- `api.py`: The core FastAPI application (handles `/chat`, `/upload`, `/documents`, `/quiz`, `/map`).
- `requirements.txt`: Python dependencies.
- `data/`: Uploaded raw files temporarily stored before processing.

### Frontend Directory (`rag-ui/`)
- `src/components/`: Reusable UI elements (Rail, ThemeSettings, etc.)
- `src/pages/`: Main application views (Chat, Library, KnowledgeMap, StudyMode)
- `src/context/`: React context providers (`ThemeContext`, `UIContext`)
- `src/config.js`: API routing configurations.
