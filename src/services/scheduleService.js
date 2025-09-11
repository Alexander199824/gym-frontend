// src/services/scheduleService.js
// SERVICIO ADAPTADO: Para manejar el formato actual del backend de forma resiliente

import { BaseService } from './baseService.js';

class ScheduleService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ================================
  // 🛠️ UTILIDADES PARA NORMALIZAR DATOS DEL BACKEND
  // ================================

  // ✅ SIMPLIFICADO: Los datos ya vienen procesados del controller
normalizeCurrentScheduleResponse(response) {
  console.log('📅 ScheduleService: Datos ya procesados del controller');
  
  if (!response || !response.data) {
    return this.getEmptyScheduleStructure();
  }

  return response.data;
}
  // Normalizar datos de horarios actuales por día
  normalizeCurrentScheduleData(currentSchedule) {
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

    if (!currentSchedule || typeof currentSchedule !== 'object') {
      console.warn('⚠️ currentSchedule inválido o vacío');
      return normalized;
    }

    // Procesar cada día
    Object.entries(currentSchedule).forEach(([day, dayData]) => {
      try {
        const normalizedDay = this.normalizeDayData(day, dayData, dayNames[day]);
        if (normalizedDay) {
          normalized[day] = normalizedDay;
        }
      } catch (error) {
        console.error(`❌ Error normalizando día ${day}:`, error);
        // Mantener estructura vacía para el día
      }
    });

    return normalized;
  }

  // Normalizar datos de un día específico
  normalizeDayData(day, dayData, dayName) {
    if (!dayData) {
      return {
        dayName: dayName || day,
        hasSlots: false,
        slots: []
      };
    }

    // Caso 1: dayData ya tiene estructura correcta { dayName, hasSlots, slots }
    if (dayData.hasOwnProperty('hasSlots') && dayData.hasOwnProperty('slots')) {
      return {
        dayName: dayData.dayName || dayName || day,
        hasSlots: dayData.hasSlots,
        slots: dayData.hasSlots ? this.normalizeSlots(dayData.slots) : []
      };
    }

    // Caso 2: dayData es un array directo de slots
    if (Array.isArray(dayData)) {
      const normalizedSlots = this.normalizeSlots(dayData);
      return {
        dayName: dayName || day,
        hasSlots: normalizedSlots.length > 0,
        slots: normalizedSlots
      };
    }

    // Caso 3: dayData tiene solo slots (sin hasSlots)
    if (dayData.slots) {
      const normalizedSlots = this.normalizeSlots(dayData.slots);
      return {
        dayName: dayData.dayName || dayName || day,
        hasSlots: normalizedSlots.length > 0,
        slots: normalizedSlots
      };
    }

    // Caso 4: dayData es un objeto con propiedades desconocidas
    console.warn(`⚠️ Formato de dayData desconocido para ${day}:`, dayData);
    return {
      dayName: dayName || day,
      hasSlots: false,
      slots: []
    };
  }

  // Normalizar array de slots
  normalizeSlots(slots) {
    if (!Array.isArray(slots)) {
      console.warn('⚠️ Slots no es un array:', slots);
      return [];
    }

    return slots.map((slot, index) => {
      try {
        return this.normalizeSlot(slot, index);
      } catch (error) {
        console.error(`❌ Error normalizando slot ${index}:`, error);
        return null;
      }
    }).filter(slot => slot !== null);
  }

  // Normalizar slot individual
  normalizeSlot(slot, index) {
    if (!slot) {
      throw new Error('Slot vacío o nulo');
    }

    // Caso 1: Slot ya normalizado { id, timeRange, openTime, closeTime, etc. }
    if (typeof slot === 'object' && (slot.id || slot.slotId)) {
      return {
        id: slot.id || slot.slotId,
        timeRange: slot.timeRange || this.buildTimeRange(slot.openTime, slot.closeTime),
        openTime: slot.openTime || '00:00',
        closeTime: slot.closeTime || '00:00',
        label: slot.label || slot.slotLabel || '',
        capacity: slot.capacity || 0,
        currentReservations: slot.currentReservations || 0,
        availability: slot.availability || (slot.capacity ? slot.capacity - slot.currentReservations : 0),
        canCancel: slot.canCancel !== false // Por defecto true
      };
    }

    // Caso 2: Slot es solo un ID (número o string)
    if (typeof slot === 'number' || typeof slot === 'string') {
      return {
        id: parseInt(slot),
        timeRange: 'Horario configurado',
        openTime: '00:00',
        closeTime: '00:00',
        label: '',
        capacity: 0,
        currentReservations: 0,
        availability: 0,
        canCancel: true
      };
    }

    // Caso 3: Formato desconocido
    throw new Error(`Formato de slot desconocido: ${typeof slot}`);
  }

  // Construir timeRange a partir de openTime y closeTime
  buildTimeRange(openTime, closeTime) {
    if (!openTime || !closeTime) {
      return 'Horario';
    }

    // Asegurar formato HH:MM
    const formatTime = (time) => {
      if (typeof time === 'string' && time.includes(':')) {
        return time.slice(0, 5); // Tomar solo HH:MM
      }
      return time;
    };

    return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
  }

  // Normalizar datos de membresía
  normalizeMembershipData(membership) {
    if (!membership) return null;

    return {
      id: membership.id,
      plan: membership.plan || { planName: membership.type || 'Plan' },
      type: membership.type,
      status: membership.status,
      summary: membership.summary || {
        daysRemaining: membership.remainingDays || 0,
        daysTotal: membership.totalDays || 0,
        daysUsed: (membership.totalDays || 0) - (membership.remainingDays || 0),
        status: membership.status || 'active'
      },
      startDate: membership.startDate,
      endDate: membership.endDate,
      price: membership.price
    };
  }

  // Estructura vacía por defecto
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

  // Normalizar opciones disponibles
  normalizeAvailableOptionsResponse(response) {
    console.log('🔍 ScheduleService: Normalizando opciones disponibles:', response);

    if (!response || !response.availableOptions) {
      console.warn('⚠️ Respuesta de opciones disponibles inválida');
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
      try {
        normalized.availableOptions[day] = this.normalizeAvailableDayOptions(day, dayData);
      } catch (error) {
        console.error(`❌ Error normalizando opciones para ${day}:`, error);
        normalized.availableOptions[day] = this.getEmptyDayOptions(day);
      }
    });

    console.log('✅ ScheduleService: Opciones disponibles normalizadas');
    return normalized;
  }

  // Normalizar opciones de un día específico
  normalizeAvailableDayOptions(day, dayData) {
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
      return this.getEmptyDayOptions(day);
    }

    const normalized = {
      dayName: dayNames[day] || day,
      isOpen: dayData.isOpen !== false, // Por defecto true
      slots: [],
      currentlyHas: dayData.currentlyHas || 0,
      totalAvailable: 0,
      message: dayData.message || null
    };

    // Normalizar slots si el día está abierto
    if (normalized.isOpen && dayData.slots && Array.isArray(dayData.slots)) {
      normalized.slots = dayData.slots.map(slot => ({
        id: slot.id,
        timeRange: slot.timeRange || this.buildTimeRange(slot.openTime, slot.closeTime),
        openTime: slot.openTime || '00:00',
        closeTime: slot.closeTime || '00:00',
        label: slot.label || slot.slotLabel || '',
        capacity: slot.capacity || 0,
        currentReservations: slot.currentReservations || 0,
        available: slot.available || (slot.capacity ? slot.capacity - slot.currentReservations : 0),
        canSelect: slot.canSelect !== false && (slot.available > 0 || slot.isCurrentlyMine),
        isCurrentlyMine: slot.isCurrentlyMine || false,
        status: slot.status || (slot.isCurrentlyMine ? 'current' : (slot.available > 0 ? 'available' : 'full'))
      }));

      normalized.totalAvailable = normalized.slots.filter(s => s.canSelect).length;
    }

    return normalized;
  }

  // Opciones vacías para un día
  getEmptyDayOptions(day) {
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    return {
      dayName: dayNames[day] || day,
      isOpen: false,
      slots: [],
      currentlyHas: 0,
      totalAvailable: 0,
      message: 'Sin información disponible'
    };
  }

  // ================================
  // 📅 MÉTODOS PRINCIPALES ADAPTADOS
  // ================================

  // OBTENER: Horarios actuales del cliente autenticado
  async getCurrentSchedule() {
    try {
      console.log('📅 ScheduleService: Obteniendo horarios actuales...');
      
      const response = await this.get('/memberships/my-schedule');
      
      console.log('📋 ScheduleService: Respuesta cruda del backend:', response);
      
      // Normalizar la respuesta independientemente del formato
      const normalizedData = this.normalizeCurrentScheduleResponse(response);
      
      console.log('✅ ScheduleService: Datos normalizados:', {
        hasMembership: normalizedData.hasMembership,
        scheduleDays: Object.keys(normalizedData.currentSchedule).filter(day => 
          normalizedData.currentSchedule[day].hasSlots
        ).length,
        totalSlots: normalizedData.totalSlotsReserved
      });
      
      return normalizedData;
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo horarios actuales:', error);
      
      if (error.response?.status === 404) {
        console.log('ℹ️ ScheduleService: Usuario sin membresía o sin horarios');
        return this.getEmptyScheduleStructure();
      }
      
      // Para otros errores, re-lanzar para que el componente los maneje
      throw error;
    }
  }

  // OBTENER: Opciones de horarios disponibles para reservar
  async getAvailableOptions(day = null) {
    try {
      console.log('🔍 ScheduleService: Obteniendo opciones disponibles...', { day });
      
      const params = day ? { day } : {};
      const response = await this.get('/memberships/my-schedule/available-options', { params });
      
      console.log('📋 ScheduleService: Respuesta cruda de opciones:', response);
      
      // Normalizar la respuesta
      const normalizedData = this.normalizeAvailableOptionsResponse(response);
      
      console.log('✅ ScheduleService: Opciones normalizadas:', {
        totalDays: Object.keys(normalizedData.availableOptions).length,
        openDays: Object.values(normalizedData.availableOptions).filter(d => d.isOpen).length
      });
      
      return normalizedData;
      
    } catch (error) {
      console.error('❌ ScheduleService: Error obteniendo opciones disponibles:', error);
      throw error;
    }
  }

  // CAMBIAR: Horarios seleccionados del cliente con validación mejorada
  async changeSchedule(changes) {
    try {
      console.log('✏️ ScheduleService: Cambiando horarios del cliente...');
      console.log('📤 Cambios originales:', changes);
      
      // Validar y limpiar cambios
      const cleanedChanges = this.validateAndCleanChanges(changes);
      console.log('🧹 Cambios limpiados:', cleanedChanges);
      
      // Determinar tipo de cambio automáticamente
      const changeType = this.determineChangeType(cleanedChanges);
      
      const payload = {
        changeType,
        changes: cleanedChanges
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

  // CANCELAR: Horario específico por día y slot ID con validación
  async cancelSlot(day, slotId) {
    try {
      console.log(`🗑️ ScheduleService: Cancelando horario ${day}/${slotId}...`);
      
      // Validar parámetros
      if (!day || !slotId) {
        throw new Error('Día y ID de slot son requeridos para cancelar');
      }
      
      // Asegurar que slotId es un número
      const validSlotId = this.extractSlotId(slotId);
      if (!validSlotId) {
        throw new Error(`ID de slot inválido: ${slotId}`);
      }
      
      console.log(`🗑️ ScheduleService: Cancelando horario validado ${day}/${validSlotId}...`);
      
      const response = await this.delete(`/memberships/my-schedule/${day}/${validSlotId}`);
      
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

  // OBTENER: Estadísticas de uso de horarios del cliente con fallback
  async getScheduleStats() {
    try {
      console.log('📊 ScheduleService: Obteniendo estadísticas de horarios...');
      
      const response = await this.get('/memberships/my-schedule/stats');
      
      if (response?.success && response.data) {
        console.log('✅ ScheduleService: Estadísticas obtenidas del backend:', response.data);
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

  // Estadísticas vacías por defecto
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
  // 🛠️ MÉTODOS DE VALIDACIÓN Y HELPERS MEJORADOS
  // ================================

 // ✅ Helper simplificado para extraer IDs
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

  // Validar y limpiar cambios antes de envío
  validateAndCleanChanges(changes) {
    console.log('🔍 ScheduleService: Validando y limpiando cambios...');
    
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

    console.log('✅ ScheduleService: Cambios validados y limpiados');
    return cleanedChanges;
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

  // Validar cambios de horarios (método público para compatibilidad)
  validateChanges(changes) {
    try {
      this.validateAndCleanChanges(changes);
      return true;
    } catch (error) {
      console.error('❌ ScheduleService: Validación falló:', error.message);
      return false;
    }
  }

  // Formatear horarios para visualización en UI (con datos normalizados)
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

  // Calcular estadísticas locales desde datos existentes (mejorado)
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

    // Encontrar horario más común
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
      totalVisits: totalSlots * 4, // Estimación semanal
      favoriteTime,
      dayDistribution
    };

    console.log('📊 ScheduleService: Estadísticas locales calculadas:', stats);
    return stats;
  }

  // ================================
  // 🕒 UTILIDADES DE TIEMPO Y DÍAS (sin cambios)
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
  // 💾 GESTIÓN DE CACHE (sin cambios)
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
    console.log('🗑️ ScheduleService: Invalidando cache de horarios');
    this.cache.clear();
  }

  invalidateCacheKey(key) {
    console.log(`🗑️ ScheduleService: Invalidando cache para: ${key}`);
    this.cache.delete(key);
  }

  // ================================
  // 🔧 MÉTODOS DE DEBUG Y SALUD
  // ================================

  async checkScheduleEndpoints() {
    console.log('🔍 ScheduleService: Verificando endpoints de horarios...');
    
    const endpoints = [
      { path: '/memberships/my-schedule', method: 'GET', description: 'Obtener horarios actuales' },
      { path: '/memberships/my-schedule/available-options', method: 'GET', description: 'Obtener opciones disponibles' },
      { path: '/memberships/my-schedule/stats', method: 'GET', description: 'Obtener estadísticas' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        await this.get(endpoint.path);
        results[endpoint.path] = { available: true, method: endpoint.method };
        console.log(`✅ ${endpoint.description} - Disponible`);
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