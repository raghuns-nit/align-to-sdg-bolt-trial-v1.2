# Bolt import repository redirect

The duplicate CSV payload normally stored in this directory was omitted from the Bolt-import package only to satisfy Bolt's new-project size limit.

The byte-identical runtime CSVs are retained at:

`../../../../05_RUNTIME_REPOSITORIES/`

All 19 removed CSV copies were SHA-256 verified to match those retained files before packaging.

If reference tests/tools require the original `data/repository` path, run:

`node ../../../00_START_HERE/PREPARE_REFERENCE_RUNTIME_COPY.mjs`

from the package root, or execute that script using its package-relative path.
