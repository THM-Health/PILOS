#!/bin/bash

set -eu

# Build the docs for these tags (the last tag of old major releases)
# We build the docs for historical reasons. The branch no longer exists
# since the release is no longer supported/maintained.
TAGS=()

# Build the docs only for these release branches
BRANCHES=(
  master
  2.x
)
REMOTE="origin"

git fetch --all
git fetch --tags
current_branch=$(git rev-parse --abbrev-ref HEAD)

for tag in "${TAGS[@]}"; do

  if [ "$tag" != "$current_branch" ]; then
    git fetch "$REMOTE" "$tag"
  fi

  git checkout "$tag"
  if [ -f docusaurus.config.js ]; then
    majorVersion="$(echo $tag | cut -d. -f1)"
    version=v${majorVersion}
    echo "Adding documentation for $version"
    npm run docusaurus docs:version "${version}"
  else
    echo "Warning: branch/tag $(version) does not contain a docusaurus.config.js!"
  fi

done

for branch in "${BRANCHES[@]}"; do

  if [ "$branch" != "$current_branch" ]; then
    git fetch "$REMOTE" "$branch":"$branch"
  fi

  git checkout "$branch"
  if [ -f docusaurus.config.js ]; then
    # If branch name is master, use 3.x as version
    if [ "$branch" == "master" ]; then
      version="v3"
    else
      # Otherwise, name version as the branch name
      majorVersion="$(echo $branch | cut -d. -f1)"
      version=v${majorVersion}
    fi

    echo "Adding documentation for $version"
    npm run docusaurus docs:version "${version}"
  else
    echo "Warning: branch $(branch) does not contain a docusaurus.config.js!"
  fi

done

git checkout "$current_branch"
