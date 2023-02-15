#!/bin/bash

current_dir=$(pwd)
archive_dir="$current_dir/cloud/archive"

# enable nullglob so that if no files are found the for loop is skipped
shopt -s nullglob

# for all directories starting with "ep" and ending with a number
# go into the dir and list all files
for dir in ep*
do
    (
    echo "checking $dir"
    cd "$dir" || exit
    # for all files ending with .aup tar them in a new archive and delete the original
    # check if the archive doesn exist already
    # do onlye compact and archive older ones and do not touch the last two weeks
    for file in *.aup3
    do
        echo "checking $file"
        # skip file if it doesn't exist
        # check if the files in the directory weren't modified in the last 14 days
        # if so skip them
        if [ ! -f "$file" ] || [ $(find "$file" -mtime -14 -print) ]; then
            echo "skipping $file as file were modified in the last 14 days"
            # skip this file
            continue
        fi
        echo "compacting $file"
        if [ -f "$file.tar.xz" ]; then
            echo "archive already exists"
            continue
        fi
        # compact the file to tar.xz
        tar -cJf "$file.tar.xz" "$file"
        echo "done"
        # check if tar was created and has a size of more than 100MB and delte the original
        if [ -f "$file.tar.xz" ] && [ $(stat -c%s "$file.tar.xz") -gt 100000000 ]; then
            echo "deleting $file"
            rm "$file"
        fi
    done
    # if dir doesn't contain any files ending with .aup3
    if [ ! "$(find . -type f -name '*.aup3')" ]; then
        # check if there are any files ending with tar.xz
        if [ "$(find . -type f -name '*.aup3.tar.xz')" ]; then
            # as everything is done move the dir to the archive if archive dir exists
            if [ -d "$archive_dir" ]; then
                echo "moving $dir to $archive_dir"
                mv "$current_dir/$dir" "$archive_dir"
            else
                echo "skipping $dir as archive dir doesn't exist"
            fi
        else    
            echo "skipping $dir as it doesn't contain any .tar.xz files"
        fi
    else
        echo "skipping $dir as it still contains .aup3 files"
    fi
    )
done