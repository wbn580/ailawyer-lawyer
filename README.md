# AILawyer source recovery

This static Astro project preserves the public English and Chinese site captured
from `ailawyer.lawyer` on 2026-07-30.

The recovery is reproducible with `scripts/restore_public_snapshot.py`. The
script reads the immutable same-site evidence batch recorded in
`source-recovery-receipt.json`, restores missing files only, and refuses to
overwrite any different existing file.

Build with `npm ci --no-audit --no-fund` followed by `npm run build`.
