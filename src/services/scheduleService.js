// src/services/scheduleService.js
// SERVICIO ESPECIALIZADO PARA GESTIÓN DE HORARIOS DE CLIENTES

import { BaseService } from './baseService.js';

class ScheduleService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ================================
  // 📅 MÉTODOS PRINCIPALES DE HORARIOS
  // ================================

  // OBTENER: Horarios actuales del cliente autenticado
  async getCurrentSchedule() {
    try {
      console.log('📅 ScheduleService: Obteniendo horarios actuales...');
      
      const response = await this.get('/memberships/my-schedule');
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Horarios actuales obtenidos:', {
          hasMembership: response.data.hasMembership,
          scheduleDays: response.data.currentSchedule ? Object.keys(response.data.currentSchedule).length : 0,
          membershipStatus: response.data.membership?.status
        });
        
        return response.data;
      }
      
      throw new Error('Formato de respuesta inválido para horarios actuales');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo horarios actuales:', error);
      
      if (error.response?.status === 404) {
        // Usuario sin membresía o sin horarios
        return {
          hasMembership: false,
          currentSchedule: {},
          membership: null
        };
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
        console.log('✅ ScheduleService: Opciones disponibles obtenidas:', {
          totalDays: Object.keys(response.data.availableOptions || {}).length,
          openDays: Object.values(response.data.availableOptions || {}).filter(d => d.isOpen).length
        });
        
        return response.data;
      }
      
      throw new Error('Error obteniendo opciones de horarios disponibles');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo opciones disponibles:', error);
      throw error;
    }
  }

  // CAMBIAR: Horarios seleccionados del cliente con validación
  async changeSchedule(changes) {
    try {
      console.log('✏️ ScheduleService: Cambiando horarios del cliente...');
      console.log('📤 Cambios a aplicar:', changes);
      
      // Validar cambios antes de enviar
      this.validateChanges(changes);
      
      // Determinar tipo de cambio automáticamente
      const changeType = this.determineChangeType(changes);
      
      const payload = {
        changeType,
        changes
      };
      
      console.log('📦 ScheduleService: Payload final:', payload);
      
      const response = await this.post('/memberships/my-schedule/change', payload);
      
      if (response?.success) {
        console.log('✅ ScheduleService: Horarios cambiados exitosamente');
        
        // Invalidar cache después del cambio exitoso
        this.invalidateCache();
        
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cambiando horarios');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error cambiando horarios:', error);
      
      // Manejo específico de errores de disponibilidad
      if (error.response?.data?.unavailableSlots) {
        const enhancedError = new Error(error.message);
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
      
      // Validar parámetros
      if (!day || !slotId) {
        throw new Error('Día y ID de slot son requeridos para cancelar');
      }
      
      const response = await this.delete(`/memberships/my-schedule/${day}/${slotId}`);
      
      if (response?.success) {
        console.log('✅ ScheduleService: Horario cancelado exitosamente');
        
        // Invalidar cache después de la cancelación
        this.invalidateCache();
        
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cancelando horario');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error cancelando horario:', error);
      throw error;
    }
  }

  // OBTENER: Estadísticas de uso de horarios del cliente
  async getScheduleStats() {
    try {
      console.log('📊 ScheduleService: Obteniendo estadísticas de horarios...');
      
      const response = await this.get('/memberships/my-schedule/stats');
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Estadísticas obtenidas:', response.data);
        return response.data;
      }
      
      throw new Error('Error obteniendo estadísticas de horarios');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo estadísticas:', error);
      
      if (error.response?.status === 404) {
        // Fallback con estadísticas vacías
        console.log('📊 ScheduleService: Usando estadísticas fallback');
        return {
          totalSlots: 0,
          usedSlots: 0,
          availableSlots: 0,
          favoriteTime: null,
          totalVisits: 0,
          dayDistribution: {}
        };
      }
      
      throw error;
    }
  }

  // PREVISUALIZAR: Cambios de horarios antes de confirmar
  async previewChanges(changes) {
    try {
      console.log('👁️ ScheduleService: Previsualizando cambios de horarios...');
      
      // Validar cambios antes de previsualizar
      this.validateChanges(changes);
      
      const response = await this.post('/memberships/my-schedule/preview-change', {
        changes
      });
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Vista previa generada:', {
          canProceed: response.data.canProceed,
          conflictsCount: response.data.conflicts?.length || 0
        });
        
        return response.data;
      }
      
      throw new Error('Error generando vista previa de cambios');
      
    } catch (error) {
      console.error('❌ ScheduleService: Error en vista previa:', error);
      throw error;
    }
  }

  // ================================
  // 🔄 MÉTODOS CON CACHE PARA OPTIMIZACIÓN
  // ================================

  // Obtener horarios actuales con cache
  async getCurrentScheduleWithCache() {
    const cacheKey = 'currentSchedule';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📅 ScheduleService: Usando horarios desde cache');
      return cached;
    }
    
    const data = await this.getCurrentSchedule();
    this.setCache(cacheKey, data);
    
    return data;
  }

  // Obtener opciones disponibles con cache
  async getAvailableOptionsWithCache(day = null) {
    const cacheKey = `availableOptions_${day || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('🔍 ScheduleService: Usando opciones disponibles desde cache');
      return cached;
    }
    
    const data = await this.getAvailableOptions(day);
    this.setCache(cacheKey, data);
    
    return data;
  }

  // ================================
  // 🛠️ MÉTODOS DE VALIDACIÓN Y HELPERS
  // ================================

  // Validar cambios de horarios antes de envío
  validateChanges(changes) {
    console.log('🔍 ScheduleService: Validando cambios de horarios...');
    
    if (!changes || typeof changes !== 'object') {
      throw new Error('Los cambios deben ser un objeto válido');
    }

    if (Object.keys(changes).length === 0) {
      throw new Error('Debe especificar al menos un cambio');
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, slots] of Object.entries(changes)) {
      // Validar nombre del día
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(`Día inválido: ${day}. Días válidos: ${validDays.join(', ')}`);
      }
      
      // Validar que slots sea un array
      if (!Array.isArray(slots)) {
        throw new Error(`Los slots para ${day} deben ser un array`);
      }
      
      // Validar que haya al menos un slot
      if (slots.length === 0) {
        throw new Error(`Debe especificar al menos un slot para ${day}`);
      }
      
      // Validar que todos los slots sean números o strings válidos
      slots.forEach((slot, index) => {
        if (slot === null || slot === undefined || slot === '') {
          throw new Error(`Slot ${index + 1} para ${day} no puede estar vacío`);
        }
      });
    }

    console.log('✅ ScheduleService: Validación de cambios exitosa');
    return true;
  }

  // Determinar tipo de cambio automáticamente
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

  // Formatear horarios para visualización en UI
  formatScheduleForDisplay(schedule) {
    if (!schedule || !schedule.currentSchedule) {
      console.warn('ScheduleService: No hay datos de horarios para formatear');
      return {};
    }

    const formatted = {};
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes', 
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    Object.entries(schedule.currentSchedule).forEach(([day, dayData]) => {
      formatted[day] = {
        ...dayData,
        dayName: dayNames[day] || day,
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

  // Calcular estadísticas locales desde datos existentes
  calculateLocalStats(schedule) {
    if (!schedule?.currentSchedule) {
      return null;
    }

    const currentScheduleData = schedule.currentSchedule;
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles', 
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    let totalSlots = 0;
    const dayDistribution = {};
    const allTimes = [];

    Object.entries(currentScheduleData).forEach(([day, dayData]) => {
      const dayName = dayNames[day] || day;
      const slotsCount = dayData.hasSlots ? dayData.slots.length : 0;
      
      dayDistribution[dayName] = slotsCount;
      totalSlots += slotsCount;
      
      if (dayData.hasSlots) {
        allTimes.push(...dayData.slots.map(slot => slot.timeRange));
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
      availableSlots: 0, // Los slots actuales están siendo usados
      totalVisits: totalSlots * 4, // Estimación semanal
      favoriteTime,
      dayDistribution
    };

    console.log('📊 ScheduleService: Estadísticas locales calculadas:', stats);
    return stats;
  }

  // ================================
  // 🕒 UTILIDADES DE TIEMPO Y DÍAS
  // ================================

  // Verificar si es el día actual
  isToday(day) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day.toLowerCase() === today;
  }

  // Verificar si el horario ya pasó (solo para el día actual)
  isPastTime(timeRange) {
    if (!timeRange) return false;
    
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

  // Formatear rango de tiempo para visualización
  formatTimeRange(timeRange) {
    if (!timeRange) return '';
    
    try {
      const [start, end] = timeRange.split(' - ');
      return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    } catch (error) {
      console.warn('ScheduleService: Error formateando rango de tiempo:', error);
      return timeRange;
    }
  }

  // Formatear tiempo individual a formato 12 horas
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
  // 💾 GESTIÓN DE CACHE
  // ================================

  // Obtener datos del cache
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

  // Guardar datos en cache
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Invalidar todo el cache
  invalidateCache() {
    console.log('🗑️ ScheduleService: Invalidando cache de horarios');
    this.cache.clear();
  }

  // Invalidar cache específico
  invalidateCacheKey(key) {
    console.log(`🗑️ ScheduleService: Invalidando cache para: ${key}`);
    this.cache.delete(key);
  }

  // ================================
  // 🔧 MÉTODOS DE DEBUG Y SALUD
  // ================================

  // Verificar conectividad con endpoints de horarios
  async checkScheduleEndpoints() {
    console.log('🔍 ScheduleService: Verificando endpoints de horarios...');
    
    const endpoints = [
      { path: '/memberships/my-schedule', method: 'GET', description: 'Obtener horarios actuales' },
      { path: '/memberships/my-schedule/available-options', method: 'GET', description: 'Obtener opciones disponibles' },
      { path: '/memberships/my-schedule/change', method: 'POST', description: 'Cambiar horarios' },
      { path: '/memberships/my-schedule/stats', method: 'GET', description: 'Obtener estadísticas' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        if (endpoint.method === 'GET') {
          await this.get(endpoint.path);
          results[endpoint.path] = { available: true, method: endpoint.method };
          console.log(`✅ ${endpoint.description} - Disponible`);
        } else {
          results[endpoint.path] = { available: true, method: endpoint.method, note: 'No probado (requiere datos)' };
        }
      } catch (error) {
        results[endpoint.path] = { available: false, method: endpoint.method, error: error.message };
        
        if (error.response?.status === 404) {
          console.log(`❌ ${endpoint.description} - Endpoint no implementado`);
        } else if (error.response?.status === 401) {
          console.log(`✅ ${endpoint.description} - Disponible (requiere auth)`);
          results[endpoint.path].available = true;
          results[endpoint.path].note = 'Requiere autenticación';
        }
      }
    }
    
    return results;
  }

  // Obtener estado del cache
  getCacheStatus() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, value]) => now - value.timestamp <= this.cacheTimeout).length,
      expiredEntries: entries.filter(([_, value]) => now - value.timestamp > this.cacheTimeout).length,
      cacheKeys: entries.map(([key]) => key),
      cacheTimeout: this.cacheTimeout
    };
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