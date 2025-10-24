// backend/config/firebaseConfig.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Function to get Firebase configuration
const getFirebaseConfig = () => {
    // Try to load service account from file
    let serviceAccount;
    try {
        const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
        if (fs.existsSync(serviceAccountPath)) {
            console.log('Loading Firebase credentials from service account file');
            serviceAccount = require(serviceAccountPath);
        } else {
            throw new Error('Service account file not found');
        }
    } catch (error) {
        console.log('Service account file not found. Using environment variables or default credentials');

        // If no service account file, try to use environment variables
        if (process.env.FIREBASE_PROJECT_ID) {
            console.log('Using Firebase credentials from environment variables');
            serviceAccount = {
                "type": "service_account",
                "project_id": process.env.FIREBASE_PROJECT_ID,
                "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
                "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                "client_email": process.env.FIREBASE_CLIENT_EMAIL,
                "client_id": process.env.FIREBASE_CLIENT_ID,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL,
                "universe_domain": "googleapis.com"
            };
        } else {
            // Default credentials for development (these should be replaced in production)
            console.log('Using default Firebase credentials for development environment');
            serviceAccount = {
                "type": "service_account",
                "project_id": "gestureconnect-8aa03",
                "private_key_id": "REDACTED_PRIVATE_KEY_ID",
                "private_key": "REDACTED_PRIVATE_KEY\n",
                "client_email": "firebase-adminsdk-fbsvc@gestureconnect-8aa03.iam.gserviceaccount.com",
                "client_id": "115971354392282607890",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gestureconnect-8aa03.iam.gserviceaccount.com",
                "universe_domain": "googleapis.com"
            };
        }
    }

    return serviceAccount;
};

// Initialize Firebase Admin
const serviceAccount = getFirebaseConfig();
const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : "gestureconnect-8aa03.appspot.com"
});

// Initialize Firebase services
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

console.log(`Firebase Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);

module.exports = {
    db,
    auth,
    storage,
    app
};