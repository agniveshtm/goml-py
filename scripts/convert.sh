#!/bin/bash
set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <from_format> <file> [to_format]"
    echo ""
    echo "Formats: goml, json, yaml, toml"
    echo ""
    echo "Examples:"
    echo "  $0 json config.json"
    echo "  $0 json config.json goml"
    echo "  $0 goml config.goml json"
    exit 1
fi

FROM=$1
FILE=$2
TO=${3:-goml}

cd "$(dirname "$0")/.."

if [ ! -f bin/goml ]; then
    echo "Building CLI first..."
    go build -o bin/goml ./cmd/goml
fi

./bin/goml convert -f "$FROM" -t "$TO" "$FILE"
