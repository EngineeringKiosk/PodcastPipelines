#!/bin/bash

archive_dir="./cloud/archive"

# for all directories starting with "ep" and ending with a number
# go into the dir and list all files
for dir in ep*
do
    cd $dir
    # for all files ending with .aup tar them in a new archive and delete the original
    # check if the archive doesn exist already
    # do onlye compact and archive older ones and do not touch the last two weeks
    for file in *.aup3
    do
        # check if the files in the directory weren't modified in the last 14 days
        # if so skip them
        if [ $(find $file -mtime -14) ]; then
            echo "skipping $file as it was modified in the last 14 days"
            continue
        fi
        echo "compacting $file"
        if [ -f $file.tar.xz ]; then
            echo "archive already exists"
            continue
        fi
        # compact the file to tar.xz
        tar -cJf $file.tar.xz $file
        echo "done"
        # check if tar was created and has a size of more than 10MB and delte the original
        if [ -f $file.tar.xz ] && [ $(stat -c%s "$file.tar.xz") -gt 10000000 ]; then
            echo "deleting $file"
            rm $file
        fi
    done
    cd ..
    # as everything is done move the dir to the archive
    mv $dir $archive_dir
done