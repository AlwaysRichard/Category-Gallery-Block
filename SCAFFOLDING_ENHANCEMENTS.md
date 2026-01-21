# Scaffolding Scripts Enhancement Recommendations

Based on the Category Gallery Block refactoring, here are the gaps in the current scaffolding scripts and recommended enhancements.

## Current Gaps

### 1. **block.json is Too Minimal**

**Current script creates:**
```json
{
  "apiVersion": 3,
  "name": "gk/block-slug",
  "title": "Block Title",
  "category": "widgets",
  "icon": "screenoptions",
  "description": "Block Description",
  "editorScript": "file:../../build/block_slug/index.js",
  "render": "file:./index.php"
}
```

**Missing:**
- ❌ `attributes` - Block attribute definitions
- ❌ `editorStyle` - Editor-only CSS
- ❌ `viewScript` - Frontend JavaScript
- ❌ `style` - Frontend CSS
- ❌ `supports` - HTML, align, etc.
- ❌ `keywords` - Searchable keywords
- ❌ `textdomain` - i18n text domain

**Should create:**
```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "gk/block-slug",
  "version": "1.0.0",
  "title": "Block Title",
  "category": "widgets",
  "icon": "screenoptions",
  "description": "Block Description",
  "keywords": ["keyword1", "keyword2"],
  "textdomain": "plugin-slug",
  "supports": {
    "html": false,
    "align": ["wide", "full"]
  },
  "attributes": {
    "exampleText": {
      "type": "string",
      "default": ""
    },
    "exampleBoolean": {
      "type": "boolean",
      "default": false
    }
  },
  "editorScript": "file:../../build/block_slug/index.js",
  "editorStyle": "file:../../build/block_slug/editor.css",
  "viewScript": "file:../../build/block_slug/view.js",
  "style": "file:../../build/block_slug/style.css",
  "render": "file:./index.php"
}
```

### 2. **Editor Component is Too Basic**

**Current script creates:**
```jsx
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('gk/block-slug', {
    edit() {
        return (
            <div className="block-slug-editor">
                Block Title (Editor View)
            </div>
        );
    },
    save() { return null; },
});
```

**Missing:**
- ❌ No `InspectorControls` for sidebar settings
- ❌ No `useBlockProps` for proper block wrapper
- ❌ No attributes handling (`attributes`, `setAttributes`)
- ❌ No actual UI controls (TextControl, ToggleControl, etc.)
- ❌ No imports for @wordpress/components
- ❌ No imports for @wordpress/i18n

**Should create:**
```jsx
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('gk/block-slug', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const { exampleText, exampleBoolean } = attributes;

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Settings', 'plugin-slug')}>
                        <TextControl
                            label={__('Example Text', 'plugin-slug')}
                            value={exampleText}
                            onChange={(value) => setAttributes({ exampleText: value })}
                        />
                        <ToggleControl
                            label={__('Example Toggle', 'plugin-slug')}
                            checked={exampleBoolean}
                            onChange={(value) => setAttributes({ exampleBoolean: value })}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="block-slug-editor">
                        <h3>{__('Block Title', 'plugin-slug')}</h3>
                        <p>{exampleText || __('No text set', 'plugin-slug')}</p>
                    </div>
                </div>
            </>
        );
    },
    save: () => null,
});
```

### 3. **No Frontend Asset Files Created**

The scripts don't create:
- ❌ `src/blocks/block_slug/style.css` - Frontend styles
- ❌ `src/blocks/block_slug/view.js` - Frontend JavaScript
- ❌ `src/blocks/block_slug/editor.css` - Editor-only styles

**Category Gallery Block has:**
- ✅ `src/style.css` - 500+ lines of gallery styles
- ✅ `src/view.js` - 280+ lines of lightbox/layout JS
- ✅ `src/index.css` - Editor styles

### 4. **No Support for Engine/Renderer Pattern**

The script always creates `template.php` with hardcoded HTML:

```php
<div class="wp-block-gk-block-slug">
    <p><strong>Block Title:</strong> View output.</p>
</div>
```

**Should support:**
- Option to use engine/renderer pattern
- Option to skip template.php for complex blocks
- Option to use global renderer instance

### 5. **Webpack Config Doesn't Handle Multiple Asset Types**

**Current webpack.config.js:**
```javascript
entry: () => {
    const entries = {};
    const files = glob.sync( './src/blocks/*/index.jsx' );

    files.forEach( ( file ) => {
        const name = path.basename( path.dirname( file ) );
        entries[ name ] = file;
    });

    return entries;
},
```

**Only compiles:** `index.jsx` → `index.js`

**Should also handle:**
- `view.js` → `view.js` (frontend script)
- `style.css` → `style.css` (frontend styles)
- `editor.css` → `editor.css` (editor styles)

---

## Recommended Enhancements

### Enhancement 1: Add Frontend Asset Files

Update `create-wp-block.sh` to create:

```bash
# Frontend styles
cat > "$SRC_BLOCK_DIR/style.css" <<EOF
/**
 * Frontend styles for $BLOCK_TITLE
 */
.wp-block-$BLOCK_NAMESPACE_PREFIX-$BLOCK_SLUG {
    /* Add your frontend styles here */
}
EOF

# Frontend JavaScript
cat > "$SRC_BLOCK_DIR/view.js" <<EOF
/**
 * Frontend JavaScript for $BLOCK_TITLE
 */
(function() {
    'use strict';

    // Add your frontend JavaScript here
    console.log('$BLOCK_TITLE frontend script loaded');

})();
EOF

# Editor styles
cat > "$SRC_BLOCK_DIR/editor.css" <<EOF
/**
 * Editor-only styles for $BLOCK_TITLE
 */
.editor-styles-wrapper .wp-block-$BLOCK_NAMESPACE_PREFIX-$BLOCK_SLUG {
    /* Add your editor-only styles here */
}
EOF
```

### Enhancement 2: Enhanced block.json Template

Add command-line options for customization:

```bash
# New optional parameters
BLOCK_CATEGORY="${5:-widgets}"       # Default: widgets
BLOCK_SUPPORTS_ALIGN="${6:-true}"    # Default: true
BLOCK_HAS_ATTRIBUTES="${7:-true}"    # Default: true

# Generate block.json with full schema
cat > "$BLOCK_DIR/block.json" <<EOF
{
  "\$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "$BLOCK_NAMESPACE_PREFIX/$BLOCK_SLUG",
  "version": "1.0.0",
  "title": "$BLOCK_TITLE",
  "category": "$BLOCK_CATEGORY",
  "icon": "screenoptions",
  "description": "$BLOCK_DESCRIPTION",
  "keywords": ["${BLOCK_SLUG}", "${BLOCK_NAMESPACE_PREFIX}"],
  "textdomain": "$PLUGIN_SLUG",
  "supports": {
    "html": false,
    "align": $([ "$BLOCK_SUPPORTS_ALIGN" = "true" ] && echo '["wide", "full"]' || echo 'false')
  },
  "attributes": {
    "exampleText": {
      "type": "string",
      "default": ""
    }
  },
  "editorScript": "file:../../build/$BLOCK_SLUG/index.js",
  "editorStyle": "file:../../build/$BLOCK_SLUG/editor.css",
  "viewScript": "file:../../build/$BLOCK_SLUG/view.js",
  "style": "file:../../build/$BLOCK_SLUG/style.css",
  "render": "file:./index.php"
}
EOF
```

### Enhancement 3: Enhanced Editor Component Template

Create a more complete editor component:

```bash
cat > "$SRC_BLOCK_DIR/index.jsx" <<'EDITOREOF'
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('${BLOCK_NAMESPACE_PREFIX}/${BLOCK_SLUG}', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const { exampleText } = attributes;

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Settings', '${PLUGIN_SLUG}')} initialOpen={true}>
                        <TextControl
                            label={__('Example Text', '${PLUGIN_SLUG}')}
                            value={exampleText}
                            onChange={(value) => setAttributes({ exampleText: value })}
                            help={__('Enter some example text', '${PLUGIN_SLUG}')}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="${BLOCK_SLUG}-editor">
                        <h3>${BLOCK_TITLE}</h3>
                        <p>{exampleText || __('No text set', '${PLUGIN_SLUG}')}</p>
                    </div>
                </div>
            </>
        );
    },
    save: () => null,
});
EDITOREOF
```

### Enhancement 4: Support Engine/Renderer Pattern

Add an option to use engine pattern:

```bash
# New optional parameter
USE_ENGINE_PATTERN="${8:-false}"  # Default: false

if [ "$USE_ENGINE_PATTERN" = "true" ]; then
    # Create engine-based index.php
    cat > "$BLOCK_DIR/index.php" <<EOF
<?php
defined( 'ABSPATH' ) || exit;

// Get the renderer instance from the plugin
global \$${PLUGIN_SLUG}_renderer;

if ( ! \$${PLUGIN_SLUG}_renderer ) {
    return '<p>Renderer not initialized.</p>';
}

// Render and return HTML
return \$${PLUGIN_SLUG}_renderer->render( \$attributes );
EOF
else
    # Create template-based index.php (current behavior)
    cat > "$BLOCK_DIR/index.php" <<EOF
<?php
defined( 'ABSPATH' ) || exit;
include __DIR__ . '/template.php';
EOF

    # Create template.php
    cat > "$BLOCK_DIR/template.php" <<EOF
<?php
defined( 'ABSPATH' ) || exit;
?>
<div class="wp-block-$BLOCK_NAMESPACE_PREFIX-$BLOCK_SLUG">
    <p><strong>$BLOCK_TITLE:</strong> View output.</p>
</div>
EOF
fi
```

### Enhancement 5: Enhanced Webpack Config

Update `create-wp-plugin.sh` to create a webpack config that handles all asset types:

```javascript
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const glob = require( 'glob' );

module.exports = {
    ...defaultConfig,
    entry: () => {
        const entries = {};

        // Editor scripts (index.jsx → index.js)
        const editorFiles = glob.sync( './src/blocks/*/index.jsx' );
        editorFiles.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ `${name}/index` ] = file;
        });

        // Frontend scripts (view.js → view.js)
        const viewFiles = glob.sync( './src/blocks/*/view.js' );
        viewFiles.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ `${name}/view` ] = file;
        });

        // Editor styles (editor.css → editor.css)
        const editorStyles = glob.sync( './src/blocks/*/editor.css' );
        editorStyles.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ `${name}/editor` ] = file;
        });

        // Frontend styles (style.css → style.css)
        const styles = glob.sync( './src/blocks/*/style.css' );
        styles.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ `${name}/style` ] = file;
        });

        return entries;
    },
    output: {
        path: path.resolve( process.cwd(), 'build' ),
        filename: '[name].js',
    },
};
```

---

## Summary of Changes Needed

### create-wp-block.sh

1. ✅ Create `src/blocks/[slug]/style.css` (frontend styles)
2. ✅ Create `src/blocks/[slug]/view.js` (frontend JavaScript)
3. ✅ Create `src/blocks/[slug]/editor.css` (editor styles)
4. ✅ Enhance `block.json` with full schema (attributes, supports, keywords, etc.)
5. ✅ Enhance `index.jsx` with InspectorControls boilerplate
6. ✅ Add option for engine/renderer pattern vs template pattern
7. ✅ Add command-line options for category, supports, etc.

### create-wp-plugin.sh

1. ✅ Update webpack.config.js to handle multiple entry points (view.js, style.css, editor.css)
2. ✅ Add MiniCssExtractPlugin for CSS compilation
3. ✅ Add support for CSS modules if needed

### Documentation

1. ✅ Update README_WP_BLOCK with new options
2. ✅ Add examples for complex blocks with InspectorControls
3. ✅ Document engine/renderer pattern option
4. ✅ Add migration guide for existing blocks

---

## Priority

**High Priority:**
1. Frontend asset files (style.css, view.js) - **Critical for blocks with frontend interactions**
2. Enhanced block.json with attributes - **Required for any block with settings**
3. Enhanced editor component with InspectorControls - **Required for configurable blocks**

**Medium Priority:**
4. Engine/renderer pattern option - **Nice to have for complex blocks**
5. Enhanced webpack config - **Better asset handling**

**Low Priority:**
6. Additional command-line options - **Convenience feature**

---

## Implementation Strategy

1. **Create enhanced-scaffolding branch**
2. **Update create-wp-block.sh** with frontend assets
3. **Update create-wp-plugin.sh** webpack config
4. **Test with a new sample block**
5. **Document new features in README_WP_BLOCK**
6. **Merge back to wordpress-block-scaffolding branch**
