// src/services/membershipService.js
// Autor: Alexander Echeverria
// Archivo: src/services/membershipService.js

// FUNCION: Servicio API para membresías SEGÚN GUÍA del backend
// IMPLEMENTA: Todos los endpoints de la guía de adquisición de membresías

import apiService from './apiService';

class MembershipService {
  
  // PASO 1: Obtener planes de membresía disponibles - SEGÚN GUÍA
  async getPlans() {
    try {
      console.log('Obteniendo planes de membresía...');
      
      // ENDPOINT SEGÚN GUÍA: GET /api/memberships/plans
      const response = await apiService.get('/api/memberships/plans');
      
      console.log('Respuesta de planes:', response);
      
      if (response?.success && response.data) {
        const plans = Array.isArray(response.data) ? response.data : response.data.plans || [];
        console.log('Planes obtenidos exitosamente:', plans.length);
        return plans;
      }
      
      throw new Error('Formato de respuesta inválido');
      
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      throw error;
    }
  }
  
  // FLUJO STRIPE: Verificar configuración
  async checkStripeConfig() {
    try {
      console.log('Verificando configuración de Stripe...');
      
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
      console.error('Error verificando Stripe:', error);
      return { enabled: false };
    }
  }
  
  // FLUJO STRIPE: Crear Payment Intent para membresía
  async createMembershipPaymentIntent(membershipData) {
    try {
      console.log('Creando Payment Intent para membresía...');
      console.log('Datos recibidos:', membershipData);
      
      // DEBUG: Preparar payload según la guía
      const payload = {
        membershipType: membershipData.type || membershipData.duration,
        price: membershipData.price,
        membershipId: membershipData.id
      };
      
      console.log('Payload que se enviará al backend:', payload);
      console.log('URL del endpoint:', '/api/stripe/create-membership-intent');
      
      // ENDPOINT SEGÚN GUÍA: POST /api/stripe/create-membership-intent
      const response = await apiService.post('/api/stripe/create-membership-intent', payload);
      
      console.log('Respuesta del backend:', response);
      
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
      console.error('Error creando Payment Intent:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }
  
  // FLUJO STRIPE: Confirmar pago en backend
  async confirmStripePayment(paymentIntentId) {
    try {
      console.log('Confirmando pago en backend...');
      
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
      console.error('Error confirmando pago:', error);
      throw error;
    }
  }
  
  // FLUJO TRANSFERENCIA: Crear pago con transferencia
  async createTransferPayment(membershipData, userId) {
    try {
      console.log('Creando pago con transferencia...');
      
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
      console.error('Error creando pago por transferencia:', error);
      throw error;
    }
  }
  
  // FLUJO TRANSFERENCIA: Subir comprobante
  async uploadTransferProof(paymentId, proofFile) {
    try {
      console.log('Subiendo comprobante de transferencia...');
      
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
      console.error('Error subiendo comprobante:', error);
      throw error;
    }
  }
  
  // VERIFICAR: Estado del pago
  async checkPaymentStatus(paymentId) {
    try {
      console.log('Verificando estado del pago...');
      
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
      console.error('Error verificando estado del pago:', error);
      throw error;
    }
  }
  
  // OBTENER: Membresías del usuario
  async getUserMemberships(userId) {
    try {
      console.log('Obteniendo membresías del usuario...');
      
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
      console.error('Error obteniendo membresías del usuario:', error);
      throw error;
    }
  }
  
  // HELPER: Calcular días hasta vencimiento
  calculateDaysUntilExpiry(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  // POLLING: Iniciar seguimiento de estado de pago
  startPaymentStatusPolling(paymentId, onStatusChange, intervalMs = 30000, maxDuration = 600000) {
    console.log(`Iniciando polling para pago ${paymentId}...`);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.checkPaymentStatus(paymentId);
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          onStatusChange({
            type: 'success',
            status: status,
            message: 'Pago aprobado! Tu membresía ha sido activada.'
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
      console.log('Polling timeout alcanzado');
    }, maxDuration);
    
    return pollInterval;
  }
}

// Exportar instancia singleton
const membershipService = new MembershipService();
export default membershipService;

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este MembershipService es el servicio principal para la gestión completa de membresías
del gimnasio Elite Fitness. Maneja todo el flujo de adquisición de membresías desde la
consulta de planes disponibles hasta la confirmación de pagos, soportando tanto pagos
con tarjeta (Stripe) como transferencias bancarias con validación manual.

FUNCIONALIDAD PRINCIPAL:
- Obtención de planes de membresía disponibles desde el backend
- Verificación y configuración de integración con Stripe para pagos con tarjeta
- Creación de Payment Intents de Stripe para procesamiento seguro de pagos
- Gestión completa del flujo de transferencias bancarias
- Subida y validación de comprobantes de transferencia
- Seguimiento en tiempo real del estado de pagos
- Obtención de membresías activas del usuario
- Cálculo automático de días hasta vencimiento
- Sistema de polling para monitoreo de pagos pendientes

ARCHIVOS A LOS QUE SE CONECTA:
- ./apiService: Servicio principal de API para todas las peticiones HTTP
- Componentes de adquisición de membresías en la UI
- Contextos de autenticación para información del usuario
- Páginas de checkout y proceso de pago
- Dashboard de usuario para ver membresías activas
- Componentes de administración para validar transferencias

ENDPOINTS DEL BACKEND UTILIZADOS:
- GET /api/memberships/plans: Obtener planes disponibles
- GET /api/stripe/config: Verificar configuración de Stripe
- POST /api/stripe/create-membership-intent: Crear intención de pago
- POST /api/stripe/confirm-payment: Confirmar pago procesado
- POST /api/payments: Crear pago por transferencia
- POST /api/payments/:id/transfer-proof: Subir comprobante
- GET /api/payments/:id: Verificar estado de pago
- GET /api/memberships: Obtener membresías del usuario

FLUJOS DE PAGO SOPORTADOS:
1. Pago con Stripe (tarjeta de crédito/débito):
   - Verificar configuración de Stripe
   - Crear Payment Intent con datos de membresía
   - Procesar pago en frontend con Stripe Elements
   - Confirmar pago exitoso en backend
   - Activar membresía automáticamente

2. Pago por transferencia bancaria:
   - Crear registro de pago pendiente
   - Usuario sube comprobante de transferencia
   - Sistema de polling para monitoreo automático
   - Validación manual por administradores
   - Activación de membresía tras aprobación

TIPOS DE MEMBRESIAS GESTIONADAS:
- Membresías mensuales, trimestrales, semestrales y anuales
- Planes con diferentes niveles de acceso y beneficios
- Membresías con renovación automática opcional
- Gestión de fechas de inicio y vencimiento
- Cálculo automático de días restantes

ESTADOS DE PAGO MANEJADOS:
- Pending: Pago creado pero no procesado
- Processing: Pago en proceso de validación
- Completed: Pago aprobado y membresía activada
- Failed: Pago rechazado o falló
- Cancelled: Pago cancelado por el usuario

BENEFICIOS PARA EL USUARIO FINAL:
- Proceso de compra de membresía simple y seguro
- Múltiples opciones de pago (tarjeta y transferencia)
- Confirmación inmediata para pagos con tarjeta
- Seguimiento automático del estado de transferencias
- Visualización clara de membresías activas y fechas
- Notificaciones de vencimiento próximo
- Renovación automática opcional para conveniencia
- Proceso transparente con actualizaciones en tiempo real

FUNCIONALIDADES ADMINISTRATIVAS:
- Validación manual de comprobantes de transferencia
- Seguimiento de todos los pagos en el sistema
- Gestión de planes y precios de membresías
- Reportes de ingresos por membresías
- Control de accesos según tipo de membresía

SEGURIDAD Y VALIDACIONES:
- Integración segura con Stripe para pagos con tarjeta
- Validación de comprobantes de transferencia por staff
- Verificación de integridad de datos de pago
- Manejo seguro de información financiera sensible
- Logging detallado para auditorías

EXPERIENCIA OPTIMIZADA:
- Proceso de checkout optimizado para conversión
- Retroalimentación inmediata sobre estado de pagos
- Manejo elegante de errores con mensajes claros
- Sistema de polling no intrusivo para actualizaciones
- Interfaz responsive para compra desde móvil

Este servicio es fundamental para la monetización del gimnasio y la experiencia
de adquisición de membresías, proporcionando un sistema robusto, seguro y fácil
de usar tanto para clientes como para administradores.
*/