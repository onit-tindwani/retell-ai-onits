const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { checkJwt } = require('../middleware/auth');

// All routes require authentication
router.use(checkJwt);

// Initiate a new call
router.post('/initiate', callController.initiateCall);

// Handle call connection (Twilio webhook)
router.post('/:callId/connect', callController.handleCallConnect);

// Handle call recording (Twilio webhook)
router.post('/:callId/recording', callController.handleCallRecording);

// Get call history
router.get('/history', callController.getCallHistory);

// Get call analytics
router.get('/analytics', callController.getCallAnalytics);

module.exports = router; 