import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

export let isFirebaseEnabled = false;

try {
    const serviceAccountPath = path.join(__dirname, 'scripts', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseEnabled = true;
        console.log('[Firebase Admin] Initialized successfully.');
    }
} catch (error: any) {
    console.error('[Firebase Admin] Initialization failed:', error.message);
}

export const verifyFirebaseToken = async (token: string) => {
    if (!isFirebaseEnabled) throw new Error("Firebase is not configured.");
    return await admin.auth().verifyIdToken(token);
};
