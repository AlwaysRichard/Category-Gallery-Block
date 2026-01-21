#!/usr/bin/env bash
set -euo pipefail

LAST_STEP="Script started"
trap 'echo "❌ Script failed at: $LAST_STEP"' ERR

step() {
    LAST_STEP="$1"
    echo "→ $LAST_STEP"
}

step "Begin creating wordpress plugin"

# ------------------------------------------------------------
# Load configuration from wp-plugin-config.json
# ------------------------------------------------------------
SCRIPT_DIR="."
CONFIG_FILE="$SCRIPT_DIR/wp-plugin-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    step "Error: $CONFIG_FILE not found in current directory."
    exit 1
fi

WP_PLUGINS_DIR=$(jq -r '.wp_plugins' "$CONFIG_FILE")
BLOCK_NAMESPACE_PREFIX=$(jq -r '.block_namespace_prefix' "$CONFIG_FILE")
WP_USER=$(jq -r '.wp_user' "$CONFIG_FILE")

if [ -z "$WP_PLUGINS_DIR" ] || [ "$WP_PLUGINS_DIR" = "null" ]; then
    step "Error: wp_plugins not defined in $CONFIG_FILE"
    exit 1
fi

if [ -z "$BLOCK_NAMESPACE_PREFIX" ] || [ "$BLOCK_NAMESPACE_PREFIX" = "null" ]; then
    step "Error: block_namespace_prefix not defined in $CONFIG_FILE"
    exit 1
fi

# ----------------------------------------
# CLI arguments
# ----------------------------------------
if [[ $# -lt 4 ]]; then
  echo "Usage:"
  step "create-wp-block.sh plugin_slug block_slug \"Block Title\" \"Block Description\""
  exit 1
fi

PLUGIN_SLUG="$1"
BLOCK_SLUG="$2"
BLOCK_TITLE="$3"
BLOCK_DESCRIPTION="$4"

# Normalize and ensure prefix
BLOCK_SLUG=$(echo "$BLOCK_SLUG" | tr '[:upper:]' '[:lower:]')
BLOCK_NAMESPACE_PREFIX=$(echo "$BLOCK_NAMESPACE_PREFIX" | tr '[:upper:]' '[:lower:]')

[[ "$PLUGIN_SLUG" != "${BLOCK_NAMESPACE_PREFIX}_"* ]] && PLUGIN_SLUG="${BLOCK_NAMESPACE_PREFIX}_${PLUGIN_SLUG}"
[[ "$BLOCK_SLUG" != "${BLOCK_NAMESPACE_PREFIX}_"* ]] && BLOCK_SLUG="${BLOCK_NAMESPACE_PREFIX}_${BLOCK_SLUG}"

step "Validated block name:  $BLOCK_SLUG"
PLUGIN_DIR="$WP_PLUGINS_DIR/$PLUGIN_SLUG"
BLOCK_DIR="$PLUGIN_DIR/blocks/$BLOCK_SLUG"
SRC_BLOCK_DIR="$PLUGIN_DIR/src/blocks/$BLOCK_SLUG"
BUILD_BLOCK_DIR="$PLUGIN_DIR/build/blocks/$BLOCK_SLUG"

# ----------------------------------------
# Safety checks
# ----------------------------------------

if [[ ! -d "$PLUGIN_DIR" ]]; then
  step "Error: Plugin directory not found at $PLUGIN_DIR"
  exit 1
fi

EXISTING_DIRS=()
EXISTING_FILES=()

while IFS= read -r dir; do
    EXISTING_DIRS+=("$dir")
done < <(find "${PLUGIN_DIR}/blocks" -maxdepth 1 -type d -name "${BLOCK_SLUG}*" ! -name ".")

[[ -d "$BLOCK_DIR" ]] && EXISTING_DIRS+=("$BLOCK_DIR")
[[ -d "$SRC_BLOCK_DIR" ]] && EXISTING_DIRS+=("$SRC_BLOCK_DIR")
[[ -d "$BUILD_BLOCK_DIR" ]] && EXISTING_DIRS+=("$BUILD_BLOCK_DIR")

EXISTING_DIRS=($(printf "%s\n" "${EXISTING_DIRS[@]}" | sort -u))

[[ -f "$BLOCK_DIR/block.json" ]] && EXISTING_FILES+=("$BLOCK_DIR/block.json")
[[ -f "$BLOCK_DIR/index.php" ]] && EXISTING_FILES+=("$BLOCK_DIR/index.php")
[[ -f "$SRC_BLOCK_DIR/index.jsx" ]] && EXISTING_FILES+=("$SRC_BLOCK_DIR/index.jsx")

if (( ${#EXISTING_DIRS[@]} > 0 )); then
  echo ""
  step "Error: Block $BLOCK_SLUG already exists."
  echo ""

  echo "Existing Directories:"
  for dir in "${EXISTING_DIRS[@]}"; do
    echo "  $dir"
  done

  if (( ${#EXISTING_FILES[@]} > 0 )); then
    echo ""
    echo "Files found:"
    for file in "${EXISTING_FILES[@]}"; do
      echo "  $file"
    done
  fi

  echo ""
  step "Aborting to avoid overwriting an existing or partially deleted block."
  echo ""
  exit 1
fi

# ----------------------------------------
# Create directories
# ----------------------------------------

mkdir -p "$BLOCK_DIR" "$SRC_BLOCK_DIR"

# ----------------------------------------
# block.json
# ----------------------------------------
cat > "$BLOCK_DIR/block.json" <<EOF
{
  "apiVersion": 3,
  "name": "$BLOCK_NAMESPACE_PREFIX/$BLOCK_SLUG",
  "title": "$BLOCK_TITLE",
  "category": "widgets",
  "icon": "screenoptions",
  "description": "$BLOCK_DESCRIPTION",
  "editorScript": "file:../../build/$BLOCK_SLUG/index.js",
  "render": "file:./index.php"
}
EOF

# ----------------------------------------
# index.php (Optional: Custom Render Logic)
# ----------------------------------------
# Note: Blocks can use the shared BlockRenderer.php from the three-layer
# architecture by NOT including index.php. If you need custom rendering
# for this specific block, create index.php. Otherwise, delete it.
# ----------------------------------------
cat > "$BLOCK_DIR/index.php" <<EOF
<?php
/**
 * Optional Custom Render Logic for this Block
 *
 * If this file exists, it overrides the shared BlockRenderer.php.
 * Delete this file to use the shared renderer instead.
 *
 * Variables available: \$attributes, \$content, \$block
 */
defined( 'ABSPATH' ) || exit;

// Option 1: Include a template file for HTML output
include __DIR__ . '/template.php';

// Option 2: Use the shared renderer (uncomment below, delete template.php)
// global \$plugin_renderer; // Set in Scaffolding.php
// if ( \$plugin_renderer ) {
//     return \$plugin_renderer->render( \$attributes );
// }
EOF

# ----------------------------------------
# template.php (The View)
# ----------------------------------------
cat > "$BLOCK_DIR/template.php" <<EOF
<?php
/**
 * Block Template - HTML Output
 *
 * This file is only needed if you're using custom rendering (index.php).
 * If using the shared BlockRenderer.php, delete this file.
 */
defined( 'ABSPATH' ) || exit;
?>
<div class="wp-block-$BLOCK_NAMESPACE_PREFIX-$BLOCK_SLUG">
    <p><strong>$BLOCK_TITLE:</strong> View output.</p>
    <p><em>Tip: Delete index.php and template.php to use the shared renderer.</em></p>
</div>
EOF

# ----------------------------------------
# src/blocks/index.jsx (Editor View) - Replacement
# ----------------------------------------
cat > "$SRC_BLOCK_DIR/index.jsx" <<EOF
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('$BLOCK_NAMESPACE_PREFIX/$BLOCK_SLUG', {
    edit() {
        return (
            <div className="${BLOCK_SLUG}-editor">
                ${BLOCK_TITLE} (Editor View)
            </div>
        );
    },
    save() { return null; },
});
EOF

echo "✓ Block '$BLOCK_SLUG' generated successfully."

# Build eliminated