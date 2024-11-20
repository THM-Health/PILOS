#!/bin/bash

set -eu

# Build the docs for these tags (the last tag of old major releases)
# We build the docs for historical reasons. The branch no longer exists
# since the release is no longer supported/maintained.
TAGS=()

# Build the docs only for these release branches
BRANCHES=(
  2.x
  3.x
  4.x
)

LAST_VERSION=v4

REMOTE="origin"

git fetch --all
git fetch --tags
origin=$(git config --get remote.origin.url)
current_path=$(pwd)

rm -rf temp_versioned_docs
mkdir -p temp_versioned_docs
git clone "$origin" temp_versioned_docs

for tag in "${TAGS[@]}"; do

  cd "$current_path"
  cd temp_versioned_docs

  git checkout "$tag"
  if [ -f docs/docusaurus.config.js ]; then
    majorVersion=$(echo "$tag" | cut -d. -f1)
    version=v${majorVersion}

    echo "Adding documentation for $version"

    cd "$current_path"

    rm -rf docs sidebars.json
    cp -r temp_versioned_docs/docs/docs .
    cp -r temp_versioned_docs/docs/sidebars.js .

    npm run docusaurus docs:version "${version}"
  else
    echo "Warning: branch/tag ${version} does not contain a docusaurus.config.js!"
  fi

done

for branch in "${BRANCHES[@]}"; do
  cd "$current_path"
  cd temp_versioned_docs

  git checkout "$branch"
  if [ -f docs/docusaurus.config.js ]; then
    # Name version as the branch name
    majorVersion=$(echo "$branch" | cut -d. -f1)
    version=v${majorVersion}

    echo "Adding documentation for $version"

    cd "$current_path"

    rm -rf docs sidebars.json
    cp -r temp_versioned_docs/docs/docs .
    cp -r temp_versioned_docs/docs/sidebars.js .

    npm run docusaurus docs:version "${version}"
  else
    echo "Warning: branch ${branch} does not contain a docusaurus.config.js!"
  fi

done
cd "$current_path"

# Cleanup
rm -rf temp_versioned_docs

# Return to the original branch
git reset --hard HEAD

# Edit docusaurus.config.js lastVersion to the last version
sed -i 's/lastVersion: "current"/lastVersion: "'"${LAST_VERSION}"'"/g' docusaurus.config.js
