---
title: Streaming
description: Guide to setting up live streaming with PILOS
---

## Introduction

PILOS supports livestreaming BigBlueButton meetings to an RTMP endpoint via the [BBB-Streaming-Server](https://github.com/THM-Health/BBB-Streaming-Server).

Follow the steps below to enable livestreaming in PILOS.

## Setup

### 1. Install the BBB-Streaming-Server

The BBB-Streaming-Server is a separate Docker Compose stack that requires a dedicated server with sufficient CPU, memory, and bandwidth.

Refer to the [BBB-Streaming-Server setup guide](https://github.com/THM-Health/BBB-Streaming-Server) for installation instructions.

Verify the setup by calling the `/health` route of the BBB-Streaming-Server.

### 2. Configure PILOS

Enable livestreaming in PILOS by adding the following environment variables to the `.env` file:

```shell
STREAMING_ENABLED=true
STREAMING_API=https://streaming.domain.tld/
```

- `STREAMING_API` should point to the BBB-Streaming-Server’s base URL, where the `/health` route is accessible.
- If the API is in a subdirectory (e.g., `/streaming`), include the full path in the URL.

### 3. Secure the API

If the API is publicly accessible, consider:

- Setting an IP allowlist
- Enabling basic authentication

To configure basic authentication in PILOS, use these environment variables:

```shell
STREAMING_AUTH_TYPE=basic
STREAMING_AUTH_BASIC_USERNAME=streaming
STREAMING_AUTH_BASIC_PASSWORD="abc123"
```

## Usage

### 1. Global streaming settings

Once livestreaming is enabled in the .env file, additional settings can be configured in the admin UI:

- **Default pause image**: Pause image, used if no pause image is set for the room type or room.
- **Settings per room type**:
    - **Enabled**: Enable or disable livestreaming for this room type. (default: disabled)
    - **Default image**: Pause image for this room type, used if no pause image is set for the room.

### 2. Configure streaming for a room

A livestreaming button will appear in the room features toolbar.
Clicking it opens the live streaming tab, where you can configure streaming settings for the room.

If the room type does not have streaming enabled, the button will be disabled, and clicking it will display a message stating that streaming is not enabled for this room type.

Inside the live streaming tab, you can configure the stream using the 'Configure streaming' button, which opens a modal with the following options:

- **Enabled**: Enable or disable live streaming for new meetings created in this room.
- **RTMP(S) URL**: The RTMP(S) URL where the stream will be sent. To stream to YouTube, use the Stream URL from YouTube Studio and append the stream key. Example: rtmp://a.rtmp.youtube.com/live2/ab01-cd23-ef45-gh67-ij89.
- **Pause Image**: Custom pause image for this room. If none is set, the system will use the room type's default or the global pause image.

### 3. Start meeting

Once the settings are saved, start the meeting as usual.
Before joining, all users must acknowledge that the meeting may be streamed.

### 4. Controlling livestream

While the meeting is running, livestream controls are available in the live streaming tab:

- **Start**: Begins the livestream. The stream enters a "Queued" state and starts within a few seconds when picked up by the BBB-Streaming-Server.
- **Pause/Resume**: Pause the stream at any time. When paused, the pause image is displayed, and audio is muted.
- **Stop**: Ends the livestream. The stream also stops automatically when the BigBlueButton meeting ends.

## Configuration Options

| Option                          | Default Value | Description                                          |
| ------------------------------- | ------------- | ---------------------------------------------------- |
| `STREAMING_ENABLED`             | `false`       | Enable livestreaming                                 |
| `STREAMING_API`                 | `null`        | URL of the BBB-Streaming-Server                      |
| `STREAMING_AUTH_TYPE`           | `null`        | Authentication method (`null`: none, `basic`: Basic) |
| `STREAMING_AUTH_BASIC_USERNAME` | `null`        | Username for basic authentication                    |
| `STREAMING_AUTH_BASIC_PASSWORD` | `null`        | Password for basic authentication                    |
| `STREAMING_REFRESH_INTERVAL`    | `10`          | UI refresh interval (seconds) for status and FPS     |
| `STREAMING_SHOW_FPS`            | `false`       | Display FPS counter in the UI                        |
