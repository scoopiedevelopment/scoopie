import admin from 'firebase-admin';
import config from '../config/config';

const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
