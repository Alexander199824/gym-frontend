// src/services/gymService.js
// SERVICIO DE GIMNASIO - ACTUALIZADO PARA CONECTAR CON TEST-GYM-INFO-MANAGER
// Autor: Alexander Echeverria

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';

class GymService extends BaseService {
  // ================================
  // 🏢 CONFIGURACIÓN GENERAL DEL GYM
  // ================================
  
  // OBTENER CONFIGURACIÓN COMPLETA DEL GYM
  async getGymConfig() {
    console.log('🏢 FETCHING GYM CONFIGURATION...');
    try {
      const result = await this.get('/gym/config');
      console.log('✅ GYM CONFIG RECEIVED:', result);
      
      if (result && result.data) {
        console.log('📋 Config structure:', {
          hasName: !!result.data.name,
          hasTagline: !!result.data.tagline,
          hasDescription: !!result.data.description,
          hasLogo: !!result.data.logo,
          hasHero: !!result.data.hero,
          hasContact: !!result.data.contact,
          hasSocial: !!result.data.social,
          hasMultimedia: !!result.data.multimedia,
          contactRaw: result.data.contact
        });
        
        // ✅ MAPEO CORRECTO: Asegurar que contact.location.mapsUrl existe
        if (result.data.contact) {
          const contact = result.data.contact;
          
          // Mapear maps_url a mapsUrl si es necesario
          if (contact.maps_url && !contact.mapsUrl) {
            contact.mapsUrl = contact.maps_url;
          }
          
          // Mapear location.maps_url a location.mapsUrl
          if (contact.location) {
            if (contact.location.maps_url && !contact.location.mapsUrl) {
              contact.location.mapsUrl = contact.location.maps_url;
            }
            
            // También copiar lat/lng si vienen como latitude/longitude
            if (contact.latitude && !contact.location.lat) {
              contact.location.lat = contact.latitude;
            }
            if (contact.longitude && !contact.location.lng) {
              contact.location.lng = contact.longitude;
            }
          } else if (contact.maps_url || contact.latitude || contact.longitude) {
            // Crear objeto location si no existe pero hay datos
            contact.location = {
              mapsUrl: contact.mapsUrl || contact.maps_url,
              lat: contact.latitude,
              lng: contact.longitude
            };
          }
          
          console.log('✅ Contact después de mapeo:', contact);
        }
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG FAILED:', error.message);
      throw error;
    }
  }

  // ACTUALIZAR CONFIGURACIÓN DEL GYM
  async updateGymConfig(configData) {
    console.log('💾 UPDATING GYM CONFIGURATION...');
    console.log('📤 Config data to update:', configData);
    
    try {
      // El backend espera los campos directamente: gymName, gymTagline, gymDescription, colores
      const requestData = {};
      
      // Mapear campos al formato esperado por el backend
      if (configData.name !== undefined) requestData.gymName = configData.name;
      if (configData.tagline !== undefined) requestData.gymTagline = configData.tagline;
      if (configData.description !== undefined) requestData.gymDescription = configData.description;
      
      // Colores del tema
      if (configData.primaryColor !== undefined) requestData.primaryColor = configData.primaryColor;
      if (configData.secondaryColor !== undefined) requestData.secondaryColor = configData.secondaryColor;
      if (configData.successColor !== undefined) requestData.successColor = configData.successColor;
      if (configData.warningColor !== undefined) requestData.warningColor = configData.warningColor;
      if (configData.dangerColor !== undefined) requestData.dangerColor = configData.dangerColor;
      
      console.log('📤 Request data formatted:', requestData);
      
      const result = await this.put('/gym/config', requestData);
      
      console.log('✅ GYM CONFIG UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Configuración actualizada exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE GYM CONFIG FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación en la configuración');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para actualizar configuración');
      } else {
        toast.error('Error al actualizar configuración');
      }
      
      throw error;
    }
  }

  // ================================
  // 📞 INFORMACIÓN DE CONTACTO
  // ================================
  
  // OBTENER INFORMACIÓN DE CONTACTO
   async getContactInfo() {
    console.log('📞 FETCHING CONTACT INFO...');
    try {
      const result = await this.get('/gym/contact');
      console.log('✅ CONTACT INFO RECEIVED:', result);
      
      if (result && result.data) {
        console.log('📞 Contact structure:', {
          hasPhone: !!result.data.phone,
          hasEmail: !!result.data.email,
          hasAddress: !!result.data.address,
          hasLocation: !!result.data.location,
          hasCity: !!result.data.city,
          rawMapsUrl: result.data.maps_url,        // ⭐ Campo en BD (snake_case)
          rawMapsUrlCamel: result.data.mapsUrl,    // Por si viene en camelCase
          locationMapsUrl: result.data.location?.maps_url,
          locationMapsUrlCamel: result.data.location?.mapsUrl
        });
        
        // ✅ MAPEO CORRECTO: Convertir snake_case a camelCase
        const contactData = {
          ...result.data,
          // Si viene maps_url (snake_case), convertir a mapsUrl (camelCase)
          mapsUrl: result.data.mapsUrl || result.data.maps_url,
          location: result.data.location ? {
            ...result.data.location,
            mapsUrl: result.data.location.mapsUrl || result.data.location.maps_url,
            lat: result.data.location.lat || result.data.latitude,
            lng: result.data.location.lng || result.data.longitude
          } : null
        };
        
        console.log('✅ Contact data mapeado:', contactData);
        
        return {
          ...result,
          data: contactData
        };
      }
      
      return result;
    } catch (error) {
      console.log('❌ CONTACT INFO FAILED:', error.message);
      throw error;
    }
  }

  // ACTUALIZAR INFORMACIÓN DE CONTACTO
  async updateContactInfo(contactData) {
    console.log('💾 UPDATING CONTACT INFO...');
    console.log('📤 Contact data to update:', contactData);
    
    try {
      // El backend espera: phone, email, address, city, mapsUrl, etc.
      const requestData = {};
      
      if (contactData.phone !== undefined) requestData.phone = contactData.phone;
      if (contactData.email !== undefined) requestData.email = contactData.email;
      if (contactData.address !== undefined) requestData.address = contactData.address;
      if (contactData.whatsapp !== undefined) requestData.whatsapp = contactData.whatsapp;
      if (contactData.city !== undefined) requestData.city = contactData.city;
      if (contactData.mapsUrl !== undefined) requestData.mapsUrl = contactData.mapsUrl;
      
      // Coordenadas de ubicación
      if (contactData.location) {
        if (contactData.location.lat !== undefined) requestData.lat = contactData.location.lat;
        if (contactData.location.lng !== undefined) requestData.lng = contactData.location.lng;
      }
      
      console.log('📤 Request data formatted:', requestData);
      
      const result = await this.put('/gym/contact', requestData);
      
      console.log('✅ CONTACT INFO UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Información de contacto actualizada');
      }
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE CONTACT INFO FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación en información de contacto');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para actualizar contacto');
      } else {
        toast.error('Error al actualizar información de contacto');
      }
      
      throw error;
    }
  }

  // ================================
  // 📱 REDES SOCIALES
  // ================================
  
  // OBTENER TODAS LAS REDES SOCIALES (público)
  async getSocialMedia() {
    console.log('📱 FETCHING SOCIAL MEDIA (PUBLIC)...');
    try {
      const result = await this.get('/gym/social-media');
      console.log('✅ SOCIAL MEDIA RECEIVED:', result);
      
      if (result && result.data) {
        console.log('📱 Social media structure:', {
          platforms: Object.keys(result.data),
          activePlatforms: Object.entries(result.data).filter(([_, v]) => v?.active).length
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ SOCIAL MEDIA FAILED:', error.message);
      throw error;
    }
  }

  // OBTENER TODAS LAS REDES SOCIALES (admin - incluye inactivas)
  async getAllSocialMedia() {
    console.log('📱 FETCHING ALL SOCIAL MEDIA (ADMIN)...');
    try {
      const result = await this.get('/gym/social-media/all');
      console.log('✅ ALL SOCIAL MEDIA RECEIVED:', result);
      
      if (result && result.data) {
        console.log('📱 All social media structure:', {
          platforms: Object.keys(result.data),
          totalPlatforms: Object.keys(result.data).length,
          activePlatforms: Object.entries(result.data).filter(([_, v]) => v?.active).length,
          inactivePlatforms: Object.entries(result.data).filter(([_, v]) => !v?.active).length
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ ALL SOCIAL MEDIA FAILED:', error.message);
      
      // Fallback a endpoint público si falla
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log('📱 FALLBACK: Using public social media endpoint');
        return await this.getSocialMedia();
      }
      
      throw error;
    }
  }

  // OBTENER RED SOCIAL ESPECÍFICA
  async getSocialMediaPlatform(platform) {
    console.log(`📱 FETCHING SOCIAL MEDIA PLATFORM: ${platform}...`);
    try {
      const result = await this.get(`/gym/social-media/${platform}`);
      console.log(`✅ ${platform.toUpperCase()} RECEIVED:`, result);
      
      if (result && result.data) {
        console.log(`📱 ${platform} details:`, {
          hasUrl: !!result.data.url,
          hasHandle: !!result.data.handle,
          isActive: !!result.data.isActive
        });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ ${platform.toUpperCase()} FAILED:`, error.message);
      throw error;
    }
  }

  // CREAR O ACTUALIZAR RED SOCIAL
  async saveSocialMedia(socialData) {
    console.log('💾 SAVING SOCIAL MEDIA...');
    console.log('📤 Social data:', socialData);
    
    try {
      // El backend espera: platform, url, handle, isActive
      const requestData = {
        platform: socialData.platform,
        url: socialData.url,
        handle: socialData.handle || null,
        isActive: socialData.isActive !== false // default true
      };
      
      console.log('📤 Request data formatted:', requestData);
      
      const result = await this.post('/gym/social-media', requestData);
      
      console.log('✅ SOCIAL MEDIA SAVED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        const action = result.data?.isNew ? 'creada' : 'actualizada';
        toast.success(`Red social ${socialData.platform} ${action}`);
      }
      
      return result;
    } catch (error) {
      console.log('❌ SAVE SOCIAL MEDIA FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error(`Error en ${socialData.platform}: URL inválida o datos incompletos`);
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para guardar redes sociales');
      } else {
        toast.error(`Error al guardar ${socialData.platform}`);
      }
      
      throw error;
    }
  }

  // ACTIVAR/DESACTIVAR RED SOCIAL
  async toggleSocialMedia(platform) {
    console.log(`🔄 TOGGLING SOCIAL MEDIA: ${platform}...`);
    
    try {
      const result = await this.patch(`/gym/social-media/${platform}/toggle`, {});
      
      console.log('✅ SOCIAL MEDIA TOGGLED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        const status = result.data?.isActive ? 'activada' : 'desactivada';
        toast.success(`${platform} ${status}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ TOGGLE SOCIAL MEDIA FAILED for ${platform}:`, error.message);
      
      if (error.response?.status === 404) {
        toast.error(`Red social ${platform} no encontrada`);
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para cambiar estado');
      } else {
        toast.error(`Error al cambiar estado de ${platform}`);
      }
      
      throw error;
    }
  }

  // ================================
  // 📊 ESTADÍSTICAS
  // ================================
  
  // OBTENER ESTADÍSTICAS DEL GYM
  async getGymStats() {
    console.log('📊 FETCHING GYM STATISTICS...');
    try {
      const result = await this.get('/gym/stats');
      console.log('✅ GYM STATS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('📊 Stats structure:', {
          isArray: Array.isArray(result.data),
          count: Array.isArray(result.data) ? result.data.length : 0,
          sample: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM STATS FAILED:', error.message);
      throw error;
    }
  }

  // OBTENER ESTADÍSTICAS ACTIVAS (para landing page)
  async getActiveStatistics() {
    console.log('📊 FETCHING ACTIVE STATISTICS...');
    try {
      // Primero intentar endpoint de estadísticas activas
      const result = await this.get('/statistics/active');
      console.log('✅ ACTIVE STATISTICS RECEIVED:', result);
      
      if (result && result.data && Array.isArray(result.data)) {
        console.log(`📊 Found ${result.data.length} active statistics:`, 
          result.data.map(s => `${s.label}: ${s.number}`)
        );
      }
      
      return result;
    } catch (error) {
      console.log('❌ ACTIVE STATISTICS FAILED:', error.message);
      
      // Fallback a estadísticas del gym si falla
      if (error.response?.status === 404) {
        console.log('📊 FALLBACK: Using gym stats endpoint');
        return await this.getGymStats();
      }
      
      throw error;
    }
  }

  // ================================
  // 🏋️ SERVICIOS
  // ================================
  
  // OBTENER SERVICIOS DEL GYM
  async getGymServices() {
    console.log('🏋️ FETCHING GYM SERVICES...');
    try {
      const result = await this.get('/gym/services');
      console.log('✅ GYM SERVICES RECEIVED:', result);
      
      if (result && result.data) {
        console.log('🏋️ Services structure:', {
          isArray: Array.isArray(result.data),
          count: Array.isArray(result.data) ? result.data.length : 0,
          activeCount: Array.isArray(result.data) ? 
            result.data.filter(s => s.active).length : 0
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM SERVICES FAILED:', error.message);
      throw error;
    }
  }

  // ACTUALIZAR SERVICIOS
  async updateServices(services) {
    console.log('💾 UPDATING GYM SERVICES...');
    console.log('📤 Services data:', services);
    
    try {
      const result = await this.put('/gym/services', { services });
      
      console.log('✅ SERVICES UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Servicios actualizados');
      }
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE SERVICES FAILED:', error.message);
      toast.error('Error al actualizar servicios');
      throw error;
    }
  }

  // ================================
  // 💳 PLANES DE MEMBRESÍA
  // ================================
  
  // OBTENER PLANES DE MEMBRESÍA
  async getMembershipPlans() {
    console.log('🎫 FETCHING MEMBERSHIP PLANS...');
    try {
      const result = await this.get('/gym/membership-plans');
      console.log('✅ MEMBERSHIP PLANS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('💳 Plans structure:', {
          isArray: Array.isArray(result.data),
          count: Array.isArray(result.data) ? result.data.length : 0,
          activeCount: Array.isArray(result.data) ? 
            result.data.filter(p => p.active).length : 0,
          popularPlan: Array.isArray(result.data) ? 
            result.data.find(p => p.popular)?.name : null
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PLANS FAILED:', error.message);
      throw error;
    }
  }

  // ACTUALIZAR PLANES DE MEMBRESÍA
  async updateMembershipPlans(plans) {
    console.log('💾 UPDATING MEMBERSHIP PLANS...');
    console.log('📤 Plans data:', plans);
    
    try {
      const result = await this.put('/gym/membership-plans', { plans });
      
      console.log('✅ PLANS UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Planes actualizados');
      }
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE PLANS FAILED:', error.message);
      toast.error('Error al actualizar planes');
      throw error;
    }
  }

  // ================================
  // 💬 TESTIMONIOS
  // ================================
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    console.log('💬 FETCHING TESTIMONIALS...');
    try {
      const result = await this.get('/gym/testimonials');
      console.log('✅ TESTIMONIALS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('💬 Testimonials structure:', {
          isArray: Array.isArray(result.data),
          count: Array.isArray(result.data) ? result.data.length : 0
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIALS FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // 🎬 VIDEO Y MULTIMEDIA
  // ================================
  
  // OBTENER VIDEO DEL GIMNASIO
  async getGymVideo() {
    console.log('🎬 FETCHING GYM VIDEO...');
    try {
      const result = await this.get('/gym/video');
      console.log('✅ GYM VIDEO RECEIVED:', result);
      
      if (result && result.data) {
        console.log('🎬 Video structure:', {
          hasHeroVideo: !!result.data.heroVideo,
          hasPoster: !!result.data.poster,
          hasTitle: !!result.data.title,
          hasSettings: !!result.data.settings
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM VIDEO FAILED:', error.message);
      throw error;
    }
  }

  // ================================
  // 📄 CONTENIDO DE SECCIONES
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
  // 🔧 ADMINISTRACIÓN
  // ================================
  
  // REINICIALIZAR DATOS POR DEFECTO
  async initializeGymData() {
    console.log('🌱 INITIALIZING GYM DATA...');
    
    try {
      const result = await this.post('/gym/initialize', {});
      
      console.log('✅ GYM DATA INITIALIZED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success('Datos inicializados correctamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ INITIALIZE GYM DATA FAILED:', error.message);
      
      if (error.response?.status === 403) {
        toast.error('Sin permisos para reinicializar datos');
      } else {
        toast.error('Error al reinicializar datos');
      }
      
      throw error;
    }
  }

  // ================================
  // 🆕 SISTEMA DE HORARIOS FLEXIBLES (mantener compatibilidad)
  // ================================
  
  // 📝 OBTENER CONFIGURACIÓN COMPLETA PARA CONTENTEDITOR
  async getGymConfigEditor() {
    console.log('📝 FETCHING GYM CONFIG FOR CONTENT EDITOR...');
    
    try {
      // Intentar endpoint especializado primero
      const result = await this.get('/gym/config/editor');
      console.log('✅ GYM CONFIG EDITOR RECEIVED:', result);
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
  
  // 💾 GUARDAR HORARIOS FLEXIBLES (mantener para compatibilidad)
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
        toast.success(result.message || 'Horarios flexibles guardados exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ FLEXIBLE SCHEDULE SAVE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación en horarios flexibles');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para guardar horarios');
      } else {
        toast.error('Error al guardar horarios flexibles');
      }
      
      throw error;
    }
  }
  
  // 📊 OBTENER MÉTRICAS DE CAPACIDAD (mantener para compatibilidad)
  async getCapacityMetrics() {
    console.log('📊 FETCHING CAPACITY METRICS...');
    
    try {
      const result = await this.get('/gym/capacity/metrics');
      console.log('✅ CAPACITY METRICS RECEIVED:', result);
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
  
  // 🔧 GUARDAR CONFIGURACIÓN POR SECCIONES (mantener para compatibilidad)
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
        toast.error(`Error en ${section}`);
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para guardar configuración');
      } else {
        toast.error(`Error al guardar ${section}`);
      }
      
      throw error;
    }
  }
}

export { GymService };

/*
=============================================================================
GYM SERVICE - ACTUALIZADO PARA TEST-GYM-INFO-MANAGER
=============================================================================

✅ ENDPOINTS IMPLEMENTADOS SEGÚN EL TEST:

CONFIGURACIÓN:
- GET  /api/gym/config               - Obtener configuración completa
- PUT  /api/gym/config               - Actualizar config (gymName, gymTagline, gymDescription, colores)

CONTACTO:
- GET  /api/gym/contact              - Obtener info de contacto
- PUT  /api/gym/contact              - Actualizar contacto (phone, email, address, city, mapsUrl)

REDES SOCIALES:
- GET  /api/gym/social-media         - Obtener redes activas (público)
- GET  /api/gym/social-media/all     - Obtener todas las redes (admin)
- GET  /api/gym/social-media/:platform - Obtener red específica
- POST /api/gym/social-media         - Crear/actualizar red (platform, url, handle, isActive)
- PATCH /api/gym/social-media/:platform/toggle - Activar/desactivar red

CONTENIDO:
- GET  /api/gym/stats                - Obtener estadísticas
- GET  /api/gym/services             - Obtener servicios
- GET  /api/gym/membership-plans     - Obtener planes de membresía
- GET  /api/gym/testimonials         - Obtener testimonios
- GET  /api/gym/video                - Obtener video

ADMINISTRACIÓN:
- POST /api/gym/initialize           - Reinicializar datos por defecto

✅ CARACTERÍSTICAS:
- Mapeo correcto de campos al formato del backend
- Validación y manejo de errores robusto
- Fallbacks para endpoints no disponibles
- Logging detallado para debugging
- Notificaciones toast apropiadas
- Compatibilidad con código existente

✅ FORMATO DE DATOS:
- Config: gymName, gymTagline, gymDescription, colores
- Contact: phone, email, address, city, mapsUrl
- Social: platform, url, handle, isActive
- Stats: Array de estadísticas dinámicas
- Services: Array de servicios
- Plans: Array de planes de membresía

✅ MANTIENE FUNCIONALIDAD EXISTENTE:
- Sistema de horarios flexibles
- Métodos de contenido de secciones
- Navegación, promociones, branding
- Landing content
- Video y multimedia

Este servicio está completamente sincronizado con el test backend
y mantiene toda la funcionalidad existente sin romper nada.
=============================================================================
*/