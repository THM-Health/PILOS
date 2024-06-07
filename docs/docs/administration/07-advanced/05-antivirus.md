---

title: Antivirus
description: Guide on how to set up antivirus scanning
---

:::note

This is a new experimental feature and therefore not enabled by default.

:::

## Introduction

PILOS allows users to upload files to rooms for use in BigBlueButton meetings and to share files directly with other users in PILOS. Users can also upload a profile picture, and admins can upload several files to customize the PILOS instance in the admin settings. To prevent the upload of malicious files that could later be accessed by other users and cause harm, PILOS provides an antivirus scanning feature.

:::warning

Note that files uploaded during a meeting inside BigBlueButton are not scanned by an antivirus solution. All users should be aware of the risks of downloading files from the internet and should only download files from trusted sources, use antivirus software on their local machines, and keep it up to date.

:::

## Setup

As part of form validation, PILOS can send all uploaded files to a ClamAV server for scanning. You need to run a [`ajilaag/clamav-rest`](https://hub.docker.com/r/ajilaag/clamav-rest) server to provide the scanning service.

## Configuration

| Option                 | Default Value | Description                                                    |
|------------------------|---------------|----------------------------------------------------------------|
| `ANTIVIRUS_ENABLED`    | `false`       | Enable the antivirus service                                   |
| `ANTIVIRUS_CLAMAV_URL` |               | REST API Endpoint of the `ajilaag/clamav-rest` service         |

## Docker Compose Service

To run the ClamAV server as part of the Docker Compose setup, you need to add the following service to your `docker-compose.yml` file:

```yaml
services:
  clamav-rest:
    image: ajilaag/clamav-rest
    read_only: true
    user: "100:101"
    volumes:
      - clamav:/clamav:rw
      - run-clamav:/run/clamav:rw
      - var-log-clamav:/var/log/clamav:rw

volumes:
  clamav:
  run-clamav:
  var-log-clamav:
```

Next, adjust your `.env` file to include the following configuration:

```bash
ANTIVIRUS_ENABLED=true
ANTIVIRUS_CLAMAV_URL=http://clamav-rest:9000/scan
```
