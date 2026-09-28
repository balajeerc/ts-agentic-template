#!/usr/bin/env bash
#
# Installs the pinned gitleaks binary into ./.tools (gitignored).
#
# gitleaks is a Go binary with no npm package, so it cannot be a devDependency.
# What it can be is pinned and checksum-verified, which is the part that
# matters: the alternative people reach for is `curl | sh` against a moving
# `latest`, and that is a different binary every time nobody is looking.
#
# To upgrade: bump VERSION, run once, and the mismatch error prints the digest
# it actually got. Verify that against the release's checksums.txt before
# pasting it into SHA256.
set -euo pipefail

VERSION="8.30.1"
SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.tools"
BINARY="${TOOLS_DIR}/gitleaks"
ARCHIVE="gitleaks_${VERSION}_linux_x64.tar.gz"
URL="https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${ARCHIVE}"

if [ -x "${BINARY}" ] && "${BINARY}" version 2>/dev/null | grep -q "${VERSION}"; then
  echo "gitleaks ${VERSION} already installed at ${BINARY}"
  exit 0
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

echo "Downloading gitleaks ${VERSION}..."
curl -fsSL "${URL}" -o "${WORK_DIR}/${ARCHIVE}"

ACTUAL="$(sha256sum "${WORK_DIR}/${ARCHIVE}" | cut -d' ' -f1)"
if [ "${ACTUAL}" != "${SHA256}" ]; then
  echo "Checksum mismatch for ${ARCHIVE}" >&2
  echo "  expected: ${SHA256}" >&2
  echo "  actual:   ${ACTUAL}" >&2
  echo "Refusing to install." >&2
  exit 1
fi

mkdir -p "${TOOLS_DIR}"
tar -xzf "${WORK_DIR}/${ARCHIVE}" -C "${WORK_DIR}" gitleaks
mv "${WORK_DIR}/gitleaks" "${BINARY}"
chmod +x "${BINARY}"

echo "Installed $("${BINARY}" version) to ${BINARY}"
