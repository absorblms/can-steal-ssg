#!/bin/sh
# Function to search the array for valid params in the command line
# 0 = false
# 1 = true
# ex: ./bump.sh minor == 1
# ex: ./bump.sh fake == 0
containsElement () {
  local e
  for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 1; done
  return 0
}

# Valid version array
valid=("major" "minor" "patch" "from-git" "prerelease" "preminor" "premajor" "prepatch");

# Print help instructions
# ./bump.sh -h
# ./bump.sh --help
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Bump script Usage:"
  echo ""
  echo "- Help"
  echo "---------------------"
  echo "./`basename $0` -h                      Prints Help output"
  echo "./`basename $0` --help                  Prints Help output"
  echo ""
  echo "- Bump versions"
  echo "---------------------"
  echo "./`basename $0`                         Default settings. Bumps the package with the 'patch' versioning."
  for each in "${valid[@]}"
	do
      echo "./`basename $0` $each               Bumps the package a $each version"
  done
  echo "./`basename $0` 2.0.1                   Sets the version to the specified number"
  echo ""
  exit 0
fi

branch=`git rev-parse --abbrev-ref HEAD`;
echo "checking for upstream updates from $branch..."
git fetch upstream
git pull upstream $branch

# Check the first command line arg against the 'valid' array, set the answer to 'version'
containsElement $1 "${valid[@]}"
version=$?

# Pass the delimiter if the first arg is a valid grunt bump param
if [[ $version == 1 ]]
then
	delim="$1"
else
	delim="patch"
fi

# Check for params
if [[ ! -z $2 ]]
then
	params="$2"
elif [[ $version == 0 ]] && [[ ! -z $1 ]]
then
	params="$1"
else
	params=""
fi
echo "running version bump..."
echo "npm version $delim $params"
npm version $delim $params
git push upstream && git push --tags upstream
