
// content.js

// The spoilerKeywords array is now loaded from keywords.js
// It is available globally because keywords.js is loaded before content.js in manifest.json.

/**
 * Checks if a given text contains any of the spoiler keywords.
 * @param {string} text - The text to check.
 * @returns {boolean} - True if a spoiler keyword is found, false otherwise.
 */
function containsSpoiler(text) {
    const lowerCaseText = text.toLowerCase();
    // Ensure both the text and the keyword are in lowercase for comparison
    return spoilerKeywords.some(keyword => lowerCaseText.includes(keyword.toLowerCase()));
}

/**
 * Processes a single video element to hide spoilers.
 * It looks for image elements within the video container and changes their src.
 * It also finds the title element and changes its text.
 * @param {HTMLElement} videoElement - The HTML element representing a video.
 */
function processVideoElement(videoElement) {
    // Find the title element. YouTube uses various classes for titles.
    // Common selectors include: #video-title, .yt-core-attributed-string, .title
    // Added '.yt-lockup-metadata-view-model-wiz__title span' to target titles in related videos.
    const titleElement = videoElement.querySelector('#video-title, .yt-core-attributed-string, .title, .yt-lockup-metadata-view-model-wiz__title span');

    if (titleElement && titleElement.textContent) {
        const originalTitle = titleElement.textContent;

        // Check if the title has already been modified to "Spoiler" to avoid re-processing
        if (titleElement.textContent === "Spoiler" && videoElement.querySelector('.spoiler-overlay')) {
            return; // Already processed, exit
        }

        if (containsSpoiler(originalTitle)) {
            console.log(`Spoiler detected in title: "${originalTitle}". Hiding...`);

            // Change the title text
            titleElement.textContent = "Spoiler";

            // Find the thumbnail container. This is often 'ytd-thumbnail' or a similar element.
            // This is a more reliable target for adding an overlay.
            // Added 'yt-thumbnail-view-model' to the selector for related videos.
            const thumbnailContainer = videoElement.querySelector('ytd-thumbnail, yt-thumbnail-view-model');

            if (thumbnailContainer) {
                // Check if an overlay already exists to prevent adding multiple
                if (!thumbnailContainer.querySelector('.spoiler-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.classList.add('spoiler-overlay');
                    // Apply styles directly to ensure it covers the thumbnail
                    Object.assign(overlay.style, {
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'black', // Or any color to hide the thumbnail
                        zIndex: '10', // Ensure it's above the image
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    });
                    overlay.textContent = 'SPOILER'; // Optional text on the overlay

                    // Ensure the thumbnail container is positioned relative for the absolute overlay to work
                    if (window.getComputedStyle(thumbnailContainer).position === 'static') {
                        thumbnailContainer.style.position = 'relative';
                    }

                    thumbnailContainer.appendChild(overlay);
                }
            }
        }
    }
}

/**
 * Finds all video elements on the page and processes them.
 */
function processAllVideoElements() {
    // YouTube video elements are often within 'ytd-video-renderer', 'ytd-grid-video-renderer',
    // 'ytd-compact-video-renderer', 'ytd-rich-grid-media', 'ytd-playlist-video-renderer', etc.
    // A more general selector for common video containers:
    const videoSelectors = [
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-rich-grid-media',
        'ytd-playlist-video-renderer',
        'ytd-shelf-renderer', // For shelves of videos
        'ytd-watch-next-secondary-results-renderer', // For sidebar recommendations
        'yt-lockup-view-model' // Added this selector for related videos on watch page
    ];

    videoSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(processVideoElement);
    });
}

// --- Main execution logic ---

// 1. Process existing videos on page load
processAllVideoElements();

// 2. Use MutationObserver to detect dynamically loaded content (e.g., scrolling, navigation)
const observer = new MutationObserver(mutations => {
    let newContentAdded = false;
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
            newContentAdded = true;
        }
    });

    if (newContentAdded) {
        console.log('New content added. Re-processing all videos...');
        processAllVideoElements();
    }
});

// Start observing the document body for changes
observer.observe(document.body, {
    childList: true, // Observe direct children additions/removals
    subtree: true    // Observe all descendants
});

// Add a listener for YouTube's custom navigation events (SPA behavior)
// This is crucial for single-page application (SPA) navigation where the URL changes
// but the page doesn't fully reload.
window.addEventListener('yt-navigate-finish', () => {
    console.log('YouTube navigation finished. Re-processing videos...');
    processAllVideoElements();
});

// Initial run after a small delay to ensure YouTube's initial content is loaded
// This helps catch elements that might be rendered slightly after document_idle
setTimeout(processAllVideoElements, 1000);
