export VERSION=$(npm version minor | cut -c 2-)
export GIT_MERGE_AUTOEDIT=no
echo Bump to $VERSION
git add .
git commit -m "v$VERSION"
git flow release start $VERSION
git flow release finish -m "v$VERSION" $VERSION
git push --all --follow-tags
unset GIT_MERGE_AUTOEDIT
