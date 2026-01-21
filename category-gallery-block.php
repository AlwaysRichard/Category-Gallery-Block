<?php
/**
 * Plugin Name: Category Gallery Block
 * Description: Standalone gallery block that displays images from posts filtered by gallery taxonomy or category. Auto-detects taxonomy/category archives.
 * Version:     2.0.0
 * Author:      Richard Cox
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: category-gallery-block
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

// Load the engine and renderer
require_once __DIR__ . '/src/GalleryEngine.php';
require_once __DIR__ . '/src/BlockRenderer.php';

class Category_Gallery_Block_Plugin {

    const HANDLE = 'category-gallery-block-v2';

    private $renderer;

    public function __construct() {
        // Initialize the engine and renderer
        $engine = new Category_Gallery_Engine();
        $this->renderer = new Category_Gallery_Block_Renderer( $engine );

        // Make renderer globally available for block render callback
        global $category_gallery_renderer;
        $category_gallery_renderer = $this->renderer;

        // Hook into WordPress
        add_action( 'init', [ $this, 'register_block' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
        add_action( 'enqueue_block_assets', [ $this, 'enqueue_frontend_assets' ] );
    }

    /**
     * Register the block using block.json
     */
    public function register_block() {
        register_block_type( __DIR__ . '/blocks/gk_category_gallery' );
    }

    /**
     * Enqueue frontend assets (CSS and JS)
     */
    public function enqueue_frontend_assets() {
        // Only enqueue if we're on a page with the block or on an archive
        if ( ! $this->should_load_assets() ) {
            return;
        }

        // Read CSS file
        $css_file = __DIR__ . '/src/style.css';
        $css = file_exists( $css_file ) ? file_get_contents( $css_file ) : '';

        // Read JS file
        $js_file = __DIR__ . '/src/view.js';
        $js = file_exists( $js_file ) ? file_get_contents( $js_file ) : '';

        // Register and enqueue inline styles
        wp_register_style( self::HANDLE, false, [], '2.0.0' );
        if ( $css ) {
            wp_add_inline_style( self::HANDLE, $css );
        }
        wp_enqueue_style( self::HANDLE );

        // Register and enqueue inline scripts
        wp_register_script( self::HANDLE, false, [], '2.0.0', true );
        if ( $js ) {
            wp_add_inline_script( self::HANDLE, $js );
        }
        wp_enqueue_script( self::HANDLE );
    }

    /**
     * Check if assets should be loaded
     */
    private function should_load_assets() {
        // Always load on gallery/category archives
        if ( is_tax( 'photo_gallery' ) || is_category() ) {
            return true;
        }

        // Check if current post/page has the block
        if ( is_singular() ) {
            global $post;
            if ( $post && has_block( 'category-gallery', $post ) ) {
                return true;
            }
        }

        return false;
    }
}

// Initialize the plugin
new Category_Gallery_Block_Plugin();
