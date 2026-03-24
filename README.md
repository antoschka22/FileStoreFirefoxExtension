# FileStore Firefox Extension

A Firefox extension for storing PDFs and images synced across your devices using your Firefox account.

## How It Works

This extension uses a hybrid approach:
- **Firebase Storage** - Stores your actual files (5GB free tier)
- **Firebase Authentication** - Keeps your files private to your account
- **Firefox Sync** - Syncs file metadata (URLs, names) across devices via `browser.storage.sync`

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired (optional)

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click Save

### 3. Enable Storage

1. Go to **Storage** in Firebase Console
2. Click "Get Started"
3. Choose production mode or test mode (we'll set proper rules next)
4. Select a location for your storage bucket

### 4. Set Storage Security Rules

1. Go to **Storage** > **Rules**
2. Replace the default rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

This ensures users can only access their own files.

### 5. Create a Web App

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Give it a name (e.g., "FileStore Extension")
5. Copy the `firebaseConfig` object

### 6. Configure the Extension

1. Copy `firebase-config.template.js` to `firebase-config.js`
2. Paste your Firebase config values into `firebase-config.js`

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

### 7. Load the Extension in Firefox

1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file from this folder

### 8. Test the Extension

1. Click the FileStore extension icon in Firefox
2. Create an account with your email
3. Upload a PDF or image
4. Verify it appears in Firebase Console > Storage
5. On another device with the same Firefox account, load the extension and verify synced files appear

## Project Structure

```
FileStoreFirefoxExtension/
├── manifest.json           # Firefox extension manifest
├── popup.html              # Extension popup UI
├── popup.js                # Main logic (upload, sync, display)
├── popup.css               # Styling
├── firebase-config.js      # Your Firebase config (gitignored)
├── firebase-config.template.js  # Template for setup
└── README.md               # This file
```

## Important Notes

- **Storage Quota**: Firefox Sync has a ~100KB limit. This extension only syncs file metadata (URLs), not the actual files.
- **File Privacy**: Files are stored in Firebase Storage with rules ensuring only you can access them.
- **Free Tier**: Firebase free tier includes 5GB storage and 1GB/day download.

## Troubleshooting

### "Firebase config not found"
Make sure `firebase-config.js` exists and contains valid Firebase configuration.

### "Permission denied" errors
Check that your Firebase Storage rules are set correctly.

### Files not syncing across devices
1. Ensure you're signed into Firefox with the same Firefox Account on both devices
2. Check Firefox Sync settings include "Add-ons"
3. Wait a moment for sync to complete (can take a few minutes)