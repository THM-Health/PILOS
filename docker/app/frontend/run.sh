#!/usr/bin/env sh

# Setup vars
HASH_FILE="/var/www/html/public/$VITE_BUILD_DIR/hash"
PREVIOUS_HASH=""
export VITE_BUILD_DIR="build"

# Function to set the hash of previous runs from the file or create the hash file if it doesn't exist
function getPreviousHash() {
    if [ -f "HASH_FILE" ]; then
        PREVIOUS_HASH="$(<"$HASH_FILE")"
        echo "Hash file exists, hash is: $PREVIOUS_HASH"
    else
        touch "$HASH_FILE"
        echo "Hash file created"
    fi
}

# Function to set the new hash based on VITE_ environment variables and frontend files
function getNewHash() {
    NEW_HASH=$(printenv | grep VITE_ | md5sum | awk '{ print $1 }')

    # Get hash for every frontend file in the "resources" directory
    for DIR in "/var/www/html/resources"
    do
        NEW_HASH+=$(find "$DIR" -type f -exec md5sum {} \; | md5sum | awk '{ print $1 }')
    done
}

# Function to build the frontend and save the new hash in the file for future comparison
function buildFrontend() {
    echo "Build frontend"
    # Run the build
    npm run build
    # Put the new hash in the file for the next time
    echo "$NEW_HASH" > "$HASH_FILE"
    echo "Saved new hash, hash is: $NEW_HASH"
}

# If --pre-build is passed, set the env variable VITE_BUILD_DIR to 'pre-build'
if [ "$1" = "--pre-build" ]; then
    echo "Pre-building frontend"
    export VITE_BUILD_DIR=build/next
fi

# Retrieve the previous hash
getPreviousHash
# Calculate the new hash
getNewHash

# Check if the frontend needs to be rebuilt
if [ "$NEW_HASH" != "$PREVIOUS_HASH" ]; then
    echo "Frontend hash changed"
    buildFrontend
else
    echo "Frontend hash unchanged, don't rebuild frontend"
fi
