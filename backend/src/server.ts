import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkUser } from './middleware/auth';
import callsRouter from './routes/calls';
import analyticsRouter from './routes/analytics';
import settingsRouter from './routes/settings';
import billingRouter from './routes/billing';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
app.use(checkUser);

// Routes
app.use('/api/calls', callsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/billing', billingRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 