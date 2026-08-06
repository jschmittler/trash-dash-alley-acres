#!/usr/bin/env python3
"""Build Jimothy's normalized private and public atlases.

The project already carries Sharp as its image toolchain dependency.  Keeping
the compositor in a small ESM module lets this script remain a convenient,
portable command for artists while avoiding a second Python imaging runtime.
"""

from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent
subprocess.run(["node", str(ROOT / "build-atlas.mjs")], check=True)
