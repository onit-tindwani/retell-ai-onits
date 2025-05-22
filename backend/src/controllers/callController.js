const callService = require('../services/callService');

class CallController {
  async initiateCall(req, res) {
    try {
      const { phoneNumber, aiPersonality, callPurpose } = req.body;
      const userId = req.user.id; // From Auth0

      const result = await callService.initiateCall(phoneNumber, aiPersonality, callPurpose);
      res.json(result);
    } catch (error) {
      console.error('Error in initiateCall controller:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  }

  async handleCallConnect(req, res) {
    try {
      const { callId } = req.params;
      const twiml = await callService.handleCallConnect(callId);
      
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('Error in handleCallConnect controller:', error);
      res.status(500).json({ error: 'Failed to handle call connect' });
    }
  }

  async handleCallRecording(req, res) {
    try {
      const { callId } = req.params;
      const { recordingUrl } = req.body;

      const result = await callService.handleCallRecording(callId, recordingUrl);
      res.json(result);
    } catch (error) {
      console.error('Error in handleCallRecording controller:', error);
      res.status(500).json({ error: 'Failed to handle call recording' });
    }
  }

  async getCallHistory(req, res) {
    try {
      const userId = req.user.id; // From Auth0
      const { page, limit } = req.query;

      const calls = await callService.getCallHistory(userId, parseInt(page), parseInt(limit));
      res.json(calls);
    } catch (error) {
      console.error('Error in getCallHistory controller:', error);
      res.status(500).json({ error: 'Failed to get call history' });
    }
  }

  async getCallAnalytics(req, res) {
    try {
      const userId = req.user.id; // From Auth0

      const analytics = await callService.getCallAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error('Error in getCallAnalytics controller:', error);
      res.status(500).json({ error: 'Failed to get call analytics' });
    }
  }
}

module.exports = new CallController(); 