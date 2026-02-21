from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.chat.orchestration import handle_chat
from app.shemas import ChatRequest, ChatResponse
from app.services.chat.speech_to_text import convert_speech_to_text

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        result = handle_chat(
            db=db,
            user_message=request.message,
            history=[m.model_dump() for m in request.history],
        )
        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}",
        )
        
@router.post("/speech-to-text") 
def speech_to_text(audio_file: UploadFile = File(...)):
    print("Speech to text conversion called")
    try:
        transcription = convert_speech_to_text(audio_file.file)
        return {"transcription": transcription}
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech to text conversion failed: {str(e)}",
        )