import admin from '../service/firebase';

export const sendNotification = async ({fcmToken, title, body}: { fcmToken: string, title: string, body: string }) => {

   const message: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ FCM sent successfully:', response);
  } catch (error: any) {
    console.error('❌ FCM send error:', error.message);
    if (error.code === 'messaging/registration-token-not-registered') {
      console.warn('🧹 Invalid token — consider deleting from DB');
    }
  }
};
