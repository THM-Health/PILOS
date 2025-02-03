---
title: Recording management
description: Guide how to setup recording management with PILOS
---

## Introduction

PILOS is able to manage recordings from BigBlueButton servers.
This includes the transfer of the recordings to PILOS for permanent storage and serving.

Follow the steps below to set up the recording management.

## Permissions

To allow the BBB-Server to write the recording files and PILOS to read the files, the file permissions need to be set correctly.
Therefore, you need to create a user and group on both systems.

**On the BBB Server** you need to create a group `pilos-spool` and add the `bigbluebutton` user to this group.

```bash
# Create a new group shared by the BBB-Server and PILOS
addgroup pilos-spool --gid 2000
# Add the bigbluebutton user to the pilos-spool group
usermod -a -G pilos-spool bigbluebutton
```

**On the PILOS server** you also need to create a group `pilos-spool` with the same group id.

```bash
# Create a new group shared by the BBB-Server and PILOS
addgroup pilos-spool --gid 2000
```

## Transferring recordings

To transfer the recording files to PILOS you have two options:

- Shared storage
- Rsync over ssh

### Shared storage

To use shared storage, you need to mount the shared storage to the BBB-Servers and PILOS.

**On the BBB Server** you need to set the mount point in the `spool_dir` setting of the `pilos.yml` file.

```yaml
spool_dir: /mnt/storage/recordings-spool
```

**On the PILOS server** you need to map the mount point to the `/var/www/html/storage/recordings-spool` folder of the docker container (adjust the `docker-compose.yml`).

```yaml
x-docker-pilos-common: &pilos-common
    volumes:
        - "/mnt/storage/recordings-spool:/var/www/html/storage/recordings-spool"
```

#### Check transfer

Next make sure permissions are correctly set for the shared storage.

**On the PILOS server:**

```bash
chown pilos-spool:pilos-spool /mnt/storage/recordings-spool
chmod 775 /mnt/storage/recordings-spool
```

You can try to create a file in the shared storage from the BBB-Server and check if you can read it from PILOS.

**On the BBB-Server:**

```bash
sudo su - bigbluebutton -s /bin/bash -c echo "test" > /mnt/storage/recordings-spool/test.txt
```

**On PILOS:**

```bash
# Check if the file is readable
docker compose exec app cat storage/recordings-spool/test.txt
# Check if the file can be deleted
docker compose exec app rm storage/recordings-spool/test.txt
```

### Rsync over ssh

**On the PILOS server:**

We first have to create a new user on the PILOS server that should be used to transfer the files from the BBB-Server.

```bash
adduser --disabled-password --ingroup pilos-spool --gecos "" pilos-spool
```

This user has no password, therefore it can only be used via ssh with key authentication.
To further secure the transfer, you can later restrict the user to only run the rsync command.

**On the BBB server:**

1. Create an ssh key for the bigbluebutton user on the BBB-Server.

```bash
su - bigbluebutton -s /bin/bash -c "ssh-keygen -t ed25519 -N '' -f ~/.ssh/pilos && cat ~/.ssh/pilos.pub"
```

2. Edit the `.ssh/config` file of the bigbluebutton user and add the following lines.

```bash
su - bigbluebutton -s /bin/bash -c "nano ~/.ssh/config"
```

```
Host pilos
    HostName pilos.example.com
    User pilos-spool
    IdentityFile ~/.ssh/pilos
```

This will tell the BBB-Server to use the ssh key and the `pilos-spool` user when connecting to the PILOS server.

**On the PILOS server:**

The public key of the bigbluebutton user needs to be added to the `~/.ssh/authorized_keys` file of the `pilos-spool` user.

```bash
su - pilos-spool -s /bin/bash -c "mkdir ~/.ssh && chmod 700 ~/.ssh && nano ~/.ssh/authorized_keys"
```

You can paste the public key from the BBB-Server and restrict the key to only run the rsync command in the recordings-spool directory:

```
# Example key restricted to rsync and the path of the recordings-spool directory
command="/usr/bin/rrsync /srv/pilos/storage/recordings-spool/",restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII87OBtxWJYWUc/Y13O2GYZ5c91uR8HesEirQ4SMrpsM bigbluebutton@bbb-server
```

Lastly you need to make sure the `pilos-spool` user has the correct permissions to read and write the recordings-spool directory.

```bash
mkdir -p /srv/pilos/storage/recordings-spool/
chown pilos-spool:pilos-spool /srv/pilos/storage/recordings-spool/
chmod 775 /srv/pilos/storage/recordings-spool/
```

#### Check transfer

Next make sure permissions are correctly set for the shared storage.

**On the BBB-Server:**

```bash
su - bigbluebutton -s /bin/bash -c "echo "test" > test.txt && rsync --verbose --remove-source-files test.txt dev.pilos-thm.de:/"
```

Notice the `/` at the end of the command, this is the path of the recordings-spool directory on the PILOS server as you restricted the key to only run the rsync command in this directory.

**On PILOS:**

```bash
# Check if the file is readable
docker compose exec app cat storage/recordings-spool/test.txt
# Check if the file can be deleted
docker compose exec app rm storage/recordings-spool/test.txt
```

## Post publish script

To transfer the recording files to PILOS for permanent storage and serving, you need to setup a post_publish script.

You can find an example post_publish script in the `bigbluebutton` directory of the PILOS repository.
This script needs to be installed on all BBB-Servers in the `/usr/local/bigbluebutton/core/scripts/post_publish` directory.

You also need configure the script using the config file in the `bigbluebutton` directory of the PILOS repository.
Adjust and install the file in the `/etc/bigbluebutton/recording/` directory.

If you are using the shared storage, you need to set the `spool_dir` setting in the `pilos.yml` file to the local mountpoint on the BBB-Server.

```yaml
spool_dir: /mnt/storage/recordings-spool
```

If you are using rsync over ssh, you need to set the `spool_dir` setting in the `pilos.yml` file to the rsync destination.

```yaml
spool_dir: pilos.example.com:/
```

### Cleanup

BigBlueButton processes all recording formats independently of each other.
However, BigBlueButton only has a command to delete a recording, not a specific format.

We save a sender.done file for a meeting once the first format has been processed.
You can use [Scalelite's](https://github.com/blindsidenetworks/scalelite/blob/master/bigbluebutton/scalelite_prune_recordings) script to clean up the recordings. However, this can lead to data loss if not all formats have been processed before the cleanup is performed.

## Importing recording

Recording files are imported using the scheduler, checking for new files in the spool directory every minute.
New files are added to a queue and imported in the background.
You can check the queue status using Horizon (Main menu -> System Monitoring -> Horizon).

The import script expects the recording files to be inside a .tar archive file.
Each archive file should only contain the recording files of one meeting.
The script will try to extract the archive file to a temporary directory, import the recording files from there into the database and the application storage.

If the import was successful, the archive file will be deleted.

By default all recording files are only visible to the meeting owner. The owner can change the visibility of the recordings in the UI.

### Failed imports

If the import failed (extract failed, recording doesn't belong to a room, etc.), the archive file will be moved to the `failed` directory in the spool directory.
You can check the log files and Horizon for more information. You can also retry the import using Horizon.

## Config options

### Customize recording download

Room owners can download the raw recording files for archiving, uploading to other video platforms, etc. The BigBlueButton recording raw files include many files that typical users don't need. Therefore, you can customise which files are included in the download. You can filter the files using a regular expression in the .env file.

In this example, only pdf, ogg, mp4, m4v and webm files are included in the download.

```shell
RECORDING_DOWNLOAD_ALLOWLIST='^.*\.(pdf|ogg|mp4|m4v|webm)$'
```

### Max. retention period

Admins can customise the retention period for recordings, after which the system automatically deletes the recordings. This setting can be changed in the application settings on the UI.

You can also set a maximum retention period that cannot be exceeded by the administrators.
This setting can be defined in the .env file. The value can be either -1 = unlimited or a number of days.

```shell
RECORDING_MAX_RETENTION_PERIOD=365
```

### Max. recording description length

Users can change the description of a recording.
You can limit the length of the description in the .env file.
The current default value is 1000 characters.

```shell
RECORDING_DESCRIPTION_LIMIT=255
```

The maximum configurable value is 65,535 characters. As the entire description is displayed in the overview of the recordings, such a high limit is not recommended.

### Recording import hook

If you are unable to push recordings to your PILOS server as described above, you can let PILOS call a hook script before importing recordings.

```shell
RECORDING_IMPORT_BEFORE_HOOK=/usr/local/bin/pull_recordings.sh
```

This script should place tar files in the spool directory, just as the proposed BBB `post_publish` script would.

## Tips and tricks

### Using a different group id

You can use a different group id for the `pilos-spool` group, but you need to make sure the group id is the same on both systems.

For PILOS to also use the same group id, you need to adjust the `docker-compose.yml` file.

```yaml
x-docker-pilos-common: &pilos-common
    environment:
        PILOS_SPOOL_GID: 5000
```

### Using multiple BBB-Servers and PILOS instances

If you are sharing the same BBB-Serves with multiple PILOS instances, you need to make sure the recordings are transferred to the correct PILOS instance.
To do this, you should have a central storage server that is accessible from all BBB-Servers and PILOS instances.

The BBB-Servers mounts the spool directory from the central storage server.
Each PILOS instance has a subdirectory in the spool directory of the central storage server that only contains the recordings for this PILOS instance.
This subdirectory is mounted to the PILOS instance.

To tell the post_publish script in what subdirectory the recordings should be transferred, you need to set the `RECORDING_SPOOL_SUB_DIRECTORY` environment variable.
PILOS will send this as a meta variable on the creation of each meeting and the post_publish script will use this to transfer the recordings to the correct subdirectory.

```shell
RECORDING_SPOOL_SUB_DIRECTORY=instance1
```

### Update the BigBlueButton recording player

The BBB Recording Player is included in the Docker container.
However, it can be upgraded independently of the docker container.

You will need to map the player directory to the host system using docker compose.

```yaml
x-docker-pilos-common: &pilos-common
    env_file: .env
    volumes:
        - "./public/playback-player:/var/www/html/public/playback-player"
```

Next, use pilos-cli to build the player with the release version you want.

```bash
docker compose exec app pilos-cli playback-player:build 5.0.2
```
