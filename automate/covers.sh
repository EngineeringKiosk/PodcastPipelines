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
    # get the episode number
    episode_number=$(echo "$file" | sed -e 's/.*ep\([0-9]*\)_cover.png/\1/')
    echo "episode number: $episode_number"
    # check if the small cover exists
    if [ -f "$dir/ep${episode_number}_cover_small.png" ]; then
        echo "skipping $file as small cover already exists"
        continue
    fi
    # resize the cover to 1500x1500
    echo "resizing $file to 1500x1500"
    convert "$file" -resize 1500x1500 "$dir/ep${episode_number}_cover_small.png"
done