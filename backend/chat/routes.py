from fastapi import APIRouter, Depends, HTTPException, status
from chat.schemas import AskAISchema
from dependencies import get_optional_user, get_current_user
from ai.ai_service import ask_ai
from fastapi.responses import JSONResponse
from database import chats_collection
from datetime import datetime


router = APIRouter()


@router.post("/ai/ask")
def ask_ai_route(data: AskAISchema, user: dict | None = Depends(get_optional_user)):
    answer = ask_ai(data.question)
    
    if user:
        chats_collection.insert_one({
            "userId": user["_id"],
            "question": data.question,
            "answer": answer,
            "timestamp": datetime.fromtimestamp(data.timestamp / 1000)
        })
        # Jab data save ho jaye (User logged in)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"answer": answer}
        )
    
    # Normal response (Guest user)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"answer": answer}
    )

# Get chats with pagination
@router.get("/getchats/{offset}")
def get_chats(offset: int, user: dict = Depends(get_current_user)):
   PAGE_SIZE = 10
   total = chats_collection.count_documents({"userId": user["_id"]})
   if offset >= total:
        raise HTTPException(status_code=404, detail="No more chats")

   cursor = (
        chats_collection
        .find({"userId": user["_id"]})
        .sort("timestamp", -1)
        .skip(offset)
        .limit(PAGE_SIZE)
   )

   chats = [
        {
            "question": c["question"],
            "answer": c["answer"],
            "timestamp": c["timestamp"]
        }
        for c in cursor
   ]


   can_load_more = offset + PAGE_SIZE < total
   return {
        "chats": chats,
        "canLoadMore": can_load_more
   }
