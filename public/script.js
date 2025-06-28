// This script handles the client-side logic for the video browser.
// It loads video data from the manifest, displays video items with thumbnails,
// manages video playback, and allows users to toggle video disable status and trigger syncs.

const videoList = document.getElementById('video-list');
const videoPlayer = document.getElementById('video-player');
const videoElement = videoPlayer.querySelector('video');
const closePlayerButton = document.getElementById('close-player');
const syncButton = document.getElementById('sync-button');

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
 * Fetches the video manifest, clears the existing list, and displays video items.
 * Each video item includes a thumbnail, shortened filename, and a disable checkbox.
 */
async function loadVideos() {
  try {
    const response = await fetch('/video-manifest.json');
    const videos = await response.json();

    videoList.innerHTML = ''; // Clear existing list

    for (const video of videos) {
      const videoItem = document.createElement('div');
      videoItem.classList.add('video-item');

      // Create and append video thumbnail
      const videoThumbnail = document.createElement('img');
      videoThumbnail.src = video.thumbnail;
      const filename = video.path.split('/').pop();
      videoThumbnail.alt = filename;
      videoThumbnail.classList.add('video-thumbnail');
      videoItem.appendChild(videoThumbnail);

      // Create and append video title (shortened if too long)
      const videoTitle = document.createElement('span');
      videoTitle.textContent = filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
      videoTitle.addEventListener('click', () => {
        // Only play video if it's not disabled
        if (!video.disabled) {
          videoElement.src = `/video?path=${encodeURIComponent(video.path)}`;
          showPlayer();
          videoElement.play();
        }
      });
      videoItem.appendChild(videoTitle);

      // Create and append disable checkbox
      const disableCheckbox = document.createElement('input');
      disableCheckbox.type = 'checkbox';
      disableCheckbox.checked = video.disabled;
      disableCheckbox.id = `disable-${video.path}`;
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
      disableLabel.htmlFor = `disable-${video.path}`;
      disableLabel.textContent = 'Disable';
      videoItem.appendChild(disableLabel);

      videoList.appendChild(videoItem);
    }
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

// Load videos when the page initially loads
loadVideos();