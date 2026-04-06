# DinApp 🍃

A full-stack soil analysis and crop recommendation application powered by **Deep Learning (SoilNet)** and **Groq (Llama 3)**.  

## 🏗️ Project Structure
The project is split into two parts:
1. `backend/` — Python FastAPI server with PyTorch DL model & Gemini integration.
2. `frontend/` — React + Vite UI.

---

## 🚀 How to Run the Project Locally

You will need **two terminal windows** (one for the backend, one for the frontend).

### Step 1: Start the Backend (API & AI Models)
Open your first terminal and run:

```powershell
# 1. Activate the Virtual Environment (Important!)
# Make sure you are in the root 'Practical' folder, then run:
.\.venv\Scripts\activate
# For Mac/Linux use: source .venv/bin/activate

# 2. Navigate to the backend directory
cd backend

# 3. Install dependencies (First time setup only)
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload
```
*The backend should now be running at `http://127.0.0.1:8000`*

*(Note: Ensure you have populated your `.env` file in the `backend/` directory with `GROQ_API_KEY` and `OPENROUTER_API_KEY` before running).*

### Step 2: Start the Frontend (User Interface)
Open a separate, second terminal window and run:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (if you haven't already and are setting this up for the first time)
npm install

# 3. Start the React development server
npm run dev
```
*The frontend should now be running. The terminal will show a local URL (e.g., `http://localhost:5173`). Ctrl+Click that link to open the app in your browser!*

---

## 💡 Usage Guide

- **Upload Data**: Go to the Dashboard and upload a soil dataset (CSV/Excel format). Ensure it has columns for N, P, K, temperature, humidity, pH, and rainfall.
- **AI Recommendation**: The Deep Learning model (`SoilNet`) will classify the soil and recommend the top 3 crops with confidence percentages.
- **Chat with Expert AI**: Go to the Advice page to ask customized agronomy questions based on the soil analysis. The app uses Groq (Llama 3) for instant responses (with automatic failover to OpenRouter).
