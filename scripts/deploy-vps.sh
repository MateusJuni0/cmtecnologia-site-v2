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
HEAD_SHA=$(git rev-parse HEAD)

echo "→ Finding latest completed build for branch '$BRANCH'..."
RUN_ID=$(gh run list --workflow=deploy.yml --branch "$BRANCH" --commit "$HEAD_SHA" --limit 1 \
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
ssh "$VPS" "DEPLOY_SHA=$HEAD_SHA bash -s" <<'REMOTE'
set -e
IMAGE_BASE=ghcr.io/mateusjuni0/cmtecnologia-site-v2
cd /opt/cmtec-site
cp docker-compose.yml docker-compose.yml.rollback

  CURRENT_IMAGE=$(docker inspect cmtec-site --format="{{.Image}}" 2>/dev/null || true)
  if [ -n "$CURRENT_IMAGE" ]; then
    docker image tag "$CURRENT_IMAGE" "$IMAGE_BASE:rollback"
  fi

  docker load -i /tmp/cmtec-site-image.tar.gz
  docker image tag "$IMAGE_BASE:latest" "$IMAGE_BASE:$DEPLOY_SHA"
  sed -i -E "s#image: ${IMAGE_BASE}:[^[:space:]]+#image: ${IMAGE_BASE}:${DEPLOY_SHA}#" docker-compose.yml

  if ! docker compose config -q; then
    cp docker-compose.yml.rollback docker-compose.yml
    echo "Compose validation failed; restored the previous configuration."
    exit 1
  fi

  docker compose up -d --force-recreate
  rm -f /tmp/cmtec-site-image.tar.gz
  sleep 3
  if ! curl -sf localhost:3002/healthz; then
    echo "Health check failed; rolling back the previous image."
    cp docker-compose.yml.rollback docker-compose.yml
    docker compose up -d --force-recreate
    sleep 3
    curl -sf localhost:3002/healthz
    exit 1
  fi
  echo " ✓ healthz OK"
REMOTE

echo "→ Notifying IndexNow from the canonical sitemap..."
if npm run submit:indexnow; then
  echo "✓ IndexNow accepted the release URLs."
else
  echo "⚠ IndexNow notification failed; production remains healthy. Retry: npm run submit:indexnow"
fi

echo "✓ Deployed. Verify: https://cmtecnologia.pt/healthz"
