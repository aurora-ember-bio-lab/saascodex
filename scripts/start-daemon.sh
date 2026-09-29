#!/usr/bin/env sh
# Production start for the SaaSCodex/SplatStudio daemon.
#
# Optionally installs a code-agent runtime so hosted chat/generation has a CLI
# to spawn. Set SPLATSTUDIO_AGENT_CLI to an npm package (e.g.
# @anthropic-ai/claude-code or opencode-ai) plus the provider key env
# (ANTHROPIC_API_KEY, OPENAI_API_KEY, ...). No-op when unset.
#
# See docs/DEPLOYMENT.md → "Hosted runtime".

if [ -n "$SPLATSTUDIO_AGENT_CLI" ]; then
  echo "[start] installing agent runtime: $SPLATSTUDIO_AGENT_CLI"
  npm install -g "$SPLATSTUDIO_AGENT_CLI" || echo "[start] agent runtime install failed (continuing)"
else
  echo "[start] SPLATSTUDIO_AGENT_CLI not set; no agent runtime installed"
fi

exec node apps/daemon/dist/cli.js --no-open --host 0.0.0.0 --port "${PORT:-7456}"
