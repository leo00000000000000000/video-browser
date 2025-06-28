# Video Browser

A simple web application to browse and play videos from your local file system.

## Features

*   Scans your home directory for video files (.mp4, .webm, .ogg, .mov).
*   Generates thumbnails for each video.
*   Allows you to play videos directly in the browser.
*   Provides an option to disable videos from the manifest.

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd video-browser
    ```

2.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

3.  **Install FFmpeg:**

    FFmpeg is required to generate video thumbnails. Install it using your system's package manager:

    *   **macOS (with Homebrew):**

        ```bash
        brew install ffmpeg
        ```

    *   **Ubuntu/Debian:**

        ```bash
        sudo apt update
        sudo apt install ffmpeg
        ```

    *   **Windows (with Chocolatey):**

        First, install [Chocolatey](https://chocolatey.org/install).
        Then, open an **administrative** PowerShell or Command Prompt and run:

        ```bash
        choco install ffmpeg
        ```

4.  **Start the server:**

    ```bash
    node server.js
    ```

5.  **Open in browser:**

    Navigate to `http://localhost:3000` in your web browser.

## Usage

*   **Sync Videos:** Click the "Sync Videos" button to scan your home directory for videos and generate/update the video manifest and thumbnails.
*   **Play Video:** Click on a video's thumbnail or title to play it.
*   **Disable Video:** Use the checkbox next to each video to disable it. Disabled videos will not be playable.
