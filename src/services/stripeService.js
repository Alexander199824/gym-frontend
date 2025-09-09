// src/services/stripeService.js
// SERVICIO DE STRIPE Y PROCESAMIENTO DE PAGOS

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';

class StripeService extends BaseService {
  // ================================
  // 💳 MÉTODOS DE STRIPE - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  async getStripeConfig() {
    console.log('💳 FETCHING STRIPE CONFIGURATION...');
    
    try {
      const result = await this.get('/stripe/config');
      
      console.log('✅ STRIPE CONFIG RECEIVED:', result);
      
      if (result && result.data?.stripe) {
        console.log('✅ Stripe config structure is correct');
        console.log('💳 Stripe settings:', {
          enabled: result.data.stripe.enabled,
          mode: result.data.stripe.mode,
          currency: result.data.stripe.currency,
          hasPublishableKey: !!result.data.stripe.publishableKey
        });
      } else {
        console.warn('⚠️ Stripe config structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE CONFIG FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 STRIPE: Config endpoint not found - Stripe not implemented');
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }

  // ================================
  // 💳 MÉTODOS DE STRIPE QUE PODRÍAN FALTAR
  // ================================

  // Método para obtener webhooks de Stripe
  async handleStripeWebhook(webhookData) {
    console.log('💳 HANDLING STRIPE WEBHOOK...');
    console.log('📤 Webhook data:', webhookData);
    
    try {
      const result = await this.post('/stripe/webhook', webhookData);
      
      console.log('✅ STRIPE WEBHOOK HANDLED:', result);
      
      if (result && result.success) {
        console.log('✅ Webhook processing response structure is correct');
        console.log('💳 Webhook details:', {
          eventType: webhookData.type,
          processed: result.data?.processed || false,
          paymentIntentId: result.data?.paymentIntentId
        });
      } else {
        console.warn('⚠️ Webhook response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE WEBHOOK HANDLING FAILED:', error.message);
      
      if (error.response?.status === 400) {
        console.log('💳 WEBHOOK: Invalid webhook signature or data');
      } else if (error.response?.status === 404) {
        console.log('💳 WEBHOOK: Endpoint not found - Webhooks not implemented');
      }
      
      throw error;
    }
  }

  // Método para obtener lista de pagos de Stripe
  async getStripePayments(params = {}) {
    console.log('💳 FETCHING STRIPE PAYMENTS...');
    console.log('📋 Query params:', params);
    
    try {
      const result = await this.get('/stripe/payments', { params });
      
      console.log('✅ STRIPE PAYMENTS RECEIVED:', result);
      
      if (result && result.data) {
        if (Array.isArray(result.data.payments)) {
          console.log('✅ Payments list structure is correct');
          console.log('💳 Payments summary:', {
            totalPayments: result.data.payments.length,
            hasMore: result.data.hasMore || false,
            totalAmount: result.data.totalAmount || 0
          });
        } else {
          console.warn('⚠️ Payments structure might be different from expected');
        }
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENTS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENTS: Payments endpoint not found');
        return {
          success: true,
          data: {
            payments: [],
            hasMore: false,
            totalAmount: 0
          }
        };
      }
      
      throw error;
    }
  }

  // Método para cancelar Payment Intent
  async cancelStripePaymentIntent(paymentIntentId) {
    console.log('💳 CANCELING STRIPE PAYMENT INTENT...');
    console.log('🎯 Payment Intent ID:', paymentIntentId);
    
    try {
      const result = await this.post('/stripe/cancel-payment-intent', {
        paymentIntentId
      });
      
      console.log('✅ STRIPE PAYMENT INTENT CANCELED:', result);
      
      if (result && result.success) {
        console.log('✅ Cancel payment intent response structure is correct');
        console.log('💳 Cancellation details:', {
          paymentIntentId: result.data?.paymentIntentId,
          status: result.data?.status,
          canceledAt: result.data?.canceledAt
        });
      } else {
        console.warn('⚠️ Cancel payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENT INTENT CANCELLATION FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT INTENT NOT FOUND: Payment intent ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 PAYMENT INTENT CANNOT BE CANCELED: Already succeeded or canceled');
      }
      
      throw error;
    }
  }

  // Método para obtener métodos de pago guardados
  async getStripePaymentMethods(customerId) {
    console.log('💳 FETCHING STRIPE PAYMENT METHODS...');
    console.log('👤 Customer ID:', customerId);
    
    try {
      const result = await this.get(`/stripe/payment-methods/${customerId}`);
      
      console.log('✅ STRIPE PAYMENT METHODS RECEIVED:', result);
      
      if (result && result.data && Array.isArray(result.data.paymentMethods)) {
        console.log('✅ Payment methods structure is correct');
        console.log('💳 Payment methods summary:', {
          totalMethods: result.data.paymentMethods.length,
          hasDefaultMethod: !!result.data.defaultPaymentMethod
        });
      } else {
        console.warn('⚠️ Payment methods structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENT METHODS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 CUSTOMER NOT FOUND OR NO PAYMENT METHODS');
        return {
          success: true,
          data: {
            paymentMethods: [],
            defaultPaymentMethod: null
          }
        };
      }
      
      throw error;
    }
  }

  // Método para crear customer en Stripe
  async createStripeCustomer(customerData) {
    console.log('💳 CREATING STRIPE CUSTOMER...');
    console.log('📤 Customer data:', customerData);
    
    try {
      const result = await this.post('/stripe/create-customer', customerData);
      
      console.log('✅ STRIPE CUSTOMER CREATED:', result);
      
      if (result && result.success && result.data?.customer) {
        console.log('✅ Create customer response structure is correct');
        console.log('💳 Customer details:', {
          customerId: result.data.customer.id,
          email: result.data.customer.email,
          hasPaymentMethods: !!result.data.customer.default_source
        });
      } else {
        console.warn('⚠️ Create customer response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE CUSTOMER CREATION FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - email: Must be a valid email address');
        console.log('   - name: Must be provided');
      }
      
      throw error;
    }
  }

  // Método para verificar estado de Stripe en tiempo real
  async checkStripeHealth() {
    console.log('💳 CHECKING STRIPE HEALTH STATUS...');
    
    try {
      const result = await this.get('/stripe/health');
      
      console.log('✅ STRIPE HEALTH CHECK COMPLETED:', result);
      
      if (result && result.data) {
        console.log('✅ Stripe health response structure is correct');
        console.log('💳 Stripe health status:', {
          isConnected: result.data.connected || false,
          mode: result.data.mode,
          lastCheck: result.data.lastCheck,
          webhooksEnabled: result.data.webhooksEnabled || false
        });
      } else {
        console.warn('⚠️ Stripe health response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE HEALTH CHECK FAILED:', error.message);
      
      return {
        success: false,
        data: {
          connected: false,
          mode: 'unknown',
          lastCheck: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }

  async createMembershipPaymentIntent(membershipData) {
    console.log('💳 CREATING MEMBERSHIP PAYMENT INTENT...');
    console.log('📤 Membership data:', membershipData);
    
    try {
      const result = await this.post('/stripe/create-membership-intent', membershipData);
      
      console.log('✅ MEMBERSHIP PAYMENT INTENT CREATED:', result);
      
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Payment intent response structure is correct');
        console.log('💳 Payment intent details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          amount: result.data.amount,
          currency: result.data.currency
        });
      } else {
        console.warn('⚠️ Payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }
  
  async createDailyPaymentIntent(dailyData) {
    console.log('💳 CREATING DAILY PAYMENT INTENT...');
    console.log('📤 Daily payment data:', dailyData);
    
    try {
      const result = await this.post('/stripe/create-daily-intent', dailyData);
      
      console.log('✅ DAILY PAYMENT INTENT CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ DAILY PAYMENT INTENT FAILED:', error.message);
      throw error;
    }
  }
  
  async createStorePaymentIntent(storeData) {
    console.log('💳 CREATING STORE PAYMENT INTENT...');
    console.log('📤 Store payment data:', storeData);
    
    try {
      const result = await this.post('/stripe/create-store-intent', storeData);
      
      console.log('✅ STORE PAYMENT INTENT CREATED:', result);
      
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Store payment intent response structure is correct');
        console.log('💳 Store payment details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          orderId: storeData.orderId
        });
      } else {
        console.warn('⚠️ Store payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STORE PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - orderId: Must be a valid order ID');
      } else if (error.response?.status === 404) {
        console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid');
      }
      
      throw error;
    }
  }
  
  async confirmStripePayment(paymentData) {
    console.log('💳 CONFIRMING STRIPE PAYMENT...');
    console.log('📤 Payment confirmation data:', paymentData);
    
    try {
      const result = await this.post('/stripe/confirm-payment', paymentData);
      
      console.log('✅ STRIPE PAYMENT CONFIRMED:', result);
      
      if (result && result.success && result.data?.payment) {
        console.log('✅ Payment confirmation response structure is correct');
        console.log('💳 Payment confirmation details:', {
          paymentId: result.data.payment.id,
          amount: result.data.payment.amount,
          status: result.data.payment.status,
          stripeStatus: result.data.stripe?.status
        });
      } else {
        console.warn('⚠️ Payment confirmation response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENT CONFIRMATION FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT INTENT NOT FOUND: Payment intent ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 PAYMENT ALREADY PROCESSED: Payment might already be confirmed');
      }
      
      throw error;
    }
  }
  
  async createStripeRefund(refundData) {
    console.log('💳 CREATING STRIPE REFUND...');
    console.log('📤 Refund data:', refundData);
    
    try {
      const result = await this.post('/stripe/refund', refundData);
      
      console.log('✅ STRIPE REFUND CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE REFUND FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT NOT FOUND: Payment ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 REFUND NOT ALLOWED: Payment cannot be refunded');
      }
      
      throw error;
    }
  }
  
  async getStripeStatus() {
    console.log('💳 FETCHING STRIPE STATUS...');
    
    try {
      const result = await this.get('/stripe/status');
      
      console.log('✅ STRIPE STATUS RECEIVED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE STATUS FAILED:', error.message);
      
      return {
        status: 'unknown',
        enabled: false,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

export { StripeService };