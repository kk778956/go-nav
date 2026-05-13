#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
DEFAULT_DATA_DIR="/app/default-data"

mkdir -p "$DATA_DIR/uploads"

if [ -f "$DEFAULT_DATA_DIR/nav.json" ] && [ ! -f "$DATA_DIR/nav.json" ]; then
	cp "$DEFAULT_DATA_DIR/nav.json" "$DATA_DIR/nav.json"
fi

if [ -f "$DEFAULT_DATA_DIR/website.json" ] && [ ! -f "$DATA_DIR/website.json" ]; then
	cp "$DEFAULT_DATA_DIR/website.json" "$DATA_DIR/website.json"
fi

if [ -d "$DEFAULT_DATA_DIR/uploads" ] && [ -z "$(find "$DATA_DIR/uploads" -mindepth 1 ! -name .gitkeep -print -quit)" ]; then
	cp -R "$DEFAULT_DATA_DIR/uploads/." "$DATA_DIR/uploads/"
fi

exec "$@"
