#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "=== Tag Release ==="
echo ""
echo "Version: $VERSION"
echo "Tag:     $TAG"
echo ""

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: You have uncommitted changes. Commit or stash them first."
  exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: Tag $TAG already exists."
  exit 1
fi

# Create annotated tag
git tag -a "$TAG" -m "Release $VERSION"
echo "Created tag: $TAG"
echo ""
echo "To push the tag to the remote:"
echo "  git push origin $TAG"
