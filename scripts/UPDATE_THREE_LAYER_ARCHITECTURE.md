# Update Guide: Three-Layer Architecture for WordPress Plugin Scaffolding

## Overview

This document outlines the changes required to update the WordPress plugin scaffolding scripts (`create-wp-plugin.sh` and `create-wp-block.sh`) to generate plugins using the clean three-layer architecture pattern.

## Architecture Pattern Summary

The three-layer architecture separates concerns into:

1. **Layer 1 - Engine** (`src/Engine.php`): Pure business logic, framework-agnostic
2. **Layer 2 - BlockRenderer** (`src/BlockRenderer.php`): Thin adapter between blocks and engine
3. **Layer 3 - Scaffolding** (`Scaffolding.php`): WordPress integration layer

---

## Changes to `create-wp-plugin.sh`

### 1. Directory Structure

**BEFORE:**
```bash
mkdir -p "$PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR/blocks"
mkdir -p "$PLUGIN_DIR/build"
mkdir -p "$PLUGIN_DIR/includes"
mkdir -p "$PLUGIN_DIR/assets"
```

**AFTER:**
```bash
mkdir -p "$PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR/blocks"
mkdir -p "$PLUGIN_DIR/build"
mkdir -p "$PLUGIN_DIR/src"              # NEW
mkdir -p "$PLUGIN_DIR/src/blocks"       # NEW
mkdir -p "$PLUGIN_DIR/includes"
mkdir -p "$PLUGIN_DIR/assets"
```

**Why:** Need directories for Engine, BlockRenderer, and JSX source files.

---

### 2. Main Plugin File

**BEFORE:** (83-122)
```php
<?php
/**
 * Plugin Name: __PLUGIN_NAME__
 * Description: __PLUGIN_DESCRIPTION__
 * Author: __PLUGIN_AUTHOR__
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function gkd_register_dynamic_blocks() {
    $blocks_dir = plugin_dir_path( __FILE__ );
    __BLOCK_DISCOVERY_PHP__

    foreach ( $block_json_files as $file ) {
        register_block_type( dirname( $file ) );
    }
}

add_action( 'init', 'gkd_register_dynamic_blocks' );
```

**AFTER:**
```php
<?php
/**
 * Plugin Name: __PLUGIN_NAME__
 * Description: __PLUGIN_DESCRIPTION__
 * Author: __PLUGIN_AUTHOR__
 * Version: 1.0.0
 * Text Domain: __PLUGIN_SLUG__
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Load the clean three-layer architecture
require_once __DIR__ . '/Scaffolding.php';
```

**Why:** Main plugin file becomes ultra-minimal. All logic moves to Scaffolding.php.

**Sed replacements needed:**
```bash
sed -i "s|__PLUGIN_NAME__|$PLUGIN_NAME|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__PLUGIN_DESCRIPTION__|$PLUGIN_DESCRIPTION|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__PLUGIN_AUTHOR__|$WP_USER|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"
sed -i "s|__PLUGIN_SLUG__|$PLUGIN_SLUG|" "$PLUGIN_DIR/$PLUGIN_SLUG.php"  # NEW
```

---

### 3. NEW FILE: Scaffolding.php

**Add this section after creating the main plugin file:**

```bash
# ----------------------------------------------------------------------------
step "Create Scaffolding.php (Layer 3: WordPress Integration)"
# ----------------------------------------------------------------------------

cat <<'EOF' > "$PLUGIN_DIR/Scaffolding.php"
<?php
/**
 * Plugin Scaffolding - WordPress integration layer
 *
 * Responsibilities (ONLY):
 * - Register blocks
 * - Enqueue frontend assets (CSS/JS)
 * - Wire up render callbacks
 *
 * No business logic. No HTML generation. Just scaffolding.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

// Load engine and renderer (if they exist)
$engine_file = __DIR__ . '/src/Engine.php';
$renderer_file = __DIR__ . '/src/BlockRenderer.php';

if ( file_exists( $engine_file ) ) {
    require_once $engine_file;
}

if ( file_exists( $renderer_file ) ) {
    require_once $renderer_file;
}

class __PLUGIN_CLASS__ {

    const HANDLE = '__PLUGIN_SLUG__';

    private $renderer;

    public function __construct() {
        // Initialize engine and renderer (if they exist)
        if ( class_exists( '__PLUGIN_CLASS___Engine' ) && class_exists( '__PLUGIN_CLASS___Block_Renderer' ) ) {
            $engine = new __PLUGIN_CLASS___Engine();
            $this->renderer = new __PLUGIN_CLASS___Block_Renderer( $engine );
        }

        // Hook into WordPress
        add_action( 'init', [ $this, 'register_blocks' ] );
    }

    /**
     * Automatically register all blocks that have a block.json file
     */
    public function register_blocks() {
        $blocks_dir = plugin_dir_path( __FILE__ ) . 'blocks/';

        // Find all block.json files
        __BLOCK_DISCOVERY_PHP__

        foreach ( $block_json_files as $file ) {
            $block_dir = dirname( $file );

            // Check if block has custom render callback
            $render_file = $block_dir . '/index.php';

            if ( file_exists( $render_file ) ) {
                // Block has custom PHP rendering
                register_block_type( $block_dir );
            } else {
                // Block uses default renderer (if available)
                $args = [];
                if ( $this->renderer ) {
                    $args['render_callback'] = [ $this->renderer, 'render' ];
                }
                register_block_type( $block_dir, $args );
            }
        }
    }
}

new __PLUGIN_CLASS__();
EOF

# Convert plugin slug to class name (replace hyphens with underscores, capitalize words)
PLUGIN_CLASS=$(echo "$PLUGIN_SLUG" | sed 's/-/_/g' | awk '{for(i=1;i<=NF;i++){$i=toupper(substr($i,1,1)) substr($i,2)}}1' FS='_' OFS='_')

sed -i "s|__PLUGIN_CLASS__|$PLUGIN_CLASS|g" "$PLUGIN_DIR/Scaffolding.php"
sed -i "s|__PLUGIN_SLUG__|$PLUGIN_SLUG|" "$PLUGIN_DIR/Scaffolding.php"
sed -i "s|__BLOCK_DISCOVERY_PHP__|$BLOCK_DISCOVERY_PHP|" "$PLUGIN_DIR/Scaffolding.php"

step "Created Scaffolding.php"
```

**Why:** This is Layer 3 - handles all WordPress-specific integration.

---

### 4. NEW FILE: src/Engine.php Template

**Add this section after Scaffolding.php:**

```bash
# ----------------------------------------------------------------------------
step "Create template files for Engine.php and BlockRenderer.php"
# ----------------------------------------------------------------------------

cat <<'EOF' > "$PLUGIN_DIR/src/Engine.php"
<?php
/**
 * Engine - Pure business logic
 *
 * Framework-agnostic class that handles:
 * - Data queries
 * - Business logic
 * - HTML generation
 *
 * No WordPress hooks, no block registration, no asset enqueueing.
 * Just pure logic that can be reused anywhere.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

class __PLUGIN_CLASS___Engine {

    /**
     * Example method - replace with your actual business logic
     */
    public function get_data( $params ) {
        // Your data retrieval logic here
        return [];
    }

    /**
     * Example method - replace with your HTML generation logic
     */
    public function build_html( $data, $opts ) {
        // Your HTML generation logic here
        return '<div>Replace with your HTML</div>';
    }
}
EOF

sed -i "s|__PLUGIN_CLASS__|$PLUGIN_CLASS|g" "$PLUGIN_DIR/src/Engine.php"
```

**Why:** This is Layer 1 - pure business logic, reusable in any context.

---

### 5. NEW FILE: src/BlockRenderer.php Template

**Add this section after Engine.php:**

```bash
cat <<'EOF' > "$PLUGIN_DIR/src/BlockRenderer.php"
<?php
/**
 * Block Renderer - Thin wrapper around Engine
 *
 * Responsibilities:
 * - Receive block attributes
 * - Normalize parameters
 * - Call the engine
 * - Return HTML
 *
 * This is a pure adapter - no WordPress hooks, no asset management.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

class __PLUGIN_CLASS___Block_Renderer {

    private $engine;

    public function __construct( __PLUGIN_CLASS___Engine $engine ) {
        $this->engine = $engine;
    }

    /**
     * Render the block
     */
    public function render( $attributes ) {
        // Extract and normalize attributes
        $param1 = $attributes['param1'] ?? 'default_value';

        // Get data via engine
        $data = $this->engine->get_data( [ 'param1' => $param1 ] );

        if ( empty( $data ) ) {
            return '<p>' . esc_html__( 'No data found.', '__PLUGIN_SLUG__' ) . '</p>';
        }

        // Build HTML via engine
        return $this->engine->build_html( $data, [
            'param1' => $param1,
        ]);
    }
}
EOF

sed -i "s|__PLUGIN_CLASS__|$PLUGIN_CLASS|g" "$PLUGIN_DIR/src/BlockRenderer.php"
sed -i "s|__PLUGIN_SLUG__|$PLUGIN_SLUG|" "$PLUGIN_DIR/src/BlockRenderer.php"

step "Created template files for Engine.php and BlockRenderer.php"
```

**Why:** This is Layer 2 - thin adapter between blocks and business logic.

---

## Changes to `create-wp-block.sh`

### 1. Update index.php Comments

**BEFORE:** (Lines 139-151)
```php
<?php
/**
 * Dynamic Render Logic
 * Variables available: $attributes, $content, $block
 */
defined( 'ABSPATH' ) || exit;

// We include the template file for HTML output
include __DIR__ . '/template.php';
```

**AFTER:**
```php
<?php
/**
 * Optional Custom Render Logic for this Block
 *
 * If this file exists, it overrides the shared BlockRenderer.php.
 * Delete this file to use the shared renderer instead.
 *
 * Variables available: $attributes, $content, $block
 */
defined( 'ABSPATH' ) || exit;

// Option 1: Include a template file for HTML output
include __DIR__ . '/template.php';

// Option 2: Use the shared renderer (uncomment below, delete template.php)
// global $plugin_renderer; // Set in Scaffolding.php
// if ( $plugin_renderer ) {
//     return $plugin_renderer->render( $attributes );
// }
```

**Why:** Clarifies that blocks can use shared renderer or custom logic.

---

### 2. Update template.php Comments

**BEFORE:** (Lines 154-163)
```php
<?php
defined( 'ABSPATH' ) || exit;
?>
<div class="wp-block-$BLOCK_NAMESPACE_PREFIX-$BLOCK_SLUG">
    <p><strong>$BLOCK_TITLE:</strong> View output.</p>
</div>
```

**AFTER:**
```php
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
```

**Why:** Educates developers about when to delete these files.

---

## Benefits of This Architecture

### 1. Separation of Concerns
- **Engine**: Pure business logic, no WordPress dependencies
- **BlockRenderer**: Thin adapter, normalizes inputs/outputs
- **Scaffolding**: WordPress integration only

### 2. Reusability
Engine can be used in:
- Blocks (via BlockRenderer)
- Shortcodes
- REST API endpoints
- WP-CLI commands
- Template tags
- Other plugins

### 3. Testability
Each layer can be tested independently:
- Unit test Engine without WordPress
- Integration test BlockRenderer with mock Engine
- E2E test Scaffolding in WordPress environment

### 4. Maintainability
- Clear file structure
- Single responsibility per class
- Easy to locate and fix bugs

### 5. Scalability
- Add new blocks without touching Engine
- Update Engine without touching WordPress code
- Swap out WordPress for another framework (theoretically)

---

## Migration Path

### For Existing Plugins

1. **Keep old plugin working** - don't break existing installations
2. **Create new files** - add Scaffolding.php, Engine.php, BlockRenderer.php
3. **Move logic** - extract business logic from blocks to Engine
4. **Update main file** - change to load Scaffolding.php
5. **Test thoroughly** - ensure all blocks still work
6. **Update version** - bump to indicate architectural change

### For New Plugins

Use updated scripts - they'll generate the correct structure automatically.

---

## File Structure Comparison

### OLD Structure
```
my-plugin/
├── my-plugin.php          (All logic in one file)
├── blocks/
│   └── my-block/
│       ├── block.json
│       ├── index.php      (Controller + View mixed)
│       └── template.php
├── build/
└── package.json
```

### NEW Structure
```
my-plugin/
├── my-plugin.php          (Headers + require Scaffolding)
├── Scaffolding.php        (Layer 3: WordPress integration)
├── src/
│   ├── Engine.php         (Layer 1: Business logic)
│   ├── BlockRenderer.php  (Layer 2: Adapter)
│   └── blocks/
│       └── my-block/
│           └── index.jsx  (React editor)
├── blocks/
│   └── my-block/
│       ├── block.json
│       ├── index.php      (Optional: custom render)
│       └── template.php   (Optional: custom view)
├── build/
└── package.json
```

---

## Testing Checklist

After updating the scripts, test the following:

### Plugin Creation Test
```bash
./create-wp-plugin.sh test-plugin "Test Plugin" "A test plugin"
```

**Verify:**
- [ ] `test-plugin/test-plugin.php` has headers + require Scaffolding.php
- [ ] `test-plugin/Scaffolding.php` exists with correct class name
- [ ] `test-plugin/src/Engine.php` exists with correct class name
- [ ] `test-plugin/src/BlockRenderer.php` exists with correct class name
- [ ] `test-plugin/src/blocks/` directory exists
- [ ] npm install runs successfully
- [ ] npm run build runs successfully

### Block Creation Test
```bash
./create-wp-block.sh test-plugin test-block "Test Block" "A test block"
```

**Verify:**
- [ ] `blocks/test-block/block.json` created
- [ ] `blocks/test-block/index.php` has updated comments
- [ ] `blocks/test-block/template.php` has updated comments
- [ ] `src/blocks/test-block/index.jsx` created
- [ ] Block registers correctly in WordPress
- [ ] Block appears in editor
- [ ] Block renders on frontend

### Integration Test
- [ ] Create plugin with updated script
- [ ] Create block with updated script
- [ ] Activate plugin in WordPress
- [ ] Add block to page
- [ ] Verify block works in editor
- [ ] Verify block works on frontend
- [ ] Check console for errors
- [ ] Test with custom BlockRenderer logic

---

## Documentation Updates Needed

Update the following documentation files:

1. **README.md**
   - Add architecture overview section
   - Update directory structure diagram
   - Add examples of Engine usage

2. **CONTRIBUTING.md** (if exists)
   - Explain three-layer pattern
   - Show where to add new logic
   - Provide code examples

3. **Inline Comments**
   - Add architecture notes to generated files
   - Explain when to use Engine vs BlockRenderer
   - Show examples in comments

---

## Common Pitfalls

### 1. Wrong Class Names
**Issue:** Class names don't match plugin slug
**Solution:** Use `$PLUGIN_CLASS` variable correctly in all sed commands

### 2. Missing Directory Creation
**Issue:** `src/` and `src/blocks/` don't exist
**Solution:** Add mkdir commands for new directories

### 3. Hard-Coded Values
**Issue:** Using literal strings instead of variables
**Solution:** Always use placeholders (__PLUGIN_CLASS__, etc.) and sed replacements

### 4. Forgetting Text Domain
**Issue:** Translation functions don't work
**Solution:** Add Text Domain to plugin headers and use in esc_html__() calls

---

## Support & Questions

For questions about implementing this architecture:

1. Review `Custom-Block-Architecture.md` in the scripts directory
2. Examine `gallery-block` plugin as reference implementation
3. Check generated template files for inline documentation
4. Review this document for specific implementation details

---

## Version History

- **v1.0** (2026-01-21): Initial three-layer architecture implementation
  - Added Scaffolding.php generation
  - Added Engine.php template
  - Added BlockRenderer.php template
  - Updated directory structure
  - Updated block generation comments
