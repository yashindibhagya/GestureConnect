// backend/config/firebaseConfig.js
require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

/**
 * Resolves Firebase Admin credentials, in order of preference:
 *   1. Backend/serviceAccountKey.json (gitignored)
 *   2. FIREBASE_* environment variables
 *
 * Credentials are never hardcoded here — a service-account private key in source
 * control is readable by anyone with repo access.
 */
const getFirebaseConfig = () => {
    const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
        console.log('Loading Firebase credentials from service account file');
        return require(serviceAccountPath);
    }

    if (process.env.FIREBASE_PROJECT_ID) {
        console.log('Loading Firebase credentials from environment variables');
        return {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
            universe_domain: 'googleapis.com',
        };
    }

    throw new Error(
        'No Firebase credentials found. Either place a service account key at ' +
        'Backend/serviceAccountKey.json or set the FIREBASE_* variables in Backend/.env ' +
        '(see .env.example).'
    );
};

const serviceAccount = getFirebaseConfig();

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
});

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

console.log(`Firebase Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);

module.exports = {
    db,
    auth,
    storage,
    app,
};
