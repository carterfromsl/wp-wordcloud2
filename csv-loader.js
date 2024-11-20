jQuery(document).ready(function($) {
    // Function to parse CSV and extract word and frequency pairs from the specified column
    window.parseCSV = function(text, selectedColumn, minFrequency, termsLimit) {
        let lines = text.split('\n');
        let headers = lines[0].split(',');
        let selectedIndex = -1;

        // Identify the selected column or default to the first column
        if (selectedColumn) {
            selectedIndex = headers.indexOf(selectedColumn.trim());
        }
        if (selectedIndex === -1) {
            selectedIndex = 0; // Default to the first column if no valid selection is made
        }

        let data = [];
        let maxFrequency = 0;

        for (let i = 1; i < lines.length && data.length < termsLimit; i++) {
            let row = lines[i].split(',');
            if (row.length > selectedIndex) {
                let [word, frequencyStr] = row[selectedIndex].split(':');
                let frequency = parseInt(frequencyStr);
                if (!isNaN(frequency)) {
                    data.push([word, frequency]);
                    if (frequency > maxFrequency) {
                        maxFrequency = frequency;
                    }
                }
            }
        }

        let normalizedData = [];
        for (let i = 0; i < data.length; i++) {
            let normalizedValue = Math.round((data[i][1] / maxFrequency) * 100);
            if (normalizedValue >= minFrequency) {
                normalizedData.push([data[i][0], normalizedValue]);
            }
        }

        return normalizedData;
    };

    // Load and render word cloud for each container instance
    window.loadWordCloud = function(container) {
        var csvUrl = container.data("csvUrl");
        var selectedColumn = container.data("selectedColumn");
        var minFrequency = container.data("minFrequency");
        var termsLimit = container.data("termsLimit");
        var linked = container.data("linked");
        var category = container.data("category");
        var fontFamily = container.data("fontFamily");

        console.log("Attempting to load font for word cloud...");

        // Load the specified font before rendering the word cloud
        if (document.fonts && fontFamily) {
            const fontFace = new FontFace(fontFamily, `local(${fontFamily})`);
            document.fonts.add(fontFace);

            fontFace.load().then(() => {
                console.log("Font loaded successfully. Rendering word cloud...");
                renderWordCloud(container, csvUrl, selectedColumn, minFrequency, termsLimit, linked, category);
            }).catch((error) => {
                console.error('Failed to load font:', error);
                renderWordCloud(container, csvUrl, selectedColumn, minFrequency, termsLimit, linked, category);
            });
        } else {
            renderWordCloud(container, csvUrl, selectedColumn, minFrequency, termsLimit, linked, category);
        }
    };

    function renderWordCloud(container, csvUrl, selectedColumn, minFrequency, termsLimit, linked, category) {
        $.ajax({
            url: csvUrl,
            dataType: 'text',
            success: function(data) {
                var wordArray = parseCSV(data, selectedColumn, minFrequency, termsLimit);

                let colorArray = container.data("baseColor").split(",").map(function(c) { return c.trim(); });
                let colorIndex = 0;
                const black50 = { r: 50, g: 50, b: 50 };

                // Start observing the container before rendering the word cloud
                observeWordCloud(container[0], linked, category);

                WordCloud(container[0], {
                    list: wordArray,
                    gridSize: 8,
                    weightFactor: function(size) {
                        return size;
                    },
                    color: function(word, size) {
                        const color = colorArray[colorIndex % colorArray.length];
                        colorIndex++;
                        const wordRGB = hexToRGB(color);
                        const fadeFactor = Math.min(1, size / 50);
                        return interpolateColor(wordRGB, black50, 1 - fadeFactor);
                    },
                    rotateRatio: container.data("rotateRatio"),
                    backgroundColor: container.data("backgroundColor"),
                    fontFamily: container.data("fontFamily"),
                    drawOutOfBound: container.data("outOfBounds") === 1,
                    classes: "wordcloud-item",
                    html: true,
                    done: function() {
                        console.log("Word cloud rendering done.");
                    }
                });
            },
            error: function() {
                console.error("Failed to load CSV file.");
            }
        });
    }

    // Function to generate the search URL for a word
    window.generateLink = function(word, category) {
        let link = `/?s=${encodeURIComponent(word)}`;
        if (category && category !== '') {
            link += `&category_name=${encodeURIComponent(category)}`;
        }
        return link;
    };

    // Function to inject the link into a word element
    window.injectLinkIntoWord = function(spanElement, linked, category) {
        if (linked && spanElement) {
            const word = $(spanElement).text();
            const link = generateLink(word, category);
            $(spanElement).html(`<a href="${link}" style="color: inherit; text-decoration: none;">${word}</a>`);
        }
    };

    // Function to observe when new spans are added and inject links
    window.observeWordCloud = function(container, linked, category) {
        console.log("Starting to observe word cloud container for links...");
        const observer = new MutationObserver(function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'SPAN') {
                            console.log("New span detected, injecting link...");
                            injectLinkIntoWord(node, linked, category); // Inject link when a new span is added
                        }
                    });
                }
            }
        });

        // Start observing the target container for added child elements
        observer.observe(container, { childList: true });
    };

    // Helper functions moved globally
    window.hexToRGB = function(hex) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };

    window.interpolateColor = function(color1, color2, factor) {
        let result = {};
        for (let key in color1) {
            result[key] = Math.round(color1[key] + factor * (color2[key] - color1[key]));
        }
        return `rgb(${result.r}, ${result.g}, ${result.b})`;
    };

    // Trigger a custom event to signal that the csv-loader functions are ready
    $(document).trigger("csvLoaderReady");
});
