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
exports.onVideoUploaded = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.onVideoUploaded = (0, storage_1.onObjectFinalized)(async (event) => {
    var _a;
    console.log('Processing video upload event:', event);
    // Only process video files
    if (!((_a = event.data.contentType) === null || _a === void 0 ? void 0 : _a.startsWith('video/'))) {
        console.log('Not a video file, skipping processing');
        return;
    }
    const filePath = event.data.name;
    if (!filePath) {
        console.error('File path is undefined');
        return;
    }
    try {
        // Extract video metadata using FFmpeg or similar tool
        // This is a placeholder for actual video processing
        const metadata = {
            duration: 0, // To be extracted
            format: event.data.contentType,
            resolution: '1080p' // To be extracted
        };
        // Extract videoId from path (format: videos/{userId}/{videoId}/filename)
        const pathParts = filePath.split('/');
        const videoId = pathParts.length >= 3 ? pathParts[2] : null;
        console.log('Extracted videoId:', videoId);
        if (videoId) {
            const docRef = db.collection('videos').doc(videoId);
            console.log('Updating document:', docRef.path);
            const updateData = {
                status: 'ready',
                metadata,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            console.log('Update data:', updateData);
            await docRef.set(updateData, { merge: true });
            console.log('Document updated successfully');
            // Verify the update
            const updatedDoc = await docRef.get();
            console.log('Updated document data:', updatedDoc.data());
        }
        console.log(`Successfully processed video: ${filePath}`);
    }
    catch (error) {
        console.error('Error processing video:', error);
        throw error;
    }
});
//# sourceMappingURL=processVideo.js.map