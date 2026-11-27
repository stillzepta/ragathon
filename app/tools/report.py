"""Render due-diligence reports for download."""

import html
import re
from pathlib import Path
from urllib.parse import urlsplit


def render_markdown(title: str, body: str, citations: list[dict]) -> str:
    lines = []
    for item in citations:
        source = item["source"]
        try:
            parsed = urlsplit(source)
            if parsed.scheme not in {"https", "http"} or not parsed.hostname:
                source = item.get("locator") or "Uploaded document"
        except ValueError:
            source = item.get("locator") or "Source unavailable"
        lines.append(f"- [{item['id']}] {_markdown_text(item['title'])} ({_markdown_text(source)})")
    safe_body = "\n".join(
        line[:2] + _markdown_text(line[2:]) if line.startswith(("> ", "- ")) else line
        for line in body.splitlines()
    )
    sources = "\n".join(lines) or "- No sources were retrieved."
    return f"# {title}\n\n{safe_body}\n\n## Sources\n\n{sources}\n"



def _markdown_text(text: str) -> str:
    return re.sub(r"([\\`*_{}\[\]!])", r"\\\1", html.escape(" ".join(text.split())))


def write_markdown(path: str, title: str, body: str, citations: list[dict]) -> str:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_markdown(title, body, citations), encoding="utf-8")
    return str(output)



def render_pdf(title: str, body: str, citations: list[dict]) -> bytes:
    from io import BytesIO
    from xml.sax.saxutils import escape

    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    stream = BytesIO()
    styles = getSampleStyleSheet()
    blocks = [Paragraph(escape(title), styles["Title"])]
    sources = "\n".join(f"[{item['id']}] {item['title']} ({item['source']})" for item in citations)
    for line in (body + "\n\n## Sources\n\n" + sources).splitlines():
        if line.startswith("## "):
            blocks.append(Paragraph(escape(line[3:]), styles["Heading2"]))
        elif line.strip():
            blocks.append(Paragraph(escape(line.removeprefix("> ")), styles["BodyText"]))
        else:
            blocks.append(Spacer(1, 6))
    SimpleDocTemplate(stream, title=title).build(blocks)
    return stream.getvalue()
