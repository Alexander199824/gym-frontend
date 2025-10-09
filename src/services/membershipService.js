/*
Autor: Alexander Echeverria
src/services/membershipService.js
VERSIÓN COMBINADA COMPLETA: Todas las validaciones y mejoras unificadas
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
  
  // ✅ MEJORADO: FLUJO PRINCIPAL DE COMPRA CON VALIDACIÓN COMPLETA
  async purchaseMembership(planId, selectedSchedule, paymentMethod, notes = '') {
    try {
      console.log('💰 Iniciando compra de membresía...');
      console.log('📋 Método de pago:', paymentMethod);
      
      // ✅ PASO 1: Verificar si puede comprar (usando método mejorado)
      const canPurchaseResult = await this.canPurchaseNewMembership();
      
      if (!canPurchaseResult.canPurchase) {
        console.error('❌ Usuario no puede comprar nueva membresía:', canPurchaseResult.reason);
        
        // ✅ MENSAJES ESPECÍFICOS MEJORADOS por tipo
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
            errorMessage = canPurchaseResult.message || 'No puedes comprar una nueva membresía en este momento.';
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ Usuario autorizado para comprar membresía');
      
      // ✅ PASO 2: Proceder con la compra con validaciones específicas
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
        
        // ✅ VALIDACIONES DE SEGURIDAD COMBINADAS
        result.membership = this.validateMembershipStateFromBackend(result.membership, paymentMethod);
        result.payment = this.validatePaymentStateFromBackend(result.payment, paymentMethod);
        
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

  // ✅ MEJORADO: Validar estado de membresía desde backend
  validateMembershipStateFromBackend(membership, paymentMethod) {
    if (!membership) return membership;

    // Para transferencias y efectivo, NUNCA debe estar activa inmediatamente
    if ((paymentMethod === 'transfer' || paymentMethod === 'cash') && membership.status === 'active') {
      console.error('❌ ERROR CRÍTICO: Membresía activada automáticamente para método que requiere validación manual');
      membership.status = 'pending';
      membership.isActive = false;
      membership.requiresValidation = true;
      membership.isPending = true;
    }

    return membership;
  }

  // ✅ MEJORADO: Validar estado de pago desde backend
  validatePaymentStateFromBackend(payment, paymentMethod) {
    if (!payment) return payment;

    // Para transferencias y efectivo, NUNCA debe estar completado inmediatamente
    if ((paymentMethod === 'transfer' || paymentMethod === 'cash') && payment.status === 'completed') {
      console.error('❌ ERROR CRÍTICO: Pago marcado como completado para método que requiere validación manual');
      payment.status = 'pending';
      payment.requiresValidation = true;
    }

    return payment;
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
  
  // ✅ MEJORADO: OBTENER MEMBRESÍA ACTUAL CON MEJOR LÓGICA
  async getCurrentMembership() {
    try {
      console.log('🔍 Buscando membresía actual del usuario...');
      
      let membership = null;
      
      // ✅ PASO 1: Intentar obtener membresía activa primero
      try {
        console.log('📋 Intentando obtener membresía activa...');
        const activeResponse = await apiService.get('/api/memberships/my-current');
        
        if (activeResponse?.success && activeResponse.data?.membership) {
          membership = activeResponse.data.membership;
          console.log('✅ Membresía activa encontrada:', membership.id, 'Estado:', membership.status);
          return this.processMembershipForFrontend(membership);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('❌ Error obteniendo membresía activa:', error.message);
        } else {
          console.log('ℹ️ No hay membresía activa (404)');
        }
      }
      
      // ✅ PASO 2: Buscar membresías en historial (incluyendo pendientes)
      try {
        console.log('📜 Buscando en historial de membresías...');
        const historyResponse = await apiService.get('/api/memberships');
        
        if (historyResponse?.success && historyResponse.data?.memberships) {
          const memberships = historyResponse.data.memberships;
          console.log(`📊 Encontradas ${memberships.length} membresías en historial`);
          
          if (memberships.length > 0) {
            // Ordenar por fecha de creación (más reciente primero)
            const sortedMemberships = memberships.sort((a, b) => 
              new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate)
            );
            
            // ✅ LÓGICA MEJORADA: Buscar membresía actual válida
            membership = this.findCurrentMembershipFromHistory(sortedMemberships);
          }
        }
      } catch (error) {
        console.error('❌ Error obteniendo historial:', error.message);
      }
      
      // ✅ PASO 3: Procesar resultado final
      if (membership) {
        console.log(`✅ MEMBRESÍA ENCONTRADA:`, {
          id: membership.id,
          status: membership.status,
          paymentMethod: membership.payment?.paymentMethod,
          isActive: membership.status === 'active',
          isPending: membership.status === 'pending'
        });
        
        return this.processMembershipForFrontend(membership);
      } else {
        console.log('❌ No se encontró ninguna membresía válida');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error general obteniendo membresía actual:', error);
      throw error;
    }
  }

  // ✅ MEJORADO: Lógica mejorada para encontrar membresía actual en historial
  findCurrentMembershipFromHistory(sortedMemberships) {
    console.log('🔍 Analizando historial para encontrar membresía actual...');

    for (const mem of sortedMemberships) {
      console.log(`   📋 Evaluando membresía ${mem.id}:`, {
        status: mem.status,
        createdAt: mem.createdAt,
        endDate: mem.endDate,
        paymentMethod: mem.payment?.paymentMethod,
        isRecent: this.isMembershipRecent(mem, 48) // 48 horas
      });
      
      // ✅ PRIORIDAD 1: Membresía pendiente reciente (menos de 48 horas)
      if (mem.status === 'pending' && this.isMembershipRecent(mem, 48)) {
        console.log('   ✅ PENDIENTE reciente encontrada');
        return mem;
      }
      
      // ✅ PRIORIDAD 2: Membresía activa
      if (mem.status === 'active') {
        console.log('   ✅ ACTIVA encontrada');
        return mem;
      }
      
      // ✅ PRIORIDAD 3: Membresía no vencida (endDate > hoy)
      if (mem.endDate && new Date(mem.endDate) > new Date()) {
        console.log('   ✅ NO VENCIDA encontrada');
        return mem;
      }
    }
    
    // ✅ FALLBACK: Membresía más reciente si es muy reciente
    if (sortedMemberships.length > 0) {
      const mostRecent = sortedMemberships[0];
      const hoursAgo = (new Date() - new Date(mostRecent.createdAt)) / (1000 * 60 * 60);
      
      // Solo si es muy reciente (menos de 24 horas)
      if (hoursAgo < 24) {
        console.log(`   ⚠️ Usando FALLBACK (${hoursAgo.toFixed(1)}h ago)`);
        return mostRecent;
      }
    }
    
    console.log('   ❌ No se encontró membresía actual válida');
    return null;
  }

  // ✅ MÉTODO HELPER: Verificar si membresía es reciente
  isMembershipRecent(membership, hoursThreshold = 24) {
    if (!membership.createdAt) return false;
    
    const createdTime = new Date(membership.createdAt);
    const hoursAgo = (new Date() - createdTime) / (1000 * 60 * 60);
    
    return hoursAgo <= hoursThreshold;
  }

  // ✅ MÉTODO MEJORADO: Procesar membresía para frontend
  processMembershipForFrontend(membership) {
    if (!membership) return null;
    
    console.log('🔄 Procesando membresía para frontend:', membership.id);
    
    // ✅ CREAR COPIA PARA NO MUTAR ORIGINAL
    const processed = { ...membership };
    
    // ✅ CORREGIR FLAGS según el estado real
    if (membership.status === 'pending') {
      processed.isActive = false;
      processed.requiresValidation = true;
      processed.isPending = true;
      console.log('   ⏳ Marcada como PENDIENTE');
    } else if (membership.status === 'active') {
      processed.isActive = true;
      processed.requiresValidation = false;
      processed.isPending = false;
      console.log('   ✅ Marcada como ACTIVA');
    } else if (membership.status === 'expired') {
      processed.isActive = false;
      processed.requiresValidation = false;
      processed.isPending = false;
      console.log('   ⌛ Marcada como VENCIDA');
    } else if (membership.status === 'cancelled') {
      processed.isActive = false;
      processed.requiresValidation = false;
      processed.isPending = false;
      console.log('   🚫 Marcada como CANCELADA');
    } else {
      // Para otros estados desconocidos
      processed.isActive = false;
      processed.requiresValidation = false;
      processed.isPending = false;
      console.log(`   📊 Estado desconocido: ${membership.status}`);
    }
    
    // ✅ AGREGAR información adicional útil para el dashboard
    processed.daysUntilExpiry = this.calculateDaysUntilExpiry(processed.endDate);
    processed.isRecent = this.isMembershipRecent(processed);
    
    return processed;
  }

  // ✅ MEJORADO: Validación estricta para comprar nueva membresía
  async canPurchaseNewMembership() {
    try {
      console.log('🔍 Verificando si usuario puede comprar nueva membresía...');
      
      const currentMembership = await this.getCurrentMembership();
      
      if (!currentMembership) {
        console.log('✅ Sin membresía - Puede comprar');
        return {
          canPurchase: true,
          reason: 'no_membership',
          message: 'Puede obtener membresía'
        };
      }
      
      console.log('📋 Membresía actual encontrada:', {
        id: currentMembership.id,
        status: currentMembership.status,
        paymentMethod: currentMembership.payment?.paymentMethod
      });
      
      // ✅ VALIDACIÓN 1: Si tiene membresía activa, no puede comprar
      if (currentMembership.status === 'active') {
        console.log('❌ Membresía ACTIVA - No puede comprar');
        return {
          canPurchase: false,
          reason: 'active_membership',
          membership: currentMembership,
          message: 'Ya tienes una membresía activa. Espera a que venza para renovar.'
        };
      }
      
      // ✅ VALIDACIÓN 2: Si tiene membresía pendiente, no puede comprar
      if (currentMembership.status === 'pending' || currentMembership.isPending) {
        console.log('❌ Membresía PENDIENTE - No puede comprar');
        
        let message = 'Tienes una membresía pendiente de validación.';
        
        if (currentMembership.payment?.paymentMethod === 'cash') {
          message = 'Tienes una membresía pendiente de pago en efectivo. Visita el gimnasio para completar tu pago antes de comprar otra.';
        } else if (currentMembership.payment?.paymentMethod === 'transfer') {
          message = 'Tienes una membresía pendiente de validación por transferencia. Espera la confirmación antes de comprar otra.';
        }
        
        return {
          canPurchase: false,
          reason: 'pending_membership',
          membership: currentMembership,
          message: message
        };
      }
      
      // ✅ VALIDACIÓN 3: Si la membresía está vencida o cancelada, puede comprar
      if (currentMembership.status === 'expired' || currentMembership.status === 'cancelled') {
        console.log('✅ Membresía VENCIDA/CANCELADA - Puede comprar');
        return {
          canPurchase: true,
          reason: currentMembership.status + '_membership',
          message: 'Puede obtener nueva membresía'
        };
      }
      
      // ✅ FALLBACK: Por seguridad, no permitir si estado desconocido
      console.log('❌ Estado DESCONOCIDO - No permitir por seguridad');
      return {
        canPurchase: false,
        reason: 'unknown_status',
        membership: currentMembership,
        message: 'Estado de membresía desconocido. Contacta soporte para verificar tu estado.'
      };
      
    } catch (error) {
      console.error('❌ Error verificando si puede comprar membresía:', error);
      
      // En caso de error, permitir compra para no bloquear al usuario
      return {
        canPurchase: true,
        reason: 'error_fallback',
        error: error.message,
        message: 'Error verificando estado. Puedes intentar comprar.'
      };
    }
  }

  
  
  // ✅ MEJORADO: OBTENER MEMBRESÍAS DEL USUARIO CON PROCESAMIENTO COMPLETO
  async getUserMemberships() {
    try {
      const response = await apiService.get('/api/memberships');
      
      if (response?.success && response.data?.memberships) {
        return response.data.memberships.map(membership => {
          
          // ✅ Procesar membresía para consistencia de estados
          const processedMembership = this.processMembershipForFrontend(membership);
          
          return {
            id: processedMembership.id,
            type: processedMembership.type,
            status: processedMembership.status, // ✅ Estado real y consistente
            startDate: processedMembership.startDate,
            endDate: processedMembership.endDate,
            price: processedMembership.price,
            autoRenew: processedMembership.autoRenew,
            daysUntilExpiry: this.calculateDaysUntilExpiry(processedMembership.endDate),
            plan: processedMembership.plan,
            schedule: processedMembership.schedule,
            summary: processedMembership.summary,
            payment: processedMembership.payment,
            isActive: processedMembership.isActive,
            isPending: processedMembership.isPending,
            requiresValidation: processedMembership.requiresValidation,
            createdAt: processedMembership.createdAt,
            
            // ✅ NUEVO: Estado visual mejorado para historial
            visualStatus: this.determineVisualStatus(processedMembership)
          };
        });
      }
      
      throw new Error(response?.message || 'Error obteniendo membresías del usuario');
      
    } catch (error) {
      console.error('Error obteniendo membresías del usuario:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Determinar estado visual para el historial
  determineVisualStatus(membership) {
    // Si está pendiente
    if (membership.status === 'pending') {
      return {
        label: 'Pendiente',
        color: 'yellow',
        description: membership.payment?.paymentMethod === 'transfer' ? 
          'Validando transferencia...' : 
          membership.payment?.paymentMethod === 'cash' ?
          'Esperando pago en gimnasio...' :
          'En proceso de validación...'
      };
    }
    
    // Si está activa
    if (membership.status === 'active') {
      return {
        label: 'Activa',
        color: 'green',
        description: 'Membresía en uso'
      };
    }
    
    // Si está cancelada
    if (membership.status === 'cancelled') {
      return {
        label: 'Cancelada',
        color: 'gray',
        description: 'Membresía cancelada'
      };
    }
    
    // Si está vencida (por fecha)
    if (membership.endDate && new Date(membership.endDate) < new Date()) {
      return {
        label: 'Vencida',
        color: 'gray',
        description: 'Periodo expirado'
      };
    }
    
    // Otros casos
    return {
      label: membership.status || 'Desconocido',
      color: 'gray',
      description: 'Estado no definido'
    };
  }
  
  // ✅ MEJORADO: VERIFICAR ESTADO REAL DEL PAGO CON VALIDACIÓN COMPLETA
  async checkPaymentStatus(paymentId) {
    try {
      console.log('🔍 Verificando estado real del pago:', paymentId);
      
      const response = await apiService.get(`/api/payments/${paymentId}`);
      
      if (response?.success && response.data?.payment) {
        const payment = response.data.payment;
        
        // ✅ VALIDACIÓN DE CONSISTENCIA
        const validatedPayment = this.validatePaymentConsistency(payment);
        
        console.log('📊 Estado del pago validado:', {
          id: validatedPayment.id,
          status: validatedPayment.status,
          method: validatedPayment.paymentMethod,
          validated: validatedPayment.transferValidated,
          consistent: validatedPayment.isConsistent
        });
        
        return validatedPayment;
      }
      
      throw new Error(response?.message || 'Error verificando estado del pago');
      
    } catch (error) {
      console.error('❌ Error verificando estado del pago:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Validar consistencia de estados de pago
  validatePaymentConsistency(payment) {
    const validated = {
      ...payment,
      isConsistent: true,
      issues: []
    };

    // Verificar consistencia para transferencias
    if (payment.paymentMethod === 'transfer') {
      if (payment.status === 'completed' && !payment.transferValidated) {
        validated.issues.push('INCONSISTENCIA: Transferencia completada sin validación manual');
        validated.isConsistent = false;
      }
    }

    // Verificar consistencia para efectivo
    if (payment.paymentMethod === 'cash') {
      if (payment.status === 'completed' && !payment.cashReceived) {
        validated.issues.push('INCONSISTENCIA: Pago en efectivo completado sin confirmación');
        validated.isConsistent = false;
      }
    }

    // Agregar flag de validación requerida
    validated.requiresManualValidation = (payment.paymentMethod === 'transfer' && !payment.transferValidated) ||
                                        (payment.paymentMethod === 'cash' && !payment.cashReceived);

    // Log de issues si existen
    if (validated.issues.length > 0) {
      console.error('❌ Inconsistencias detectadas en pago:', validated.issues);
    }

    return validated;
  }

  // ✅ MEJORADO: POLLING AVANZADO PARA TRANSFERENCIAS PENDIENTES
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
  // 📅 MÉTODOS DE GESTIÓN DE HORARIOS COMPLETOS
  // ================================

  async getCurrentSchedule() {
    try {
      console.log('📅 MembershipService: Obteniendo horarios actuales del cliente...');
      
      const response = await apiService.get('/api/memberships/my-schedule');
      
      console.log('📋 MembershipService: Respuesta cruda del backend:', response);
      
      const normalizedData = this.normalizeScheduleDataFallback(response);
      console.log('✅ MembershipService: Datos normalizados:', normalizedData);
      return normalizedData;
      
    } catch (error) {
      console.error('❌ MembershipService: Error obteniendo horarios actuales:', error);
      
      if (error.response?.status === 404) {
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

  async getAvailableScheduleOptions(day = null) {
    try {
      console.log('🔍 MembershipService: Obteniendo opciones de horarios disponibles...');
      
      const params = day ? { day } : {};
      const response = await apiService.get('/api/memberships/my-schedule/available-options', { params });
      
      console.log('📋 MembershipService: Respuesta de opciones:', response);
      
      const normalizedData = this.normalizeAvailableOptionsFallback(response);
      console.log('✅ MembershipService: Opciones normalizadas:', normalizedData);
      return normalizedData;
      
    } catch (error) {
      console.error('❌ MembershipService: Error obteniendo opciones disponibles:', error);
      throw error;
    }
  }

  async changeClientSchedule(changes) {
    try {
      console.log('✏️ MembershipService: Cambiando horarios del cliente...');
      console.log('📤 Cambios recibidos:', changes);
      
      const cleanedChanges = this.validateAndCleanChangesFallback(changes);
      console.log('🧹 Cambios limpiados:', cleanedChanges);
      
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
      
      if (error.response?.data?.unavailableSlots) {
        throw {
          ...error,
          unavailableSlots: error.response.data.unavailableSlots
        };
      }
      
      throw error;
    }
  }

  async cancelScheduleSlot(day, slotId) {
    try {
      console.log(`🗑️ MembershipService: Cancelando horario ${day}/${slotId}...`);
      
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

  async previewScheduleChanges(changes) {
    try {
      console.log('👁️ MembershipService: Previsualizando cambios de horarios...');
      
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
  // 🛠️ MÉTODOS HELPER COMPLETOS
  // ================================
  
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
      if (!validDays.includes(day.toLowerCase())) {
        console.warn(`⚠️ Día inválido ignorado: ${day}`);
        continue;
      }
      
      if (!Array.isArray(slots)) {
        console.warn(`⚠️ Slots para ${day} no es un array:`, slots);
        continue;
      }
      
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

  normalizeScheduleDataFallback(response) {
    console.log('🔄 MembershipService: Normalizando horarios (fallback)...');
    
    if (!response) {
      return this.getEmptyScheduleStructure();
    }
    
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

  extractSlotsFromDayData(dayData) {
    if (dayData.slots && Array.isArray(dayData.slots)) {
      return this.normalizeSlotsArray(dayData.slots);
    }
    
    if (Array.isArray(dayData)) {
      return this.normalizeSlotsArray(dayData);
    }
    
    if (dayData.hasSlots && dayData.slots) {
      return this.normalizeSlotsArray(dayData.slots);
    }
    
    return [];
  }

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
    
    Object.entries(response.availableOptions).forEach(([day, dayData]) => {
      normalized.availableOptions[day] = this.normalizeDayOptionsFallback(day, dayData);
    });
    
    return normalized;
  }

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
  // 🛠️ MÉTODOS HELPER ADICIONALES
  // ================================
  
  calculateDaysUntilExpiry(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  validateScheduleChanges(changes) {
    try {
      this.validateAndCleanChangesFallback(changes);
      return true;
    } catch (error) {
      console.error('❌ MembershipService: Validación falló:', error.message);
      return false;
    }
  }

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

  isToday(day) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  }

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
  
  autoSelectSchedule(availableOptions, planInfo) {
    const schedule = {};
    let totalReservations = 0;

    console.log('Selección automática de horarios...');
    
    const priorityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekendDays = ['saturday', 'sunday'];
    
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
          
          const sortedSlots = availableSlots.sort((a, b) => a.openTime.localeCompare(b.openTime));
          schedule[day] = sortedSlots.slice(0, slotsToSelect).map(slot => slot.id);
          totalReservations += slotsToSelect;
        }
      }
    }
    
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
      totalVisits: totalSlots * 4,
      favoriteTime,
      dayDistribution
    };

    console.log('📊 MembershipService: Estadísticas locales calculadas:', stats);
    return stats;
  }

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
=== ARCHIVO COMBINADO COMPLETO ===

✅ **CARACTERÍSTICAS UNIFICADAS**:

1. **VALIDACIONES COMPLETAS**:
   - Validaciones estrictas de estados de membresías y pagos
   - Detección de inconsistencias del backend
   - Corrección automática de estados erróneos

2. **MENSAJES MEJORADOS**:
   - Mensajes específicos por método de pago
   - Instrucciones claras para cada estado
   - Feedback apropiado para transferencias y efectivo

3. **LÓGICA ROBUSTA**:
   - Búsqueda inteligente de membresía actual
   - Procesamiento consistente para frontend
   - Validación de compras con lógica mejorada

4. **FUNCIONALIDAD COMPLETA DE HORARIOS**:
   - Todos los métodos de gestión de horarios
   - Normalización robusta de datos
   - Manejo de múltiples formatos de respuesta

5. **POLLING AVANZADO**:
   - Polling específico para transferencias
   - Intervalos optimizados
   - Manejo completo de estados

6. **HELPERS COMPLETOS**:
   - Todos los métodos helper necesarios
   - Validaciones de consistencia
   - Formateo y procesamiento de datos

✅ **MÉTODOS ÚNICOS INCLUIDOS**:
- `validateMembershipStateFromBackend()`
- `validatePaymentStateFromBackend()` 
- `validatePaymentConsistency()`
- `findCurrentMembershipFromHistory()`
- `determineVisualStatus()`
- `startPaymentStatusPolling()` (versión avanzada)
- Y todos los métodos de horarios completos

✅ **BENEFICIOS**:
- Sin pérdida de funcionalidad
- Todas las mejoras combinadas
- Validaciones de seguridad completas
- Manejo robusto de errores
- Logging detallado para debugging

Este archivo combina lo mejor de ambas versiones y agrega las validaciones necesarias.
*/