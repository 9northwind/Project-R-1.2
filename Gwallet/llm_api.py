from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from .llm import llm_model
from .fbase import insert_data
import tempfile, shutil, logging, inspect, json
from typing import Any

app = FastAPI()
logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_json(obj: Any):
    """Safely serialize Firestore and custom Python objects."""
    try:
        return json.loads(json.dumps(obj, default=str))
    except Exception:
        return str(obj)


async def call_llm_model(*args, **kwargs):
    """Handle async/sync llm_model calls gracefully."""
    if inspect.iscoroutinefunction(llm_model):
        return await llm_model(*args, **kwargs)
    result = llm_model(*args, **kwargs)
    if inspect.isawaitable(result):
        return await result
    return result


@app.post("/extract-receipt")
async def extract_receipt(file: UploadFile = File(...)):
    """Handle image upload and receipt extraction."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        result = await call_llm_model(temp_path)
        payload = (
            safe_json(result.model_dump())
            if hasattr(result, "model_dump")
            else safe_json(result)
        )
        return {"status": "success", "data": payload}
    except Exception as e:
        logging.exception("extract_receipt failed")
        return {"status": "error", "message": str(e)}


@app.post("/save-receipt")
async def save_receipt(request: Request):
    """Save receipt data to Firebase."""
    try:
        data = await request.json()
        receipt_id = insert_data(data)
        if receipt_id:
            return {"status": "success", "receipt_id": receipt_id}
        return {"status": "error", "message": "Failed to save"}
    except Exception as e:
        logging.exception("save_receipt failed")
        return {"status": "error", "message": str(e)}


@app.post("/llm-receipt")
async def llm_receipt(req: Request):
    """
    Chat endpoint — LLM always accesses live Firebase receipts
    and responds to the user’s prompt.
    """
    try:
        body = await req.json()
        prompt = body.get("prompt", "")

        result = await call_llm_model(prompt)

        if isinstance(result, dict):
            reply = result.get("reply") or json.dumps(result)
        else:
            reply = str(result)

        return {"reply": reply}
    except Exception as e:
        logging.exception("llm_receipt failed")
        return {"reply": f"Error: {str(e)}"}
