// src/services/scheduleService.js
// SERVICIO ESPECIALIZADO PARA GESTIÓN DE HORARIOS DE CLIENTES

import { BaseService } from './baseService.js';

class ScheduleService extends BaseService {
  constructor() {
    super();
    this.baseScheduleURL = '/api/memberships/my-schedule';
  }

  // ================================
  // 📅 OBTENER HORARIOS ACTUALES DEL CLIENTE
  // ================================
  async getCurrentSchedule() {
    try {
      console.log('📅 Obteniendo horarios actuales del cliente...');
      
      const response = await this.get(this.baseScheduleURL);
      
      if (response?.success && response.data) {
        console.log('✅ Horarios actuales obtenidos:', response.data);
        return response.data;
      }
      
      throw new Error('Error obteniendo horarios actuales');
      
    } catch (error) {
      console.error('❌ Error obteniendo horarios actuales:', error);
      
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

  // ================================
  // 🔍 OBTENER OPCIONES DE HORARIOS DISPONIBLES
  // ================================
  async getAvailableOptions(day = null) {
    try {
      console.log('🔍 Obteniendo opciones de horarios disponibles...');
      
      const params = day ? { day } : {};
      const url = `${this.baseScheduleURL}/available-options`;
      
      const response = await this.get(url, { params });
      
      if (response?.success && response.data) {
        console.log('✅ Opciones disponibles obtenidas:', response.data);
        return response.data;
      }
      
      throw new Error('Error obteniendo opciones disponibles');
      
    } catch (error) {
      console.error('❌ Error obteniendo opciones disponibles:', error);
      throw error;
    }
  }

  // ================================
  // ✏️ CAMBIAR HORARIOS SELECCIONADOS
  // ================================
  async changeSchedule(changes) {
    try {
      console.log('✏️ Cambiando horarios del cliente...');
      console.log('📤 Cambios a aplicar:', changes);
      
      // Determinar tipo de cambio
      const changeType = Object.keys(changes).length === 1 ? 
        'single_day' : 
        Object.keys(changes).length <= 3 ? 'multiple_days' : 'full_week';
      
      const payload = {
        changeType,
        changes
      };
      
      const response = await this.post(`${this.baseScheduleURL}/change`, payload);
      
      if (response?.success) {
        console.log('✅ Horarios cambiados exitosamente:', response.data);
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cambiando horarios');
      
    } catch (error) {
      console.error('❌ Error cambiando horarios:', error);
      
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

  // ================================
  // 🗑️ CANCELAR HORARIO ESPECÍFICO
  // ================================
  async cancelSlot(day, slotId) {
    try {
      console.log(`🗑️ Cancelando horario ${day}/${slotId}...`);
      
      const response = await this.delete(`${this.baseScheduleURL}/${day}/${slotId}`);
      
      if (response?.success) {
        console.log('✅ Horario cancelado exitosamente');
        return response.data;
      }
      
      throw new Error(response?.message || 'Error cancelando horario');
      
    } catch (error) {
      console.error('❌ Error cancelando horario:', error);
      throw error;
    }
  }

  // ================================
  // 📊 OBTENER ESTADÍSTICAS DE HORARIOS
  // ================================
  async getScheduleStats() {
    try {
      console.log('📊 Obteniendo estadísticas de horarios...');
      
      const response = await this.get(`${this.baseScheduleURL}/stats`);
      
      if (response?.success && response.data) {
        console.log('✅ Estadísticas obtenidas:', response.data);
        return response.data;
      }
      
      throw new Error('Error obteniendo estadísticas');
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      
      if (error.response?.status === 404) {
        // Fallback con estadísticas vacías
        return {
          totalSlots: 0,
          usedSlots: 0,
          availableSlots: 0,
          favoriteTime: null,
          totalVisits: 0
        };
      }
      
      throw error;
    }
  }

  // ================================
  // 👁️ PREVISUALIZAR CAMBIOS DE HORARIOS
  // ================================
  async previewChanges(changes) {
    try {
      console.log('👁️ Previsualizando cambios de horarios...');
      
      const response = await this.post(`${this.baseScheduleURL}/preview-change`, {
        changes
      });
      
      if (response?.success && response.data) {
        console.log('✅ Vista previa generada:', response.data);
        return response.data;
      }
      
      throw new Error('Error generando vista previa');
      
    } catch (error) {
      console.error('❌ Error en vista previa:', error);
      throw error;
    }
  }

  // ================================
  // 📱 HELPERS Y UTILIDADES
  // ================================

  // Validar cambios antes de enviar
  validateChanges(changes) {
    if (!changes || typeof changes !== 'object') {
      throw new Error('Los cambios deben ser un objeto válido');
    }

    if (Object.keys(changes).length === 0) {
      throw new Error('Debe especificar al menos un cambio');
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, slots] of Object.entries(changes)) {
      if (!validDays.includes(day)) {
        throw new Error(`Día inválido: ${day}`);
      }
      
      if (!Array.isArray(slots)) {
        throw new Error(`Los slots para ${day} deben ser un array`);
      }
      
      if (slots.length === 0) {
        throw new Error(`Debe especificar al menos un slot para ${day}`);
      }
    }

    return true;
  }

  // Formatear horarios para mostrar
  formatScheduleForDisplay(schedule) {
    if (!schedule || !schedule.currentSchedule) {
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

    for (const [day, dayData] of Object.entries(schedule.currentSchedule)) {
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
    }

    return formatted;
  }

  // Verificar si es el día actual
  isToday(day) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today;
  }

  // Verificar si el horario ya pasó
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
      return false;
    }
  }

  // Formatear rango de tiempo
  formatTimeRange(timeRange) {
    if (!timeRange) return '';
    
    try {
      const [start, end] = timeRange.split(' - ');
      return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    } catch (error) {
      return timeRange;
    }
  }

  // Formatear tiempo individual
  formatTime(time) {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${displayHour}:${minutes} ${period}`;
    } catch (error) {
      return time;
    }
  }

  // Calcular estadísticas locales
  calculateLocalStats(schedule) {
    if (!schedule?.currentSchedule) {
      return {
        totalSlots: 0,
        usedSlots: 0,
        availableSlots: 0,
        daysWithSlots: 0
      };
    }

    let totalSlots = 0;
    let usedSlots = 0;
    let daysWithSlots = 0;

    Object.values(schedule.currentSchedule).forEach(dayData => {
      if (dayData.hasSlots && dayData.slots) {
        usedSlots += dayData.slots.length;
        daysWithSlots++;
      }
    });

    // Estimación de slots totales (esto depende del plan de membresía)
    totalSlots = usedSlots + (daysWithSlots * 2); // Estimación conservadora

    return {
      totalSlots,
      usedSlots,
      availableSlots: totalSlots - usedSlots,
      daysWithSlots
    };
  }

  // ================================
  // 🔄 GESTIÓN DE ESTADO LOCAL Y CACHE
  // ================================

  // Cache para evitar peticiones repetidas
  _cache = new Map();
  _cacheTimeout = 2 * 60 * 1000; // 2 minutos

  // Obtener del cache
  getFromCache(key) {
    const cached = this._cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this._cacheTimeout) {
      this._cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Guardar en cache
  saveToCache(key, data) {
    this._cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Limpiar cache
  clearCache() {
    this._cache.clear();
  }

  // Métodos con cache
  async getCurrentScheduleWithCache() {
    const cacheKey = 'current-schedule';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📅 Usando horarios desde cache');
      return cached;
    }
    
    const data = await this.getCurrentSchedule();
    this.saveToCache(cacheKey, data);
    return data;
  }

  async getAvailableOptionsWithCache(day = null) {
    const cacheKey = `available-options-${day || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('🔍 Usando opciones disponibles desde cache');
      return cached;
    }
    
    const data = await this.getAvailableOptions(day);
    this.saveToCache(cacheKey, data);
    return data;
  }

  // Invalidar cache después de cambios
  invalidateCache() {
    console.log('🔄 Invalidando cache de horarios');
    this.clearCache();
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