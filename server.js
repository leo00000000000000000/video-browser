// This is the main server file for the video browser application.
// It uses Express.js to serve static files, stream videos, and handle API requests
// for syncing video manifests and toggling video statuses.

import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file's path and directory name for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static('public'));

/**
 * GET /video
 * Streams a video file to the client. Supports range requests for seeking.
 * Requires 'path' query parameter with the absolute path to the video file.
 */
app.get('/video', (req, res) => {
  const videoPath = req.query.path;

  // Validate video path and existence
  if (!videoPath || !fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse range header for partial content requests
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    // Send 206 Partial Content status for range requests
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Send full content for non-range requests
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

/**
 * POST /sync
 * Triggers the find-videos.js script to rescan for videos and update the manifest.
 */
app.post('/sync', (req, res) => {
  // Execute the find-videos.js script as a child process
  exec('node find-videos.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send('Sync complete');
  });
});

/**
 * POST /toggle-video-status
 * Updates the 'disabled' status of a specific video in the video-manifest.json.
 * Requires 'videoPath' and 'disabled' (boolean) in the request body.
 */
app.post('/toggle-video-status', (req, res) => {
  const { videoPath, disabled } = req.body;
  const manifestPath = path.join(__dirname, 'public', 'video-manifest.json');

  // Validate request body parameters
  if (!videoPath || typeof disabled === 'undefined') {
    return res.status(400).send('Missing videoPath or disabled status');
  }

  // Read the current video manifest
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading video manifest:', err);
      return res.status(500).send('Error reading video manifest');
    }

    let videos = JSON.parse(data);
    // Find the video by its path in the manifest
    const videoIndex = videos.findIndex(video => video.path === videoPath);

    if (videoIndex > -1) {
      // Update the disabled status
      videos[videoIndex].disabled = disabled;
      // Write the updated manifest back to the file
      fs.writeFile(manifestPath, JSON.stringify(videos, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing video manifest:', err);
          return res.status(500).send('Error writing video manifest');
        }
        res.send('Video status updated');
      });
    } else {
      res.status(404).send('Video not found in manifest');
    }
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
