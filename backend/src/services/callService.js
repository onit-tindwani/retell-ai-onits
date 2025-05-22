const { OpenAI } = require('openai');
const twilio = require('twilio');
const { Pool } = require('pg');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class CallService {
  async initiateCall(phoneNumber, aiPersonality, callPurpose) {
    try {
      // Create a new call record in the database
      const callResult = await pool.query(
        'INSERT INTO calls (phone_number, ai_personality, call_purpose, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [phoneNumber, aiPersonality, callPurpose, 'initiated']
      );
      const callId = callResult.rows[0].id;

      // Initiate the call using Twilio
      const call = await twilioClient.calls.create({
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${process.env.BASE_URL}/api/calls/${callId}/connect`,
      });

      // Update the call record with Twilio call SID
      await pool.query(
        'UPDATE calls SET twilio_call_sid = $1 WHERE id = $2',
        [call.sid, callId]
      );

      return { callId, twilioCallSid: call.sid };
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  async handleCallConnect(callId) {
    try {
      // Get call details from database
      const callResult = await pool.query(
        'SELECT * FROM calls WHERE id = $1',
        [callId]
      );
      const call = callResult.rows[0];

      // Generate TwiML response for the call
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say({
        voice: call.ai_personality,
      }, 'Hello, this is your AI assistant. How can I help you today?');

      // Start the conversation with OpenAI
      const conversation = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant with a ${call.ai_personality} personality. The purpose of this call is: ${call.call_purpose}`,
          },
        ],
      });

      return twiml.toString();
    } catch (error) {
      console.error('Error handling call connect:', error);
      throw error;
    }
  }

  async handleCallRecording(callId, recordingUrl) {
    try {
      // Update call record with recording URL
      await pool.query(
        'UPDATE calls SET recording_url = $1 WHERE id = $2',
        [recordingUrl, callId]
      );

      // Get the recording and transcribe it
      const transcription = await this.transcribeRecording(recordingUrl);

      // Update call record with transcription
      await pool.query(
        'UPDATE calls SET transcription = $1 WHERE id = $2',
        [transcription, callId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error handling call recording:', error);
      throw error;
    }
  }

  async transcribeRecording(recordingUrl) {
    try {
      // Download the recording
      const response = await fetch(recordingUrl);
      const audioBuffer = await response.buffer();

      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing recording:', error);
      throw error;
    }
  }

  async getCallHistory(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await pool.query(
        'SELECT * FROM calls WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  }

  async getCallAnalytics(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_calls,
          AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_calls
        FROM calls 
        WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting call analytics:', error);
      throw error;
    }
  }
}

module.exports = new CallService(); 