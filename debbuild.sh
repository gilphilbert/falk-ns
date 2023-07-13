#!/bin/bash

# FIX NOT INCREMENTING (NEEDS VAR(

CURRENT=`jq '.version' package.json | sed 's/"//g'`
MAJOR=`echo $CURRENT | awk -F'.' '{ print $1}'`
MINOR=`echo $CURRENT | awk -F'.' '{ print $2}'`
BUG=`echo $CURRENT | awk -F'.' '{ print $3}'`

BUILD=1

while getopts 'bmMx' flag; do
  case "${flag}" in
    b)
      ((BUG++))
      ;;
    m)
      ((MINOR++))
      BUG=0
      ;;
    M)
      ((MAJOR++))
      MINOR=0
      BUG=0
      ;;
    x)
      BUILD=0
      ;;
  esac
done

if [ $OPTIND -eq 1 ]; then
  ((BUG++))
fi

NEW="$MAJOR.$MINOR.$BUG"

if [[ $BUILD -eq 1 ]]; then
  echo "Building dist..."
  npm run build > /dev/null
fi

echo ""
echo "New version is $NEW"

cat package.json | jq --arg variable "$NEW" '.version = $variable' | tee package.json
cat package.json | jq --arg variable "$NEW" '.node_deb.version = $variable' | tee package.json
#
node-deb --install-strategy npm-install -- app.js api/ dist/
