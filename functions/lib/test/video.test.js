"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("./setup");
const processVideo_1 = require("../video/processVideo");
const globals_1 = require("@jest/globals");
globals_1.jest.setTimeout(10000);
(0, globals_1.describe)('Video Processing Functions', () => {
    (0, globals_1.beforeEach)(async () => {
        // Clear test data before each test
        const videosRef = setup_1.admin.firestore().collection('videos');
        const snapshot = await videosRef.get();
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
    }, 10000);
    (0, globals_1.afterAll)(async () => {
        // Final cleanup
        const videosRef = setup_1.admin.firestore().collection('videos');
        const snapshot = await videosRef.get();
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
    });
    // Helper function to wait for document update
    const waitForDocumentUpdate = async (docRef, maxAttempts = 5) => {
        for (let i = 0; i < maxAttempts; i++) {
            const doc = await docRef.get();
            const data = doc.data();
            if ((data === null || data === void 0 ? void 0 : data.status) === 'ready') {
                return data;
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
        }
        throw new Error('Document did not update within the expected time');
    };
    (0, globals_1.it)('should process video upload and update metadata', async () => {
        // Create a test video document
        const videoId = 'test-video-123';
        const docRef = setup_1.admin.firestore().collection('videos').doc(videoId);
        await docRef.set({
            status: 'processing',
            title: 'Test Video',
            creatorId: 'test-user-123'
        });
        // Mock storage event
        const wrapped = setup_1.test.wrap(processVideo_1.onVideoUploaded);
        const testEvent = {
            data: {
                contentType: 'video/mp4',
                name: `videos/test-user-123/${videoId}/video.mp4`,
            }
        };
        // Execute function
        await wrapped(testEvent);
        // Wait for and verify results
        const data = await waitForDocumentUpdate(docRef);
        (0, globals_1.expect)(data).toBeDefined();
        (0, globals_1.expect)(data.status).toBe('ready');
        (0, globals_1.expect)(data.metadata).toBeDefined();
        (0, globals_1.expect)(data.metadata.format).toBe('video/mp4');
    }, 10000);
    (0, globals_1.it)('should skip non-video files', async () => {
        const wrapped = setup_1.test.wrap(processVideo_1.onVideoUploaded);
        const testEvent = {
            data: {
                contentType: 'image/jpeg',
                name: 'images/test.jpg',
            }
        };
        await wrapped(testEvent);
        // Function should exit early without error
    }, 10000);
});
//# sourceMappingURL=video.test.js.map