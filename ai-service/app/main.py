import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv
import pypdf
import io

load_dotenv()

app = FastAPI(
    title="EduNexa AI & NLP Engine",
    description="Advanced Python & FastAPI AI service for Document Parsing, OCR, and Gemini LLM Processing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class SummarizeRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class QuestionGenRequest(BaseModel):
    topic: str
    count: Optional[int] = 5
    difficulty: Optional[str] = "medium"
    language: Optional[str] = "en"

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "EduNexa AI Service",
        "gemini_configured": bool(GEMINI_API_KEY)
    }

@app.post("/extract-pdf")
async def extract_pdf_text(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    try:
        content = await file.read()
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return {"filename": file.filename, "pages": len(reader.pages), "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")

@app.post("/summarize")
def summarize_content(req: SummarizeRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key is not configured on AI service")
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Summarize the following educational content in {req.language}:\n\n{req.text[:30000]}"
        res = model.generate_content(prompt)
        return {"summary": res.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

