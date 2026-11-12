#!/usr/bin/env sh
# Runs `playwright test` inside the official Playwright Docker image, so the browsers and their system dependencies do not
# have to be installed. The image tag follows the installed @playwright/test version.
# The container uses the host network (Linux only), so it can reach the app on localhost, e.g. in CI.
#
# Usage: tools/playwright-docker.sh --project=frontend --shard=1/5
set -eu

VERSION=$(node -p "require('./node_modules/@playwright/test/package.json').version")

exec docker run --rm --init --ipc=host --network host \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e CI -e APP_URL -e TZ \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${VERSION}-noble" \
  npx playwright test "$@"
