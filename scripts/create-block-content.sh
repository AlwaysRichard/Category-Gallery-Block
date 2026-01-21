# ------------------------------------------------------------
# Create block directory and files
# ------------------------------------------------------------
BLOCK_DIR="$PLUGIN_DIR/blocks/$BLOCK_SLUG"
mkdir -p "$BLOCK_DIR"

# ------------------------------------------------------------
# block.json (safe heredoc, no variable expansion issues)
# ------------------------------------------------------------
cat > "$BLOCK_DIR/block.json" <<EOF
{
  "apiVersion": 3,
  "name": "$PLUGIN_NAMESPACE/$BLOCK_SLUG",
  "title": "$BLOCK_TITLE",
  "category": "widgets",
  "icon": "screenoptions",
  "description": "$BLOCK_DESCRIPTION",
  "editorScript": "file:../../build/$BLOCK_SLUG/index.js",
  "render": "file:./index.php"
}
EOF

# ------------------------------------------------------------
# index.php (registration shim — returns callable, not HTML)
# ------------------------------------------------------------
cat > "$BLOCK_DIR/index.php" <<EOF
<?php
defined( 'ABSPATH' ) || exit;

function ${PLUGIN_SLUG}_render_${BLOCK_SLUG}_block( \$attributes, \$content, \$block ) {
    return ${PLUGIN_SLUG}_render_${BLOCK_SLUG}_template( \$attributes, \$content, \$block );
}

return '${PLUGIN_SLUG}_render_${BLOCK_SLUG}_block';
EOF

# ------------------------------------------------------------
# template.php (HTML-only template with safe escaping)
# ------------------------------------------------------------
cat > "$BLOCK_DIR/template.php" <<EOF
<?php
defined( 'ABSPATH' ) || exit;

\$title = isset( \$attributes['title'] ) ? esc_html( \$attributes['title'] ) : '';
\$items = isset( \$attributes['items'] ) && is_array( \$attributes['items'] ) ? \$attributes['items'] : [];
?>
<div class="$BLOCK_SLUG">
    <?php if ( \$title ) : ?>
        <h3><?php echo \$title; ?></h3>
    <?php endif; ?>

    <?php if ( \$items ) : ?>
        <ul>
            <?php foreach ( \$items as \$item ) : ?>
                <li><?php echo esc_html( \$item ); ?></li>
            <?php endforeach; ?>
        </ul>
    <?php else : ?>
        <p>No items found.</p>
    <?php endif; ?>
</div>
EOF

step "✓ Created block: $BLOCK_SLUG"
