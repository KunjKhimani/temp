#!/bin/bash

# --- Configuration ---
FTP_USER="frontend@sparework.net"
# WARNING: Avoid storing passwords directly in scripts if possible.
# Consider using lftp bookmarks or a .netrc file for security.
FTP_PASS='bs@_RLBRq_Yd'
FTP_HOST="sparework.net" # Often ftp.yourdomain.com or just yourdomain.com
FTP_PORT="21" # Default FTP port

# IMPORTANT: Path on the *remote* server where files should go
# Usually public_html for the main domain, or public_html/subdirectory
REMOTE_TARGET_DIR="/public_html"
LOCAL_BUILD_DIR="dist" # Or 'build'

# --- Script Start ---
echo "Starting deployment via FTP..."

# -------------------------------------------------------------------------
# Section for creating .env manually is REMOVED.
# Vite will automatically load .env.production when `npm run build` is executed.
# Ensure your .env.production file exists in your project root.
echo "Using .env.production for build variables (if it exists)."
# -------------------------------------------------------------------------

# 1. Build the React application
#    Vite automatically uses .env.production for production builds
echo "Building React application for production..."
npm run build # or yarn build
if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi
echo "Build successful."

# 2. Deploy using lftp
#    WARNING: Standard FTP (port 21) sends password and data unencrypted!
echo "Deploying files to $FTP_HOST..."

lftp -p $FTP_PORT -u "$FTP_USER","$FTP_PASS" $FTP_HOST << EOF
set ftp:ssl-allow no
set ftp:passive-mode true
cd "$REMOTE_TARGET_DIR"
mirror --reverse --delete --verbose --parallel=5 \
       --exclude-glob .git* \
       --exclude-glob .env* \
       --exclude-glob .htaccess \
       --exclude-glob favicon.ico \
       --exclude-glob logo.png \
       --exclude-glob sitemap.xml \
       --exclude-glob robots.txt \
       "$LOCAL_BUILD_DIR"/ .

quit
EOF

# Check lftp exit status
if [ $? -ne 0 ]; then
  echo "FTP Deployment failed!"
  exit 1
fi

echo "FTP Deployment successful!"
exit 0