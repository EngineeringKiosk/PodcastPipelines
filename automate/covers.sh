#!/bin/bash

dir="$1"
if [ -z "$dir" ]; then
    echo "usage: $0 <dir>"
    exit
fi

# read all files in format of ep<episode number>_cover.png
# check if ep<episode number>_cover_small.png exists
# otherwise create it by resizing to 1500x1500

for file in "$dir"/ep*_cover.png
do
    echo "checking $file"
    if [ ! -f "$file" ]; then
        echo "skipping $file as it doesn't exist"
        continue
    fi
    # check if the small cover exists
    small_cover="${file%_cover.png}_cover_small.png"
    echo "checking $small_cover"
    if [ -f "$small_cover" ]; then
        echo "skipping $file as small cover already exists"
        continue
    fi
    # resize the cover to 1500x1500
    echo "resizing $file to 1500x1500"
    convert "$file" -resize 1500x1500 "$small_cover"
done