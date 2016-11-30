#!/bin/bash
set -e
# set -v
EXT_NAME="focus-reader-view-chrome-extension"
BUILD_DIR="/tmp/$EXT_NAME"
ZIP_FILE="/Users/$USER/Desktop/${EXT_NAME}.zip"
rm -rf $BUILD_DIR
rm -rf $ZIP_FILE
cp -R . $BUILD_DIR
rm -rf "${BUILD_DIR}/.*" # remove all hidden files
zip -r $ZIP_FILE $BUILD_DIR
echo -e "New zip at:\n$ZIP_FILE"
