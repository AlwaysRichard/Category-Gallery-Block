<?php
/**
 * Dynamic Render Callback for Category Gallery Block
 *
 * Variables available: $attributes, $content, $block
 */
defined( 'ABSPATH' ) || exit;

// Get the renderer instance from the plugin
global $category_gallery_renderer;

if ( ! $category_gallery_renderer ) {
    return '<p>Category Gallery renderer not initialized.</p>';
}

// Render and return HTML
return $category_gallery_renderer->render( $attributes );
