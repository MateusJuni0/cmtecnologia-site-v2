#!/usr/bin/env bash
# Deploy cmtecnologia.pt to the VPS.
#
# The GHCR image is private and the VPS has no read:packages credential, so we
# ship the image as a CI artifact tarball instead of `docker pull`. The CI
# workflow (deploy.yml) builds the image AND uploads it as `cmtec-site-image`.
# This script grabs the latest completed build for the current branch, sends it
# to the VPS, and reloads the container. One command, no GHCR auth needed.
#
# Usage:  ./scripts/deploy-vps.sh
# Pre:    push your commit first and let CI finish the build.
# (If the image is ever made public, replace this with: ssh VPS
#  'cd /opt/cmtec-site && docker compose pull && docker compose up -d')
set -euo pipefail

IMAGE_ARTIFACT=cmtec-site-image
VPS=root@72.60.88.137
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "→ Finding latest completed build for branch '$BRANCH'..."
RUN_ID=$(gh run list --workflow=deploy.yml --branch "$BRANCH" --limit 1 \
  --json databaseId,status,conclusion \
  --jq '.[0] | select(.status=="completed" and .conclusion=="success") | .databaseId')
[ -z "${RUN_ID:-}" ] && { echo "✗ No successful build found. Push first and wait for CI."; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "→ Downloading image artifact from run $RUN_ID..."
gh run download "$RUN_ID" -n "$IMAGE_ARTIFACT" -D "$TMP"

echo "→ Uploading to VPS..."
scp "$TMP/cmtec-site-image.tar.gz" "$VPS:/tmp/cmtec-site-image.tar.gz"

echo "→ Loading image + restarting container..."
ssh "$VPS" 'set -e
  docker load -i /tmp/cmtec-site-image.tar.gz
  cd /opt/cmtec-site && docker compose up -d
  rm -f /tmp/cmtec-site-image.tar.gz
  sleep 3
  curl -sf localhost:3002/healthz && echo " ✓ healthz OK"'

echo "✓ Deployed. Verify: https://cmtecnologia.pt/healthz"
