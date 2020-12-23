#!/bin/bash

# exit on any failure in the pipeline
set -e

printf "%b" "Pre-commit check...\\n"

npm run lint

npm run test

echo "Updating aplication version"

BRANCH=`git branch | grep \* | cut -d ' ' -f2`
IFS="/"
TYPE=($BRANCH)
if [ "${TYPE[0]}" = "patch" ]; then
	echo "Updating to a patch version..."
	npm --no-git-tag-version version patch
elif [ "${TYPE[0]}" = "minor" ]; then
	echo "Updating to a minor version..."
	npm --no-git-tag-version version minor
elif [ "${TYPE[0]}" = "major" ]; then
	echo "Updating to a major version..."
	npm --no-git-tag-version version major
else
	echo "Could not determine branch type, so Updating to a patch version instead..."
	npm --no-git-tag-version version patch
fi

rm -rf package-lock.json
npm install
git add package.json package-lock.json

printf "%b" "Finished pre-commit check!\\n"
