#!/bin/bash
set -e

VERSION=${1:-"0.1.0"}

echo "Building release v${VERSION}..."

cd "$(dirname "$0")/.."

echo "=== Running tests ==="
bash scripts/test.sh

echo ""
echo "=== Building binaries ==="

# Build for multiple platforms
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
)

rm -rf dist
mkdir -p dist

for platform in "${PLATFORMS[@]}"; do
    GOOS=${platform%/*}
    GOARCH=${platform#*/}

    output="dist/goml-${VERSION}-${GOOS}-${GOARCH}"
    if [ "$GOOS" = "windows" ]; then
        output="${output}.exe"
    fi

    echo "Building ${GOOS}/${GOARCH}..."
    GOOS=$GOOS GOARCH=$GOARCH go build -o "$output" ./cmd/goml
done

echo ""
echo "=== Release binaries ==="
ls -lh dist/

echo ""
echo "Release v${VERSION} built successfully!"
echo "Binaries in: dist/"
