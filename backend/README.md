# Retell AI Backend

This is the backend service for Retell AI, a platform for making AI-powered phone calls.

## Features

- User authentication and authorization with Auth0
- Call management with Twilio integration
- Recording storage with AWS S3
- Real-time updates with WebSocket
- Analytics and insights
- Bulk calling capabilities
- Subscription management with Stripe

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Redis
- Socket.IO
- Auth0
- Twilio
- AWS S3
- Stripe

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Redis
- Auth0 account
- Twilio account
- AWS account
- Stripe account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/retell_ai

# Auth0 Configuration
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.retell.ai
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AWS Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket

# OpenAI Configuration
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_ANALYTICS=true

# Stripe Configuration
STRIPE_SECRET_KEY=your-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
STRIPE_PRICE_ID=your-price-id
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/retell-ai.git
cd retell-ai/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## API Documentation

The API documentation is available at `/api-docs` when running the server.

### Authentication

All API endpoints require authentication using Auth0 JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update current user
- `DELETE /api/auth/me` - Delete current user

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Calls
- `GET /api/calls` - Get all calls
- `GET /api/calls/:id` - Get call by ID
- `POST /api/calls` - Create new call
- `PATCH /api/calls/:id/status` - Update call status
- `DELETE /api/calls/:id` - Delete call

#### Recordings
- `GET /api/recordings` - Get all recordings
- `GET /api/recordings/:id` - Get recording by ID
- `POST /api/recordings` - Create new recording
- `DELETE /api/recordings/:id` - Delete recording

#### Bulk Calls
- `GET /api/bulk-calls` - Get all bulk calls
- `GET /api/bulk-calls/:id` - Get bulk call by ID
- `POST /api/bulk-calls` - Create new bulk call
- `PATCH /api/bulk-calls/:id/status` - Update bulk call status
- `DELETE /api/bulk-calls/:id` - Delete bulk call

#### Analytics
- `GET /api/analytics/calls` - Get call statistics
- `GET /api/analytics/sentiment` - Get sentiment analysis
- `GET /api/analytics/trends` - Get call trends

#### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings
- `GET /api/settings/profile` - Get user profile
- `PATCH /api/settings/profile` - Update user profile

#### Billing
- `GET /api/billing/subscription` - Get subscription
- `POST /api/billing/subscription` - Create subscription
- `PATCH /api/billing/subscription` - Update subscription
- `DELETE /api/billing/subscription` - Cancel subscription
- `GET /api/billing/payments` - Get payments
- `POST /api/billing/webhook` - Handle Stripe webhook

## WebSocket Events

### Client to Server
- `join` - Join a room (userId)
- `leave` - Leave a room (userId)

### Server to Client
- `call:status` - Call status update
- `bulkCall:status` - Bulk call status update
- `analytics:update` - Analytics update

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm run test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database

### Code Style

This project uses ESLint and Prettier for code formatting. The configuration is in `.eslintrc.js` and `.prettierrc`.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set up environment variables on your hosting platform.

3. Start the server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 