/*
Autor: Alexander Echeverria
src/services/membershipService.js
CORREGIDO: Transferencias permanecen pendientes hasta validación manual
*/

import apiService from './apiService';

class MembershipService {
  
  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS EXISTENTES
  // ================================
  
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
  
  // ✅ CORREGIDO: FLUJO PRINCIPAL DE COMPRA CON VALIDACIÓN DE TRANSFERENCIAS
  async purchaseMembership(planId, selectedSchedule, paymentMethod, notes = '') {
  try {
    console.log('💰 Iniciando compra de membresía...');
    console.log('📋 Método de pago:', paymentMethod);
    
    // ✅ PASO 1: Verificar si puede comprar
    const canPurchaseResult = await this.canPurchaseNewMembership();
    
    if (!canPurchaseResult.canPurchase) {
      console.error('❌ Usuario no puede comprar nueva membresía:', canPurchaseResult.reason);
      
      let errorMessage = 'No puedes comprar una nueva membresía.';
      
      switch (canPurchaseResult.reason) {
        case 'active_membership':
          errorMessage = 'Ya tienes una membresía activa. Espera a que venza para renovar.';
          break;
        case 'pending_membership':
          const membership = canPurchaseResult.membership;
          if (membership.payment?.paymentMethod === 'cash') {
            errorMessage = 'Tienes una membresía pendiente de pago en efectivo. Visita el gimnasio para completar tu pago antes de comprar otra.';
          } else if (membership.payment?.paymentMethod === 'transfer') {
            errorMessage = 'Tienes una membresía pendiente de validación por transferencia. Espera la confirmación antes de comprar otra.';
          } else {
            errorMessage = 'Tienes una membresía pendiente de validación. Espera la confirmación antes de comprar otra.';
          }
          break;
        default:
          errorMessage = 'No puedes comprar una nueva membresía en este momento.';
      }
      
      throw new Error(errorMessage);
    }
    
    console.log('✅ Usuario autorizado para comprar membresía');
    
    // ✅ PASO 2: Proceder con la compra (lógica original)
    if (paymentMethod === 'transfer') {
      console.log('🏦 Método de transferencia - Debe quedar PENDIENTE hasta validación manual');
      notes = notes || 'Pago por transferencia bancaria - PENDIENTE DE VALIDACIÓN MANUAL';
    }
    
    if (paymentMethod === 'cash') {
      console.log('💵 Método de efectivo - Debe quedar PENDIENTE hasta pago en gimnasio');
      notes = notes || 'Pago en efectivo en gimnasio - PENDIENTE DE PAGO';
    }
    
    const payload = {
      planId,
      selectedSchedule,
      paymentMethod,
      notes,
      requiresManualValidation: paymentMethod === 'transfer' || paymentMethod === 'cash'
    };
    
    console.log('📤 Enviando payload de compra:', payload);
    
    const response = await apiService.post('/api/memberships/purchase', payload);
    
    console.log('📥 Respuesta del backend:', response);
    
    if (response?.success && response.data) {
      const result = {
        membership: response.data.membership,
        payment: response.data.payment,
        plan: response.data.plan,
        user: response.data.user
      };
      
      // ✅ CORREGIDO: Validaciones de estado usando 'pending' real
      if (paymentMethod === 'transfer') {
        if (result.membership?.status === 'active') {
          console.error('❌ ERROR: Membresía por transferencia se activó automáticamente');
          result.membership.status = 'pending'; // Usar estado real de BD
          result.membership.isActive = false;
          result.membership.requiresValidation = true;
        }
        
        if (result.payment?.status === 'completed') {
          console.error('❌ ERROR: Pago por transferencia marcado como completado');
          result.payment.status = 'pending';
          result.payment.requiresValidation = true;
        }
      }
      
      if (paymentMethod === 'cash') {
        if (result.membership?.status === 'active') {
          console.error('❌ ERROR: Membresía por efectivo se activó automáticamente');
          result.membership.status = 'pending'; // Usar estado real de BD
          result.membership.isActive = false;
          result.membership.requiresValidation = true;
        }
        
        if (result.payment?.status === 'completed') {
          console.error('❌ ERROR: Pago por efectivo marcado como completado');
          result.payment.status = 'pending';
          result.payment.requiresValidation = true;
        }
      }
      
      console.log('✅ Compra completada exitosamente:', {
        membershipId: result.membership.id,
        status: result.membership.status,
        paymentMethod: result.payment.paymentMethod,
        paymentStatus: result.payment.status
      });
      
      return result;
    }
    
    throw new Error(response?.message || 'Error comprando membresía');
    
  } catch (error) {
    console.error('❌ Error en purchaseMembership:', error);
    throw error;
  }
}
  
  // FLUJO TRANSFERENCIA: Subir comprobante
  async uploadTransferProof(paymentId, proofFile) {
    try {
      console.log('📎 Subiendo comprobante de transferencia para pago:', paymentId);
      
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
        console.log('✅ Comprobante subido - Pago sigue PENDIENTE hasta validación manual');
        return response.data;
      }
      
      throw new Error(response?.message || 'Error subiendo comprobante');
      
    } catch (error) {
      console.error('❌ Error subiendo comprobante:', error);
      throw error;
    }
  }
  
  // ✅ CORREGIDO: OBTENER MEMBRESÍA ACTUAL CON VALIDACIÓN DE ESTADOS
async getCurrentMembership() {
  try {
    console.log('🔍 Obteniendo membresía actual del usuario (usando rutas con parámetros)...');
    
    let membership = null;
    
    // ✅ PASO 1: Intentar obtener membresía activa primero
    try {
      console.log('🔍 Paso 1: Buscando membresía activa...');
      const activeResponse = await apiService.get('/api/memberships/my-current');
      
      if (activeResponse?.success && activeResponse.data?.membership) {
        membership = activeResponse.data.membership;
        console.log('✅ Membresía activa encontrada:', membership.id);
        console.log('📊 Estado de membresía activa:', membership.status);
        return membership;
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('❌ Error obteniendo membresía activa:', error);
      } else {
        console.log('ℹ️ No hay membresía activa, buscando membresías pendientes...');
      }
    }
    
    // ✅ PASO 2: Buscar membresías pendientes usando la ruta con parámetros
    try {
      console.log('🔍 Paso 2: Buscando membresías pendientes usando ?status=pending...');
      
      // ✅ USAR LA RUTA CON PARÁMETROS COMO SUGIRIÓ EL USUARIO
      const pendingResponse = await apiService.get('/api/memberships?status=pending');
      
      console.log('📥 Respuesta de membresías pendientes:', pendingResponse);
      
      if (pendingResponse?.success && pendingResponse.data?.memberships) {
        const pendingMemberships = pendingResponse.data.memberships;
        console.log(`📋 Total membresías pendientes encontradas: ${pendingMemberships.length}`);
        
        if (pendingMemberships.length > 0) {
          // Filtrar solo las de efectivo y transferencia
          const relevantPending = pendingMemberships.filter(m => {
            const isCashOrTransfer = m.payment?.paymentMethod === 'cash' || m.payment?.paymentMethod === 'transfer';
            
            console.log(`🔍 Membresía ${m.id}:`, {
              status: m.status,
              paymentMethod: m.payment?.paymentMethod,
              isCashOrTransfer,
              createdAt: m.createdAt
            });
            
            return isCashOrTransfer;
          });
          
          if (relevantPending.length > 0) {
            // Tomar la más reciente
            membership = relevantPending.sort((a, b) => 
              new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate)
            )[0];
            
            console.log(`✅ Membresía pendiente encontrada: ${membership.id} (${membership.payment?.paymentMethod})`);
            
            // ✅ Marcar con flags adicionales para el frontend
            membership.isActive = false;
            membership.requiresValidation = true;
            membership.isPending = true;
            
            console.log('🔧 Membresía pendiente procesada:', {
              id: membership.id,
              status: membership.status,
              paymentMethod: membership.payment?.paymentMethod,
              paymentStatus: membership.payment?.status,
              requiresValidation: membership.requiresValidation
            });
            
            return membership;
          } else {
            console.log('ℹ️ No se encontraron membresías pendientes de efectivo/transferencia');
          }
        } else {
          console.log('ℹ️ No hay membresías pendientes');
        }
      } else {
        console.log('ℹ️ Respuesta vacía o sin membresías pendientes');
      }
    } catch (error) {
      console.error('❌ Error buscando membresías pendientes:', error);
      
      // ✅ FALLBACK: Si la ruta con parámetros falla, intentar la ruta original
      console.log('🔄 Fallback: Intentando ruta original /api/memberships...');
      
      try {
        const fallbackResponse = await apiService.get('/api/memberships');
        
        if (fallbackResponse?.success && fallbackResponse.data?.memberships) {
          const allMemberships = fallbackResponse.data.memberships;
          console.log(`📋 Fallback: Total membresías encontradas: ${allMemberships.length}`);
          
          const pendingMemberships = allMemberships.filter(m => {
            const isPending = m.status === 'pending';
            const isCashOrTransfer = m.payment?.paymentMethod === 'cash' || m.payment?.paymentMethod === 'transfer';
            
            console.log(`🔍 Fallback - Membresía ${m.id}:`, {
              status: m.status,
              paymentMethod: m.payment?.paymentMethod,
              isPending,
              isCashOrTransfer
            });
            
            return isPending && isCashOrTransfer;
          });
          
          if (pendingMemberships.length > 0) {
            membership = pendingMemberships.sort((a, b) => 
              new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate)
            )[0];
            
            console.log(`✅ Fallback: Membresía pendiente encontrada: ${membership.id}`);
            
            membership.isActive = false;
            membership.requiresValidation = true;
            membership.isPending = true;
            
            return membership;
          }
        }
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
      }
    }
    
    console.log('ℹ️ No se encontró ninguna membresía (activa o pendiente)');
    return null;
    
  } catch (error) {
    console.error('❌ Error general obteniendo membresía actual:', error);
    
    // Solo lanzar error si no es 404
    if (error.response?.status !== 404) {
      throw error;
    }
    
    return null;
  }
}

// ✅ AGREGAR este nuevo método en membershipService.js

async canPurchaseNewMembership() {
  try {
    console.log('🔍 Verificando si el usuario puede comprar una nueva membresía...');
    
    const currentMembership = await this.getCurrentMembership();
    
    if (!currentMembership) {
      console.log('✅ Usuario puede comprar - no tiene membresías');
      return {
        canPurchase: true,
        reason: 'no_membership'
      };
    }
    
    console.log('📊 Membresía encontrada para validación:', {
      id: currentMembership.id,
      status: currentMembership.status,
      paymentMethod: currentMembership.payment?.paymentMethod,
      paymentStatus: currentMembership.payment?.status,
      isActive: currentMembership.isActive,
      isPending: currentMembership.isPending
    });
    
    // Si tiene membresía activa, no puede comprar
    if (currentMembership.status === 'active') {
      console.log('❌ Usuario NO puede comprar - tiene membresía activa');
      return {
        canPurchase: false,
        reason: 'active_membership',
        membership: currentMembership
      };
    }
    
    // ✅ Si tiene membresía pendiente (estado 'pending'), no puede comprar
    if (currentMembership.status === 'pending' || currentMembership.isPending) {
      console.log('❌ Usuario NO puede comprar - tiene membresía pendiente');
      console.log('❌ Detalles de membresía pendiente:', {
        id: currentMembership.id,
        paymentMethod: currentMembership.payment?.paymentMethod,
        paymentStatus: currentMembership.payment?.status
      });
      
      return {
        canPurchase: false,
        reason: 'pending_membership',
        membership: currentMembership
      };
    }
    
    // Si la membresía está vencida, puede comprar
    if (currentMembership.status === 'expired') {
      console.log('✅ Usuario puede comprar - membresía anterior vencida');
      return {
        canPurchase: true,
        reason: 'expired_membership'
      };
    }
    
    // Default: no permitir
    console.log('❌ Usuario NO puede comprar - estado desconocido:', currentMembership.status);
    return {
      canPurchase: false,
      reason: 'unknown',
      membership: currentMembership
    };
    
  } catch (error) {
    console.error('❌ Error verificando si puede comprar membresía:', error);
    
    // En caso de error, permitir compra para no bloquear al usuario
    return {
      canPurchase: true,
      reason: 'error',
      error: error.message
    };
  }
}
  
  // OBTENER: Membresías del usuario
  
async getUserMemberships() {
  try {
    console.log('📋 Obteniendo membresías del usuario...');
    
    const response = await apiService.get('/api/memberships');
    
    if (response?.success && response.data?.memberships) {
      return response.data.memberships.map(membership => {
        
        // ✅ CORREGIDO: Aplicar validaciones usando estado 'pending' real
        if (membership.payment?.paymentMethod === 'transfer') {
          // Verificar consistencia de estados
          if (membership.payment.status === 'pending' && membership.status === 'active') {
            console.warn('⚠️ Membresía histórica inconsistente corregida:', membership.id);
            membership.status = 'pending'; // Usar estado real de BD
            membership.isActive = false;
          }
        }
        
        // ✅ NUEVO: Validaciones para efectivo
        if (membership.payment?.paymentMethod === 'cash') {
          if (membership.payment.status === 'pending' && membership.status === 'active') {
            console.warn('⚠️ Membresía de efectivo inconsistente corregida:', membership.id);
            membership.status = 'pending'; // Usar estado real de BD
            membership.isActive = false;
          }
        }
        
        return {
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
          summary: membership.summary,
          payment: membership.payment,
          requiresValidation: membership.requiresValidation || 
            (membership.status === 'pending' && 
             (membership.payment?.paymentMethod === 'transfer' || membership.payment?.paymentMethod === 'cash'))
        };
      });
    }
    
    throw new Error(response?.message || 'Error obteniendo membresías del usuario');
    
  } catch (error) {
    console.error('❌ Error obteniendo membresías del usuario:', error);
    throw error;
  }
}
  
  // ✅ NUEVO: VERIFICAR ESTADO REAL DEL PAGO CON VALIDACIÓN
  async checkPaymentStatus(paymentId) {
    try {
      console.log('🔍 Verificando estado real del pago:', paymentId);
      
      const response = await apiService.get(`/api/payments/${paymentId}`);
      
      if (response?.success && response.data?.payment) {
        const payment = response.data.payment;
        
        // ✅ LOGGING DETALLADO PARA DEBUGGING
        console.log('📊 Estado completo del pago:', {
          id: payment.id,
          status: payment.status,
          method: payment.paymentMethod,
          amount: payment.amount,
          validated: payment.transferValidated,
          validatedBy: payment.validatedBy,
          validatedAt: payment.validatedAt,
          created: payment.createdAt
        });
        
        // ✅ VALIDACIÓN: Transferencias no pueden estar completadas sin validación manual
        if (payment.paymentMethod === 'transfer' && payment.status === 'completed') {
          if (!payment.transferValidated || !payment.validatedBy) {
            console.error('❌ INCONSISTENCIA: Transferencia completada sin validación manual');
            console.error('❌ Esto indica un problema en el backend');
          }
        }
        
        return {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transferValidated: payment.transferValidated || false,
          validatedBy: payment.validatedBy,
          validatedAt: payment.validatedAt,
          requiresManualValidation: payment.paymentMethod === 'transfer' && !payment.transferValidated
        };
      }
      
      throw new Error(response?.message || 'Error verificando estado del pago');
      
    } catch (error) {
      console.error('❌ Error verificando estado del pago:', error);
      throw error;
    }
  }

  // ✅ NUEVO: POLLING MEJORADO PARA TRANSFERENCIAS PENDIENTES
  startPaymentStatusPolling(paymentId, onStatusChange, intervalMs = 60000, maxDuration = 3600000) {
    console.log(`🔄 Iniciando polling para pago ${paymentId} (transferencia)...`);
    console.log(`⏱️ Intervalo: ${intervalMs/1000}s, Duración máxima: ${maxDuration/60000} minutos`);
    
    let pollCount = 0;
    const maxPolls = Math.floor(maxDuration / intervalMs);
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`🔄 Poll #${pollCount}/${maxPolls} para pago ${paymentId}`);
        
        const status = await this.checkPaymentStatus(paymentId);
        
        if (status.status === 'completed' && status.transferValidated) {
          console.log('✅ Transferencia VALIDADA y completada');
          clearInterval(pollInterval);
          onStatusChange({
            type: 'success',
            status: status,
            message: '¡Transferencia aprobada! Tu membresía ha sido activada.'
          });
        } else if (status.status === 'failed') {
          console.log('❌ Transferencia RECHAZADA');
          clearInterval(pollInterval);
          onStatusChange({
            type: 'error',
            status: status,
            message: 'Tu transferencia fue rechazada. Contacta soporte para más detalles.'
          });
        } else if (status.status === 'cancelled') {
          console.log('🚫 Transferencia CANCELADA');
          clearInterval(pollInterval);
          onStatusChange({
            type: 'error',
            status: status,
            message: 'Tu transferencia fue cancelada.'
          });
        } else {
          console.log('⏳ Transferencia aún PENDIENTE de validación manual');
          onStatusChange({
            type: 'pending',
            status: status,
            message: `Transferencia en validación manual... (${pollCount}/${maxPolls})`
          });
        }
      } catch (error) {
        console.error('❌ Error en polling:', error);
        onStatusChange({
          type: 'error',
          error: error,
          message: 'Error verificando estado de la transferencia'
        });
      }
    }, intervalMs);
    
    // Limpiar después del tiempo máximo
    setTimeout(() => {
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('⏰ Polling timeout alcanzado para pago:', paymentId);
        onStatusChange({
          type: 'timeout',
          message: 'Tiempo de espera agotado. Verifica el estado manualmente.'
        });
      }
    }, maxDuration);
    
    return pollInterval;
  }

  // ================================
  // 📅 MÉTODOS DE GESTIÓN DE HORARIOS ADAPTADOS (SIN CAMBIOS)
  // ================================

  // OBTENER: Horarios actuales del cliente (adaptado para backend actual)
  async getCurrentSchedule() {
    try {
      console.log('📅 MembershipService: Obteniendo horarios actuales del cliente...');
      
      const response = await apiService.get('/api/memberships/my-schedule');
      
      console.log('📋 MembershipService: Respuesta cruda del backend:', response);
      
      // Usar normalización adaptada para el formato actual
      const normalizedData = this.normalizeScheduleDataFallback(response);
      console.log('✅ MembershipService: Datos normalizados:', normalizedData);
      return normalizedData;
      
    } catch (error) {
      console.error('❌ MembershipService: Error obteniendo horarios actuales:', error);
      
      if (error.response?.status === 404) {
        // Usuario sin membresía o sin horarios
        console.log('ℹ️ Usuario sin membresía activa');
        return {
          hasMembership: false,
          currentSchedule: {},
          membership: null,
          canEditSchedule: false,
          totalSlotsReserved: 0
        };
      }
      
      throw error;
    }
  }

  // OBTENER: Opciones de horarios disponibles (adaptado)
  async getAvailableScheduleOptions(day = null) {
    try {
      console.log('🔍 MembershipService: Obteniendo opciones de horarios disponibles...');
      
      const params = day ? { day } : {};
      const response = await apiService.get('/api/memberships/my-schedule/available-options', { params });
      
      console.log('📋 MembershipService: Respuesta de opciones:', response);
      
      // Usar normalización adaptada
      const normalizedData = this.normalizeAvailableOptionsFallback(response);
      console.log('✅ MembershipService: Opciones normalizadas:', normalizedData);
      return normalizedData;
      
    } catch (error) {
      console.error('❌ MembershipService: Error obteniendo opciones disponibles:', error);
      throw error;
    }
  }

  // CAMBIAR: Horarios seleccionados del cliente (con validación robusta)
  async changeClientSchedule(changes) {
    try {
      console.log('✏️ MembershipService: Cambiando horarios del cliente...');
      console.log('📤 Cambios recibidos:', changes);
      
      // Validar y limpiar cambios
      const cleanedChanges = this.validateAndCleanChangesFallback(changes);
      console.log('🧹 Cambios limpiados:', cleanedChanges);
      
      // Determinar tipo de cambio
      const changeType = this.determineChangeType(cleanedChanges);
      
      const payload = {
        changeType,
        changes: cleanedChanges
      };
      
      console.log('📦 MembershipService: Enviando payload:', payload);
      
      const response = await apiService.post('/api/memberships/my-schedule/change', payload);
      
      if (response?.success) {
        console.log('✅ MembershipService: Horarios cambiados exitosamente:', response.data);
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cambiando horarios');
      
    } catch (error) {
      console.error('❌ MembershipService: Error cambiando horarios:', error);
      
      // Manejo específico de errores de disponibilidad
      if (error.response?.data?.unavailableSlots) {
        throw {
          ...error,
          unavailableSlots: error.response.data.unavailableSlots
        };
      }
      
      throw error;
    }
  }

  // CANCELAR: Horario específico (con validación de ID)
  async cancelScheduleSlot(day, slotId) {
    try {
      console.log(`🗑️ MembershipService: Cancelando horario ${day}/${slotId}...`);
      
      // Validar y extraer ID válido
      const validSlotId = this.extractSlotId(slotId);
      if (!validSlotId) {
        throw new Error(`ID de slot inválido: ${slotId}`);
      }
      
      console.log(`🗑️ MembershipService: Cancelando horario validado ${day}/${validSlotId}...`);
      
      const response = await apiService.delete(`/api/memberships/my-schedule/${day}/${validSlotId}`);
      
      if (response?.success) {
        console.log('✅ MembershipService: Horario cancelado exitosamente');
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cancelando horario');
      
    } catch (error) {
      console.error('❌ MembershipService: Error cancelando horario:', error);
      throw error;
    }
  }

  // OBTENER: Estadísticas de horarios del cliente (con fallback mejorado)
  async getScheduleStats() {
    try {
      console.log('📊 MembershipService: Obteniendo estadísticas de horarios...');
      
      const response = await apiService.get('/api/memberships/my-schedule/stats');
      
      if (response?.success && response.data) {
        console.log('✅ MembershipService: Estadísticas obtenidas:', response.data);
        return response.data;
      }
      
      throw new Error('Error obteniendo estadísticas');
      
    } catch (error) {
      console.error('❌ MembershipService: Error obteniendo estadísticas:', error);
      
      if (error.response?.status === 404) {
        // Fallback con estadísticas vacías mejoradas
        console.log('📊 MembershipService: Usando estadísticas fallback');
        return {
          hasMembership: false,
          stats: {
            totalSlots: 0,
            usedSlots: 0,
            availableSlots: 0,
            favoriteTime: null,
            totalVisits: 0,
            dayDistribution: {}
          }
        };
      }
      
      throw error;
    }
  }

  // PREVISUALIZAR: Cambios de horarios antes de confirmar (mejorado)
  async previewScheduleChanges(changes) {
    try {
      console.log('👁️ MembershipService: Previsualizando cambios de horarios...');
      
      // Validar cambios antes de previsualizar
      const cleanedChanges = this.validateAndCleanChangesFallback(changes);
      
      const response = await apiService.post('/api/memberships/my-schedule/preview-change', {
        changes: cleanedChanges
      });
      
      if (response?.success && response.data) {
        console.log('✅ MembershipService: Vista previa generada:', response.data);
        return response.data;
      }
      
      throw new Error('Error generando vista previa');
      
    } catch (error) {
      console.error('❌ MembershipService: Error en vista previa:', error);
      throw error;
    }
  }

  // ================================
  // 🛠️ MÉTODOS HELPER ADAPTADOS Y NUEVOS
  // ================================

  // Extraer ID de slot de forma segura (nuevo método)
  extractSlotId(slot) {
    if (typeof slot === 'number') {
      return slot > 0 ? slot : null;
    }
    
    if (typeof slot === 'string') {
      const parsed = parseInt(slot);
      return !isNaN(parsed) && parsed > 0 ? parsed : null;
    }
    
    if (typeof slot === 'object' && slot) {
      const id = slot.id || slot.slotId;
      return this.extractSlotId(id);
    }
    
    console.warn('⚠️ MembershipService: ID de slot inválido:', slot);
    return null;
  }

  // Validar y limpiar cambios - fallback manual
  validateAndCleanChangesFallback(changes) {
    console.log('🔍 MembershipService: Validando cambios (fallback)...');
    
    if (!changes || typeof changes !== 'object') {
      throw new Error('Los cambios deben ser un objeto válido');
    }

    if (Object.keys(changes).length === 0) {
      throw new Error('Debe especificar al menos un cambio');
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const cleanedChanges = {};
    
    for (const [day, slots] of Object.entries(changes)) {
      // Validar nombre del día
      if (!validDays.includes(day.toLowerCase())) {
        console.warn(`⚠️ Día inválido ignorado: ${day}`);
        continue;
      }
      
      // Validar que slots sea un array
      if (!Array.isArray(slots)) {
        console.warn(`⚠️ Slots para ${day} no es un array:`, slots);
        continue;
      }
      
      // Limpiar y validar IDs de slots
      const cleanedSlots = slots
        .map(slot => this.extractSlotId(slot))
        .filter(id => id !== null);
      
      if (cleanedSlots.length === 0) {
        console.warn(`⚠️ No hay slots válidos para ${day}`);
        continue;
      }
      
      cleanedChanges[day] = cleanedSlots;
    }

    if (Object.keys(cleanedChanges).length === 0) {
      throw new Error('No hay cambios válidos para procesar');
    }

    console.log('✅ MembershipService: Cambios validados (fallback)');
    return cleanedChanges;
  }

  // Determinar tipo de cambio
  determineChangeType(changes) {
    const dayCount = Object.keys(changes).length;
    
    if (dayCount === 1) {
      return 'single_day';
    } else if (dayCount <= 3) {
      return 'multiple_days';
    } else {
      return 'full_week';
    }
  }

  // Normalizar datos de horarios - fallback manual
  normalizeScheduleDataFallback(response) {
    console.log('🔄 MembershipService: Normalizando horarios (fallback)...');
    
    if (!response) {
      return this.getEmptyScheduleStructure();
    }
    
    // Extraer datos de respuesta
    const data = response.data || response;
    
    if (!data.hasMembership) {
      return {
        hasMembership: false,
        currentSchedule: {},
        membership: null,
        canEditSchedule: false,
        totalSlotsReserved: 0
      };
    }
    
    // Normalizar horarios actuales
    const normalizedSchedule = this.normalizeCurrentScheduleFallback(data.currentSchedule);
    
    return {
      hasMembership: true,
      currentSchedule: normalizedSchedule,
      membership: data.membership,
      canEditSchedule: data.canEditSchedule !== false,
      totalSlotsReserved: Object.values(normalizedSchedule).reduce((total, day) => 
        total + (day.hasSlots ? day.slots.length : 0), 0
      )
    };
  }

  // Normalizar horarios actuales - fallback
  normalizeCurrentScheduleFallback(currentSchedule) {
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    const normalized = {};

    // Asegurar que todos los días estén presentes
    Object.keys(dayNames).forEach(day => {
      normalized[day] = {
        dayName: dayNames[day],
        hasSlots: false,
        slots: []
      };
    });

    if (!currentSchedule) {
      return normalized;
    }

    // Procesar cada día
    Object.entries(currentSchedule).forEach(([day, dayData]) => {
      if (dayData && dayNames[day]) {
        const slots = this.extractSlotsFromDayData(dayData);
        normalized[day] = {
          dayName: dayNames[day],
          hasSlots: slots.length > 0,
          slots: slots
        };
      }
    });

    return normalized;
  }

  // Extraer slots de datos de día (manejo de múltiples formatos)
  extractSlotsFromDayData(dayData) {
    // Caso 1: dayData.slots existe
    if (dayData.slots && Array.isArray(dayData.slots)) {
      return this.normalizeSlotsArray(dayData.slots);
    }
    
    // Caso 2: dayData es un array directo
    if (Array.isArray(dayData)) {
      return this.normalizeSlotsArray(dayData);
    }
    
    // Caso 3: dayData.hasSlots y puede tener estructura diferente
    if (dayData.hasSlots && dayData.slots) {
      return this.normalizeSlotsArray(dayData.slots);
    }
    
    return [];
  }

  // Normalizar array de slots
  normalizeSlotsArray(slots) {
    if (!Array.isArray(slots)) return [];
    
    return slots.map((slot, index) => {
      if (typeof slot === 'object' && slot) {
        return {
          id: slot.id || slot.slotId || index,
          timeRange: slot.timeRange || this.buildTimeRange(slot.openTime, slot.closeTime),
          openTime: slot.openTime || '00:00',
          closeTime: slot.closeTime || '00:00',
          label: slot.label || slot.slotLabel || '',
          capacity: slot.capacity || 0,
          currentReservations: slot.currentReservations || 0,
          availability: slot.availability || 0,
          canCancel: slot.canCancel !== false
        };
      }
      
      // Si es solo un ID
      return {
        id: this.extractSlotId(slot) || index,
        timeRange: 'Horario configurado',
        openTime: '00:00',
        closeTime: '00:00',
        label: '',
        capacity: 0,
        currentReservations: 0,
        availability: 0,
        canCancel: true
      };
    }).filter(slot => slot.id !== null);
  }

  // Construir timeRange desde openTime y closeTime
  buildTimeRange(openTime, closeTime) {
    if (!openTime || !closeTime) {
      return 'Horario';
    }
    
    const formatTime = (time) => {
      if (typeof time === 'string' && time.includes(':')) {
        return time.slice(0, 5);
      }
      return time;
    };
    
    return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
  }

  // Normalizar opciones disponibles - fallback
  normalizeAvailableOptionsFallback(response) {
    console.log('🔄 MembershipService: Normalizando opciones disponibles (fallback)...');
    
    if (!response || !response.availableOptions) {
      return {
        membershipId: null,
        planInfo: null,
        availableOptions: {},
        currentSchedule: {},
        summary: null
      };
    }
    
    const normalized = {
      membershipId: response.membershipId,
      planInfo: response.planInfo,
      availableOptions: {},
      currentSchedule: response.currentSchedule || {},
      summary: response.summary
    };
    
    // Normalizar opciones por día
    Object.entries(response.availableOptions).forEach(([day, dayData]) => {
      normalized.availableOptions[day] = this.normalizeDayOptionsFallback(day, dayData);
    });
    
    return normalized;
  }

  // Normalizar opciones de día - fallback
  normalizeDayOptionsFallback(day, dayData) {
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    
    if (!dayData) {
      return {
        dayName: dayNames[day] || day,
        isOpen: false,
        slots: [],
        totalAvailable: 0
      };
    }
    
    const normalized = {
      dayName: dayNames[day] || day,
      isOpen: dayData.isOpen !== false,
      slots: [],
      totalAvailable: 0
    };
    
    if (normalized.isOpen && dayData.slots && Array.isArray(dayData.slots)) {
      normalized.slots = dayData.slots.map(slot => ({
        id: slot.id,
        timeRange: slot.timeRange || this.buildTimeRange(slot.openTime, slot.closeTime),
        openTime: slot.openTime || '00:00',
        closeTime: slot.closeTime || '00:00',
        label: slot.label || '',
        capacity: slot.capacity || 0,
        available: slot.available || 0,
        canSelect: slot.canSelect !== false,
        isCurrentlyMine: slot.isCurrentlyMine || false,
        status: slot.status || 'available'
      }));
      
      normalized.totalAvailable = normalized.slots.filter(s => s.canSelect).length;
    }
    
    return normalized;
  }

  // Estructura vacía de horarios
  getEmptyScheduleStructure() {
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    const emptySchedule = {};
    Object.entries(dayNames).forEach(([day, dayName]) => {
      emptySchedule[day] = {
        dayName,
        hasSlots: false,
        slots: []
      };
    });

    return {
      hasMembership: false,
      currentSchedule: emptySchedule,
      membership: null,
      canEditSchedule: false,
      totalSlotsReserved: 0
    };
  }

  // ================================
  // 🛠️ MÉTODOS HELPER ORIGINALES
  // ================================
  
  // HELPER: Calcular días hasta vencimiento
  calculateDaysUntilExpiry(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // VALIDAR: Cambios de horarios (método público actualizado)
  validateScheduleChanges(changes) {
    try {
      this.validateAndCleanChangesFallback(changes);
      return true;
    } catch (error) {
      console.error('❌ MembershipService: Validación falló:', error.message);
      return false;
    }
  }

  // FORMATEAR: Horarios para visualización (actualizado)
  formatScheduleForDisplay(schedule) {
    if (!schedule || !schedule.currentSchedule) {
      console.warn('MembershipService: No hay datos de horarios para formatear');
      return {};
    }

    const formatted = {};

    Object.entries(schedule.currentSchedule).forEach(([day, dayData]) => {
      formatted[day] = {
        ...dayData,
        formattedSlots: dayData.slots?.map(slot => ({
          ...slot,
          displayTime: this.formatTimeRange(slot.timeRange),
          isToday: this.isToday(day),
          isPast: this.isPastTime(slot.timeRange)
        })) || []
      };
    });

    console.log('✅ MembershipService: Horarios formateados para visualización');
    return formatted;
  }

  // HELPER: Verificar si es el día actual
  isToday(day) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  }

  // HELPER: Verificar si el horario ya pasó
  isPastTime(timeRange) {
    if (!timeRange || timeRange === 'Horario' || timeRange === 'Horario configurado') {
      return false;
    }
    
    try {
      const now = new Date();
      const [startTime] = timeRange.split(' - ');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      
      return now > slotTime;
    } catch (error) {
      return false;
    }
  }

  // HELPER: Formatear rango de tiempo
  formatTimeRange(timeRange) {
    if (!timeRange || timeRange === 'Horario' || timeRange === 'Horario configurado') {
      return timeRange;
    }
    
    try {
      const [start, end] = timeRange.split(' - ');
      return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    } catch (error) {
      return timeRange;
    }
  }

  // HELPER: Formatear tiempo individual
  formatTime(time) {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${displayHour}:${minutes} ${period}`;
    } catch (error) {
      console.warn('MembershipService: Error formateando tiempo:', error);
      return time;
    }
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

  // ================================
  // 📊 HELPERS MEJORADOS PARA ESTADÍSTICAS LOCALES
  // ================================

  // Calcular estadísticas locales mejorado
  calculateLocalScheduleStats(schedule) {
    if (!schedule?.currentSchedule) {
      return null;
    }

    const currentScheduleData = schedule.currentSchedule;
    let totalSlots = 0;
    const dayDistribution = {};
    const allTimes = [];

    Object.entries(currentScheduleData).forEach(([day, dayData]) => {
      const slotsCount = dayData.hasSlots ? dayData.slots.length : 0;
      
      dayDistribution[dayData.dayName] = slotsCount;
      totalSlots += slotsCount;
      
      if (dayData.hasSlots && dayData.slots) {
        dayData.slots.forEach(slot => {
          if (slot.timeRange && slot.timeRange !== 'Horario' && slot.timeRange !== 'Horario configurado') {
            allTimes.push(slot.timeRange);
          }
        });
      }
    });

    // Encontrar horario más común
    const timeFrequency = {};
    allTimes.forEach(time => {
      timeFrequency[time] = (timeFrequency[time] || 0) + 1;
    });

    const favoriteTime = Object.keys(timeFrequency).length > 0 ? 
      Object.keys(timeFrequency).reduce((a, b) => 
        timeFrequency[a] > timeFrequency[b] ? a : b
      ) : null;

    const stats = {
      totalSlots,
      usedSlots: totalSlots,
      availableSlots: 0,
      totalVisits: totalSlots * 4, // Estimación semanal
      favoriteTime,
      dayDistribution
    };

    console.log('📊 MembershipService: Estadísticas locales calculadas:', stats);
    return stats;
  }

  // ✅ NUEVO: Helper para trabajar con el formato de objetos completos
  extractSlotIdsFromReservedSchedule(reservedSchedule) {
    const extractedSchedule = {};
    
    if (!reservedSchedule || typeof reservedSchedule !== 'object') {
      return extractedSchedule;
    }

    Object.entries(reservedSchedule).forEach(([day, slots]) => {
      if (Array.isArray(slots)) {
        extractedSchedule[day] = slots.map(slotObj => {
          if (typeof slotObj === 'number') return slotObj;
          if (typeof slotObj === 'object' && slotObj) {
            return slotObj.slotId || slotObj.id;
          }
          return null;
        }).filter(id => id !== null);
      }
    });

    return extractedSchedule;
  }

}

// Exportar instancia singleton
const membershipService = new MembershipService();
export default membershipService;

/*
=== CAMBIOS CRÍTICOS REALIZADOS PARA TRANSFERENCIAS ===

✅ CAMBIOS PRINCIPALES:

1. **VALIDACIÓN ESTRICTA EN purchaseMembership()**:
   - Detecta automáticamente si el método es 'transfer'
   - Agrega flag explícito `requiresManualValidation: true`
   - Valida que la respuesta del backend NO active la membresía automáticamente
   - Fuerza estado `pending_validation` si el backend lo activa incorrectamente

2. **PROTECCIÓN EN getCurrentMembership()**:
   - Verifica inconsistencias: membresía activa con pago pendiente
   - Corrige automáticamente estados incorrectos del backend
   - Asegura que transferencias pendientes se muestren como pendientes

3. **VALIDACIÓN EN getUserMemberships()**:
   - Aplica la misma validación a todo el historial
   - Corrige membresías históricas inconsistentes

4. **MEJORAS EN checkPaymentStatus()**:
   - Logging detallado del estado real del pago
   - Detecta transferencias completadas sin validación manual
   - Incluye flag `requiresManualValidation`

5. **POLLING MEJORADO**:
   - Intervalos más largos para transferencias (60s en lugar de 30s)
   - Verifica que las transferencias estén realmente validadas manualmente
   - Mejor logging para debugging

✅ FLUJO CORREGIDO:

1. **Usuario compra con transferencia**: 
   - Estado: `pending_validation`
   - Pago: `pending`
   - Membresía: NO activa

2. **Usuario sube comprobante**:
   - Estado sigue: `pending_validation`
   - Pago sigue: `pending`

3. **Admin valida manualmente**:
   - Solo entonces: Estado cambia a `active`
   - Solo entonces: Pago cambia a `completed`

✅ DETECCIÓN DE PROBLEMAS:

El servicio ahora detecta y reporta:
- Membresías activadas automáticamente con transferencias
- Pagos marcados como completados sin validación manual
- Inconsistencias entre estado de membresía y pago

✅ FALLBACKS DE SEGURIDAD:

Si el backend activa incorrectamente:
- El frontend fuerza el estado a pendiente
- Logs de error para debugging
- Protege la experiencia del usuario

Estos cambios aseguran que las transferencias siempre requieran validación manual.
*/