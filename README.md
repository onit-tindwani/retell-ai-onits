# Retell AI Clone

A web application that replicates the core features of Retell AI, including AI-powered phone calls, call recording, transcription, analytics, and user management.

## Features

- User authentication (sign up, login, password reset)
- Dashboard for managing calls
- Initiate and receive AI-powered phone calls
- Call recording and transcription
- Analytics and reporting
- Billing and subscription management
- Admin panel

## Tech Stack

- **Frontend:** React (with TypeScript), Tailwind CSS
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **AI Integration:** OpenAI API (for conversation), Twilio (for telephony)
- **Authentication:** Auth0
- **Deployment:** Docker, Vercel (frontend), AWS (backend)

## Project Structure

```
retell-clone/
  backend/
    src/
      controllers/
      models/
      routes/
      services/
    package.json
  frontend/
    src/
      components/
      pages/
      App.tsx
    package.json
  README.md
  docker-compose.yml
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/retell-clone.git
   cd retell-clone
   ```

2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` directory with the following variables:
     ```
     PORT=5000
     DATABASE_URL=postgresql://username:password@localhost:5432/retell_clone
     OPENAI_API_KEY=your_openai_api_key
     TWILIO_ACCOUNT_SID=your_twilio_account_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     AUTH0_DOMAIN=your_auth0_domain
     AUTH0_CLIENT_ID=your_auth0_client_id
     AUTH0_CLIENT_SECRET=your_auth0_client_secret
     ```
   - Create a `.env` file in the `frontend` directory with the following variables:
     ```
     REACT_APP_API_URL=http://localhost:5000
     REACT_APP_AUTH0_DOMAIN=your_auth0_domain
     REACT_APP_AUTH0_CLIENT_ID=your_auth0_client_id
     ```

4. Start the development servers:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## License

MIT 