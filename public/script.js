// This script handles the client-side logic for the video browser.
// It loads video data from the manifest, displays video items with thumbnails,
// manages video playback, and allows users to toggle video disable status and trigger syncs.

const videoList = document.getElementById('video-list');
const videoPlayer = document.getElementById('video-player');
const videoElement = videoPlayer.querySelector('video');
const closePlayerButton = document.getElementById('close-player');
const syncButton = document.getElementById('sync-button');
const sortBy = document.getElementById('sort-by');
const displayMode = document.getElementById('display-mode');

let videos = [];

/**
 * Shows the video player overlay.
 */
function showPlayer() {
  videoPlayer.classList.remove('hidden');
}

/**
 * Hides the video player overlay and pauses the video.
 */
function hidePlayer() {
  videoPlayer.classList.add('hidden');
  videoElement.pause();
}

/**
 * Sorts and displays video items based on the selected options.
 */
function renderVideos() {
  const sortByValue = sortBy.value;
  const displayModeValue = displayMode.value;

  // Sort videos
  videos.sort((a, b) => {
    if (sortByValue === 'filename') {
      return a.path.localeCompare(b.path);
    } else if (sortByValue === 'codec') {
      return a.codec.localeCompare(b.codec);
    }
    return 0;
  });

  // Clear existing list
  videoList.innerHTML = '';

  // Set display mode
  if (displayModeValue === 'list') {
    videoList.classList.add('list-view');
  } else {
    videoList.classList.remove('list-view');
  }

  videos.forEach((video, index) => {
    const videoItem = document.createElement('div');
    videoItem.classList.add('video-item');

    // Create and append video thumbnail
    const videoThumbnail = document.createElement('img');
    videoThumbnail.src = video.thumbnail;
    const filename = video.path.split('/').pop();
    videoThumbnail.alt = filename;
    videoThumbnail.classList.add('video-thumbnail');
    videoThumbnail.addEventListener('click', () => {
      // Only play video if it's not disabled
      if (!video.disabled) {
        videoElement.src = `/video?id=${index}`;
        videoElement.load(); // Load the new video source
        showPlayer();
        videoElement.play();
      }
    });
    videoItem.appendChild(videoThumbnail);

    // Create and append video title (shortened if too long)
    const videoTitle = document.createElement('span');
    videoTitle.textContent = filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
    videoTitle.addEventListener('click', () => {
      // Only play video if it's not disabled
      if (!video.disabled) {
        videoElement.src = `/video?id=${index}`;
        videoElement.load(); // Load the new video source
        showPlayer();
        videoElement.play();
      }
    });
    videoItem.appendChild(videoTitle);

    // Create and append disable checkbox
    const disableCheckbox = document.createElement('input');
    disableCheckbox.type = 'checkbox';
    disableCheckbox.checked = video.disabled;
    disableCheckbox.id = `disable-${index}`;
    disableCheckbox.addEventListener('change', async (event) => {
      const isDisabled = event.target.checked;
      try {
        // Send request to server to update video's disabled status
        const response = await fetch('/toggle-video-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoPath: video.path, disabled: isDisabled }),
        });
        if (!response.ok) {
          alert('Failed to update video status.');
          // Revert checkbox state if update fails
          event.target.checked = !isDisabled;
        }
      } catch (error) {
        console.error('Error toggling video status:', error);
        alert('An error occurred while updating video status.');
        event.target.checked = !isDisabled;
      }
    });
    videoItem.appendChild(disableCheckbox);

    // Create and append label for the disable checkbox
    const disableLabel = document.createElement('label');
    disableLabel.htmlFor = `disable-${index}`;
    disableLabel.textContent = 'Disable';
    videoItem.appendChild(disableLabel);

    videoList.appendChild(videoItem);
  });
}

/**
 * Fetches the video manifest and renders the video list.
 */
async function loadVideos() {
  try {
    const response = await fetch('/video-manifest.json');
    videos = await response.json();
    renderVideos();
  } catch (error) {
    console.error('Error loading videos:', error);
    videoList.innerHTML = 'Could not load video list. Please run the sync first.';
  }
}

/**
 * Triggers a video sync by calling the server's /sync endpoint.
 * Updates UI to indicate syncing in progress.
 */
async function syncVideos() {
    syncButton.textContent = 'Syncing...';
    syncButton.disabled = true;
    try {
        const response = await fetch('/sync', { method: 'POST' });
        if (response.ok) {
            await loadVideos(); // Reload videos after successful sync
        } else {
            alert("Failed to sync videos. See server console for details.");
        }
    } catch (error) {
        console.error('Error syncing videos:', error);
        alert("An error occurred while syncing videos.");
    } finally {
        syncButton.textContent = 'Sync Videos';
        syncButton.disabled = false;
    }
}

// Event listeners for player controls and sync button
closePlayerButton.addEventListener('click', hidePlayer);
syncButton.addEventListener('click', syncVideos);
sortBy.addEventListener('change', renderVideos);
displayMode.addEventListener('change', renderVideos);


// Load videos when the page initially loads
loadVideos();