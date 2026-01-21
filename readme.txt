=== Gallery Block ===
Contributors: richardcox
Tags: gallery, block, category, taxonomy, exif
Requires at least: 6.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Standalone gallery block that displays images from posts filtered by gallery taxonomy or category. Auto-detects taxonomy/category archives.

== Description ==

Gallery Block is a flexible Gutenberg block designed for photographers and content creators. It allows you to display image galleries dynamically based on post categories or a custom "photo_gallery" taxonomy.

Key features include:
* **Auto-Detection:** Automatically detects if it is being viewed on a category or gallery archive and displays relevant images.
* **Multiple Layouts:** Choose between Tiled, Grid, Masonry, or Collage layouts.
* **EXIF Support:** Display camera metadata (ISO, Shutter Speed, Aperture) using a customizable template.
* **Flexible Linking:** Link images directly to the media file, the parent post, or both via a toggle menu.
* **Performance:** Uses unique class names to avoid conflicts and supports lazy loading/eager loading settings.

== Installation ==

1. Upload the `gallery-block` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. In the Block Editor, search for "Gallery" to add the block to your posts or pages.

== Frequently Asked Questions ==

= Does this work with custom taxonomies? =
Yes, it is specifically built to support a `photo_gallery` taxonomy or standard WordPress categories.

= Can I show EXIF data? =
Yes. You can use placeholders like `{FNumber}`, `{ISOSpeedRatings}`, and `{ShutterSpeedValue}` in the block settings to generate custom captions.

== Screenshots ==

1. The block settings in the Gutenberg editor.
2. An example of the Tiled layout on a live site.

== Changelog ==

= 1.3.0 =
* Initial stable release.
* Support for Tiled, Grid, Masonry, and Collage layouts.
* Added conditional EXIF template processing.

== Upgrade Notice ==

= 1.3.0 =
Initial version release.