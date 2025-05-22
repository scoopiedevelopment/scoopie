import admin from 'firebase-admin';
import config from '../config/config';

const decoded = Buffer.from(config.FIREBASE_SERVICE_ACCOUNT || '', 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decoded);


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
