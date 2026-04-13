#!/bin/bash

# This script helps fix the "File exceeds GitHub's file size limit" error 
# by untracking node_modules from the Git history while keeping your local files.

echo "Clearing Git cache for node_modules..."
git rm -r --cached node_modules

echo "Ensuring .gitignore is up to date..."
if grep -q "node_modules/" .gitignore; then
    echo ".gitignore already contains node_modules."
else
    echo "node_modules/" >> .gitignore
    echo ".next/" >> .gitignore
    echo ".env" >> .gitignore
fi

echo "Adding remaining files..."
git add .

echo "Commiting the fix..."
git commit -m "Fix: Remove large binaries and node_modules from Git history"

echo ""
echo "Now run: git push"
