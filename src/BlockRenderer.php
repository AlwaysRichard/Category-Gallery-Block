<?php
/**
 * Category Gallery Block Renderer
 *
 * Thin adapter that:
 * - Normalizes block attributes
 * - Handles archive auto-detection
 * - Delegates to the engine
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

class Category_Gallery_Block_Renderer {

    private $engine;

    public function __construct( Category_Gallery_Engine $engine ) {
        $this->engine = $engine;
    }

    /**
     * Render the gallery block
     *
     * @param array $attributes Block attributes from block.json
     * @return string HTML output
     */
    public function render( $attributes ) {
        // Extract attributes with defaults
        $sourceType = $attributes['sourceType'] ?? 'gallery';
        $galleries = $attributes['galleries'] ?? [];
        $categories = $attributes['categories'] ?? [];
        $includeUnpublished = $attributes['includeUnpublished'] ?? false;
        $layout = $attributes['layout'] ?? 'tiled';
        $columns = absint( $attributes['columns'] ?? 3 );
        $gutter = absint( $attributes['gutter'] ?? 8 );
        $targetHeight = absint( $attributes['targetHeight'] ?? 250 );
        $maxImages = absint( $attributes['maxImages'] ?? 0 );
        $linkToImage = $attributes['linkToImage'] ?? true;
        $linkToPost = $attributes['linkToPost'] ?? false;
        $crop = $attributes['crop'] ?? true;
        $size = $attributes['size'] ?? 'large';
        $exifTemplate = $attributes['exifTemplate'] ?? '';

        // Auto-detect taxonomy/category archive
        if ( is_tax( 'photo_gallery' ) ) {
            $current_term = get_queried_object();
            if ( $current_term && isset( $current_term->term_id ) ) {
                $sourceType = 'gallery';
                $galleries = [ $current_term->term_id ];
            }
        } elseif ( is_category() ) {
            $current_term = get_queried_object();
            if ( $current_term && isset( $current_term->term_id ) ) {
                $sourceType = 'category';
                $categories = [ $current_term->term_id ];
            }
        }

        // Validate selection
        if ( $sourceType === 'gallery' && empty( $galleries ) ) {
            return '<p class="cat-gallery__notice">' . esc_html__( 'No galleries selected.', 'category-gallery-block' ) . '</p>';
        }

        if ( $sourceType === 'category' && empty( $categories ) ) {
            return '<p class="cat-gallery__notice">' . esc_html__( 'No category selected.', 'category-gallery-block' ) . '</p>';
        }

        // Get attachments based on source type
        if ( $sourceType === 'category' ) {
            $attachments = $this->engine->get_featured_images_from_category( $categories[0], $includeUnpublished );
        } else {
            $attachments = $this->engine->get_attachments_from_galleries( $galleries, $includeUnpublished );
        }

        if ( empty( $attachments ) ) {
            return '<p class="cat-gallery__notice">' . esc_html__( 'No images found.', 'category-gallery-block' ) . '</p>';
        }

        // Limit if needed
        if ( $maxImages > 0 ) {
            $attachments = array_slice( $attachments, 0, $maxImages );
        }

        // Delegate to engine for HTML generation
        return $this->engine->build_gallery_html( $attachments, [
            'layout' => $layout,
            'columns' => $columns,
            'gutter' => $gutter,
            'targetHeight' => $targetHeight,
            'linkToImage' => $linkToImage,
            'linkToPost' => $linkToPost,
            'crop' => $crop,
            'size' => $size,
            'exifTemplate' => $exifTemplate,
        ]);
    }
}
