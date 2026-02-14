# CD Pipeline Setup Guide

One-time setup steps to enable continuous deployment on the production host (lister).

## Prerequisites

- **podman** installed
- **Node.js** (via nvm) installed
- The rewards-app repository cloned and working
- A GitHub personal access token or runner registration token

## A. Create the environment file

The app needs a `JWT_SECRET` for authentication. This stays on lister and is never stored in GitHub.

```bash
mkdir -p ~/.config/rewards-app
echo 'JWT_SECRET=<actual-secret-value>' > ~/.config/rewards-app/env
chmod 600 ~/.config/rewards-app/env
```

## B. Install the GitHub Actions self-hosted runner

Register a self-hosted runner with the `lister` label so the deploy job targets this host.

```bash
mkdir ~/actions-runner && cd ~/actions-runner

# Download the latest runner package
# (Get the URL from: GitHub repo → Settings → Actions → Runners → New self-hosted runner)
curl -o actions-runner-linux-x64.tar.gz -L <download-url>
tar xzf actions-runner-linux-x64.tar.gz

# Configure the runner with the 'lister' label
./config.sh --url https://github.com/<owner>/<repo> --token <token> --labels lister
```

## C. Install systemd services

Enable user lingering so services run without an active login session, then install the service files.

```bash
# Enable lingering for the current user
sudo loginctl enable-linger $USER

# Create the systemd user directory
mkdir -p ~/.config/systemd/user

# Copy the template service files from the repo
cp systemd/rewards-app.service ~/.config/systemd/user/
cp systemd/github-runner.service ~/.config/systemd/user/

# Reload and enable both services
systemctl --user daemon-reload
systemctl --user enable --now github-runner
systemctl --user enable --now rewards-app
```

## D. Migrate from manual podman to systemd

If the app is currently running via a manually-started podman container, migrate to systemd management:

```bash
# Stop the existing manually-started container
podman stop rewards-app && podman rm rewards-app

# Start via systemd
systemctl --user start rewards-app

# Verify it's running
systemctl --user status rewards-app
curl -sk https://localhost:3000/api/health
```

## Useful commands

```bash
# Check service status
systemctl --user status rewards-app
systemctl --user status github-runner

# View app logs
podman logs -f rewards-app
journalctl --user -u rewards-app -f

# Restart the app
systemctl --user restart rewards-app

# View runner logs
journalctl --user -u github-runner -f
```

## How the CD pipeline works

1. A push to `master` triggers the CI workflow on GitHub-hosted runners (lint, audit, unit tests, build/scan, functional tests, UI tests).
2. After all CI jobs pass, the `deploy` job runs on the self-hosted runner (lister).
3. The deploy job checks out the code and runs `scripts/cd-deploy.sh`, which:
   - Tags the current running image as `rewards-app:rollback`
   - Builds a new image with the current version
   - Restarts the systemd service
   - Runs a health check
   - On failure: rolls back to the previous image and restarts

## Security notes

- CI jobs never run on lister — only the `deploy` job does, gated by branch and event conditions.
- `JWT_SECRET` stays on lister in a `chmod 600` file, never in GitHub Secrets or workflow logs.
- The `lister` runner label ensures only explicitly-targeted jobs execute on the production host.
