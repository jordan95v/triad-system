#!/usr/bin/env bash
set -euo pipefail

uv run python manage.py expire_reservations "$@"