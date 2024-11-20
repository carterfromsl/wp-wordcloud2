<?php
/**
 * Plugin Name: WordCloud2.js for WordPress
 * Description: A WordPress plugin that generates an HTML word cloud from a CSV file using wordcloud2.js <br><code>Shortcode settings: [wordcloud data="https://yourdomain.com/path/to/words.csv" column="column_name" min="5" terms="100" color="#ff0000" background="#f0f0f0" rotate="0.5" oob="0" linked="0" category="your-category" font="'Arial', sans-serif"]</code>
 * Version: 1.5.3
 * Author: StratLab Marketing
 * Author URI: https://strategylab.ca
 * Text Domain: wp-wordcloud2
 * Requires at least: 6.0
 * Requires PHP: 7.0
 * Update URI: https://github.com/carterfromsl/wp-wordcloud2/
*/

if (!defined('ABSPATH')) {
    exit; // You don't belong here.
}

// Connect with the StratLab Auto-Updater for plugin updates
add_action('plugins_loaded', function() {
    if (class_exists('StratLabUpdater')) {
        if (!function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $plugin_file = __FILE__;
        $plugin_data = get_plugin_data($plugin_file);

        do_action('stratlab_register_plugin', [
            'slug' => plugin_basename($plugin_file),
            'repo_url' => 'https://api.github.com/repos/carterfromsl/wp-wordcloud2/releases/latest',
            'version' => $plugin_data['Version'], 
            'name' => $plugin_data['Name'],
            'author' => $plugin_data['Author'],
            'homepage' => $plugin_data['PluginURI'],
            'description' => $plugin_data['Description'],
            'access_token' => '', // Add if needed for private repo
        ]);
    }
});

// Enqueue scripts
function wc_enqueue_scripts() {
    wp_enqueue_script('wordcloud2', plugins_url('js/wordcloud2.js', __FILE__), array(), '1.0', true);
    wp_enqueue_script('csv-loader', plugins_url('csv-loader.js', __FILE__), array('jquery'), '1.5.2', true);
}
add_action('wp_enqueue_scripts', 'wc_enqueue_scripts');

// Shortcode to generate the word cloud
function wc_wordcloud_shortcode($atts) {
    // Define default shortcode attributes
    $atts = shortcode_atts(array(
        'data'         => '',            // CSV file URL
        'column'       => '',            // Column to read from the CSV
        'min'          => 0,             // Minimum frequency filter (default is 0)
        'color'        => '#ff0000',     // Default color for words with the highest frequency (red)
        'background'   => '#f0f0f0',     // Default background color (light grey)
        'rotate'       => 0.5,           // Default rotation ratio (50%)
        'oob'          => 0,             // Whether words can be drawn out of bounds (default is no)
        'linked'       => 0,             // Whether words should be linked to search queries (default is 0)
        'category'     => '',            // Optional category for search query (default is empty)
        'terms'        => 100,           // Limit the number of terms to process from the CSV
        'font'         => '"Trebuchet MS", "Arial Unicode MS", "Droid Fallback Sans", sans-serif', // Default font family
    ), $atts, 'wordcloud');

    if (empty($atts['data'])) {
        return '<p>Please provide a valid CSV file URL.</p>';
    }

    // Generate a unique container ID for each shortcode instance to prevent conflicts
    $container_id = 'wordcloud-container-' . uniqid();

    // HTML container for the word cloud
    $html = '<div id="' . esc_attr($container_id) . '" class="wordcloud-container" style="width: 100%; height: 500px;"></div>';
    
    // Inject the CSV URL and other attributes into JS variables
    $html .= '<script type="text/javascript">
        jQuery(document).ready(function($) {
            // Wait for csv-loader.js to load
            if (typeof loadWordCloud === "function") {
                initializeWordCloud();
            } else {
                $(document).on("csvLoaderReady", function() {
                    initializeWordCloud();
                });
            }

            function initializeWordCloud() {
                var container = $("#' . esc_js($container_id) . '");
                container.data({
                    "csvUrl": "' . esc_url($atts['data']) . '",
                    "selectedColumn": "' . esc_js($atts['column']) . '",
                    "minFrequency": ' . intval($atts['min']) . ',
                    "baseColor": "' . esc_js($atts['color']) . '",
                    "backgroundColor": "' . esc_js($atts['background']) . '",
                    "rotateRatio": ' . floatval($atts['rotate']) . ',
                    "outOfBounds": ' . intval($atts['oob']) . ',
                    "linked": ' . intval($atts['linked']) . ',
                    "category": "' . esc_js($atts['category']) . '",
                    "termsLimit": ' . intval($atts['terms']) . ',
                    "fontFamily": "' . esc_js($atts['font']) . '"
                });
                loadWordCloud(container);
            }
        });
    </script>';

    return $html;
}
add_shortcode('wordcloud', 'wc_wordcloud_shortcode');
?>
