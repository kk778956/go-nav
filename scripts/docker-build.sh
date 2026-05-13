#!/bin/sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-go-nav}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

echo "Built ${IMAGE_NAME}:${IMAGE_TAG}"
