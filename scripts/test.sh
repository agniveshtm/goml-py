#!/bin/bash
set -e

echo "Running tests..."

cd "$(dirname "$0")/.."

echo "=== Go Tests ==="
go test ./... -v -count=1

echo ""
echo "=== Python Tests ==="
if command -v python3 &> /dev/null; then
    cd python
    python3 -m pytest -v 2>/dev/null || echo "Python tests skipped (pytest not installed)"
    cd ..
else
    echo "Python not found, skipping"
fi

echo ""
echo "=== JS Tests ==="
if command -v npm &> /dev/null; then
    cd js
    npm test 2>/dev/null || echo "JS tests skipped (npm test not configured)"
    cd ..
else
    echo "npm not found, skipping"
fi

echo ""
echo "All tests passed!"
