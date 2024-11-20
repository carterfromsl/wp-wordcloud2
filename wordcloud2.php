<?php
/**
 * Plugin Name: WordCloud2.js for WordPress
 * Description: A WordPress plugin that generates an HTML word cloud from a CSV file using wordcloud2.js <br><code>Shortcode settings: [wordcloud data="https://yourdomain.com/path/to/words.csv" min="5" terms="100" color="#ff0000" background="#f0f0f0" rotate="0.5" oob="0" linked="0" category="your-category" font="'Arial', sans-serif"]</code>
 * Version: 1.4
 * Author: StratLab Marketing
 */

// Enqueue scripts
function wc_enqueue_scripts() {
    wp_enqueue_script('wordcloud2', plugins_url('js/wordcloud2.js', __FILE__), array(), '1.0', true);
    wp_enqueue_script('csv-loader', plugins_url('csv-loader.js', __FILE__), array('jquery'), '1.4', true);
}
add_action('wp_enqueue_scripts', 'wc_enqueue_scripts');

// Shortcode to generate the word cloud
function wc_wordcloud_shortcode($atts) {
    $atts = shortcode_atts(array(
        'data'         => '',            // CSV file URL
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

    // HTML container for the word cloud
    $html = '<div id="wordcloud-container" style="width: 100%; height: 500px;"></div>';
    
    // Inject the CSV URL and other into JS variables
    $html .= '<script type="text/javascript">
		var csvUrl = "' . esc_url($atts['data']) . '";
		var minFrequency = ' . intval($atts['min']) . ';
		var baseColor = "' . esc_attr($atts['color']) . '";
		var backgroundColor = "' . esc_attr($atts['background']) . '";
		var rotateRatio = ' . floatval($atts['rotate']) . ';
		var outOfBounds = ' . intval($atts['oob']) . ';
		var linked = ' . intval($atts['linked']) . ';
		var category = "' . esc_attr($atts['category']) . '";
		var termsLimit = ' . intval($atts['terms']) . ';
		var fontFamily = "' . esc_js($atts['font']) . '";
	</script>';

    return $html;
}
add_shortcode('wordcloud', 'wc_wordcloud_shortcode');