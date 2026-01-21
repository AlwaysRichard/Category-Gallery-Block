# Category Gallery Block - Architecture v2.0

This plugin has been refactored to use a **clean three-layer architecture** that separates concerns and makes the code reusable, testable, and maintainable.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  1. WordPress Block Scaffolding (category-gallery-block-v2.php) │
│     - Register block                                        │
│     - Enqueue assets                                        │
│     - Hook into WordPress                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │ uses
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Block Renderer (src/BlockRenderer.php)                  │
│     - Normalize attributes                                  │
│     - Handle archive auto-detection                         │
│     - Delegate to engine                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ uses
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Gallery Engine (src/GalleryEngine.php)                  │
│     - Query posts and attachments                           │
│     - Build gallery HTML                                    │
│     - Process EXIF templates                                │
│     - Pure logic, no WordPress block awareness              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
category-gallery-block/
├── category-gallery-block-v2.php    # Main plugin file (scaffolding)
├── src/
│   ├── GalleryEngine.php            # Pure gallery logic
│   ├── BlockRenderer.php            # Thin adapter
│   ├── style.css                    # Frontend styles
│   ├── view.js                      # Frontend JavaScript
│   └── blocks/
│       └── gk_category_gallery/
│           └── index.jsx            # Editor component (React)
├── blocks/
│   └── gk_category_gallery/
│       ├── block.json               # Block metadata
│       └── index.php                # Render callback
├── build/
│   └── gk_category_gallery/
│       └── index.js                 # Compiled editor script
├── webpack.config.js                # Build configuration
└── package.json                     # Dependencies and scripts
```

## Layer 1: Gallery Engine (Pure Logic)

**File:** `src/GalleryEngine.php`

**Responsibilities:**
- Query WordPress database for attachments
- Support both gallery taxonomy and category modes
- Build HTML markup for galleries
- Process EXIF caption templates

**Key Methods:**
- `get_attachments_from_galleries()` - Query images from gallery taxonomy
- `get_featured_images_from_category()` - Query featured images from category
- `build_gallery_html()` - Generate gallery HTML with all layout options
- `build_caption_from_exif()` - Process EXIF templates with conditional text

**Why it's pure:**
- No WordPress block concepts
- No hooks or filters
- No asset enqueueing
- Just data queries and HTML generation

**Reusability:**
You can now use this engine from:
- Shortcodes
- REST API endpoints
- WP-CLI commands
- Template tags
- Other blocks
- Non-WordPress contexts (with adapter)

## Layer 2: Block Renderer (Thin Adapter)

**File:** `src/BlockRenderer.php`

**Responsibilities:**
- Extract and normalize block attributes
- Auto-detect taxonomy/category archives
- Handle validation and error messages
- Delegate HTML generation to the engine

**Key Method:**
- `render($attributes)` - Main render method called by WordPress

**Why it's thin:**
- Only ~80 lines of code
- No business logic
- Just attribute handling and delegation

## Layer 3: WordPress Scaffolding (Integration)

**File:** `category-gallery-block-v2.php`

**Responsibilities:**
- Register the block with WordPress
- Enqueue frontend assets (CSS & JS)
- Initialize engine and renderer
- Minimal WordPress integration

**Key Methods:**
- `register_block()` - Register using block.json
- `enqueue_frontend_assets()` - Load CSS/JS inline
- `should_load_assets()` - Conditional asset loading

**Why it's minimal:**
- Only ~100 lines of code
- No business logic
- Just WordPress hooks and registration

## Block Registration

The block follows the scaffolding pattern from `create-wp-block.sh`:

1. **Block metadata:** `blocks/gk_category_gallery/block.json`
   - Defines attributes, scripts, and metadata
   - Uses `gk/` namespace prefix (from scaffolding)
   - Points to compiled editor script in `build/`
   - Points to render callback in `index.php`

2. **Render callback:** `blocks/gk_category_gallery/index.php`
   - Receives `$attributes` from WordPress
   - Calls global `$category_gallery_renderer->render($attributes)`
   - Returns HTML string

3. **Editor component:** `src/blocks/gk_category_gallery/index.jsx`
   - React component for block editor
   - Uses `@wordpress/components` for UI
   - Registers with `gk/category-gallery` name

## Build System

### Webpack Configuration

The plugin uses the scaffolding-style webpack config:

```javascript
// webpack.config.js
module.exports = {
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
```

This **auto-discovers** all blocks in `src/blocks/*/index.jsx` and compiles them to `build/[name]/index.js`.

### Build Commands

```bash
# Development build with watch mode
npm start

# Production build
npm run build

# Linting
npm run lint:js
npm run lint:css

# Format code
npm run format
```

## Asset Loading Strategy

### Frontend Assets (CSS & JS)

Loaded **inline** via `wp_add_inline_style()` and `wp_add_inline_script()`:

```php
// Read file contents
$css = file_get_contents( __DIR__ . '/src/style.css' );
$js = file_get_contents( __DIR__ . '/src/view.js' );

// Enqueue inline
wp_register_style( self::HANDLE, false, [], '2.0.0' );
wp_add_inline_style( self::HANDLE, $css );
wp_enqueue_style( self::HANDLE );
```

**Conditional loading:**
- Always load on `photo_gallery` taxonomy archives
- Always load on category archives
- Load on singular pages if block is present

### Editor Assets

Loaded automatically by WordPress via `block.json`:
- `editorScript` points to compiled `build/gk_category_gallery/index.js`
- Only loaded in block editor

## Benefits of This Architecture

### 1. **Separation of Concerns**
Each layer has a single, clear responsibility:
- Engine = business logic
- Renderer = attribute handling
- Scaffolding = WordPress integration

### 2. **Reusability**
The `GalleryEngine` can be used outside of blocks:

```php
// In a shortcode
$engine = new Category_Gallery_Engine();
$attachments = $engine->get_attachments_from_galleries( [1, 2, 3] );
return $engine->build_gallery_html( $attachments, $options );

// In a REST endpoint
$engine = new Category_Gallery_Engine();
$attachments = $engine->get_attachments_from_galleries( $gallery_ids );
return rest_ensure_response( $attachments );

// In WP-CLI
$engine = new Category_Gallery_Engine();
WP_CLI::success( count( $engine->get_attachments_from_galleries( [1] ) ) . ' images found' );
```

### 3. **Testability**
Each layer can be tested independently:
- Engine methods can be unit tested
- Renderer can be tested with mock attributes
- Scaffolding can be tested for proper registration

### 4. **Maintainability**
Clear boundaries make changes easier:
- Need to change gallery HTML? → Edit `GalleryEngine::build_gallery_html()`
- Need to add an attribute? → Edit `BlockRenderer::render()` and `block.json`
- Need to change asset loading? → Edit plugin scaffolding

### 5. **Scalability**
Following the scaffolding pattern means:
- Easy to add more blocks (just create `src/blocks/gk_another_block/`)
- Webpack auto-discovers new blocks
- Consistent structure across all blocks
- No manual entry point management

## Conforming to Scaffolding Scripts

This architecture matches the pattern from `create-wp-block.sh`:

✅ **Namespace prefix:** Uses `gk_` for directories, `gk/` for block name
✅ **Three-layer separation:** src/, blocks/, build/
✅ **Auto-discovery:** Webpack glob for editor scripts
✅ **block.json metadata:** Follows scaffolding template
✅ **Render callback:** Uses `index.php` pattern
✅ **Build system:** Compatible with multi-block plugins

## Migration from v1.3.0

### What Changed

**Old structure (v1.3.0):**
```
category-gallery-block.php    (monolithic: registration + logic + rendering)
src/index.js                  (editor component)
src/view.js                   (frontend JS)
src/block.json               (metadata)
```

**New structure (v2.0):**
```
category-gallery-block-v2.php (scaffolding only)
src/GalleryEngine.php        (pure logic)
src/BlockRenderer.php        (adapter)
blocks/gk_category_gallery/  (runtime files)
src/blocks/gk_category_gallery/ (source files)
build/gk_category_gallery/   (compiled files)
```

### Breaking Changes

1. **Block name changed:** `category-gallery/block` → `gk/category-gallery`
2. **Plugin file renamed:** `category-gallery-block.php` → `category-gallery-block-v2.php`
3. **Build system changed:** Now uses webpack auto-discovery
4. **Directory structure changed:** Follows scaffolding pattern

### Backwards Compatibility

To maintain existing blocks:
- Keep old plugin file active temporarily
- Add migration notice
- Register both block names temporarily
- Provide migration tool/script

## Future Enhancements

With this architecture, future enhancements become easier:

1. **Add new blocks** - Just create `src/blocks/gk_new_block/`
2. **Create shortcode** - Reuse `GalleryEngine` directly
3. **Add REST endpoint** - Reuse `GalleryEngine` for JSON output
4. **Add WP-CLI command** - Reuse `GalleryEngine` for CLI
5. **Add Gutenberg patterns** - Combine with other blocks
6. **Add widget** - Reuse renderer in widget context

## Summary

This refactoring transforms a **monolithic block** into a **clean, layered architecture** that:

- ✅ Separates pure logic from WordPress integration
- ✅ Makes the engine reusable across contexts
- ✅ Follows the scaffolding pattern for consistency
- ✅ Enables easy testing and maintenance
- ✅ Supports multi-block plugin expansion
- ✅ Uses modern build tools with auto-discovery
- ✅ Provides clear upgrade path for existing installations
