#!/bin/bash
# Rebuild the Android TWA (APK + AAB). Run from repo root after pushing client changes.
set -e
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk
export ANDROID_HOME=$HOME/Library/Android/sdk
export BUBBLEWRAP_KEYSTORE_PASSWORD="$BUBBLEWRAP_KEYSTORE_PASSWORD"
export BUBBLEWRAP_KEY_PASSWORD="$BUBBLEWRAP_KEY_PASSWORD"
if [ -z "$BUBBLEWRAP_KEYSTORE_PASSWORD" ]; then
  echo "ERROR: set BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD (see AGENTS.md)"
  exit 1
fi
cd twa
bubblewrap update --skipVersionUpgrade
bubblewrap build
echo "Done: twa/app-release-signed.apk + twa/app-release-bundle.aab"
