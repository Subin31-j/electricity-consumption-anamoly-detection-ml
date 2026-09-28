"""Dataset upload flow endpoints."""
from __future__ import annotations

import io
import json

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.dataset import Dataset, DatasetSourceType, DatasetStatus
from app.models.user import User
from app.schemas.dataset import (
    DatasetPreviewRow,
    DatasetPublic,
    DatasetUploadResponse,
)
from app.services.activity import log_activity
from app.services.preprocessing import PreprocessingError, normalize_dataframe

router = APIRouter()

ALLOWED_EXTENSIONS = (".csv", ".xlsx", ".xls")
PREVIEW_LIMIT = 50


def _read_upload(file: UploadFile, content: bytes) -> pd.DataFrame:
    name = (file.filename or "").lower()
    if name.endswith(".csv"):
        try:
            return pd.read_csv(io.BytesIO(content))
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse CSV file: {exc}",
            )
    if name.endswith((".xlsx", ".xls")):
        try:
            return pd.read_excel(io.BytesIO(content))
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse Excel file: {exc}",
            )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported file type. Upload a CSV or Excel (.xlsx) file.",
    )


@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatasetUploadResponse:
    name = (file.filename or "").lower()
    if not name.endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a CSV or Excel (.xlsx) file.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The file is empty.")

    raw = _read_upload(file, content)

    try:
        clean_df, detected, warnings = normalize_dataframe(raw)
    except PreprocessingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    dataset = Dataset(
        user_id=current_user.id,
        name=file.filename or "uploaded_dataset",
        source_type=DatasetSourceType.UPLOAD,
        file_path=None,
        dataset_metadata=json.dumps(
            {
                "detected_columns": detected,
                "warnings": warnings,
                # Persist cleaned rows so analysis can reconstruct the dataframe.
                "rows": [
                    {
                        "timestamp": row["timestamp"].isoformat(),
                        "consumption_kwh": float(row["consumption_kwh"]),
                    }
                    for _, row in clean_df.iterrows()
                ],
            }
        ),
        record_count=len(clean_df),
        status=DatasetStatus.VALIDATED,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    log_activity(
        db,
        action="dataset_uploaded",
        user_id=current_user.id,
        entity_type="dataset",
        entity_id=dataset.id,
        metadata={"record_count": dataset.record_count},
    )

    preview_df = clean_df.head(PREVIEW_LIMIT)
    preview = [
        DatasetPreviewRow(
            timestamp=row["timestamp"].isoformat(),
            date=str(row["date"]),
            time=str(row["time"]),
            consumption_kwh=float(row["consumption_kwh"]),
        )
        for _, row in preview_df.iterrows()
    ]

    return DatasetUploadResponse(
        dataset=DatasetPublic.model_validate(dataset),
        detected_columns=detected,
        record_count=len(clean_df),
        preview=preview,
        warnings=warnings,
    )
