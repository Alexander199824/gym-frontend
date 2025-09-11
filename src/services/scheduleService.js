// src/services/scheduleService.js
// SERVICIO OPTIMIZADO: Funcionalidad esencial sin redundancias

import { BaseService } from './baseService.js';

class ScheduleService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ================================
  // 📅 MÉTODOS PRINCIPALES - CORE FUNCTIONALITY
  // ================================

  // OBTENER: Horarios actuales del cliente autenticado
  async getCurrentSchedule() {
    try {
      console.log('📅 ScheduleService: Obteniendo horarios actuales...');
      
      const response = await this.get('/memberships/my-schedule');
      console.log('📋 ScheduleService: Respuesta del backend:', response);
      
      // El backend ya devuelve los datos procesados según documentación
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Datos recibidos correctamente');
        return response.data;
      }
      
      // Usuario sin membresía
      if (response?.success === false || !response?.data?.hasMembership) {
        console.log('ℹ️ ScheduleService: Usuario sin membresía activa');
        return this.getEmptyScheduleStructure();
      }
      
      throw new Error('Formato de respuesta inesperado del backend');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo horarios:', error);
      
      if (error.response?.status === 404) {
        return this.getEmptyScheduleStructure();
      }
      
      throw error;
    }
  }

  // OBTENER: Opciones de horarios disponibles para reservar
  async getAvailableOptions(day = null) {
    try {
      console.log('🔍 ScheduleService: Obteniendo opciones disponibles...', { day });
      
      const params = day ? { day } : {};
      const response = await this.get('/memberships/my-schedule/available-options', { params });
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Opciones disponibles obtenidas');
        return response.data;
      }
      
      throw new Error('Error obteniendo opciones disponibles del backend');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo opciones:', error);
      throw error;
    }
  }

  // CAMBIAR: Horarios seleccionados del cliente
  async changeSchedule(changes) {
    try {
      console.log('✏️ ScheduleService: Cambiando horarios...');
      
      const cleanedChanges = this.validateAndCleanChanges(changes);
      const changeType = this.determineChangeType(cleanedChanges);
      
      const payload = {
        changeType,
        changes: cleanedChanges,
        replaceAll: false
      };
      
      console.log('📦 ScheduleService: Payload:', payload);
      
      const response = await this.post('/memberships/my-schedule/change', payload);
      
      if (response?.success) {
        console.log('✅ ScheduleService: Horarios cambiados exitosamente');
        this.invalidateCache();
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cambiando horarios');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error cambiando horarios:', error);
      
      // Manejo específico de slots no disponibles
      if (error.response?.data?.unavailableSlots) {
        const enhancedError = new Error(error.message || 'Algunos horarios ya no están disponibles');
        enhancedError.unavailableSlots = error.response.data.unavailableSlots;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  // CANCELAR: Horario específico por día y slot ID
  async cancelSlot(day, slotId) {
    try {
      console.log(`🗑️ ScheduleService: Cancelando horario ${day}/${slotId}...`);
      
      if (!day || !slotId) {
        throw new Error('Día y ID de slot son requeridos para cancelar');
      }
      
      const validSlotId = this.extractSlotId(slotId);
      if (!validSlotId) {
        throw new Error(`ID de slot inválido: ${slotId}`);
      }
      
      const response = await this.delete(`/memberships/my-schedule/${day}/${validSlotId}`);
      
      if (response?.success) {
        console.log('✅ ScheduleService: Horario cancelado exitosamente');
        this.invalidateCache();
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cancelando horario');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error cancelando horario:', error);
      throw error;
    }
  }

  // OBTENER: Estadísticas de uso de horarios
  async getScheduleStats() {
    try {
      console.log('📊 ScheduleService: Obteniendo estadísticas...');
      
      const response = await this.get('/memberships/my-schedule/stats');
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Estadísticas obtenidas');
        return response.data;
      }
      
      throw new Error('Error obteniendo estadísticas de horarios');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo estadísticas:', error);
      
      if (error.response?.status === 404) {
        console.log('📊 ScheduleService: Backend sin estadísticas, usando fallback');
        return this.getEmptyStats();
      }
      
      throw error;
    }
  }

  // PREVISUALIZAR: Cambios de horarios antes de confirmar
  async previewChanges(changes) {
    try {
      console.log('👁️ ScheduleService: Previsualizando cambios...');
      
      const cleanedChanges = this.validateAndCleanChanges(changes);
      
      const response = await this.post('/memberships/my-schedule/preview-change', {
        changes: cleanedChanges
      });
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Vista previa generada');
        return response.data;
      }
      
      throw new Error('Error generando vista previa');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error en vista previa:', error);
      throw error;
    }
  }

  // ================================
  // 🛠️ MÉTODOS DE VALIDACIÓN Y HELPERS
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
      const id = slot.slotId || slot.id;
      return this.extractSlotId(id);
    }
    
    return null;
  }

  validateAndCleanChanges(changes) {
    console.log('🔍 ScheduleService: Validando cambios...');
    
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

    console.log('✅ ScheduleService: Cambios validados');
    return cleanedChanges;
  }

  determineChangeType(changes) {
    const dayCount = Object.keys(changes).length;
    
    if (dayCount === 1) return 'single_day';
    if (dayCount <= 3) return 'multiple_days';
    return 'full_week';
  }

  // ================================
  // 📋 ESTRUCTURAS POR DEFECTO
  // ================================

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

  getEmptyStats() {
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

  // ================================
  // 🕒 UTILIDADES DE TIEMPO ESENCIALES
  // ================================

  isToday(day) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day.toLowerCase() === today;
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
      console.warn('ScheduleService: Error verificando tiempo pasado:', error);
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
      console.warn('ScheduleService: Error formateando rango de tiempo:', error);
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
      console.warn('ScheduleService: Error formateando tiempo:', error);
      return time;
    }
  }

  // ================================
  // 🎯 MÉTODOS PÚBLICOS PARA UI
  // ================================

  validateChanges(changes) {
    try {
      this.validateAndCleanChanges(changes);
      return true;
    } catch (error) {
      console.error('❌ ScheduleService: Validación falló:', error.message);
      return false;
    }
  }

  formatScheduleForDisplay(schedule) {
    if (!schedule || !schedule.currentSchedule) {
      console.warn('ScheduleService: No hay datos de horarios para formatear');
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

    console.log('✅ ScheduleService: Horarios formateados para visualización');
    return formatted;
  }

  calculateLocalStats(schedule) {
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
        allTimes.push(...dayData.slots.map(slot => slot.timeRange));
      }
    });

    const timeFrequency = {};
    allTimes.forEach(time => {
      if (time && time !== 'Horario' && time !== 'Horario configurado') {
        timeFrequency[time] = (timeFrequency[time] || 0) + 1;
      }
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

    console.log('📊 ScheduleService: Estadísticas locales calculadas');
    return stats;
  }

  // ================================
  // 💾 GESTIÓN DE CACHE OPTIMIZADA
  // ================================

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidateCache() {
    console.log('🗑️ ScheduleService: Invalidando cache');
    this.cache.clear();
  }

  // ================================
  // 🔧 MÉTODOS CON CACHE (OPCIONALES)
  // ================================

  async getCurrentScheduleWithCache() {
    const cacheKey = 'currentSchedule';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('💾 ScheduleService: Usando horarios desde cache');
      return cached;
    }
    
    const data = await this.getCurrentSchedule();
    this.setCache(cacheKey, data);
    return data;
  }

  async getAvailableOptionsWithCache(day = null) {
    const cacheKey = `availableOptions_${day || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('💾 ScheduleService: Usando opciones desde cache');
      return cached;
    }
    
    const data = await this.getAvailableOptions(day);
    this.setCache(cacheKey, data);
    return data;
  }
}

// Exportar instancia singleton
const scheduleService = new ScheduleService();
export default scheduleService;
/*
DOCUMENTACIÓN DEL SERVICIO ScheduleService

PROPÓSITO:
Servicio especializado para la gestión completa de horarios de clientes del gimnasio.
Maneja todas las operaciones relacionadas con visualización, modificación y cancelación
de horarios personales de los clientes con membresía activa.

ENDPOINTS UTILIZADOS:
- GET /api/memberships/my-schedule: Obtener horarios actuales del cliente
- GET /api/memberships/my-schedule/available-options: Ver opciones disponibles
- POST /api/memberships/my-schedule/change: Modificar horarios seleccionados
- DELETE /api/memberships/my-schedule/{day}/{slotId}: Cancelar horario específico
- GET /api/memberships/my-schedule/stats: Estadísticas de uso de horarios
- POST /api/memberships/my-schedule/preview-change: Vista previa de cambios

FUNCIONALIDADES PRINCIPALES:
1. Obtención de horarios actuales con formato estructurado
2. Exploración de opciones de horarios disponibles por día
3. Modificación de horarios con validación de disponibilidad
4. Cancelación de slots específicos con confirmación
5. Estadísticas de uso y patrones de reserva
6. Vista previa de cambios antes de confirmar
7. Validación de datos antes de envío
8. Formateo de horarios para visualización
9. Sistema de cache para optimizar peticiones
10. Manejo de errores específicos por operación

TIPOS DE CAMBIO SOPORTADOS:
- single_day: Cambios en un solo día de la semana
- multiple_days: Cambios en 2-3 días de la semana  
- full_week: Cambios completos de horario semanal

VALIDACIONES INCLUIDAS:
- Verificación de formato de cambios
- Validación de días de la semana válidos
- Verificación de arrays de slots
- Confirmación de disponibilidad en tiempo real
- Manejo de conflictos de horarios

UTILIDADES DE FORMATO:
- Conversión de horarios 24h a 12h con AM/PM
- Traducción de días de inglés a español
- Identificación de día actual y horarios pasados
- Cálculo de estadísticas locales
- Formateo de rangos de tiempo legibles

SISTEMA DE CACHE:
- Cache inteligente con timeout de 2 minutos
- Invalidación automática después de cambios
- Métodos con cache para operaciones frecuentes
- Reducción de peticiones repetidas al servidor

MANEJO DE ERRORES:
- Errores específicos por tipo de operación
- Fallbacks para endpoints no disponibles
- Manejo de usuarios sin membresía
- Respuestas con información de conflictos

INTEGRACIÓN:
- Extiende BaseService para funcionalidad HTTP básica
- Compatible con sistema de autenticación existente
- Integrable con React Query para estado global
- Soporte para componentes de UI especializados

Este servicio es esencial para la experiencia de gestión de horarios de clientes,
proporcionando una interfaz robusta y eficiente para todas las operaciones
relacionadas con la reserva y administración de slots de tiempo en el gimnasio.
*/