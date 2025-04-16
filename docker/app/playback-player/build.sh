#!/bin/bash

# This script is used to download and build the playback player

# Version tag passed as argument
tag="${1}"

# If no tag is passed, exit
if [ -z "$tag" ]; then
    echo "No tag provided"
    exit 1
fi

downloadBase="https://github.com/bigbluebutton/bbb-playback/archive/refs/tags/v$tag.zip"
playerPath="/var/www/html/public/playback-player"

echo "Downloading $downloadBase"
temporaryDirectory=$(mktemp -d)
downloadFileName="$temporaryDirectory/player.zip"
folderName="$temporaryDirectory/bbb-playback-$tag"

wget -O "$downloadFileName" "$downloadBase"

echo "Extracting..."
if unzip -q -d "$temporaryDirectory" "$downloadFileName"; then
    echo "Extraction complete"

    # run install script
    echo "Building new player..."
    if ! cd "$folderName"; then
        echo "Entering directory $folderName failed"
        exit 2
    fi
    npm install
    REACT_APP_MEDIA_ROOT_URL=/recording/presentation npm run build

    # clear old public folder
    echo "Clearing old player..."
    rm -rf "$playerPath"

    # copy to public folder
    echo "Copying new player..."
    mv build "$playerPath"
else
    echo "Extraction failed"
fi

# Clean up temporary directory
rm -rf "$temporaryDirectory"
