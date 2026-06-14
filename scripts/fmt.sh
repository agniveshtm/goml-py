#!/bin/bash
set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file.goml> [file2.goml ...]"
    echo ""
    echo "Examples:"
    echo "  $0 config.goml"
    echo "  $0 *.goml"
    exit 1
fi

cd "$(dirname "$0")/.."

if [ ! -f bin/goml ]; then
    echo "Building CLI first..."
    go build -o bin/goml ./cmd/goml
fi

./bin/goml fmt "$@"
