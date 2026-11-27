"""Report rendering helpers used by the API and future download endpoint."""

from pathlib import Path
from typing import Optional


def render_markdown(title: str, body: str, citations: list[dict]) -> str:
    sources = "\n".join(f"- [{item['title']}]({item['source']}) — {item['snippet']}" for item in citations)
    return f"# {title}\n\n{body}\n\n## Sources\n\n{sources or '- No external sources were available.'}\n"


def write_markdown(path: str, title: str, body: str, citations: list[dict]) -> str:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_markdown(title, body, citations), encoding="utf-8")
    return str(output)

