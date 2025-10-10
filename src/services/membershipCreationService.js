/*
 * ============================================================================
 * MEMBERSHIP CREATION SERVICE
 * ============================================================================
 * Autor: Alexander Echeverria
 * Archivo: src/services/membershipCreationService.js
 * 
 * Servicio especializado para la creación de membresías con wizard
 * ============================================================================
 */

import { BaseService } from './baseService';

class MembershipCreationService extends BaseService {
  constructor() {
    super();
  }

  // ============================================================================
  // PASO 1: BÚSQUEDA Y SELECCIÓN DE CLIENTES
  // ============================================================================

  /**
   * Buscar clientes con filtros inteligentes
   */
  async searchClients(query = '', params = {}) {
    try {
      console.log('🔍 Buscando clientes:', query);

      const queryParams = new URLSearchParams();
      queryParams.append('role', 'cliente');
      queryParams.append('isActive', 'true');
      queryParams.append('limit', params.limit || 50);
      
      if (query) {
        queryParams.append('search', query);
      }

      const response = await this.get(`/users?${queryParams.toString()}`);
      const data = response.data || response;
      const clients = data.users || [];

      console.log(`✅ ${clients.length} clientes encontrados`);

      return {
        success: true,
        clients
      };
    } catch (error) {
      console.error('❌ Error buscando clientes:', error);
      return { success: false, clients: [] };
    }
  }

  /**
   * Verificar si el cliente tiene membresía activa
   */
  async checkClientActiveMembership(userId) {
    try {
      console.log('🔍 Verificando membresía activa del cliente:', userId);

      const response = await this.get(`/memberships?userId=${userId}&status=active&limit=1`);
      const data = response.data || response;
      const memberships = data.memberships || [];

      if (memberships.length > 0) {
        const membership = memberships[0];
        console.log('⚠️ Cliente tiene membresía activa:', membership);
        
        return {
          hasActive: true,
          membership: {
            id: membership.id,
            type: membership.type,
            endDate: membership.endDate,
            plan: membership.plan
          }
        };
      }

      console.log('✅ Cliente sin membresía activa');
      return { hasActive: false, membership: null };

    } catch (error) {
      console.error('❌ Error verificando membresía:', error);
      return { hasActive: false, membership: null };
    }
  }

  // ============================================================================
  // PASO 2: OBTENER PLANES DISPONIBLES
  // ============================================================================

  /**
   * Obtener todos los planes disponibles
   */
  async getAvailablePlans() {
    try {
      console.log('📦 Obteniendo planes disponibles...');

      const response = await this.get('/memberships/plans');
      const data = response.data || response;
      const plans = data.plans || data || [];

      console.log(`✅ ${plans.length} planes obtenidos`);

      return {
        success: true,
        plans: plans.map(plan => ({
          ...plan,
          isDailyPlan: plan.duration === 'daily' || plan.durationType === 'daily'
        }))
      };
    } catch (error) {
      console.error('❌ Error obteniendo planes:', error);
      return { success: false, plans: [] };
    }
  }

  // ============================================================================
  // PASO 3: CALCULAR FECHAS AUTOMÁTICAMENTE
  // ============================================================================

  /**
   * Calcular fecha de fin según el tipo de plan
   */
  calculateEndDate(startDate, durationType) {
    const start = new Date(startDate);
    const end = new Date(start);

    switch(durationType) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'biannual':
        end.setMonth(end.getMonth() + 6);
        break;
      case 'annual':
        end.setFullYear(end.getFullYear() + 1);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }

    return end.toISOString().split('T')[0];
  }

  /**
   * Calcular días de duración
   */
  calculateDurationDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // ============================================================================
  // PASO 4: OBTENER HORARIOS DISPONIBLES
  // ============================================================================

  /**
   * Obtener opciones de horarios disponibles para un plan
   */
  async getScheduleOptions(planId) {
    try {
      console.log('📅 Obteniendo opciones de horarios para plan:', planId);

      const response = await this.get(`/memberships/plans/${planId}/schedule-options`);
      const data = response.data || response;

      console.log('✅ Opciones de horarios obtenidas:', data);

      return {
        success: true,
        plan: data.plan,
        availableOptions: data.availableOptions || {},
        allowedDays: data.plan?.allowedDays || []
      };
    } catch (error) {
      console.error('❌ Error obteniendo horarios:', error);
      return { 
        success: false, 
        plan: null, 
        availableOptions: {},
        allowedDays: []
      };
    }
  }

  /**
   * Verificar disponibilidad de un slot específico
   */
  async checkSlotAvailability(slotId, day) {
    try {
      const response = await this.get(`/schedule/availability?slotId=${slotId}&day=${day}`);
      const data = response.data || response;
      
      return {
        available: data.available || false,
        capacity: data.capacity || 0,
        currentReservations: data.currentReservations || 0
      };
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      return { available: false, capacity: 0, currentReservations: 0 };
    }
  }

  // ============================================================================
  // PASO 5: CREAR MEMBRESÍA CON AUTO-CONFIRMACIÓN
  // ============================================================================

  /**
   * Crear membresía (paso 1: pending)
   */
  async createMembership(membershipData) {
    try {
      console.log('💳 [1/2] Creando membresía...', membershipData);

      const payload = {
        planId: membershipData.planId,
        userId: membershipData.userId,
        selectedSchedule: membershipData.selectedSchedule || {},
        paymentMethod: membershipData.paymentMethod || 'cash',
        notes: membershipData.notes || 'Membresía creada desde dashboard'
      };

      const response = await this.post('/memberships/purchase', payload);
      const data = response.data || response;

      console.log('✅ Membresía creada (pending):', data.membership);

      return {
        success: true,
        membership: data.membership,
        payment: data.payment
      };
    } catch (error) {
      console.error('❌ Error creando membresía:', error);
      throw error;
    }
  }

  /**
   * Confirmar pago y activar membresía (paso 2: active)
   */
  async activateMembership(membershipId) {
    try {
      console.log('💰 [2/2] Confirmando pago y activando membresía:', membershipId);

      const response = await this.post('/payments/activate-cash-membership', {
        membershipId
      });

      const data = response.data || response;

      console.log('✅ Membresía activada:', data.membership);

      return {
        success: true,
        membership: data.membership,
        payment: data.payment
      };
    } catch (error) {
      console.error('❌ Error activando membresía:', error);
      throw error;
    }
  }

  /**
   * Proceso completo: crear + activar
   */
  async createAndActivateMembership(membershipData) {
    try {
      console.log('🚀 Iniciando creación completa de membresía...');

      // Paso 1: Crear membresía (pending)
      const createResult = await this.createMembership(membershipData);
      
      if (!createResult.success) {
        throw new Error('Error al crear membresía');
      }

      const membershipId = createResult.membership.id;

      // Pequeña pausa para asegurar que el backend procese
      await new Promise(resolve => setTimeout(resolve, 500));

      // Paso 2: Activar membresía (active)
      const activateResult = await this.activateMembership(membershipId);

      if (!activateResult.success) {
        throw new Error('Error al activar membresía');
      }

      console.log('✅ Membresía creada y activada exitosamente');

      return {
        success: true,
        membership: activateResult.membership,
        payment: activateResult.payment
      };

    } catch (error) {
      console.error('❌ Error en proceso completo:', error);
      throw error;
    }
  }

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  /**
   * Validar datos de membresía antes de crear
   */
  validateMembershipData(data) {
    const errors = [];

    if (!data.userId) {
      errors.push('Debe seleccionar un cliente');
    }

    if (!data.planId) {
      errors.push('Debe seleccionar un plan');
    }

    if (!data.paymentMethod) {
      errors.push('Debe seleccionar un método de pago');
    }

    // Si no es plan diario y tiene horarios, validar
    if (data.selectedSchedule && Object.keys(data.selectedSchedule).length > 0) {
      const totalSlots = Object.values(data.selectedSchedule).reduce(
        (sum, slots) => sum + slots.length, 
        0
      );
      
      if (totalSlots === 0) {
        errors.push('Debe seleccionar al menos un horario');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatear horarios seleccionados para resumen
   */
  formatSelectedSchedule(selectedSchedule) {
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    const formatted = [];
    
    for (const [day, slotIds] of Object.entries(selectedSchedule)) {
      if (slotIds && slotIds.length > 0) {
        formatted.push({
          day,
          dayName: dayNames[day],
          slotsCount: slotIds.length,
          slotIds
        });
      }
    }

    return formatted;
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Obtener fecha de hoy en formato YYYY-MM-DD
   */
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Verificar si una fecha es válida
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Formatear precio en quetzales
   */
  formatPrice(amount) {
    return `Q${parseFloat(amount).toFixed(2)}`;
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================
const membershipCreationService = new MembershipCreationService();

export default membershipCreationService;

/*
 * ============================================================================
 * EJEMPLO DE USO EN EL WIZARD
 * ============================================================================
 * 
 * import membershipCreationService from '@/services/membershipCreationService';
 * 
 * // PASO 1: Buscar clientes
 * const { clients } = await membershipCreationService.searchClients('juan');
 * 
 * // Verificar si tiene membresía activa
 * const { hasActive, membership } = await membershipCreationService.checkClientActiveMembership(userId);
 * 
 * // PASO 2: Obtener planes
 * const { plans } = await membershipCreationService.getAvailablePlans();
 * 
 * // PASO 3: Calcular fechas
 * const startDate = membershipCreationService.getTodayDate();
 * const endDate = membershipCreationService.calculateEndDate(startDate, 'monthly');
 * const days = membershipCreationService.calculateDurationDays(startDate, endDate);
 * 
 * // PASO 4: Obtener horarios
 * const { availableOptions } = await membershipCreationService.getScheduleOptions(planId);
 * 
 * // PASO 5: Crear y activar
 * const result = await membershipCreationService.createAndActivateMembership({
 *   userId: 'user-id',
 *   planId: 'plan-id',
 *   selectedSchedule: { monday: ['slot-id'], tuesday: ['slot-id'] },
 *   paymentMethod: 'cash',
 *   notes: 'Notas opcionales'
 * });
 * 
 * ============================================================================
 */