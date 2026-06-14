#!/bin/bash
set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <schema.goml> <file.goml> [file2.goml ...]"
    echo ""
    echo "Examples:"
    echo "  $0 schema.goml config.goml"
    echo "  $0 schema.goml *.goml"
    exit 1
fi

SCHEMA=$1
shift
FILES="$@"

cd "$(dirname "$0")/.."

if [ ! -f bin/goml ]; then
    echo "Building CLI first..."
    go build -o bin/goml ./cmd/goml
fi

./bin/goml validate -s "$SCHEMA" $FILES
