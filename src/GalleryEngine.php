<?php
/**
 * Category Gallery Engine
 *
 * Pure gallery logic - no WordPress block awareness.
 * Reusable from shortcodes, REST endpoints, CLI, or other blocks.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

class Category_Gallery_Engine {

    /**
     * Get all attachments from posts tagged with gallery taxonomy terms
     *
     * @param array $gallery_ids Array of gallery term IDs
     * @param bool $include_unpublished Include draft/pending/private posts
     * @return array Array of attachment objects with parent_post property
     */
    public function get_attachments_from_galleries( $gallery_ids, $include_unpublished = false ) {
        global $wpdb;

        if ( empty( $gallery_ids ) ) {
            return [];
        }

        $placeholders = implode( ',', array_fill( 0, count( $gallery_ids ), '%d' ) );

        $status_clause = $include_unpublished
            ? "AND p.post_status IN ('publish', 'draft', 'pending', 'private')"
            : "AND p.post_status = 'publish'";

        $query = $wpdb->prepare(
            "SELECT DISTINCT a.ID, p.ID as parent_post_id
             FROM {$wpdb->posts} a
             INNER JOIN {$wpdb->posts} p ON a.post_parent = p.ID
             INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
             INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             WHERE tt.taxonomy = 'photo_gallery'
               AND tt.term_id IN ({$placeholders})
               {$status_clause}
               AND a.post_type = 'attachment'
               AND a.post_mime_type LIKE 'image/%'
             ORDER BY p.post_date DESC, a.menu_order ASC, a.ID ASC",
            $gallery_ids
        );

        $results = $wpdb->get_results( $query );

        $attachments = [];
        foreach ( $results as $row ) {
            $att = get_post( $row->ID );
            if ( $att ) {
                $att->parent_post = get_post( $row->parent_post_id );
                $attachments[] = $att;
            }
        }

        return $attachments;
    }

    /**
     * Get featured images from posts in a category
     *
     * @param int $category_id Category ID
     * @param bool $include_unpublished Include draft/pending/private posts
     * @return array Array of attachment objects with parent_post property
     */
    public function get_featured_images_from_category( $category_id, $include_unpublished = false ) {
        if ( empty( $category_id ) ) {
            return [];
        }

        $post_statuses = $include_unpublished
            ? [ 'publish', 'draft', 'pending', 'private' ]
            : [ 'publish' ];

        $args = [
            'cat' => $category_id,
            'post_type' => 'post',
            'post_status' => $post_statuses,
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
            'meta_query' => [
                [
                    'key' => '_thumbnail_id',
                    'compare' => 'EXISTS'
                ]
            ]
        ];

        $posts = get_posts( $args );
        $attachments = [];

        foreach ( $posts as $post ) {
            $thumbnail_id = get_post_thumbnail_id( $post->ID );
            if ( $thumbnail_id ) {
                $att = get_post( $thumbnail_id );
                if ( $att ) {
                    $att->parent_post = $post;
                    $attachments[] = $att;
                }
            }
        }

        return $attachments;
    }

    /**
     * Build gallery HTML from attachments
     *
     * @param array $attachments Array of attachment objects
     * @param array $opts Gallery options (layout, columns, gutter, etc.)
     * @return string HTML markup
     */
    public function build_gallery_html( $attachments, $opts ) {
        $layout = $opts['layout'] ?? 'tiled';
        $columns = absint( $opts['columns'] ?? 3 );
        $gutter = absint( $opts['gutter'] ?? 8 );
        $targetHeight = absint( $opts['targetHeight'] ?? 250 );
        $linkToImage = $opts['linkToImage'] ?? true;
        $linkToPost = $opts['linkToPost'] ?? false;
        $crop = $opts['crop'] ?? true;
        $size = $opts['size'] ?? 'large';
        $exifTemplate = $opts['exifTemplate'] ?? '';

        // Decide if we show click menu (both options enabled)
        $showClickMenu = $linkToImage && $linkToPost;

        // Build CSS classes
        $classes = [ 'cat-gallery', "cat-gallery--{$layout}" ];
        if ( ! $crop && $layout === 'collage' ) {
            $classes[] = 'cat--nocrop';
        }

        // Build inline styles and data attributes
        $style_parts = [];
        $data_attrs = [];

        if ( $layout === 'grid' ) {
            $style_parts[] = "--cat-grid-cols: repeat({$columns}, 1fr)";
            $style_parts[] = "--cat-gap: {$gutter}px";
        } elseif ( $layout === 'masonry' ) {
            $style_parts[] = "--cat-columns: {$columns}";
            $style_parts[] = "--cat-gap: {$gutter}px";
        } elseif ( $layout === 'tiled' ) {
            $style_parts[] = "--cat-gap: {$gutter}px";
            $data_attrs[] = "data-target-height=\"{$targetHeight}\"";
            $data_attrs[] = "data-gutter=\"{$gutter}\"";
        } elseif ( $layout === 'collage' ) {
            $style_parts[] = "--cat-cols: {$columns}";
            $style_parts[] = "--cat-gap: {$gutter}px";
            $style_parts[] = "--cat-row: 12px";
        }

        $style_attr = ! empty( $style_parts ) ? ' style="' . esc_attr( implode( '; ', $style_parts ) ) . '"' : '';
        $data_attr_str = ! empty( $data_attrs ) ? ' ' . implode( ' ', $data_attrs ) : '';

        $html = '<div class="' . esc_attr( implode( ' ', $classes ) ) . '"' . $style_attr . $data_attr_str . '>';

        foreach ( $attachments as $att ) {
            $att_id = $att->ID;
            $img_data = wp_get_attachment_image_src( $att_id, $size );
            $img_url = $img_data[0] ?? '';
            $img_width = $img_data[1] ?? 0;
            $img_height = $img_data[2] ?? 0;

            $file_url = wp_get_attachment_url( $att_id );
            $post_permalink = isset( $att->parent_post ) ? get_permalink( $att->parent_post->ID ) : '';

            // Get caption from EXIF template or attachment caption
            $caption = '';
            if ( ! empty( $exifTemplate ) ) {
                $caption = $this->build_caption_from_exif( $att_id, $exifTemplate );
            }
            if ( empty( $caption ) ) {
                $caption = wp_get_attachment_caption( $att_id );
            }

            $html .= '<figure class="cat-gallery__item">';

            // Determine link behavior
            if ( $linkToImage && ! $linkToPost ) {
                // Direct to lightbox
                $html .= '  <a href="' . esc_url( $file_url ) . '" class="cat-gallery__link cat-gallery__lightbox-trigger" data-full-image="' . esc_url( $file_url ) . '">';
                $html .= '    <img class="cat-gallery__img skip-lazy" src="' . esc_url( $img_url ) . '" alt="' . esc_attr( $caption ) . '" width="' . esc_attr( $img_width ) . '" height="' . esc_attr( $img_height ) . '" loading="eager" />';
                $html .= '  </a>';
            } elseif ( ! $linkToImage && $linkToPost && $post_permalink ) {
                // Direct to post
                $html .= '  <a href="' . esc_url( $post_permalink ) . '" class="cat-gallery__link">';
                $html .= '    <img class="cat-gallery__img skip-lazy" src="' . esc_url( $img_url ) . '" alt="' . esc_attr( $caption ) . '" width="' . esc_attr( $img_width ) . '" height="' . esc_attr( $img_height ) . '" loading="eager" />';
                $html .= '  </a>';
            } elseif ( $showClickMenu ) {
                // Show menu - wrap image in clickable div
                $html .= '  <div class="cat-gallery__link cat-gallery__menu-trigger" data-full-image="' . esc_url( $file_url ) . '">';
                $html .= '    <img class="cat-gallery__img skip-lazy" src="' . esc_url( $img_url ) . '" alt="' . esc_attr( $caption ) . '" width="' . esc_attr( $img_width ) . '" height="' . esc_attr( $img_height ) . '" loading="eager" />';
                $html .= '  </div>';
            } else {
                // No link
                $html .= '  <img class="cat-gallery__img skip-lazy" src="' . esc_url( $img_url ) . '" alt="' . esc_attr( $caption ) . '" width="' . esc_attr( $img_width ) . '" height="' . esc_attr( $img_height ) . '" loading="eager" />';
            }

            // Click menu - only when BOTH options enabled
            if ( $showClickMenu && $post_permalink ) {
                $html .= '  <div class="cat-gallery__menu" role="menu">';
                $html .= '    <span class="cat-gallery__menu-label">View:</span>';
                $html .= '    <button role="menuitem" class="cat-gallery__lightbox-trigger" data-full-image="' . esc_url( $file_url ) . '">Image</button>';
                $html .= '    <span class="cat-gallery__menu-sep">|</span>';
                $html .= '    <a role="menuitem" href="' . esc_url( $post_permalink ) . '">Post</a>';
                $html .= '  </div>';
            }

            $html .= '</figure>';
        }

        $html .= '</div>';
        return $html;
    }

    /**
     * Build caption from EXIF metadata template with conditional text support
     *
     * @param int $att_id Attachment ID
     * @param string $template EXIF template string
     * @return string Caption text
     */
    public function build_caption_from_exif( $att_id, $template ) {
        $meta = wp_get_attachment_metadata( $att_id );
        if ( empty( $meta ) || empty( $meta['image_meta'] ) ) {
            return '';
        }

        $exif = $meta['image_meta'];
        $file_path = get_attached_file( $att_id );

        $exif_data = [];
        if ( function_exists( 'exif_read_data' ) && file_exists( $file_path ) ) {
            $raw_exif = @exif_read_data( $file_path );
            if ( $raw_exif ) {
                $exif_data = $raw_exif;
            }
        }

        // Build replacements array
        $replacements = [];
        $replacements['{FileName}'] = basename( $file_path );

        // Copyright
        $copyright_value = ! empty( $exif['copyright'] ) ? $exif['copyright'] :
                           ( ! empty( $exif_data['Copyright'] ) ? $exif_data['Copyright'] : '' );
        $replacements['{Copyright}'] = $copyright_value;

        // Handle {Copyright,default} syntax
        if ( preg_match( '/\{Copyright,([^}]+)\}/', $template, $matches ) ) {
            $default_copyright = trim( $matches[1] );
            $copyright_final = ! empty( $copyright_value ) ? $copyright_value : $default_copyright;
            $template = str_replace( $matches[0], $copyright_final, $template );
        }

        // Camera Make
        $replacements['{CameraMake}'] = ! empty( $exif['camera'] ) ? $exif['camera'] :
                                         ( ! empty( $exif_data['Make'] ) ? $exif_data['Make'] : '' );

        // Camera Model
        $replacements['{CameraModel}'] = ! empty( $exif_data['Model'] ) ? $exif_data['Model'] : '';

        // ISO
        $iso = ! empty( $exif_data['ISOSpeedRatings'] ) ? $exif_data['ISOSpeedRatings'] : '';
        $replacements['{ISOSpeedRatings}'] = $iso ? 'ISO-' . $iso : '';

        // Date/Time
        $replacements['{DateTimeOriginal}'] = ! empty( $exif['created_timestamp'] ) ?
                                               date( 'Y-m-d H:i:s', $exif['created_timestamp'] ) :
                                               ( ! empty( $exif_data['DateTimeOriginal'] ) ? $exif_data['DateTimeOriginal'] : '' );

        // Focal Length
        $focal = ! empty( $exif['focal_length'] ) ? $exif['focal_length'] :
                 ( ! empty( $exif_data['FocalLength'] ) ? $exif_data['FocalLength'] : '' );
        if ( $focal && strpos( $focal, '/' ) !== false ) {
            $parts = explode( '/', $focal );
            if ( count( $parts ) == 2 && $parts[1] != 0 ) {
                $focal = round( $parts[0] / $parts[1] ) . 'mm';
            }
        } elseif ( is_numeric( $focal ) ) {
            $focal = round( $focal ) . 'mm';
        }
        $replacements['{FocalLength}'] = $focal;

        // Shutter Speed
        $shutter = ! empty( $exif['shutter_speed'] ) ? $exif['shutter_speed'] :
                   ( ! empty( $exif_data['ExposureTime'] ) ? $exif_data['ExposureTime'] : '' );
        if ( $shutter && strpos( $shutter, '/' ) !== false ) {
            $parts = explode( '/', $shutter );
            if ( count( $parts ) == 2 && $parts[0] != 0 ) {
                $decimal = $parts[1] / $parts[0];
                if ( $decimal >= 1 ) {
                    $shutter = '1/' . round( $decimal ) . 's';
                } else {
                    $shutter = round( 1 / $decimal, 1 ) . 's';
                }
            }
        } elseif ( is_numeric( $shutter ) ) {
            if ( $shutter >= 1 ) {
                $shutter = round( $shutter, 1 ) . 's';
            } else {
                $shutter = '1/' . round( 1 / $shutter ) . 's';
            }
        }
        $replacements['{ShutterSpeedValue}'] = $shutter;

        // Aperture
        $aperture = ! empty( $exif['aperture'] ) ? $exif['aperture'] :
                    ( ! empty( $exif_data['FNumber'] ) ? $exif_data['FNumber'] : '' );
        if ( $aperture && strpos( $aperture, '/' ) !== false ) {
            $parts = explode( '/', $aperture );
            if ( count( $parts ) == 2 && $parts[1] != 0 ) {
                $aperture = 'f/' . round( $parts[0] / $parts[1], 1 );
            }
        } elseif ( is_numeric( $aperture ) ) {
            $aperture = 'f/' . $aperture;
        }
        $replacements['{FNumber}'] = $aperture;

        // Process conditional text syntax: {'text', Placeholder}
        $template = preg_replace_callback(
            '/\{([\'"])(.*?)\1\s*,\s*(\w+)\}/',
            function( $matches ) use ( $replacements ) {
                $conditional_text = $matches[2];
                $placeholder = '{' . $matches[3] . '}';

                if ( isset( $replacements[ $placeholder ] ) && ! empty( $replacements[ $placeholder ] ) ) {
                    return $conditional_text . $replacements[ $placeholder ];
                }
                return '';
            },
            $template
        );

        // Standard replacements
        $caption = str_replace( array_keys( $replacements ), array_values( $replacements ), $template );

        // Clean up empty placeholders
        $caption = preg_replace( '/\{[^}]+\}/', '', $caption );

        // Clean up multiple separators
        $caption = preg_replace( '/\s*\|\s*\|/', ' |', $caption );
        $caption = preg_replace( '/^\s*\|\s*/', '', $caption );
        $caption = preg_replace( '/\s*\|\s*$/', '', $caption );
        $caption = trim( $caption );

        return $caption;
    }
}
