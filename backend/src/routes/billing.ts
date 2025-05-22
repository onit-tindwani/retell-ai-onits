import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { SUBSCRIPTION_STATUS, PAYMENT_STATUS } from '../utils/constants';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(config.stripe.secretKey!, {
  apiVersion: '2023-10-16',
});

// Get billing information
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const cacheKey = `billing:${userId}`;
    const cachedBilling = await cache.get(cacheKey);

    if (cachedBilling) {
      return res.json(cachedBilling);
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const billing = {
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    };

    await cache.set(cacheKey, billing, config.cache.ttl.medium);
    res.json(billing);
  } catch (error) {
    next(error);
  }
});

// Create or update subscription
router.post('/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      throw new BadRequestError('Payment method ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create or get Stripe customer
    let customerId: string;
    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomer.data.length > 0) {
      customerId = existingCustomer.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: config.stripe.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Create subscription record
    const subscriptionRecord = await prisma.subscription.create({
      data: {
        userId,
        stripeId: subscription.id,
        status: subscription.status,
        plan: 'pro',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await cache.del(`billing:${userId}`);

    let clientSecret: string | undefined;
    const paymentIntent = (subscription.latest_invoice as Stripe.Invoice).payment_intent;
    if (typeof paymentIntent === 'object' && paymentIntent && 'client_secret' in paymentIntent) {
      clientSecret = (paymentIntent as Stripe.PaymentIntent).client_secret ?? undefined;
    }

    res.json({
      subscription: subscriptionRecord,
      clientSecret,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post('/subscription/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    // Cancel Stripe subscription
    await stripe.subscriptions.update(subscription.stripeId, {
      cancel_at_period_end: true,
    });

    // Update subscription record
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    await cache.del(`billing:${userId}`);

    res.json(updatedSubscription);
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    res.json({
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Handle Stripe webhook
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      throw new BadRequestError('No Stripe signature found');
    }
    if (!config.stripe.webhookSecret) {
      throw new BadRequestError('Stripe webhook secret is not configured');
    }
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret,
    );

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionRecord = await prisma.subscription.findFirst({
          where: { stripeId: subscription.id },
        });

        if (subscriptionRecord) {
          await prisma.subscription.update({
            where: { id: subscriptionRecord.id },
            data: {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          await cache.del(`billing:${subscriptionRecord.userId}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await prisma.subscription.findFirst({
          where: { stripeId: invoice.subscription as string },
        });

        if (subscription) {
          await prisma.payment.create({
            data: {
              userId: subscription.userId,
              stripeId: invoice.payment_intent as string,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: PAYMENT_STATUS.SUCCEEDED,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await prisma.subscription.findFirst({
          where: { stripeId: invoice.subscription as string },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SUBSCRIPTION_STATUS.PAST_DUE },
          });

          await prisma.payment.create({
            data: {
              userId: subscription.userId,
              stripeId: invoice.payment_intent as string,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: PAYMENT_STATUS.FAILED,
            },
          });

          await cache.del(`billing:${subscription.userId}`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router; 