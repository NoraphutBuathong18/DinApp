import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from config import STORAGE_DIR

router = APIRouter()


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file and store it in the storage directory."""
    # Validate file type
    allowed_extensions = {".csv", ".xlsx", ".xls"}
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    # Save file
    file_path = os.path.join(STORAGE_DIR, file.filename)
    contents = await file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    # Quick metadata
    file_size = len(contents)

    return {
        "filename": file.filename,
        "size_bytes": file_size,
        "message": f"File '{file.filename}' uploaded successfully.",
    }
