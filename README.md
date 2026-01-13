# Category Gallery Block

Standalone gallery block that displays images from posts filtered by **Gallery Taxonomy OR Category**. **Auto-detects taxonomy/category archives** so it works perfectly on archive pages.

## Two Image Sources

### Gallery Taxonomy (Original)
- Display **all images** from posts tagged with selected galleries
- Select **multiple galleries**
- Perfect for photography portfolios

### Category (NEW) 
- Display **featured images** from posts in a category
- Select **one category only**
- Great for blog post highlights

## Three Usage Modes

### Mode 1: Manual Selection (Any Page)
Add the block to any page and manually select galleries or category.

**Steps:**
1. Add "Category Gallery" block to any page
2. In sidebar → "Source Selection" → Choose "Gallery Taxonomy" or "Category"
3. Select your gallery/category
4. Configure layout settings
5. Publish

### Mode 2: Auto-Detect Gallery Archives
When you add this block to a `photo_gallery` taxonomy archive template, it **automatically detects and displays that gallery**.

**Example:**
- URL: `https://alwaysphotographing.com/photo_gallery/infrared/`
- Block automatically shows all images from "Infrared" gallery
- No need to manually select the gallery!

### Mode 3: Auto-Detect Category Archives (NEW)
When you add this block to a category archive template, it **automatically detects and displays that category's featured images**.

**Example:**
- URL: `https://alwaysphotographing.com/category/travel/`
- Block automatically shows featured images from "Travel" category posts
- No need to manually select the category!

## Unpublished Pages Support (NEW)

Toggle **"Include Unpublished Pages"** to show featured images from:
- Draft posts
- Pending posts
- Private posts

Perfect for previewing galleries before publishing!

## Setting Up Archive Templates

### Option A: Using Full Site Editor (Block Themes)

#### For Gallery Archives:
1. **Go to:** Appearance → Editor → Templates
2. **Find or Create:** "Taxonomy: Galleries" template
3. **Edit the template:**
   - Remove default post loop if present
   - Add **"Category Gallery"** block
   - Configure layout (Tiled, Grid, Masonry, or Collage)
   - Set columns, gutter, link options, etc.
4. **Save** the template

#### For Category Archives:
1. **Go to:** Appearance → Editor → Templates
2. **Find or Create:** "Category" template
3. **Edit the template:**
   - Remove default post loop if present
   - Add **"Category Gallery"** block
   - Configure layout
4. **Save** the template

### Option B: Using Classic Theme (PHP Templates)

#### For Gallery Archives:
Create `taxonomy-photo_gallery.php` in your theme:

```php
<?php
/**
 * Template for Photo Gallery Taxonomy Archives
 */

get_header();
?>

<main id="primary" class="site-main">
    <header class="page-header">
        <h1 class="page-title"><?php single_term_title(); ?></h1>
        <?php
        $term_description = term_description();
        if ( ! empty( $term_description ) ) {
            echo '<div class="taxonomy-description">' . $term_description . '</div>';
        }
        ?>
    </header>

    <?php
    // The Category Gallery block will auto-detect and show this gallery
    echo do_blocks( '<!-- wp:category-gallery/block {"layout":"tiled","columns":3,"gutter":12,"linkToImage":true} /-->' );
    ?>
</main>

<?php
get_footer();
```

#### For Category Archives:
Create `category.php` in your theme:

```php
<?php
/**
 * Template for Category Archives
 */

get_header();
?>

<main id="primary" class="site-main">
    <header class="page-header">
        <h1 class="page-title"><?php single_cat_title(); ?></h1>
        <?php
        $category_description = category_description();
        if ( ! empty( $category_description ) ) {
            echo '<div class="taxonomy-description">' . $category_description . '</div>';
        }
        ?>
    </header>

    <?php
    // The Category Gallery block will auto-detect and show this category's featured images
    echo do_blocks( '<!-- wp:category-gallery/block {"sourceType":"category","layout":"grid","columns":4,"gutter":16,"linkToPost":true} /-->' );
    ?>
</main>

<?php
get_footer();
```

## Block Settings

### Source Selection (NEW)
- **Image Source** - Choose "Gallery Taxonomy" or "Category"
- **Select Galleries** - Choose one or more galleries (Gallery mode only)
- **Select Category** - Choose ONE category (Category mode only)
- **Include Unpublished Pages** - Include draft/pending/private posts

### Layout Settings
- **Layout** - Tiled (Justified), Grid, Masonry, or Collage
- **Columns** - 1-8 columns (Grid, Masonry, Collage)
- **Gutter** - Space between images (0-50px)
- **Target Row Height** - For Tiled layout (100-600px)
- **Crop Images** - For Collage layout

### Image Settings
- **Image Size** - WordPress size (thumbnail, medium, large, full)
- **Maximum Images** - Limit display (0 = show all)

### Features
- **Link to Image** - Click to open lightbox
- **Link to Post** - Click to go to post
- When BOTH enabled - shows "View: Image | Post" menu
- When only one enabled - direct click action

### EXIF Caption Template
Create custom captions from photo metadata with conditional text support:

**Placeholders:**
- `{FileName}` - Image filename
- `{Copyright}` - Copyright with default: `{Copyright,© 2024 Name}`
- `{CameraMake}` - Camera manufacturer
- `{CameraModel}` - Camera model
- `{ISOSpeedRatings}` - ISO (formatted as ISO-400)
- `{FocalLength}` - Focal length (50mm)
- `{ShutterSpeedValue}` - Shutter speed (1/250s)
- `{FNumber}` - Aperture (f/2.8)

**Conditional Text (NEW in 1.3.0):**

Use `{'text', Placeholder}` to display text only when EXIF data exists:
- `{'© ', Copyright}` - Shows "© " only if Copyright has data
- `{'| ', FNumber}` - Shows "| " only if FNumber has data
- `{' | ', CameraModel}` - Shows " | " only if CameraModel has data

**Examples:**

Basic template:
```
{Copyright} | {CameraMake} {CameraModel} | {FocalLength} {FNumber} {ShutterSpeedValue} {ISOSpeedRatings}
```

With conditional text (cleaner output when data is missing):
```
{'© ', Copyright}{' | ', CameraMake}{' ', CameraModel}{' | ', FocalLength}{' ', FNumber}{' ', ShutterSpeedValue}{' ', ISOSpeedRatings}
```

Result when all data exists:
```
© Richard Cox | Canon EOS R5 | 24mm f/2.8 1/250s ISO-400
```

Result when some data is missing (e.g., no Copyright):
```
Canon EOS R5 | 24mm f/2.8 1/250s ISO-400
```
*(Note: No "© |" prefix when Copyright is empty)*

## Installation

```bash
chmod +x /home/alwaysvw.net/downloads/install-category-gallery-block.sh
bash /home/alwaysvw.net/downloads/install-category-gallery-block.sh
```

## How It Works

The block checks:
1. **Is this a `photo_gallery` taxonomy archive?**
   - YES → Auto-load that gallery (Gallery mode)
2. **Is this a category archive?**
   - YES → Auto-load that category (Category mode with featured images)
3. **Neither?**
   - Use manually selected galleries/category

This means:
- On `/photo_gallery/infrared/` → Shows all images from Infrared gallery posts
- On `/category/travel/` → Shows featured images from Travel category posts
- On regular pages → Shows what you selected manually

## Image Behavior by Source

### Gallery Taxonomy Mode
- Displays **all images attached to posts** in selected galleries
- Images are the actual post attachments
- Great for photography portfolios

### Category Mode
- Displays **only featured images** from posts in selected category
- One image per post
- Great for blog post highlights and visual indexes

## Keyboard Shortcuts (Lightbox)

- **Escape** - Close lightbox
- **Left Arrow** - Previous image
- **Right Arrow** - Next image

## Requirements

- WordPress 6.0+
- PHP 7.4+
- `photo_gallery` taxonomy registered (for Gallery mode)

## Version History

### 1.3.0
- **Refactored:** Renamed to `category-gallery-block` (removed `ap_` prefix)
- **2025 Best Practices:** Moved to separate frontend asset files with automatic cache busting
- **Category Source:** Added category mode to display featured images
- **Auto-Detection:** Enhanced to detect category archive pages
- **Unpublished Pages:** Added option to include draft/pending/private posts
- **Enhanced EXIF:** Added conditional text syntax `{'text', Placeholder}` for cleaner captions
- **Performance:** Assets now lazy-load with versioned URLs (file.js?ver=hash)

### 1.2.0
- Bug fixes and performance improvements

### 1.1.0
- Added auto-detection for taxonomy archive pages
- Block now works on `/photo_gallery/{gallery-slug}/` URLs automatically

### 1.0.0
- Initial release
- Manual gallery selection
- All layout options
- EXIF template support
