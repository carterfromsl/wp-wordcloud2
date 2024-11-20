jQuery(document).ready(function($) {
    if (typeof csvUrl === 'undefined') {
        console.error('No CSV URL provided.');
        return;
    }

    if (typeof minFrequency === 'undefined') {
        minFrequency = 0; // Default minimum frequency to 0 if not provided
    }

    if (typeof baseColor === 'undefined') {
        baseColor = '#ff0000'; // Default to red if no color is provided
    }

    if (typeof backgroundColor === 'undefined') {
        backgroundColor = '#f0f0f0'; // Default background color
    }

    if (typeof rotateRatio === 'undefined') {
        rotateRatio = 0.5; // Default rotation ratio
    }

    if (typeof outOfBounds === 'undefined') {
        outOfBounds = 0; // Default to no out-of-bounds drawing
    }

    if (typeof linked === 'undefined') {
        linked = 0; // Default to no linking if undefined
    }

    if (typeof termsLimit === 'undefined') {
        termsLimit = 100; // Default to 100 if not provided
    }
	
	if (typeof fontFamily === 'undefined') {
        fontFamily = '"Trebuchet MS", "Arial Unicode MS", "Droid Fallback Sans", sans-serif'; // Default font if not provided
    }
	
	// Split the baseColor string by commas if it contains multiple colors
    let colorArray = baseColor.split(',').map(c => c.trim());

    // Helper function to convert hex color to RGB
    function hexToRGB(hex) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // Function to interpolate between two colors (used for fading)
    function interpolateColor(color1, color2, factor) {
        let result = {};
        for (let key in color1) {
            result[key] = Math.round(color1[key] + factor * (color2[key] - color1[key]));
        }
        return `rgb(${result.r}, ${result.g}, ${result.b})`;
    }
    
    // Function to parse CSV file and apply scaling
    function parseCSV(text) {
        var lines = text.split('\n');
        var data = [];
        var maxFrequency = 0;

        // Limit the number of words processed to 'termsLimit'
        for (var i = 0; i < lines.length && i < termsLimit; i++) {
            var row = lines[i].split(',');
            if (row.length === 2) {
                var word = row[0];
                var frequency = parseInt(row[1]);
                if (!isNaN(frequency)) {
                    data.push([word, frequency]);
                    if (frequency > maxFrequency) {
                        maxFrequency = frequency;
                    }
                }
            }
        }

        // Now, normalize the frequencies and filter based on minFrequency
        var normalizedData = [];
        for (var i = 0; i < data.length; i++) {
            var normalizedValue = Math.round((data[i][1] / maxFrequency) * 100);
            if (normalizedValue >= minFrequency) { // Apply the filter here
                normalizedData.push([data[i][0], normalizedValue]);
            }
        }

        return normalizedData;
    }

    // Function to calculate color based on the normalized value
    function calculateColor(normalizedValue, baseHSL) {
        let lightness = (normalizedValue / 100) * 50;
        return `hsl(${baseHSL.h}, ${baseHSL.s}%, ${lightness}%)`;
    }

    // Function to generate the search URL for a word
    function generateLink(word) {
        let link = `/?s=${encodeURIComponent(word)}`;
        if (category && category !== '') {
            link += `&category_name=${encodeURIComponent(category)}`;
        }
        return link;
    }
	
	// Function to inject the link into a word element
    function injectLinkIntoWord(spanElement) {
        if (linked && spanElement) {
            const word = $(spanElement).text();
            const link = generateLink(word);
            $(spanElement).html(`<a href="${link}" style="color: inherit; text-decoration: none;">${word}</a>`);
        }
    }

    // Function to observe when new spans are added and inject links
    function observeWordCloud() {
        const targetNode = document.getElementById('wordcloud-container');

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'SPAN') {
                            injectLinkIntoWord(node); // Inject link when a new span is added
                        }
                    });
                }
            }
        });

        // Start observing the target node for added child elements
        observer.observe(targetNode, { childList: true });
    }

    // Load the specified font before rendering the word cloud
    function loadFontAndRenderCloud() {
        if (document.fonts && fontFamily) {
            const fontFace = new FontFace(fontFamily, `local(${fontFamily})`);
            document.fonts.add(fontFace);

            fontFace.load().then(() => {
                renderWordCloud(); // Font loaded, now render the cloud
            }).catch((error) => {
                console.error('Failed to load font:', error);
                renderWordCloud(); // Render anyway if the font fails to load
            });
        } else {
            renderWordCloud(); // FontFace API not supported, just render the cloud
        }
    }

    // Function to render the word cloud
    function renderWordCloud() {
        $.ajax({
            url: csvUrl,
            dataType: 'text',
            success: function(data) {
                var wordArray = parseCSV(data);

                let colorIndex = 0; // Track current color index

                // Define black for fade-out
                const black50 = { r: 50, g: 50, b: 50 }; // 50% black

                // Generate the word cloud
                WordCloud(document.getElementById('wordcloud-container'), {
                    list: wordArray,
                    gridSize: 8,
                    weightFactor: function(size) {
                        return size;
                    },
                    color: function(word, size) {
                        // Cycle through colors in colorArray
                        const color = colorArray[colorIndex % colorArray.length];
                        colorIndex++;

                        const wordRGB = hexToRGB(color);
                        // Fade to 50% black for smaller words
                        const fadeFactor = Math.min(1, size / 50); // Scale between 1 and 0.5
                        return interpolateColor(wordRGB, black50, 1 - fadeFactor);
                    },
                    rotateRatio: rotateRatio,
                    backgroundColor: backgroundColor,
                    fontFamily: fontFamily, // Apply the specified font family
                    drawOutOfBound: outOfBounds === 1,
                    classes: 'wordcloud-item',
                    html: true // Ensure we're rendering HTML
                });

                // Start observing the word cloud container for new spans
                observeWordCloud();
            },
            error: function() {
                console.error('Failed to load CSV file.');
            }
        });
    }

    // Load the font and render the word cloud
    loadFontAndRenderCloud();
});