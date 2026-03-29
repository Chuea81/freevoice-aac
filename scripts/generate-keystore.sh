#!/bin/bash

# Generate a keystore for APK signing
# This script creates a new keystore with a signing key

set -e

KEYSTORE_PATH=".keystore/freevoice.jks"
KEY_ALIAS="freevoice"
VALIDITY_DAYS=36500  # 100 years
KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-changeit}"
KEY_PASSWORD="${KEY_PASSWORD:-changeit}"

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "Error: keytool not found. Please install Java Development Kit (JDK)"
    exit 1
fi

# Create .keystore directory if it doesn't exist
mkdir -p .keystore

# Check if keystore already exists
if [ -f "$KEYSTORE_PATH" ]; then
    echo "Keystore already exists at $KEYSTORE_PATH"
    read -p "Overwrite existing keystore? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 1
    fi
    rm "$KEYSTORE_PATH"
fi

echo "Generating keystore..."
echo "This will create a self-signed certificate valid for 100 years"
echo ""

# Generate keystore with key
keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -alias "$KEY_ALIAS" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=FreeVoice AAC, O=Shellcraft Labs, L=Internet, ST=Internet, C=US"

echo ""
echo "✓ Keystore generated successfully at $KEYSTORE_PATH"
echo ""
echo "Next steps:"
echo "1. Copy .env.apk.example to .env.apk"
echo "2. Set KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD in .env.apk"
echo "3. Set KEY_PASSWORD=$KEY_PASSWORD in .env.apk"
echo ""
echo "DO NOT commit the keystore or .env.apk to version control!"
echo "Add .keystore/ and .env.apk to .gitignore"
