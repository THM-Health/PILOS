#!/usr/bin/env bash

# Setup vars
MD5FILE=/usr/local/etc/frontend/hash
PREVIOUSMD5=""

# If there was a previous hash get it if not create the file for later
if [ -f "$MD5FILE" ]; then
  PREVIOUSMD5="$(<"$MD5FILE")"
else
  "touch" "$MD5FILE"
fi

# Get hash of the build relevant MIX_ env variables
MD5=$(printenv | grep MIX_ | md5sum | awk '{ print $1 }')

# Get hash for every frontend file
for DIR in "./resources"
do
  MD5+=$(find "$DIR" -type f -exec md5sum {} \; | md5sum | awk '{ print $1 }')
done

# Compare hashes
if [ "$MD5" != "$PREVIOUSMD5" ]; then
  echo "Frontend hash changed"
  echo "Rebuild frontend"
  # Run run build
  npm run build
  # Put new hash in the file for next time
  echo "$MD5" > "$MD5FILE"
  echo "Saved new hash"
else
  echo "Frontend hash unchanged, don't rebuild frontend"
fi
