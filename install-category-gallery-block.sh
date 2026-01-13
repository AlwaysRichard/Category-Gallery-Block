#!/bin/bash

# Category Gallery Block - Install/Update Script

set -e

PLUGIN_DIR="/home/alwaysvw.net/public_html/wp-content/plugins/category-gallery-block"
ZIP_FILE="/home/alwaysvw.net/downloads/category-gallery-block.zip"
BACKUP_DIR_BASE="/home/alwaysvw.net/downloads"
OWNER="alway3397:alway3397"

echo "=========================================="
echo "Category Gallery Block - Install/Update"
echo "=========================================="

# Check if zip file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: ZIP file not found at $ZIP_FILE"
    exit 1
fi

cd /home/alwaysvw.net/public_html/wp-content/plugins/

# Check if plugin already exists
if [ -d "$PLUGIN_DIR" ]; then
    echo "📦 Plugin directory exists - performing UPDATE"
    BACKUP_NAME="category-gallery-block_backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR_BASE}/${BACKUP_NAME}"
    sudo cp -r "$PLUGIN_DIR" "$BACKUP_PATH"
    sudo chown -R "$OWNER" "$BACKUP_PATH"
    echo "   ✅ Backup created: $BACKUP_PATH"
    sudo rm -rf "$PLUGIN_DIR"
else
    echo "📦 Plugin directory not found - performing FRESH INSTALL"
    BACKUP_PATH=""
fi

# Unzip the file
echo "📂 Extracting plugin files..."
sudo unzip -q "$ZIP_FILE"

# Set proper ownership
echo "🔐 Setting ownership to $OWNER..."
sudo chown -R "$OWNER" category-gallery-block/

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chmod -R 755 category-gallery-block/

# Navigate into the plugin directory
cd category-gallery-block/

# Verify block.json is in src directory
if [ -f "src/block.json" ]; then
    echo "✓ block.json found in src directory"
else
    echo "❌ Error: block.json missing from src directory"
    exit 1
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install --quiet

# Build the block
echo "🔨 Building block..."
npm run build

# Verify build files
echo ""
echo "Verifying build files..."

if [ ! -f "build/index.js" ] || [ ! -f "build/index.asset.php" ] || [ ! -f "build/block.json" ]; then
    echo "❌ Build incomplete"
    ls -la build/
    exit 1
fi

echo "✅ All required files present"

echo ""
echo "=========================================="
echo "✅ SUCCESS! Plugin installed/updated"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to WordPress Admin → Plugins"
if [ -n "$BACKUP_PATH" ]; then
    echo "2. Plugin should still be activated"
    echo "3. Hard refresh your browser (Ctrl+Shift+R)"
else
    echo "2. Find 'Category Gallery Block'"
    echo "3. Click 'Activate'"
fi
echo ""
echo "Usage:"
echo "- Add 'Category Gallery' block to any page"
echo "- Select source: Gallery Taxonomy or Category"
echo "- Configure layout, columns, and other settings"
echo ""
echo "New in v1.3.0:"
echo "- Category source support (featured images)"
echo "- Include unpublished pages option"
echo "- Enhanced EXIF templates with conditional text"
echo "- Automatic asset cache busting (file.js?ver=hash)"
echo ""
[ -n "$BACKUP_PATH" ] && echo "💾 Backup: $BACKUP_PATH"
echo ""
