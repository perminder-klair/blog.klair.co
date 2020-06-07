#!/usr/bin/env bash
#
# required environment variables:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# AWS_DEFAULT_REGION
AWS_S3_BUCKET="kremalicious.com"
AWS_S3_BUCKET_BETA="beta.kremalicious.com"
SITEMAP_URL="https%3A%2F%2Fkremalicious.com%2Fsitemap.xml"

#
set -e;

function s3sync {
  aws s3 sync ./public s3://"$1" \
    --include "*" \
    --exclude "*.html" \
    --exclude "sw.js" \
    --exclude "*page-data.json" \
    --exclude "*app-data.json" \
    --exclude "chunk-map.json" \
    --exclude "sitemap.xml" \
    --exclude "feed.xml" \
    --exclude "feed.json" \
    --exclude ".iconstats.json" \
    --exclude "humans.txt" \
    --exclude "robots.txt" \
    --cache-control public,max-age=31536000,immutable \
    --delete \
    --acl public-read

  aws s3 sync ./public s3://"$1" \
    --exclude "*" \
    --include "*.html" \
    --include "sw.js" \
    --include "*page-data.json" \
    --include "*app-data.json" \
    --include "chunk-map.json" \
    --include "sitemap.xml" \
    --include "feed.xml" \
    --include "feed.json" \
    --include ".iconstats.json" \
    --include "humans.txt" \
    --include "robots.txt" \
    --cache-control public,max-age=0,must-revalidate \
    --delete \
    --acl public-read
}

##
## check for pull request against master
##
if [ "$TRAVIS_PULL_REQUEST" != "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then

  s3sync $AWS_S3_BUCKET_BETA

##
## check for master push which is no pull request
##
elif [ "$TRAVIS_BRANCH" == "master" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ] || [ "$TRAVIS" != true ]; then

  s3sync $AWS_S3_BUCKET

  # ping search engines
  # returns: HTTP_STATUSCODE URL
  curl -sL -w "%{http_code} %{url_effective}\\n" \
    "http://www.google.com/webmasters/tools/ping?sitemap=$SITEMAP_URL" -o /dev/null \
    "http://www.bing.com/webmaster/ping.aspx?siteMap=$SITEMAP_URL" -o /dev/null

  echo "---------------------------------------------"
  echo "         ✓ done deployment "
  echo "---------------------------------------------"

  exit;

else

  echo "---------------------------------------------"
  echo "          nothing to deploy "
  echo "---------------------------------------------"

fi
