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
exports.onUserDeleted = exports.onUserCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Listen for user creation through a callable function
exports.onUserCreated = (0, https_1.onCall)(async (request) => {
    const user = request.auth;
    if (!user) {
        throw new Error('Unauthorized');
    }
    try {
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            id: user.uid,
            email: user.token.email,
            displayName: user.token.name || `user_${user.uid}`,
            photoURL: user.token.picture,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            followers: 0,
            videosCount: 0,
            followingCount: 0,
            profileCompleted: false,
            onboardingCompleted: false,
            accountType: 'user',
            preferences: {
                language: 'en',
                theme: 'dark',
                notifications: true
            }
        });
        console.log(`Created user document for ${user.uid}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error creating user document:', error);
        throw new Error('Failed to create user document');
    }
});
// Listen for user deletion through a callable function
exports.onUserDeleted = (0, https_1.onCall)(async (request) => {
    const user = request.auth;
    if (!user) {
        throw new Error('Unauthorized');
    }
    try {
        // Delete user's data
        const batch = db.batch();
        // Delete user document
        batch.delete(db.collection('users').doc(user.uid));
        // Get and delete user's videos
        const videosSnapshot = await db.collection('videos')
            .where('creatorId', '==', user.uid)
            .get();
        videosSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Get and delete user's progress
        const progressSnapshot = await db.collection('progress')
            .where('userId', '==', user.uid)
            .get();
        progressSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Commit all deletions
        await batch.commit();
        console.log(`Cleaned up data for deleted user ${user.uid}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error cleaning up user data:', error);
        throw new Error('Failed to clean up user data');
    }
});
//# sourceMappingURL=userManagement.js.map