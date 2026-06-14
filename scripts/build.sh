#!/bin/bash
set -e

echo "Building goml CLI..."

cd "$(dirname "$0")/.."

go build -o bin/goml ./cmd/goml

echo "Built: bin/goml"
echo "Run: ./bin/goml --help"
