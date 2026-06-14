#!/bin/bash
set -e

echo "Running linter..."

cd "$(dirname "$0")/.."

echo "=== Go Vet ==="
go vet ./...

echo ""
echo "=== Go Lint ==="
if command -v golangci-lint &> /dev/null; then
    golangci-lint run
else
    echo "golangci-lint not found, skipping"
fi

echo ""
echo "=== Format Check ==="
GOFMT_OUTPUT=$(gofmt -l .)
if [ -n "$GOFMT_OUTPUT" ]; then
    echo "Files need formatting:"
    echo "$GOFMT_OUTPUT"
    exit 1
fi

echo ""
echo "=== Lint Examples ==="
if [ -f bin/goml ]; then
    ./bin/goml lint examples/*.goml
else
    echo "CLI not built, skipping goml lint"
fi

echo ""
echo "All checks passed!"
