#!/bin/bash
set -euo pipefail

# Install a trusted Let's Encrypt certificate (issued by Tailscale) for this
# host into the rewards-data volume, replacing the self-signed one.
#
# A trusted cert is required for the app to be installable as a PWA and for its
# service worker to register on iOS and Android.
#
# Prerequisites (one-time):
#   - HTTPS enabled for the tailnet: https://login.tailscale.com/admin/dns
#   - Permission to run `tailscale cert` (run as root, or once: sudo tailscale set --operator=$USER)
#
# Usage: ./scripts/tailscale-cert.sh [--no-restart]
# Re-run roughly every 60 days (certs last 90) or from a systemd timer / cron.

VOLUME_NAME="rewards-data"
SERVICE_NAME="rewards-app"
RESTART=1
[ "${1:-}" = "--no-restart" ] && RESTART=0

DOMAIN=$(tailscale status --json | grep -m1 '"DNSName"' | sed 's/.*"DNSName": *"\([^"]*\)".*/\1/' | sed 's/\.$//')
if [ -z "$DOMAIN" ]; then
  echo "FAIL: could not determine this machine's Tailscale DNS name"
  exit 1
fi
echo "Requesting certificate for ${DOMAIN}..."

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
tailscale cert --cert-file "${WORKDIR}/server.cert" --key-file "${WORKDIR}/server.key" "$DOMAIN"

VOLUME_DIR=$(podman volume inspect "$VOLUME_NAME" --format '{{.Mountpoint}}')
if [ -z "$VOLUME_DIR" ] || [ ! -d "$VOLUME_DIR" ]; then
  echo "FAIL: podman volume ${VOLUME_NAME} not found"
  exit 1
fi

# Keep the old self-signed pair so it can be restored if needed.
for f in server.cert server.key; do
  [ -f "${VOLUME_DIR}/${f}" ] && [ ! -f "${VOLUME_DIR}/${f}.selfsigned.bak" ] && cp "${VOLUME_DIR}/${f}" "${VOLUME_DIR}/${f}.selfsigned.bak"
done

install -m 644 "${WORKDIR}/server.cert" "${VOLUME_DIR}/server.cert"
install -m 600 "${WORKDIR}/server.key" "${VOLUME_DIR}/server.key"
echo "Installed certificate into ${VOLUME_DIR}"

if [ "$RESTART" -eq 1 ]; then
  systemctl --user restart "$SERVICE_NAME"
  echo "Restarted ${SERVICE_NAME}. Verify with: curl -s https://${DOMAIN}:3000/api/health"
else
  echo "Restart ${SERVICE_NAME} to pick up the new certificate."
fi
