// This script scans the user's home directory for video files,
// generates thumbnails for them, and creates a manifest file
// (video-manifest.json) in the 'public' directory.
// The manifest stores video paths, their disabled status, and thumbnail paths.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file's path and directory name for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeDir = os.homedir();
const manifestPath = path.join(__dirname, 'public', 'video-manifest.json');
let existingVideos = new Map();

// Load existing manifest if it exists to preserve disabled status
if (fs.existsSync(manifestPath)) {
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const parsedManifest = JSON.parse(manifestContent);
    parsedManifest.forEach(video => {
      existingVideos.set(video.path, video.disabled);
    });
  } catch (err) {
    console.error('Error reading or parsing existing video manifest:', err);
  }
}

let videos = [];

/**
 * Recursively finds video files in a given directory.
 * @param {string} dir - The directory to search.
 */
function findVideos(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Exclude common directories to speed up the search and avoid permissions issues
          if (!['node_modules', '.git', 'Library', 'Application Support'].some(d => fullPath.includes(d))) {
            findVideos(fullPath);
          }
        } else {
          const ext = path.extname(file).toLowerCase();
          // Check for common video file extensions
          if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
            // Preserve existing disabled status, default to false for new videos
            const isDisabled = existingVideos.has(fullPath) ? existingVideos.get(fullPath) : false;
            videos.push({ path: fullPath, disabled: isDisabled, thumbnail: '' });
          }
        }
      } catch (err) {
        // Ignore errors from files we can't access (e.g., permission denied)
      }
    }
  } catch (err) {
    // Ignore errors from directories we can't access (e.g., permission denied)
  }
}

/**
 * Generates thumbnails for a list of video files using ffmpeg.
 * Thumbnails are saved in the 'public/thumbnails' directory.
 * @param {Array<Object>} videoList - An array of video objects.
 */
async function generateThumbnails(videoList) {
  const thumbnailDir = path.join(__dirname, 'public', 'thumbnails');
  // Create thumbnail directory if it doesn't exist
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir);
  }

  for (const video of videoList) {
    // Define thumbnail path based on video filename
    const thumbnailPath = path.join(thumbnailDir, `${path.basename(video.path)}.jpg`);
    // Store relative path for web access
    video.thumbnail = `/thumbnails/${path.basename(video.path)}.jpg`;

    // Generate thumbnail only if it doesn't already exist
    if (!fs.existsSync(thumbnailPath)) {
      console.log(`Generating thumbnail for ${video.path}...`);
      try {
        // Execute ffmpeg command to extract a frame as a thumbnail
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -i "${video.path}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailPath}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error generating thumbnail for ${video.path}: ${error.message}`);
              reject(error);
            } else {
              console.log(`Thumbnail generated for ${video.path}`);
              resolve();
            }
          });
        });
      } catch (e) {
        // Continue even if thumbnail generation fails for one video (e.g., corrupted file)
        console.error(`Failed to generate thumbnail for ${video.path}`);
      }
    }
  }
}

/**
 * Main function to execute the video scanning and thumbnail generation process.
 */
async function main() {
  console.log('Scanning for videos in your home directory...');
  findVideos(homeDir); // Find all video files

  await generateThumbnails(videos); // Generate thumbnails for found videos

  // Write the updated video manifest to a JSON file
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(videos, null, 2)
  );

  console.log(`Found ${videos.length} videos. Manifest created.`);
}

main(); // Execute the main function