// Firebase Configuration Template
// Copy this file to firebase-config.js and fill in your Firebase project details

// Get these values from your Firebase Console:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Go to Project Settings > General > Your apps > Web app
// 4. Copy the config values below

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// IMPORTANT: Set up Firebase Storage Rules
// Go to Firebase Console > Storage > Rules and add:
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/

// IMPORTANT: Enable Authentication
// Go to Firebase Console > Authentication > Sign-in method
// Enable "Email/Password" provider