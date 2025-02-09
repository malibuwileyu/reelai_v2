"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMilestoneAchieved = exports.onNewLike = exports.onVideoProcessed = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();
async function sendNotification(userId, notification) {
    var _a;
    try {
        // Get user's FCM token
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
        if (!fcmToken) {
            console.log(`No FCM token found for user ${userId}`);
            return;
        }
        // Send notification
        await messaging.send({
            token: fcmToken,
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: notification.data || {}
        });
        // Store notification in Firestore
        await db.collection('notifications').add(Object.assign(Object.assign({ userId }, notification), { read: false, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        console.log(`Notification sent to user ${userId}`);
    }
    catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}
// Notify when video processing is complete
exports.onVideoProcessed = (0, firestore_1.onDocumentUpdated)('videos/{videoId}', async (event) => {
    var _a, _b;
    const newData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const previousData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    if ((newData === null || newData === void 0 ? void 0 : newData.status) === 'ready' && (previousData === null || previousData === void 0 ? void 0 : previousData.status) === 'processing') {
        await sendNotification(newData.creatorId, {
            title: 'Video Processing Complete',
            body: `Your video "${newData.title}" is now ready to view!`,
            type: 'video_processed',
            data: {
                videoId: event.params.videoId
            }
        });
    }
});
// Notify on new video like
exports.onNewLike = (0, firestore_1.onDocumentCreated)('videos/{videoId}/likes/{likeId}', async (event) => {
    var _a;
    const likeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!likeData)
        return;
    const videoDoc = await db.collection('videos').doc(event.params.videoId).get();
    const videoData = videoDoc.data();
    if (videoData && likeData.userId !== videoData.creatorId) {
        await sendNotification(videoData.creatorId, {
            title: 'New Like',
            body: `Someone liked your video "${videoData.title}"`,
            type: 'like',
            data: {
                videoId: event.params.videoId,
                likeId: event.params.likeId
            }
        });
    }
});
// Notify on learning milestone
exports.onMilestoneAchieved = (0, firestore_1.onDocumentUpdated)('progress/{progressId}', async (event) => {
    var _a, _b;
    const newData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const previousData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    if ((newData === null || newData === void 0 ? void 0 : newData.completed) && !(previousData === null || previousData === void 0 ? void 0 : previousData.completed)) {
        await sendNotification(newData.userId, {
            title: 'Milestone Achieved! 🎉',
            body: 'Congratulations! You\'ve completed another learning milestone.',
            type: 'milestone',
            data: {
                progressId: event.params.progressId
            }
        });
    }
});
//# sourceMappingURL=notifications.js.map