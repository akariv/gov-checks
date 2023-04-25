#!/bin/bash
git checkout main && \
(git branch -D dist || true) && \
git checkout -b dist && \
rm .gitignore && \
cd projects/gov-cnb/src/assets/cache && ./fetch-cache.sh && cd - && \
npm run build && \
cp dist/gov-cnb/index.html dist/gov-cnb/404.html && \
cp CNAME dist/gov-cnb/ || true && \
git add dist/gov-cnb && \
git commit -m dist && \
(git branch -D gh-pages || true) && \
git subtree split --prefix dist/gov-cnb -b gh-pages && \
git push -f origin gh-pages:gh-pages && \
git checkout main && \
git branch -D gh-pages && \
git branch -D dist && \
git checkout . 