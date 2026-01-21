<?php
/**
 * Plugin Name: Gallery Block
 * Description: Standalone gallery block that displays images from posts filtered by gallery taxonomy or category. Auto-detects taxonomy/category archives. Uses unique class names to avoid conflicts.
 * Version:     1.3.0
 * Author:      Richard Cox
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: gallery-block
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

// Load the clean three-layer architecture
require_once __DIR__ . '/Scaffolding.php';
