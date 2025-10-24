#!/bin/bash
# Start GitHub MCP Server with environment variables from .env

# Load environment variables from .env if it exists
if [ -f .env ]; then
  # Use set -a to automatically export all variables from .env
  set -a
  source .env
  set +a
fi

# Validate that GITHUB_PERSONAL_ACCESS_TOKEN is set
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN is not set" >&2
  echo "Please set it in your .env file or as an environment variable" >&2
  exit 1
fi

# Start the GitHub MCP server
exec npx -y @modelcontextprotocol/server-github

