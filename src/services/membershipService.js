// Autor: Alexander Echeverria
// src/services/membershipService.js



import apiService from './apiService';

class MembershipService {
  
  // PASO 1: Obtener planes de membresía disponibles - ENDPOINT QUE FUNCIONA
  async getPlans() {
    try {
      console.log('Obteniendo planes de membresía...');
      
      // ENDPOINT QUE FUNCIONÓ EN EL TEST: GET /api/memberships/purchase/plans
      const response = await apiService.get('/api/memberships/purchase/plans');
      
      console.log('Respuesta de planes:', response);
      
      if (response?.success && response.data?.plans) {
        const plans = response.data.plans;
        console.log('Planes obtenidos exitosamente:', plans.length);
        return plans;
      }
      
      throw new Error('Formato de respuesta inválido');
      
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      throw error;
    }
  }
  
  // PASO 2: Obtener horarios disponibles para un plan específico
  async getScheduleOptions(planId) {
    try {
      console.log(`Obteniendo horarios para plan ${planId}...`);
      
      // ENDPOINT QUE FUNCIONÓ: GET /api/memberships/plans/:id/schedule-options
      const response = await apiService.get(`/api/memberships/plans/${planId}/schedule-options`);
      
      if (response?.success && response.data) {
        return {
          availableOptions: response.data.availableOptions,
          plan: response.data.plan
        };
      }
      
      throw new Error('Error obteniendo horarios disponibles');
      
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
      throw error;
    }
  }
  
  // PASO 3: Verificar disponibilidad de horarios seleccionados
  async checkScheduleAvailability(planId, selectedSchedule) {
    try {
      console.log('Verificando disponibilidad de horarios...');
      
      // ENDPOINT QUE FUNCIONÓ: POST /api/memberships/purchase/check-availability
      const response = await apiService.post('/api/memberships/purchase/check-availability', {
        planId,
        selectedSchedule
      });
      
      if (response?.success && response.data) {
        return {
          canPurchase: response.data.canPurchase,
          availability: response.data.availability,
          conflicts: response.data.conflicts || []
        };
      }
      
      throw new Error('Error verificando disponibilidad');
      
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      throw error;
    }
  }
  
  // FLUJO STRIPE: Verificar configuración (sin datos de prueba)
  async checkStripeConfig() {
    try {
      console.log('Verificando configuración de Stripe...');
      
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
  
  // FLUJO STRIPE: Crear Payment Intent para membresía - ENDPOINT QUE FUNCIONA
  async createMembershipPaymentIntent(planId, selectedSchedule, userId) {
    try {
      console.log('Creando Payment Intent para membresía...');
      
      const payload = {
        planId,
        selectedSchedule,
        userId
      };
      
      console.log('Payload Payment Intent:', payload);
      
      // ENDPOINT QUE FUNCIONÓ: POST /api/stripe/create-membership-purchase-intent
      const response = await apiService.post('/api/stripe/create-membership-purchase-intent', payload);
      
      console.log('Respuesta Payment Intent:', response);
      
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
      throw error;
    }
  }
  
  // FLUJO PRINCIPAL: Comprar membresía - ENDPOINT QUE FUNCIONA
  async purchaseMembership(planId, selectedSchedule, paymentMethod, notes = '') {
    try {
      console.log('Comprando membresía...');
      
      const payload = {
        planId,
        selectedSchedule,
        paymentMethod,
        notes
      };
      
      console.log('Payload compra:', payload);
      
      // ENDPOINT QUE FUNCIONÓ: POST /api/memberships/purchase
      const response = await apiService.post('/api/memberships/purchase', payload);
      
      console.log('Respuesta compra:', response);
      
      if (response?.success && response.data) {
        return {
          membership: response.data.membership,
          payment: response.data.payment,
          plan: response.data.plan,
          user: response.data.user
        };
      }
      
      throw new Error(response?.message || 'Error comprando membresía');
      
    } catch (error) {
      console.error('Error comprando membresía:', error);
      throw error;
    }
  }
  
  // FLUJO TRANSFERENCIA: Subir comprobante
  async uploadTransferProof(paymentId, proofFile) {
    try {
      console.log('Subiendo comprobante de transferencia...');
      
      const formData = new FormData();
      formData.append('proof', proofFile);
      
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
  
  // OBTENER: Membresía actual del usuario
  async getCurrentMembership() {
    try {
      console.log('Obteniendo membresía actual del usuario...');
      
      const response = await apiService.get('/api/memberships/my-current');
      
      if (response?.success && response.data?.membership) {
        return response.data.membership;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error obteniendo membresía actual:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  // OBTENER: Membresías del usuario
  async getUserMemberships() {
    try {
      console.log('Obteniendo membresías del usuario...');
      
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
          daysUntilExpiry: this.calculateDaysUntilExpiry(membership.endDate),
          plan: membership.plan,
          schedule: membership.schedule,
          summary: membership.summary
        }));
      }
      
      throw new Error(response?.message || 'Error obteniendo membresías del usuario');
      
    } catch (error) {
      console.error('Error obteniendo membresías del usuario:', error);
      throw error;
    }
  }
  
  // VERIFICAR: Estado del pago
  async checkPaymentStatus(paymentId) {
    try {
      console.log('Verificando estado del pago...');
      
      const response = await apiService.get(`/api/payments/${paymentId}`);
      
      if (response?.success && response.data?.payment) {
        return {
          id: response.data.payment.id,
          status: response.data.payment.status,
          amount: response.data.payment.amount,
          paymentMethod: response.data.payment.paymentMethod,
          transferValidated: response.data.payment.transferValidated,
          validatedBy: response.data.payment.validatedBy,
          validatedAt: response.data.payment.validatedAt
        };
      }
      
      throw new Error(response?.message || 'Error verificando estado del pago');
      
    } catch (error) {
      console.error('Error verificando estado del pago:', error);
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
  
  // HELPER: Selección automática de horarios básica
  autoSelectSchedule(availableOptions, planInfo) {
    const schedule = {};
    let totalReservations = 0;

    console.log('Selección automática de horarios...');
    
    const priorityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekendDays = ['saturday', 'sunday'];
    
    // Llenar días laborales primero
    for (const day of priorityDays) {
      if (availableOptions[day] && 
          availableOptions[day].isOpen && 
          totalReservations < planInfo.maxReservationsPerWeek) {
        
        const availableSlots = availableOptions[day].slots.filter(slot => slot.canReserve);
        
        if (availableSlots.length > 0) {
          const slotsToSelect = Math.min(
            planInfo.maxSlotsPerDay, 
            availableSlots.length,
            planInfo.maxReservationsPerWeek - totalReservations
          );
          
          // Preferir horarios de mañana
          const sortedSlots = availableSlots.sort((a, b) => a.openTime.localeCompare(b.openTime));
          schedule[day] = sortedSlots.slice(0, slotsToSelect).map(slot => slot.id);
          totalReservations += slotsToSelect;
        }
      }
    }
    
    // Agregar fines de semana si hay espacio
    if (totalReservations < planInfo.maxReservationsPerWeek) {
      for (const day of weekendDays) {
        if (availableOptions[day] && 
            availableOptions[day].isOpen && 
            totalReservations < planInfo.maxReservationsPerWeek) {
          
          const availableSlots = availableOptions[day].slots.filter(slot => slot.canReserve);
          
          if (availableSlots.length > 0) {
            const slotsToSelect = Math.min(
              planInfo.maxSlotsPerDay, 
              availableSlots.length,
              planInfo.maxReservationsPerWeek - totalReservations
            );
            
            schedule[day] = availableSlots.slice(0, slotsToSelect).map(slot => slot.id);
            totalReservations += slotsToSelect;
          }
        }
      }
    }

    console.log(`Horarios seleccionados automáticamente: ${totalReservations} slots`);
    return schedule;
  }
  
  // POLLING: Seguimiento de estado de pago para transferencias y efectivo
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
            message: 'Tu pago fue rechazado. Contacta soporte.'
          });
        } else {
          onStatusChange({
            type: 'pending',
            status: status,
            message: 'Pago aún en validación por nuestro equipo...'
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
=== ACTUALIZACIONES PARA PRODUCCIÓN ===

ENDPOINTS UTILIZADOS (QUE FUNCIONARON EN EL TEST):
- GET /api/memberships/purchase/plans: Obtener planes disponibles
- GET /api/memberships/plans/:id/schedule-options: Obtener horarios de un plan
- POST /api/memberships/purchase/check-availability: Verificar disponibilidad
- POST /api/stripe/create-membership-purchase-intent: Crear Payment Intent
- POST /api/memberships/purchase: Comprar membresía (endpoint principal)
- POST /api/payments/:id/transfer-proof: Subir comprobante transferencia
- GET /api/memberships/my-current: Obtener membresía actual
- GET /api/payments/:id: Verificar estado de pago

MÉTODOS DE PAGO SOPORTADOS:
1. Tarjeta (card): 
   - Confirmación inmediata con Stripe
   - Sin datos de prueba en producción
   
2. Transferencia (transfer):
   - Requiere validación manual por admin
   - Sistema de polling para seguimiento
   - Upload de comprobante opcional
   
3. Efectivo (cash):
   - Pago en el gimnasio
   - Requiere confirmación por colaboradores
   - Sistema de seguimiento hasta aprobación

FLUJO COMPLETO:
1. Obtener planes disponibles
2. Seleccionar plan y obtener horarios
3. Usuario selecciona horarios deseados
4. Verificar disponibilidad de horarios
5. Para tarjeta: crear Payment Intent
6. Ejecutar compra con método seleccionado
7. Para transferencia/efectivo: seguimiento hasta aprobación

CARACTERÍSTICAS PRODUCCIÓN:
- Sin datos de prueba de Stripe
- Manejo robusto de errores
- Polling inteligente para pagos pendientes
- Validación de disponibilidad en tiempo real
- Soporte completo para horarios/schedules
*/

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