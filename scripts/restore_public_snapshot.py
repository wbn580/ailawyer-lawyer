#!/usr/bin/env python3
"""Restore the captured same-site public tree without overwriting different files."""

from __future__ import annotations

import hashlib
import json
import pathlib
import zipfile

PROJECT = pathlib.Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT.parents[1]
BATCH = (
    WORKSPACE
    / "scraped-data"
    / "ailawyer-lawyer-full-live"
    / "20260730-0154"
)
ARCHIVE = BATCH / "raw" / "site.zip"
DESTINATION = PROJECT / "public"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    restored = []
    with zipfile.ZipFile(ARCHIVE) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            relative = pathlib.PurePosixPath(info.filename)
            if relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError(f"Unsafe archive path: {info.filename}")
            target = DESTINATION.joinpath(*relative.parts)
            data = archive.read(info)
            if relative.as_posix() in {"sitemap.xml", "assets/app.css"} and target.exists():
                restored.append(
                    {
                        "path": target.relative_to(PROJECT).as_posix(),
                        "bytes": target.stat().st_size,
                        "sha256": digest(target.read_bytes()),
                        "state": "derived-preserved",
                    }
                )
                continue
            if target.exists():
                current = target.read_bytes()
                if current != data:
                    raise RuntimeError(
                        f"Refusing to overwrite different existing file: {target}"
                    )
                state = "identical"
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                state = "restored"
            restored.append(
                {
                    "path": target.relative_to(PROJECT).as_posix(),
                    "bytes": len(data),
                    "sha256": digest(data),
                    "state": state,
                }
            )
    receipt = PROJECT / "source-recovery-receipt.json"
    receipt.write_text(
        json.dumps(
            {
                "evidence_batch": str(BATCH.relative_to(WORKSPACE)),
                "policy": "missing-only; refuse different existing files",
                "files": restored,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "files": len(restored),
                "restored": sum(row["state"] == "restored" for row in restored),
                "identical": sum(row["state"] == "identical" for row in restored),
                "derived_preserved": sum(
                    row["state"] == "derived-preserved" for row in restored
                ),
            }
        )
    )


if __name__ == "__main__":
    main()
