
import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel

app = FastAPI(title="CRM Voice STT")

# Small multilingual model, CPU INT8
model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

@app.get("/health")
def health():
    return {"status": "ok", "model": "small"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing audio file")

    suffix = os.path.splitext(file.filename)[1] or ".webm"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp:
            temp.write(await file.read())
            temp_path = temp.name

        segments, info = model.transcribe(
            temp_path,
            beam_size=3,
            vad_filter=True
        )

        text = " ".join(segment.text.strip() for segment in segments)

        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
