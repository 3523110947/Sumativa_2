const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const createPaymentIntent = async (amount, currency = 'mxn') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({  
      amount: amount * 100,
      currency,
      payment_method_types: ['card'],
      metadata: {
        app: 'TaskFlow'
      }
    });

    console.log(`💳 PaymentIntent creado: ${paymentIntent.id}`);
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    };
  } catch (error) {
    console.error('❌ Error creando PaymentIntent:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ CONFIRMAR PAGO ============

const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);  // <-- RESALTAR
    
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    };
  } catch (error) {
    console.error('❌ Error confirmando pago:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ CREAR SUSCRIPCIÓN PREMIUM ============

const createPremiumSubscription = async (email, name) => {
  try {
    // Crear cliente
    const customer = await stripe.customers.create({  // <-- RESALTAR: Crear cliente
      email,
      name,
      metadata: { app: 'TaskFlow' }
    });

    // Crear suscripción (plan premium)
    const subscription = await stripe.subscriptions.create({  // <-- RESALTAR: Crear suscripción
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'TaskFlow Premium',
              description: 'Plan Premium - Funcionalidades avanzadas'
            },
            unit_amount: 19900,  // $199.00 MXN
            recurring: {
              interval: 'month'
            }
          }
        }
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    return {
      success: true,
      customerId: customer.id,
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    };
  } catch (error) {
    console.error('❌ Error creando suscripción:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ CANCELAR SUSCRIPCIÓN ============

const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);  // <-- RESALTAR
    return {
      success: true,
      status: subscription.status
    };
  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ OBTENER ESTADO DE SUSCRIPCIÓN ============

const getSubscriptionStatus = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);  // <-- RESALTAR
    return {
      success: true,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    };
  } catch (error) {
    console.error('❌ Error obteniendo suscripción:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ WEBHOOK - MANEJAR EVENTOS DE STRIPE ============

const handleWebhook = (payload, signature, webhookSecret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);  // <-- RESALTAR

    console.log(`📨 Evento de Stripe recibido: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Pago exitoso:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Pago fallido:', event.data.object.id);
        break;
      case 'customer.subscription.created':
        console.log('📋 Suscripción creada:', event.data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('🗑️ Suscripción cancelada:', event.data.object.id);
        break;
      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return { success: true, event };
  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
    return { success: false, error: error.message };
  }
};

// ============ EXPORTAR ============

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createPremiumSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  handleWebhook
};