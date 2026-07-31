#!/usr/bin/env python3
"""Generate a complete sitemap from the restored same-site public HTML routes."""

from __future__ import annotations

import pathlib
from xml.sax.saxutils import escape

PROJECT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC = PROJECT / "public"
BASE = "https://ailawyer.lawyer"


def route_for(file: pathlib.Path) -> str:
    relative = file.relative_to(PUBLIC).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def main() -> None:
    routes = sorted(route_for(path) for path in PUBLIC.rglob("*.html"))
    body = "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            *[
                "  <url><loc>"
                + escape(BASE + route)
                + "</loc><changefreq>monthly</changefreq></url>"
                for route in routes
            ],
            "</urlset>",
            "",
        ]
    )
    (PUBLIC / "sitemap.xml").write_text(body, encoding="utf-8")
    print(f"wrote {len(routes)} URLs")


if __name__ == "__main__":
    main()
