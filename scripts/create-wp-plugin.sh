#!/bin/bash
set -euo pipefail

SCRIPT_NAME="$0"
SCRIPT_LABEL="Build Plugin Scaffolding"
SCRIPT_DESCRIPTION="Creates the scaffolding for a new WordPress plugin"
SCRIPT_USAGE="$SCRIPT_NAME plugin_slug plugin_name"

echo "----------------------------------------------------------------------------"
echo "$SCRIPT_LABEL"
echo
echo $SCRIPT_DESCRIPTION
echo "----------------------------------------------------------------------------"
echo

# Insert common files
SHARED_SCRIPT_DIR="/home/alwaysvw.net/scripts"

# Config variables
. $SHARED_SCRIPT_DIR/bash_config_values.sh

# Traps and validator functions
. $SHARED_SCRIPT_DIR/bash_function_library.sh

# Validate command line arguments
REQUIRE_INFO="USAGE: $SCRIPT_USAGE plugin_slug plugin_name plugin_description"
PLUGIN_SLUG=$(require "Plugin Slug" "${1:-}" "$REQUIRE_INFO")
PLUGIN_NAME=$(require "Plugin Name" "${2:-}" "$REQUIRE_INFO")
PLUGIN_DESCRIPTION=$(require "Plugin Description" "${3:-}" "$REQUIRE_INFO")

step "Completed command line validation"

# ----------------------------------------------------------------------------
step "Ensure PLUGIN_SLUG has the namespace prefix"
# ----------------------------------------------------------------------------

RESULT=$(validate_pattern "$PLUGIN_SLUG" '^${WP_NAMESPACE_PREFIX}_', "false")
if [ "$RESULT" = "no_match" ]; then
    PLUGIN_SLUG="${WP_NAMESPACE_PREFIX}_${PLUGIN_SLUG}"
fi

step "Completed namespace prefix validation"

# ----------------------------------------------------------------------------
step "Prevent overwriting an existing plugin"
# ----------------------------------------------------------------------------

PLUGIN_DIR="$WP_PLUGINS/$PLUGIN_SLUG"

if [ -d "$PLUGIN_DIR" ]; then
    echo
    echo "Found existing plugin directory at: $PLUGIN_DIR"
    echo
    exit 1
fi

step "Completed check for existing plugin directory"

# ----------------------------------------------------------------------------
step "Create plugin directory structure"
# ----------------------------------------------------------------------------

mkdir -p "$PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR/blocks"
mkdir -p "$PLUGIN_DIR/build"
mkdir -p "$PLUGIN_DIR/includes"
mkdir -p "$PLUGIN_DIR/assets"

step "Created plugin directory structure"

# ----------------------------------------------------------------------------
step "Shared PHP block-discovery logic (single source of truth)"
# ----------------------------------------------------------------------------

BLOCK_DISCOVERY_PHP="\$block_json_files = glob( \$blocks_dir . 'gk_*/block.json' );"

step "Created shared PHP block-discovery logic"

# ----------------------------------------------------------------------------
step "Create plugin bootstrap file"
# ----------------------------------------------------------------------------

cat <<'EOF' > "$PLUGIN_DIR/$PLUGIN_SLUG.php"
<?php
/**
 * Plugin Name: __PLUGIN_NAME__
 * Description: __PLUGIN_DESCRIPTION__
 * Author: __PLUGIN_AUTHOR__
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Automatically register all blocks that have a block.json file.
 * This keeps your PHP in sync with your creation scripts.
 */
function gkd_register_dynamic_blocks() {
    // Path to your blocks directory
    $blocks_dir = plugin_dir_path( __FILE__ );

    // Use a glob to find every block.json inside your gk_ folders
    __BLOCK_DISCOVERY_PHP__

    foreach ( $block_json_files as $file ) {
        // Register the block using the metadata file
        // register_block_type automatically handles scripts, styles, and render callbacks
        register_block_type( dirname( $file ) );
    }
}

add_action( 'init', 'gkd_register_dynamic_blocks' );
EOF

sed -i "s|__PLUGIN_NAME__|$PLUGIN_NAME|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__PLUGIN_DESCRIPTION__|$PLUGIN_DESCRIPTION|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__PLUGIN_AUTHOR__|$WP_USER|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__BLOCK_DISCOVERY_PHP__|$BLOCK_DISCOVERY_PHP|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"

step "Created plugin bootstrap file"

# ----------------------------------------------------------------------------
step "Create diagnostic script (mirrors plugin logic exactly)"
# ----------------------------------------------------------------------------

cat <<'EOF' > "$PLUGIN_DIR/debug-blocks.php"
<?php
/**
 * Standalone diagnostic script to find block.json files
 */

// Get the directory where this script is located
$blocks_dir = __DIR__ . '/blocks/';
$src_dir = __DIR__ . '/src/';
$build_dir = __DIR__ . '/build/';

// Same glob logic as in the plugin registration script
__BLOCK_DISCOVERY_PHP__

// Informational: Also find block.json files in src and build
$src_json_files = glob( $src_dir . 'gk_*/block.json' );
$build_json_files = glob( $build_dir . 'gk_*/block.json' );

echo PHP_EOL . 'BLOCKS DIR: ' . $blocks_dir . PHP_EOL;
$found=0;
foreach ($block_json_files as $file) {
    echo '    register block: ' . $file . PHP_EOL;
    $found=1;
}

if ($found == 0) {
  echo "    NO BLOCKS FOUND: Nothing will be registered." . PHP_EOL;
}

echo PHP_EOL . PHP_EOL . 'BUILD DIR: ' . $build_dir . PHP_EOL;
$found=0;
foreach ($build_json_files as $file) {
    echo './src/blocks: ' . $file . PHP_EOL;
    $found=1;
}

if ($found == 0) {
  echo "    No block.json found in ./build/blocks."  . PHP_EOL;
}

echo PHP_EOL . PHP_EOL . 'SRC DIR: ' . $src_dir . PHP_EOL;
$found=0;
foreach ($src_json_files as $file) {
    echo './build/blocks: ' . $file . PHP_EOL;
    $found=1;
}
if ($found == 0) {
  echo "    No block.json found in ./src/blocks." . PHP_EOL;
}

echo PHP_EOL;
EOF

sed -i "s|__BLOCK_DISCOVERY_PHP__|$BLOCK_DISCOVERY_PHP|" "$PLUGIN_DIR/debug-blocks.php"

step "Created block discovery diagnostic script"

# ----------------------------------------------------------------------------
step "Create package.json for shared build system"
# ----------------------------------------------------------------------------

cat > "$PLUGIN_DIR/package.json" <<EOF
{
  "name": "$PLUGIN_SLUG",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start"
  },
  "devDependencies": {
    "@wordpress/scripts": "^27.0.0"
  }
}
EOF

step "Created package.json"

# ----------------------------------------------------------------------------
step "Create webpack.config.js"
# ----------------------------------------------------------------------------

cat > "$PLUGIN_DIR/webpack.config.js" <<'EOF'
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const glob = require( 'glob' );

module.exports = {
    ...defaultConfig,
    entry: () => {
        const entries = {};
        const files = glob.sync( './src/blocks/*/index.jsx' );

        files.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ name ] = file;
        });

        return entries;
    },
    output: {
        path: path.resolve( process.cwd(), 'build' ),
        filename: '[name]/index.js',
    },
};
EOF

step "Created webpack.config.js"

# ----------------------------------------------------------------------------
step "Install JavaScript build dependencies"
# ----------------------------------------------------------------------------

step "Ensuring that nmp is installed"

cd "$PLUGIN_DIR"

if ! command -v npm >/dev/null 2>&1; then
    step "Error: npm is not installed or not in PATH."
    exit 1
fi

step "Installing JavaScript build dependencies..."
npm install

step "JavaScript build dependencies complete."

# ----------------------------------------------------------------------------
step "Running initial build"
# ----------------------------------------------------------------------------

npm run build

chown -R "$WP_USER":"$WP_USER" "$PLUGIN_DIR"
chmod -R 775 "$PLUGIN_DIR"


step "Initial build complete"

echo
echo "----------------------------------------------------------------------------"
echo "$SCRIPT_NAME successfully completed"
echo "----------------------------------------------------------------------------"
echo