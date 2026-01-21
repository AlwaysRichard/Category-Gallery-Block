<?php
/**
 * Gallery Block Scaffolding - WordPress integration layer
 *
 * Responsibilities (ONLY):
 * - Register the block
 * - Enqueue frontend assets (CSS/JS)
 * - Wire up the render callback
 *
 * No business logic. No HTML generation. Just scaffolding.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

require_once __DIR__ . '/src/GalleryEngine.php';
require_once __DIR__ . '/src/BlockRenderer.php';

class Gallery_Block {

    const HANDLE = 'gallery-block';

    private $renderer;

    public function __construct() {
        // Initialize engine and renderer
        $engine = new Gallery_Engine();
        $this->renderer = new Gallery_Block_Renderer( $engine );

        // Hook into WordPress
        add_action( 'init', [ $this, 'register_block' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
        add_action( 'enqueue_block_assets', [ $this, 'enqueue_frontend_assets' ] );
    }

    /**
     * Register the block using block.json
     */
    public function register_block() {
        register_block_type( __DIR__ . '/build', [
            'render_callback' => [ $this, 'render_block' ],
        ] );
    }

    /**
     * Enqueue frontend assets (CSS and JS) using inline loading
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
        wp_register_style( self::HANDLE, false, [], '1.3.0' );
        if ( $css ) {
            wp_add_inline_style( self::HANDLE, $css );
        }
        wp_enqueue_style( self::HANDLE );

        // Register and enqueue inline scripts
        wp_register_script( self::HANDLE, false, [], '1.3.0', true );
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
            if ( $post && has_block( 'gallery/block', $post ) ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Render block callback - delegates to renderer
     */
    public function render_block( $attributes, $content, $block ) {
        return $this->renderer->render( $attributes );
    }
}

new Gallery_Block();
