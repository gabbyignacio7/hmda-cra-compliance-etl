#!/bin/bash
# =============================================================================
# Setup GitHub Labels
# =============================================================================
# Run this script once to create all the labels for your repository.
# 
# Usage:
#   ./scripts/setup-github-labels.sh
#
# Requires: GitHub CLI (gh) to be installed and authenticated
# =============================================================================

set -e

echo "🏷️  Setting up GitHub labels..."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "📋 Creating labels..."

# Priority labels
gh label create "priority: critical" --color "B60205" --description "Blocking issue" --force 2>/dev/null || true
gh label create "priority: high" --color "D93F0B" --description "Important" --force 2>/dev/null || true
gh label create "priority: medium" --color "FBCA04" --description "Normal priority" --force 2>/dev/null || true
gh label create "priority: low" --color "0E8A16" --description "Nice to have" --force 2>/dev/null || true

# Type labels
gh label create "type: bug" --color "D73A4A" --description "Something isn't working" --force 2>/dev/null || true
gh label create "type: feature" --color "0075CA" --description "New feature request" --force 2>/dev/null || true
gh label create "type: enhancement" --color "A2EEEF" --description "Improvement to existing" --force 2>/dev/null || true
gh label create "type: docs" --color "0075CA" --description "Documentation" --force 2>/dev/null || true
gh label create "type: refactor" --color "D4C5F9" --description "Code refactoring" --force 2>/dev/null || true
gh label create "type: security" --color "D93F0B" --description "Security related" --force 2>/dev/null || true

# Status labels
gh label create "status: ready" --color "0E8A16" --description "Ready for development" --force 2>/dev/null || true
gh label create "status: in-progress" --color "FBCA04" --description "Being worked on" --force 2>/dev/null || true
gh label create "status: blocked" --color "B60205" --description "Blocked by dependency" --force 2>/dev/null || true
gh label create "status: review" --color "1D76DB" --description "Ready for review" --force 2>/dev/null || true

# Area labels (specific to this project)
gh label create "area: etl" --color "C5DEF5" --description "ETL pipeline related" --force 2>/dev/null || true
gh label create "area: ui" --color "C5DEF5" --description "User interface" --force 2>/dev/null || true
gh label create "area: parser" --color "C5DEF5" --description "File parsing" --force 2>/dev/null || true
gh label create "area: export" --color "C5DEF5" --description "Export functionality" --force 2>/dev/null || true

# Special labels
gh label create "good first issue" --color "7057FF" --description "Good for newcomers" --force 2>/dev/null || true
gh label create "help wanted" --color "008672" --description "Extra attention needed" --force 2>/dev/null || true
gh label create "needs-triage" --color "EDEDED" --description "Needs review by maintainer" --force 2>/dev/null || true
gh label create "dependencies" --color "0366D6" --description "Dependency updates" --force 2>/dev/null || true
gh label create "automated" --color "BFDADC" --description "Created by automation" --force 2>/dev/null || true
gh label create "github-actions" --color "000000" --description "GitHub Actions related" --force 2>/dev/null || true

echo ""
echo "✅ Labels created successfully!"
echo ""
echo "View your labels at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/labels"
