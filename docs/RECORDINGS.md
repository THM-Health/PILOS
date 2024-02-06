# Recording management

PILOS is able to manage recordings from BigBlueButton servers.
This includes the transfer of the recordings to PILOS for permanent storage and serving.

## Permissions

To allow the BBB-Server to write the recording files and PILOS to read the files, the file permissions need to be set correctly.
Therefore, you need to create a user and group on both systems.

### BBB-Server

On the BBB-Server we create a group `pilos-spool` and add the `bigbluebutton` user to this group.

```bash
# Create a new group shared by the BBB-Server and PILOS
addgroup pilos-spool --gid 2000
# Add the bigbluebutton user to the pilos-spool group
usermod -a -G pilos-spool bigbluebutton
```

### PILOS

On the PILOS server we also create a group `pilos-spool` with the same group id.

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

On the BBB-Server you need to set the mount point in the `spool_dir` setting of the `pilos.yml` file.

```yaml
spool_dir: /mnt/storage/recordings-spool
```

On PILOS you need to map the mount point to the `/var/www/html/storage/recordings-spool` folder of the docker container (adjust the `docker-compose.yml`).

```yaml
x-docker-pilos-common: &pilos-common
    volumes:
        - '/mnt/storage/recordings-spool:/var/www/html/storage/recordings-spool'
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

This user has no password, therefor it can only be used via ssh with key authentication.
To further secure the transfer, we will later restrict the user to only run the rsync command.


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

Notice the `/` at the end of the command, this is the path of the recordings-spool directory on the PILOS server as we restricted the key to only run the rsync command in this directory.

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

```dotenv
RECORDING_SPOOL_SUB_DIRECTORY=instance1
```
