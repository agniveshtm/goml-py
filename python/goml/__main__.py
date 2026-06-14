"""CLI entry point: python -m goml file.goml"""

import sys
from pathlib import Path

from . import dumps, loads


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m goml <file.goml>", file=sys.stderr)
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(1)

    try:
        source = path.read_text(encoding="utf-8")
        data = loads(source)
        print(dumps(data))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
