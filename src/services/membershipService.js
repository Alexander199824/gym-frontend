// src/services/membershipService.js
// FUNCIÓN: Servicio API para membresías SEGÚN GUÍA del backend
// IMPLEMENTA: Todos los endpoints de la guía de adquisición de membresías

import apiService from './apiService';

class MembershipService {
  
  // ✅ PASO 1: Obtener planes de membresía disponibles - SEGÚN GUÍA
  async getPlans() {
    try {
      console.log('🎫 Obteniendo planes de membresía...');
      
      // ENDPOINT SEGÚN GUÍA: GET /api/memberships/plans
      const response = await apiService.get('/api/memberships/plans');
      
      console.log('📦 Respuesta de planes:', response);
      
      if (response?.success && response.data) {
        const plans = Array.isArray(response.data) ? response.data : response.data.plans || [];
        console.log('✅ Planes obtenidos exitosamente:', plans.length);
        return plans;
      }
      
      throw new Error('Formato de respuesta inválido');
      
    } catch (error) {
      console.error('❌ Error obteniendo planes:', error);
      throw error;
    }
  }
  
  // ✅ FLUJO STRIPE: Verificar configuración
  async checkStripeConfig() {
    try {
      console.log('💳 Verificando configuración de Stripe...');
      
      // ENDPOINT SEGÚN GUÍA: GET /api/stripe/config
      const response = await apiService.get('/api/stripe/config');
      
      if (response?.data?.stripe) {
        return {
          enabled: response.data.stripe.enabled,
          publishableKey: response.data.stripe.publishableKey,
          currency: response.data.stripe.currency
        };
      }
      
      return { enabled: false };
      
    } catch (error) {
      console.error('❌ Error verificando Stripe:', error);
      return { enabled: false };
    }
  }
  
  // ✅ FLUJO STRIPE: Crear Payment Intent para membresía
  async createMembershipPaymentIntent(membershipData) {
    try {
      console.log('💳 Creando Payment Intent para membresía...');
      console.log('📤 Datos recibidos:', membershipData);
      
      // ✅ DEBUG: Preparar payload según la guía
      const payload = {
        membershipType: membershipData.type || membershipData.duration,
        price: membershipData.price,
        membershipId: membershipData.id
      };
      
      console.log('📤 Payload que se enviará al backend:', payload);
      console.log('📤 URL del endpoint:', '/api/stripe/create-membership-intent');
      
      // ENDPOINT SEGÚN GUÍA: POST /api/stripe/create-membership-intent
      const response = await apiService.post('/api/stripe/create-membership-intent', payload);
      
      console.log('📦 Respuesta del backend:', response);
      
      if (response?.success && response.data) {
        return {
          clientSecret: response.data.clientSecret,
          paymentIntentId: response.data.paymentIntentId,
          amount: response.data.amount,
          currency: response.data.currency
        };
      }
      
      throw new Error(response?.message || 'Error creando Payment Intent');
      
    } catch (error) {
      console.error('❌ Error creando Payment Intent:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }
  
  // ✅ FLUJO STRIPE: Confirmar pago en backend
  async confirmStripePayment(paymentIntentId) {
    try {
      console.log('✅ Confirmando pago en backend...');
      
      // ENDPOINT SEGÚN GUÍA: POST /api/stripe/confirm-payment
      const response = await apiService.post('/api/stripe/confirm-payment', {
        paymentIntentId: paymentIntentId
      });
      
      if (response?.success) {
        return {
          payment: response.data.payment,
          membership: response.data.membership,
          stripe: response.data.stripe
        };
      }
      
      throw new Error(response?.message || 'Error confirmando pago');
      
    } catch (error) {
      console.error('❌ Error confirmando pago:', error);
      throw error;
    }
  }
  
  // ✅ FLUJO TRANSFERENCIA: Crear pago con transferencia
  async createTransferPayment(membershipData, userId) {
    try {
      console.log('🏦 Creando pago con transferencia...');
      
      // ENDPOINT SEGÚN GUÍA: POST /api/payments
      const response = await apiService.post('/api/payments', {
        userId: userId,
        membershipId: membershipData.id,
        amount: membershipData.price,
        paymentMethod: 'transfer',
        paymentType: 'membership',
        description: `Membresía ${membershipData.name}`,
        notes: 'Pago por transferencia bancaria'
      });
      
      if (response?.success && response.data?.payment) {
        return response.data.payment;
      }
      
      throw new Error(response?.message || 'Error creando pago por transferencia');
      
    } catch (error) {
      console.error('❌ Error creando pago por transferencia:', error);
      throw error;
    }
  }
  
  // ✅ FLUJO TRANSFERENCIA: Subir comprobante
  async uploadTransferProof(paymentId, proofFile) {
    try {
      console.log('📎 Subiendo comprobante de transferencia...');
      
      const formData = new FormData();
      formData.append('proof', proofFile);
      
      // ENDPOINT SEGÚN GUÍA: POST /api/payments/:id/transfer-proof
      const response = await apiService.post(
        `/api/payments/${paymentId}/transfer-proof`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response?.success) {
        return response.data;
      }
      
      throw new Error(response?.message || 'Error subiendo comprobante');
      
    } catch (error) {
      console.error('❌ Error subiendo comprobante:', error);
      throw error;
    }
  }
  
  // ✅ VERIFICAR: Estado del pago
  async checkPaymentStatus(paymentId) {
    try {
      console.log('🔍 Verificando estado del pago...');
      
      // ENDPOINT SEGÚN GUÍA: GET /api/payments/:id
      const response = await apiService.get(`/api/payments/${paymentId}`);
      
      if (response?.success && response.data?.payment) {
        return {
          id: response.data.payment.id,
          status: response.data.payment.status,
          amount: response.data.payment.amount,
          transferValidated: response.data.payment.transferValidated
        };
      }
      
      throw new Error(response?.message || 'Error verificando estado del pago');
      
    } catch (error) {
      console.error('❌ Error verificando estado del pago:', error);
      throw error;
    }
  }
  
  // ✅ OBTENER: Membresías del usuario
  async getUserMemberships(userId) {
    try {
      console.log('👤 Obteniendo membresías del usuario...');
      
      // ENDPOINT SEGÚN GUÍA: GET /api/memberships
      const response = await apiService.get('/api/memberships');
      
      if (response?.success && response.data?.memberships) {
        return response.data.memberships.map(membership => ({
          id: membership.id,
          type: membership.type,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
          price: membership.price,
          autoRenew: membership.autoRenew,
          daysUntilExpiry: this.calculateDaysUntilExpiry(membership.endDate)
        }));
      }
      
      throw new Error(response?.message || 'Error obteniendo membresías del usuario');
      
    } catch (error) {
      console.error('❌ Error obteniendo membresías del usuario:', error);
      throw error;
    }
  }
  
  // 📅 HELPER: Calcular días hasta vencimiento
  calculateDaysUntilExpiry(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  // 🔄 POLLING: Iniciar seguimiento de estado de pago
  startPaymentStatusPolling(paymentId, onStatusChange, intervalMs = 30000, maxDuration = 600000) {
    console.log(`🔄 Iniciando polling para pago ${paymentId}...`);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.checkPaymentStatus(paymentId);
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          onStatusChange({
            type: 'success',
            status: status,
            message: '¡Pago aprobado! Tu membresía ha sido activada.'
          });
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          onStatusChange({
            type: 'error',
            status: status,
            message: 'Tu transferencia fue rechazada. Contacta soporte.'
          });
        } else {
          onStatusChange({
            type: 'pending',
            status: status,
            message: 'Pago aún en validación...'
          });
        }
      } catch (error) {
        console.error('Error en polling:', error);
        onStatusChange({
          type: 'error',
          error: error,
          message: 'Error verificando estado del pago'
        });
      }
    }, intervalMs);
    
    // Limpiar después del tiempo máximo
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ Polling timeout alcanzado');
    }, maxDuration);
    
    return pollInterval;
  }
}

// Exportar instancia singleton
const membershipService = new MembershipService();
export default membershipService;