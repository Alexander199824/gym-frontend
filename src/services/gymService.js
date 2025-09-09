// src/services/gymService.js
// SERVICIO DE GIMNASIO Y SISTEMA DE HORARIOS FLEXIBLES

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';

class GymService extends BaseService {
  // ================================
  // 🏢 MÉTODOS DE GIMNASIO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER CONFIGURACIÓN DEL GYM
  async getGymConfig() {
    console.log('🏢 FETCHING GYM CONFIGURATION...');
    try {
      const result = await this.get('/gym/config');
      console.log('✅ GYM CONFIG RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER ESTADÍSTICAS
  async getGymStats() {
    console.log('📊 FETCHING GYM STATISTICS...');
    try {
      const result = await this.get('/gym/stats');
      console.log('✅ GYM STATS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM STATS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER SERVICIOS
  async getGymServices() {
    console.log('🏋️ FETCHING GYM SERVICES...');
    try {
      const result = await this.get('/gym/services');
      console.log('✅ GYM SERVICES RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM SERVICES FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PLANES DE MEMBRESÍA
  async getMembershipPlans() {
    console.log('🎫 FETCHING MEMBERSHIP PLANS...');
    try {
      const result = await this.get('/gym/membership-plans');
      console.log('✅ MEMBERSHIP PLANS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PLANS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    console.log('💬 FETCHING TESTIMONIALS...');
    try {
      const result = await this.get('/gym/testimonials');
      console.log('✅ TESTIMONIALS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIALS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER VIDEO DEL GIMNASIO
  async getGymVideo() {
    console.log('🎬 FETCHING GYM VIDEO...');
    try {
      const result = await this.get('/gym/video');
      console.log('✅ GYM VIDEO RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM VIDEO FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // 📄 MÉTODOS DE CONTENIDO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER CONTENIDO DE SECCIONES
  async getSectionsContent() {
    console.log('📄 FETCHING SECTIONS CONTENT...');
    try {
      const result = await this.get('/gym/sections-content');
      console.log('✅ SECTIONS CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ SECTIONS CONTENT FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER NAVEGACIÓN
  async getNavigation() {
    console.log('🧭 FETCHING NAVIGATION...');
    try {
      const result = await this.get('/gym/navigation');
      console.log('✅ NAVIGATION RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ NAVIGATION FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER PROMOCIONES
  async getPromotions() {
    console.log('🎉 FETCHING PROMOTIONS...');
    try {
      const result = await this.get('/gym/promotions');
      console.log('✅ PROMOTIONS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ PROMOTIONS FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER BRANDING
  async getBranding() {
    console.log('🎨 FETCHING BRANDING...');
    try {
      const result = await this.get('/gym/branding');
      console.log('✅ BRANDING RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ BRANDING FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER CONTENIDO DE LANDING PAGE
  async getLandingContent() {
    console.log('📄 FETCHING LANDING CONTENT...');
    try {
      const result = await this.get('/content/landing');
      console.log('✅ LANDING CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ LANDING CONTENT FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🆕 SISTEMA DE HORARIOS FLEXIBLES - NUEVOS MÉTODOS
  // ================================
  
  // 📝 OBTENER CONFIGURACIÓN COMPLETA PARA CONTENTEDITOR
  async getGymConfigEditor() {
    console.log('📝 FETCHING GYM CONFIG FOR CONTENT EDITOR...');
    
    try {
      const result = await this.get('/gym/config/editor');
      
      console.log('✅ GYM CONFIG EDITOR RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Config editor structure is correct');
        console.log('📝 Config editor details:', {
          hasName: !!result.data.name,
          hasHours: !!result.data.hours,
          hasContact: !!result.data.contact,
          hasSocial: !!result.data.social,
          hasStats: !!result.data.stats
        });
        
        // Análisis específico de horarios flexibles
        if (result.data.hours) {
          const openDays = Object.keys(result.data.hours).filter(day => 
            result.data.hours[day]?.isOpen
          );
          const totalSlots = openDays.reduce((sum, day) => {
            return sum + (result.data.hours[day]?.timeSlots?.length || 0);
          }, 0);
          
          console.log('🕒 Flexible hours analysis:', {
            totalDays: Object.keys(result.data.hours).length,
            openDays: openDays.length,
            totalTimeSlots: totalSlots,
            hasFlexibleStructure: openDays.some(day => 
              result.data.hours[day]?.timeSlots?.length > 1
            )
          });
        }
      } else {
        console.warn('⚠️ Config editor structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG EDITOR FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📝 CONFIG EDITOR: Endpoint not found - using fallback to regular config');
        // Usar configuración regular como fallback
        return await this.getGymConfig();
      }
      
      throw error;
    }
  }
  
  // 💾 GUARDAR HORARIOS FLEXIBLES
  async saveFlexibleSchedule(scheduleData) {
    console.log('💾 SAVING FLEXIBLE SCHEDULE...');
    console.log('📤 Schedule data to save:', scheduleData);
    
    try {
      const requestData = {
        section: 'schedule',
        data: {
          hours: scheduleData
        }
      };
      
      const result = await this.put('/gym/config/flexible', requestData);
      
      console.log('✅ FLEXIBLE SCHEDULE SAVED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Schedule save response structure is correct');
        console.log('💾 Schedule save details:', {
          section: result.section || 'schedule',
          success: result.success,
          message: result.message || 'Schedule saved'
        });
        
        // Mostrar toast de éxito
        if (result.message) {
          toast.success(result.message);
        } else {
          toast.success('Horarios flexibles guardados exitosamente');
        }
      } else {
        console.warn('⚠️ Schedule save response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ FLEXIBLE SCHEDULE SAVE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - timeSlots: Must be valid time slots array');
        console.log('   - capacity: Must be positive numbers');
        console.log('   - open/close times: Must be valid time format');
        
        // Mostrar errores específicos
        if (error.response.data?.errors) {
          const errorMsg = Array.isArray(error.response.data.errors) 
            ? error.response.data.errors.join(', ')
            : error.response.data.message || 'Error de validación';
          toast.error(`Error en horarios: ${errorMsg}`);
        } else {
          toast.error('Error validando horarios flexibles');
        }
      } else if (error.response?.status === 403) {
        console.log('🔒 SCHEDULE SAVE: Permission denied');
        toast.error('Sin permisos para guardar horarios');
      } else {
        toast.error('Error al guardar horarios flexibles');
      }
      
      throw error;
    }
  }
  
  // 📊 OBTENER MÉTRICAS DE CAPACIDAD
  async getCapacityMetrics() {
    console.log('📊 FETCHING CAPACITY METRICS...');
    
    try {
      const result = await this.get('/gym/capacity/metrics');
      
      console.log('✅ CAPACITY METRICS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Capacity metrics structure is correct');
        console.log('📊 Capacity metrics details:', {
          totalCapacity: result.data.totalCapacity || 0,
          totalReservations: result.data.totalReservations || 0,
          averageOccupancy: result.data.averageOccupancy || 0,
          availableSpaces: result.data.availableSpaces || 0,
          busiestDay: result.data.busiestDay || 'N/A',
          busiestOccupancy: result.data.busiestOccupancy || 0
        });
      } else {
        console.warn('⚠️ Capacity metrics structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ CAPACITY METRICS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📊 CAPACITY METRICS: Endpoint not found - returning default metrics');
        return {
          success: true,
          data: {
            totalCapacity: 0,
            totalReservations: 0,
            averageOccupancy: 0,
            availableSpaces: 0,
            busiestDay: '',
            busiestOccupancy: 0
          }
        };
      }
      
      throw error;
    }
  }
  
  // 🔄 ALTERNAR DÍA ABIERTO/CERRADO
  async toggleDayOpen(day) {
    console.log(`🔄 TOGGLING DAY OPEN STATUS: ${day}`);
    
    try {
      const result = await this.post(`/gym/hours/${day}/toggle`);
      
      console.log('✅ DAY TOGGLE SUCCESSFUL:', result);
      
      if (result && result.success) {
        console.log('✅ Day toggle response structure is correct');
        console.log(`🔄 Day ${day} is now: ${result.data?.isOpen ? 'OPEN' : 'CLOSED'}`);
        
        // Mostrar feedback
        const status = result.data?.isOpen ? 'abierto' : 'cerrado';
        toast.success(`${day} marcado como ${status}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ DAY TOGGLE FAILED for ${day}:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('🔄 DAY TOGGLE: Endpoint not found');
        toast.error('Función no disponible');
      } else if (error.response?.status === 422) {
        console.log('📝 DAY TOGGLE: Invalid day provided');
        toast.error('Día inválido');
      }
      
      throw error;
    }
  }
  
  // ➕ AGREGAR FRANJA HORARIA
  async addTimeSlot(day, slotData) {
    console.log(`➕ ADDING TIME SLOT TO ${day}:`, slotData);
    
    try {
      const result = await this.post(`/gym/hours/${day}/slots`, slotData);
      
      console.log('✅ TIME SLOT ADDED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.slot) {
        console.log('✅ Add time slot response structure is correct');
        console.log('➕ New time slot details:', {
          open: result.data.slot.open,
          close: result.data.slot.close,
          capacity: result.data.slot.capacity,
          label: result.data.slot.label || 'Sin etiqueta'
        });
        
        // Mostrar feedback
        const timeRange = `${result.data.slot.open} - ${result.data.slot.close}`;
        toast.success(`Franja horaria agregada: ${timeRange}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ ADD TIME SLOT FAILED for ${day}:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 TIME SLOT VALIDATION FAILED:', error.response.data?.errors);
        toast.error('Error en datos de franja horaria');
      } else if (error.response?.status === 404) {
        console.log('➕ ADD TIME SLOT: Endpoint not found');
        toast.error('Función no disponible');
      }
      
      throw error;
    }
  }
  
  // ❌ ELIMINAR FRANJA HORARIA
  async removeTimeSlot(day, slotIndex) {
    console.log(`❌ REMOVING TIME SLOT FROM ${day} at index ${slotIndex}`);
    
    try {
      const result = await this.delete(`/gym/hours/${day}/slots/${slotIndex}`);
      
      console.log('✅ TIME SLOT REMOVED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Remove time slot response structure is correct');
        toast.success('Franja horaria eliminada');
      }
      
      return result;
    } catch (error) {
      console.log(`❌ REMOVE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('❌ REMOVE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      } else if (error.response?.status === 422) {
        console.log('📝 REMOVE TIME SLOT: Invalid slot index');
        toast.error('Índice de franja inválido');
      }
      
      throw error;
    }
  }
  
  // ✏️ ACTUALIZAR FRANJA HORARIA
  async updateTimeSlot(day, slotIndex, field, value) {
    console.log(`✏️ UPDATING TIME SLOT ${day}[${slotIndex}] - ${field}: ${value}`);
    
    try {
      const requestData = {
        field: field,
        value: value
      };
      
      const result = await this.patch(`/gym/hours/${day}/slots/${slotIndex}`, requestData);
      
      console.log('✅ TIME SLOT UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Update time slot response structure is correct');
        console.log(`✏️ Updated ${field} to ${value}`);
        
        // Mostrar feedback específico por campo
        const fieldLabels = {
          open: 'Hora de apertura',
          close: 'Hora de cierre',
          capacity: 'Capacidad',
          reservations: 'Reservaciones',
          label: 'Etiqueta'
        };
        
        const fieldLabel = fieldLabels[field] || field;
        toast.success(`${fieldLabel} actualizada`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ UPDATE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 TIME SLOT UPDATE VALIDATION FAILED:', error.response.data?.errors);
        
        // Mostrar errores específicos por campo
        const fieldErrors = {
          capacity: 'La capacidad debe ser un número positivo',
          reservations: 'Las reservaciones no pueden exceder la capacidad',
          open: 'Hora de apertura inválida',
          close: 'Hora de cierre inválida'
        };
        
        const errorMsg = fieldErrors[field] || 'Error en el campo';
        toast.error(errorMsg);
      } else if (error.response?.status === 404) {
        console.log('✏️ UPDATE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      }
      
      throw error;
    }
  }
  
  // 📋 DUPLICAR FRANJA HORARIA
  async duplicateTimeSlot(day, slotIndex) {
    console.log(`📋 DUPLICATING TIME SLOT FROM ${day}[${slotIndex}]`);
    
    try {
      const result = await this.post(`/gym/hours/${day}/slots/${slotIndex}/duplicate`);
      
      console.log('✅ TIME SLOT DUPLICATED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.slot) {
        console.log('✅ Duplicate time slot response structure is correct');
        console.log('📋 Duplicated slot details:', {
          open: result.data.slot.open,
          close: result.data.slot.close,
          capacity: result.data.slot.capacity,
          label: result.data.slot.label || 'Copia'
        });
        
        // Mostrar feedback
        const timeRange = `${result.data.slot.open} - ${result.data.slot.close}`;
        toast.success(`Franja duplicada: ${timeRange}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ DUPLICATE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('📋 DUPLICATE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      } else if (error.response?.status === 422) {
        console.log('📝 DUPLICATE TIME SLOT: Cannot duplicate');
        toast.error('No se puede duplicar la franja');
      }
      
      throw error;
    }
  }
  
  // 📊 APLICAR CAPACIDAD A TODAS LAS FRANJAS
  async applyCapacityToAllSlots(capacity) {
    console.log(`📊 APPLYING CAPACITY ${capacity} TO ALL TIME SLOTS`);
    
    try {
      const requestData = {
        capacity: parseInt(capacity) || 0
      };
      
      const result = await this.post('/gym/hours/capacity/apply-all', requestData);
      
      console.log('✅ CAPACITY APPLIED TO ALL SLOTS SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Apply capacity response structure is correct');
        console.log('📊 Capacity application details:', {
          capacity: capacity,
          slotsAffected: result.data?.slotsAffected || 0,
          daysAffected: result.data?.daysAffected || 0
        });
        
        // Mostrar feedback detallado
        const slotsCount = result.data?.slotsAffected || 0;
        const daysCount = result.data?.daysAffected || 0;
        toast.success(`Capacidad de ${capacity} aplicada a ${slotsCount} franjas en ${daysCount} días`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ APPLY CAPACITY TO ALL FAILED:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 APPLY CAPACITY VALIDATION FAILED:', error.response.data?.errors);
        toast.error('Capacidad inválida (debe ser un número positivo)');
      } else if (error.response?.status === 404) {
        console.log('📊 APPLY CAPACITY: Endpoint not found');
        toast.error('Función no disponible');
      }
      
      throw error;
    }
  }

  // 🔧 GUARDAR CONFIGURACIÓN POR SECCIONES
  async saveGymConfigSection(section, data) {
    console.log(`🔧 SAVING GYM CONFIG SECTION: ${section}`);
    console.log('📤 Section data:', data);
    
    try {
      const requestData = {
        section: section,
        data: data
      };
      
      const result = await this.put('/gym/config/flexible', requestData);
      
      console.log(`✅ CONFIG SECTION ${section} SAVED SUCCESSFULLY:`, result);
      
      if (result && result.success) {
        console.log('✅ Section save response structure is correct');
        
        // Mostrar feedback específico por sección
        const sectionLabels = {
          basic: 'Información básica',
          contact: 'Información de contacto',
          social: 'Redes sociales',
          schedule: 'Horarios y capacidad',
          stats: 'Estadísticas'
        };
        
        const sectionLabel = sectionLabels[section] || section;
        const message = result.message || `${sectionLabel} guardada exitosamente`;
        toast.success(message);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ SAVE CONFIG SECTION ${section} FAILED:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 CONFIG SECTION VALIDATION FAILED:', error.response.data?.errors);
        
        // Mostrar errores específicos por sección
        const sectionErrors = {
          basic: 'Error en información básica',
          contact: 'Error en información de contacto',
          social: 'Error en redes sociales',
          schedule: 'Error en horarios',
          stats: 'Error en estadísticas'
        };
        
        const errorMsg = sectionErrors[section] || `Error en sección ${section}`;
        toast.error(errorMsg);
      } else if (error.response?.status === 403) {
        console.log('🔒 SAVE CONFIG SECTION: Permission denied');
        toast.error('Sin permisos para guardar configuración');
      } else {
        toast.error(`Error al guardar ${section}`);
      }
      
      throw error;
    }
  }
}

export { GymService };