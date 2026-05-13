#!/bin/sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
PUSH_LATEST="${PUSH_LATEST:-true}"

if [ -z "$IMAGE_NAME" ] || [ "$IMAGE_NAME" = "go-nav" ]; then
	echo "Set IMAGE_NAME to your Docker Hub repository, for example:"
	echo "  IMAGE_NAME=dengxiwang/go-nav IMAGE_TAG=0.1.0 pnpm docker:push"
	exit 1
fi

TAGS="-t ${IMAGE_NAME}:${IMAGE_TAG}"

if [ "$PUSH_LATEST" = "true" ] && [ "$IMAGE_TAG" != "latest" ]; then
	TAGS="$TAGS -t ${IMAGE_NAME}:latest"
fi

docker buildx build \
	--platform "$PLATFORMS" \
	$TAGS \
	--push \
	.
