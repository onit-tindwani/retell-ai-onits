CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  ai_personality VARCHAR(50) NOT NULL,
  call_purpose TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  twilio_call_sid VARCHAR(255),
  recording_url TEXT,
  transcription TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_created_at ON calls(created_at); 