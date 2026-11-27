"""Read supported attachment formats within the demo's size limits."""

import csv
import io
import json
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
MAX_EXTRACTED_CHARS = 120_000


def extract_text(filename: str, data: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        try:
            pdf = PdfReader(io.BytesIO(data), strict=True)
        except PdfReadError as exc:
            raise ValueError("The PDF could not be read.") from exc
        if pdf.is_encrypted or len(pdf.pages) > 20:
            raise ValueError("Use an unencrypted PDF with at most 20 pages.")
        parts = []
        length = 0
        for page in pdf.pages:
            contents = page.get_contents()
            if contents and len(contents.get_data()) > MAX_UPLOAD_BYTES:
                raise ValueError("A PDF page exceeds the processing limit.")
            part = page.extract_text()
            length += len(part)
            if length > MAX_EXTRACTED_CHARS:
                raise ValueError("The extracted text is too long.")
            parts.append(part)
        text = "\n".join(parts)
    elif extension in {".txt", ".md", ".log", ".eml"}:
        text = data.decode("utf-8-sig")
    elif extension == ".csv":
        try:
            rows = csv.reader(io.StringIO(data.decode("utf-8-sig")), strict=True)
            text = "\n".join(" | ".join(row) for row in rows)
        except csv.Error as exc:
            raise ValueError("The CSV could not be read.") from exc
    elif extension == ".json":
        try:
            text = json.dumps(json.loads(data), ensure_ascii=False)
        except (ValueError, RecursionError) as exc:
            raise ValueError("The JSON could not be read.") from exc
    else:
        raise ValueError("Upload a PDF, CSV, JSON, or UTF-8 text file.")
    if not text.strip() or len(text) > MAX_EXTRACTED_CHARS:
        raise ValueError("The attachment must contain readable text within the processing limit.")
    return text
