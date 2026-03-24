// FileStore Extension - Main Logic

// DOM Elements
const elements = {
  // Auth
  authContainer: document.getElementById('auth-container'),
  signInForm: document.getElementById('sign-in-form'),
  signUpForm: document.getElementById('sign-up-form'),
  signInEmail: document.getElementById('sign-in-email'),
  signInPassword: document.getElementById('sign-in-password'),
  signUpEmail: document.getElementById('sign-up-email'),
  signUpPassword: document.getElementById('sign-up-password'),
  signUpConfirm: document.getElementById('sign-up-confirm'),
  signInBtn: document.getElementById('sign-in-btn'),
  signUpBtn: document.getElementById('sign-up-btn'),
  showSignIn: document.getElementById('show-sign-in'),
  showSignUp: document.getElementById('show-sign-up'),
  userInfo: document.getElementById('user-info'),
  userEmail: document.getElementById('user-email'),
  signOutBtn: document.getElementById('sign-out-btn'),

  // Upload
  uploadSection: document.getElementById('upload-section'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  uploadProgress: document.getElementById('upload-progress'),
  progressFill: document.getElementById('progress-fill'),

  // Files
  filesSection: document.getElementById('files-section'),
  filesList: document.getElementById('files-list'),

  // Message
  message: document.getElementById('message')
};

// Firebase references
let auth, storage;

// Current user
let currentUser = null;

// Initialize Firebase
function initFirebase() {
  // Check if firebaseConfig is defined
  if (typeof firebaseConfig === 'undefined') {
    showMessage('Firebase config not found. Please set up firebase-config.js', 'error');
    return false;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    storage = firebase.storage();

    // Listen for auth state changes
    auth.onAuthStateChanged(handleAuthStateChange);
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showMessage('Failed to initialize Firebase: ' + error.message, 'error');
    return false;
  }
}

// Handle auth state changes
function handleAuthStateChange(user) {
  currentUser = user;

  if (user) {
    // User is signed in
    elements.authContainer.classList.add('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.uploadSection.classList.remove('hidden');
    elements.filesSection.classList.remove('hidden');
    elements.userEmail.textContent = user.email;

    // Load files
    loadFiles();
  } else {
    // User is signed out
    elements.authContainer.classList.remove('hidden');
    elements.userInfo.classList.add('hidden');
    elements.uploadSection.classList.add('hidden');
    elements.filesSection.classList.add('hidden');
    elements.filesList.innerHTML = '';
  }
}

// Show message toast
function showMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = 'message ' + type;
  elements.message.classList.remove('hidden');

  setTimeout(() => {
    elements.message.classList.add('hidden');
  }, 4000);
}

// Toggle auth forms
elements.showSignUp.addEventListener('click', (e) => {
  e.preventDefault();
  elements.signInForm.classList.add('hidden');
  elements.signUpForm.classList.remove('hidden');
});

elements.showSignIn.addEventListener('click', (e) => {
  e.preventDefault();
  elements.signUpForm.classList.add('hidden');
  elements.signInForm.classList.remove('hidden');
});

// Sign In
elements.signInBtn.addEventListener('click', async () => {
  const email = elements.signInEmail.value.trim();
  const password = elements.signInPassword.value;

  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  try {
    elements.signInBtn.disabled = true;
    elements.signInBtn.textContent = 'Signing in...';
    await auth.signInWithEmailAndPassword(email, password);
    elements.signInEmail.value = '';
    elements.signInPassword.value = '';
  } catch (error) {
    showMessage(getAuthErrorMessage(error.code), 'error');
  } finally {
    elements.signInBtn.disabled = false;
    elements.signInBtn.textContent = 'Sign In';
  }
});

// Sign Up
elements.signUpBtn.addEventListener('click', async () => {
  const email = elements.signUpEmail.value.trim();
  const password = elements.signUpPassword.value;
  const confirm = elements.signUpConfirm.value;

  if (!email || !password || !confirm) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (password !== confirm) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    elements.signUpBtn.disabled = true;
    elements.signUpBtn.textContent = 'Creating account...';
    await auth.createUserWithEmailAndPassword(email, password);
    elements.signUpEmail.value = '';
    elements.signUpPassword.value = '';
    elements.signUpConfirm.value = '';
    showMessage('Account created successfully!', 'success');
  } catch (error) {
    showMessage(getAuthErrorMessage(error.code), 'error');
  } finally {
    elements.signUpBtn.disabled = false;
    elements.signUpBtn.textContent = 'Create Account';
  }
});

// Sign Out
elements.signOutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    showMessage('Failed to sign out', 'error');
  }
});

// Get user-friendly auth error messages
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Email already in use',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password is too weak',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try again later'
  };
  return messages[code] || 'Authentication failed';
}

// File Upload Handling
elements.dropZone.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.dropZone.classList.add('dragover');
});

elements.dropZone.addEventListener('dragleave', () => {
  elements.dropZone.classList.remove('dragover');
});

elements.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

elements.fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  e.target.value = ''; // Reset input
});

// Handle selected files
async function handleFiles(files) {
  if (!currentUser) {
    showMessage('Please sign in first', 'error');
    return;
  }

  const validFiles = Array.from(files).filter(file => {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    return isPdf || isImage;
  });

  if (validFiles.length === 0) {
    showMessage('Please select PDFs or images only', 'error');
    return;
  }

  // Upload files one by one
  for (const file of validFiles) {
    await uploadFile(file);
  }
}

// Upload a single file to Firebase Storage
async function uploadFile(file) {
  const userId = currentUser.uid;
  const fileName = file.name;
  const timestamp = Date.now();
  const storagePath = `users/${userId}/${timestamp}_${fileName}`;

  const uploadProgress = elements.uploadProgress;
  const progressFill = elements.progressFill;

  try {
    uploadProgress.classList.remove('hidden');

    const uploadTask = storage.ref(storagePath).put(file);

    // Track upload progress
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressFill.style.width = progress + '%';
      },
      (error) => {
        console.error('Upload error:', error);
        showMessage(`Failed to upload ${fileName}: ${error.message}`, 'error');
        uploadProgress.classList.add('hidden');
        progressFill.style.width = '0%';
      },
      async () => {
        // Upload complete - get download URL
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

        // Save file metadata to Firefox sync storage
        await saveFileMetadata({
          name: fileName,
          url: downloadURL,
          storagePath: storagePath,
          type: file.type,
          size: file.size,
          uploadedAt: timestamp
        });

        showMessage(`Uploaded ${fileName} successfully!`, 'success');
        uploadProgress.classList.add('hidden');
        progressFill.style.width = '0%';

        // Reload files list
        loadFiles();
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    showMessage(`Failed to upload ${fileName}`, 'error');
    uploadProgress.classList.add('hidden');
    progressFill.style.width = '0%';
  }
}

// Save file metadata to Firefox sync storage
async function saveFileMetadata(metadata) {
  const result = await browser.storage.sync.get('files');
  const files = result.files || [];
  files.push(metadata);

  // Check if we're approaching the quota (100KB total)
  const dataString = JSON.stringify(files);
  const sizeInKB = new Blob([dataString]).size / 1024;

  if (sizeInKB > 95) { // Leave some buffer
    showMessage('Storage quota nearly reached. Consider deleting old files.', 'error');
    // Still try to save, but warn
  }

  await browser.storage.sync.set({ files });
}

// Load files from Firefox sync storage
async function loadFiles() {
  if (!currentUser) return;

  try {
    const result = await browser.storage.sync.get('files');
    const files = result.files || [];

    renderFilesList(files);
  } catch (error) {
    console.error('Error loading files:', error);
    showMessage('Failed to load files', 'error');
  }
}

// Render the files list
function renderFilesList(files) {
  const container = elements.filesList;

  if (files.length === 0) {
    container.innerHTML = '<div class="empty-state">No files uploaded yet</div>';
    return;
  }

  // Sort by upload date, newest first
  files.sort((a, b) => b.uploadedAt - a.uploadedAt);

  container.innerHTML = files.map(file => `
    <div class="file-item" data-path="${file.storagePath}">
      <span class="file-icon">${getFileIcon(file.type)}</span>
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="file-date">${formatDate(file.uploadedAt)} · ${formatSize(file.size)}</div>
      </div>
      <div class="file-actions">
        <button class="btn btn-secondary open-btn" data-url="${escapeHtml(file.url)}">Open</button>
        <button class="btn btn-danger delete-btn" data-path="${file.storagePath}">Delete</button>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  container.querySelectorAll('.open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      browser.tabs.create({ url: btn.dataset.url });
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteFile(btn.dataset.path));
  });
}

// Delete a file
async function deleteFile(storagePath) {
  if (!currentUser) return;

  try {
    // Delete from Firebase Storage
    await storage.ref(storagePath).delete();

    // Remove from Firefox sync storage
    const result = await browser.storage.sync.get('files');
    const files = result.files || [];
    const updatedFiles = files.filter(f => f.storagePath !== storagePath);
    await browser.storage.sync.set({ files: updatedFiles });

    showMessage('File deleted', 'success');
    loadFiles();
  } catch (error) {
    console.error('Delete error:', error);
    showMessage('Failed to delete file', 'error');
  }
}

// Helper functions
function getFileIcon(type) {
  if (type === 'application/pdf') return '📄';
  if (type.startsWith('image/')) return '🖼️';
  return '📁';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initFirebase);