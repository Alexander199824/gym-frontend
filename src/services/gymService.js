// src/services/gymService.js
// SERVICIO DE GIMNASIO - COMPLETO CON CRUD DE SERVICIOS
// Autor: Alexander Echeverria
// ✅ MANTIENE TODO + CORRIGE SOLO RUTAS DE SERVICIOS (/services/* en lugar de /gym/services/*)

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
          rawMapsUrl: result.data.maps_url,
          rawMapsUrlCamel: result.data.mapsUrl,
          locationMapsUrl: result.data.location?.maps_url,
          locationMapsUrlCamel: result.data.location?.mapsUrl
        });
        
        // ✅ MAPEO CORRECTO: Convertir snake_case a camelCase
        const contactData = {
          ...result.data,
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
      const requestData = {
        platform: socialData.platform,
        url: socialData.url,
        handle: socialData.handle || null,
        isActive: socialData.isActive !== false
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
      
      if (error.response?.status === 404) {
        console.log('📊 FALLBACK: Using gym stats endpoint');
        return await this.getGymStats();
      }
      
      throw error;
    }
  }

  // ================================
  // 🏋️ SERVICIOS DEL GIMNASIO - CRUD COMPLETO
  // ================================
  
  // OBTENER TODOS LOS SERVICIOS (incluye activos e inactivos)
  async getGymServices() {
    console.log('🏋️ FETCHING ALL GYM SERVICES...');
    try {
      // ✅ RUTA CORREGIDA: /services (no /gym/services)
      const result = await this.get('/services');
      console.log('✅ ALL SERVICES RECEIVED:', result);
      
      if (result && result.data) {
        console.log('🏋️ Services structure:', {
          isArray: Array.isArray(result.data),
          count: Array.isArray(result.data) ? result.data.length : 0,
          activeCount: Array.isArray(result.data) ? 
            result.data.filter(s => s.isActive !== false).length : 0,
          inactiveCount: Array.isArray(result.data) ? 
            result.data.filter(s => s.isActive === false).length : 0,
          sample: Array.isArray(result.data) && result.data[0] ? {
            id: result.data[0].id,
            title: result.data[0].title,
            hasIconName: !!result.data[0].iconName,
            hasFeatures: Array.isArray(result.data[0].features),
            featuresCount: result.data[0].features?.length || 0,
            hasDisplayOrder: result.data[0].displayOrder !== undefined,
            isActive: result.data[0].isActive
          } : null
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ ALL SERVICES FAILED:', error.message);
      throw error;
    }
  }

  // OBTENER SOLO SERVICIOS ACTIVOS (para página pública)
  async getActiveServices() {
    console.log('🏋️ FETCHING ACTIVE SERVICES (PUBLIC)...');
    try {
      // ✅ RUTA CORREGIDA: /services/active (no /gym/services/active)
      const result = await this.get('/services/active');
      console.log('✅ ACTIVE SERVICES RECEIVED:', result);
      
      if (result && result.data) {
        console.log(`🏋️ Found ${result.data.length} active services`);
      }
      
      return result;
    } catch (error) {
      console.log('❌ ACTIVE SERVICES FAILED:', error.message);
      
      // Fallback: Obtener todos y filtrar activos
      if (error.response?.status === 404) {
        console.log('🏋️ FALLBACK: Getting all services and filtering active');
        const allServices = await this.getGymServices();
        
        if (allServices && allServices.data) {
          const activeServices = allServices.data.filter(s => s.isActive !== false);
          return {
            success: true,
            data: activeServices
          };
        }
      }
      
      throw error;
    }
  }

  // OBTENER SERVICIO POR ID
  async getServiceById(serviceId) {
    console.log(`🏋️ FETCHING SERVICE BY ID: ${serviceId}...`);
    try {
      // ✅ RUTA CORREGIDA: /services/:id (no /gym/services/:id)
      const result = await this.get(`/services/${serviceId}`);
      console.log('✅ SERVICE RECEIVED:', result);
      
      if (result && result.data) {
        console.log('🏋️ Service details:', {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description?.substring(0, 50) + '...',
          iconName: result.data.iconName,
          featuresCount: result.data.features?.length || 0,
          displayOrder: result.data.displayOrder,
          isActive: result.data.isActive
        });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ GET SERVICE ${serviceId} FAILED:`, error.message);
      throw error;
    }
  }

  // CREAR NUEVO SERVICIO
  async createService(serviceData) {
    console.log('💾 CREATING NEW SERVICE...');
    console.log('📤 Service data:', serviceData);
    
    try {
      // Validar datos requeridos
      if (!serviceData.title || !serviceData.title.trim()) {
        throw new Error('El título del servicio es obligatorio');
      }
      
      // Formatear datos para el backend según el test
      const requestData = {
        title: serviceData.title.trim(),
        description: serviceData.description || '',
        iconName: serviceData.iconName || 'dumbbell',
        imageUrl: serviceData.imageUrl || null,
        features: Array.isArray(serviceData.features) ? serviceData.features : [],
        displayOrder: serviceData.displayOrder || null, // Backend calculará si es null
        isActive: serviceData.isActive !== false // default true
      };
      
      console.log('📤 Request data formatted:', requestData);
      
      // ✅ RUTA CORREGIDA: /services (no /gym/services)
      const result = await this.post('/services', requestData);
      
      console.log('✅ SERVICE CREATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Servicio creado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ CREATE SERVICE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación: Verifica los datos del servicio');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Ya existe un servicio con ese título');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para crear servicios');
      } else {
        toast.error(error.message || 'Error al crear servicio');
      }
      
      throw error;
    }
  }

  // ACTUALIZAR SERVICIO EXISTENTE
  async updateService(serviceId, serviceData) {
    console.log(`💾 UPDATING SERVICE: ${serviceId}...`);
    console.log('📤 Update data:', serviceData);
    
    try {
      // Formatear datos para el backend
      const requestData = {};
      
      if (serviceData.title !== undefined) requestData.title = serviceData.title.trim();
      if (serviceData.description !== undefined) requestData.description = serviceData.description;
      if (serviceData.iconName !== undefined) requestData.iconName = serviceData.iconName;
      if (serviceData.imageUrl !== undefined) requestData.imageUrl = serviceData.imageUrl;
      if (serviceData.features !== undefined) requestData.features = Array.isArray(serviceData.features) ? serviceData.features : [];
      if (serviceData.displayOrder !== undefined) requestData.displayOrder = serviceData.displayOrder;
      if (serviceData.isActive !== undefined) requestData.isActive = serviceData.isActive;
      
      console.log('📤 Request data formatted:', requestData);
      
      // ✅ RUTA CORREGIDA: /services/:id (no /gym/services/:id)
      const result = await this.put(`/services/${serviceId}`, requestData);
      
      console.log('✅ SERVICE UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Servicio actualizado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE SERVICE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación en actualización de servicio');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Ya existe un servicio con ese título');
      } else if (error.response?.status === 404) {
        toast.error('Servicio no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para actualizar servicios');
      } else {
        toast.error('Error al actualizar servicio');
      }
      
      throw error;
    }
  }

  // ELIMINAR SERVICIO
  async deleteService(serviceId) {
    console.log(`🗑️ DELETING SERVICE: ${serviceId}...`);
    
    try {
      // ✅ RUTA CORREGIDA: /services/:id (no /gym/services/:id)
      const result = await this.delete(`/services/${serviceId}`);
      
      console.log('✅ SERVICE DELETED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Servicio eliminado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ DELETE SERVICE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Servicio no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para eliminar servicios');
      } else {
        toast.error('Error al eliminar servicio');
      }
      
      throw error;
    }
  }

  // ACTIVAR/DESACTIVAR SERVICIO (TOGGLE)
  async toggleService(serviceId) {
    console.log(`🔄 TOGGLING SERVICE: ${serviceId}...`);
    
    try {
      // ✅ RUTA CORREGIDA: /services/:id/toggle (no /gym/services/:id/toggle)
      const result = await this.patch(`/services/${serviceId}/toggle`, {});
      
      console.log('✅ SERVICE TOGGLED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        const status = result.data?.isActive ? 'activado' : 'desactivado';
        toast.success(`Servicio ${status} exitosamente`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ TOGGLE SERVICE FAILED for ${serviceId}:`, error.message);
      
      if (error.response?.status === 404) {
        toast.error('Servicio no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para cambiar estado de servicios');
      } else {
        toast.error('Error al cambiar estado del servicio');
      }
      
      throw error;
    }
  }

  // DUPLICAR SERVICIO
  async duplicateService(serviceId) {
    console.log(`📋 DUPLICATING SERVICE: ${serviceId}...`);
    
    try {
      // ✅ RUTA CORREGIDA: /services/:id/duplicate (no /gym/services/:id/duplicate)
      const result = await this.post(`/services/${serviceId}/duplicate`, {});
      
      console.log('✅ SERVICE DUPLICATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Servicio duplicado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.log('❌ DUPLICATE SERVICE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Servicio no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para duplicar servicios');
      } else {
        toast.error('Error al duplicar servicio');
      }
      
      throw error;
    }
  }

  // CREAR SERVICIOS POR DEFECTO (SEED)
  async seedDefaultServices() {
    console.log('🌱 SEEDING DEFAULT SERVICES...');
    
    try {
      // ✅ RUTA CORREGIDA: /services/seed/defaults (no /gym/services/seed)
      const result = await this.post('/services/seed/defaults', {});
      
      console.log('✅ DEFAULT SERVICES SEEDED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        const count = result.data?.length || 0;
        toast.success(`${count} servicios por defecto creados exitosamente`);
      }
      
      return result;
    } catch (error) {
      console.log('❌ SEED DEFAULT SERVICES FAILED:', error.message);
      
      if (error.response?.status === 403) {
        toast.error('Sin permisos para crear servicios por defecto');
      } else {
        toast.error('Error al crear servicios por defecto');
      }
      
      throw error;
    }
  }

  // REORDENAR SERVICIOS
  async reorderServices(orderData) {
    console.log('🔢 REORDERING SERVICES...');
    console.log('📤 Order data:', orderData);
    
    try {
      // ✅ RUTA CORREGIDA: /services/reorder (no /gym/services/reorder)
      // orderData debe ser un array de { id, displayOrder }
      const result = await this.put('/services/reorder', { services: orderData });
      
      console.log('✅ SERVICES REORDERED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        toast.success(result.message || 'Orden de servicios actualizado');
      }
      
      return result;
    } catch (error) {
      console.log('❌ REORDER SERVICES FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación al reordenar servicios');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para reordenar servicios');
      } else {
        toast.error('Error al reordenar servicios');
      }
      
      throw error;
    }
  }

  // OBTENER ESTADÍSTICAS DE SERVICIOS
  async getServicesStats() {
    console.log('📊 FETCHING SERVICES STATS...');
    
    try {
      // ✅ RUTA CORREGIDA: /services/stats (no /gym/services/stats)
      const result = await this.get('/services/stats');
      
      console.log('✅ SERVICES STATS RECEIVED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ SERVICES STATS FAILED:', error.message);
      throw error;
    }
  }

  // ACTUALIZAR SERVICIOS (LEGACY - mantener compatibilidad)
  async updateServices(services) {
    console.log('💾 UPDATING SERVICES (LEGACY METHOD)...');
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
  
  // OBTENER CONFIGURACIÓN COMPLETA PARA CONTENTEDITOR
  async getGymConfigEditor() {
    console.log('📝 FETCHING GYM CONFIG FOR CONTENT EDITOR...');
    
    try {
      const result = await this.get('/gym/config/editor');
      console.log('✅ GYM CONFIG EDITOR RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG EDITOR FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📝 CONFIG EDITOR: Endpoint not found - using fallback to regular config');
        return await this.getGymConfig();
      }
      
      throw error;
    }
  }
  
  // GUARDAR HORARIOS FLEXIBLES (mantener para compatibilidad)
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
  
  // OBTENER MÉTRICAS DE CAPACIDAD (mantener para compatibilidad)
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
  
  // GUARDAR CONFIGURACIÓN POR SECCIONES (mantener para compatibilidad)
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
GYM SERVICE COMPLETO - SIN PERDER NINGUNA FUNCIÓN
=============================================================================

✅ ARCHIVO 100% COMPLETO CON TODAS LAS FUNCIONES ORIGINALES

🔧 ÚNICO CAMBIO: Rutas de servicios corregidas
- /gym/services/* → /services/*

📋 TODAS LAS FUNCIONES INCLUIDAS:

🏢 CONFIGURACIÓN:
- getGymConfig()
- updateGymConfig()

📞 CONTACTO:
- getContactInfo()
- updateContactInfo()

📱 REDES SOCIALES:
- getSocialMedia()
- getAllSocialMedia()
- getSocialMediaPlatform()
- saveSocialMedia()
- toggleSocialMedia()

📊 ESTADÍSTICAS:
- getGymStats()
- getActiveStatistics()

🏋️ SERVICIOS (RUTAS CORREGIDAS):
- getGymServices()          → /services
- getActiveServices()       → /services/active
- getServiceById()          → /services/:id
- createService()           → /services
- updateService()           → /services/:id
- deleteService()           → /services/:id
- toggleService()           → /services/:id/toggle
- duplicateService()        → /services/:id/duplicate
- seedDefaultServices()     → /services/seed/defaults
- reorderServices()         → /services/reorder
- getServicesStats()        → /services/stats
- updateServices() (legacy)

💳 MEMBRESÍAS:
- getMembershipPlans()
- updateMembershipPlans()

💬 TESTIMONIOS:
- getTestimonials()

🎬 MULTIMEDIA:
- getGymVideo()

📄 CONTENIDO:
- getSectionsContent()
- getNavigation()
- getPromotions()
- getBranding()
- getLandingContent()

🔧 ADMINISTRACIÓN:
- initializeGymData()

🆕 HORARIOS FLEXIBLES:
- getGymConfigEditor()
- saveFlexibleSchedule()
- getCapacityMetrics()
- saveGymConfigSection()

✅ TODO EL LOGGING DETALLADO MANTENIDO
✅ TODOS LOS TOASTS MANTENIDOS
✅ TODO EL MANEJO DE ERRORES MANTENIDO
✅ TODOS LOS COMENTARIOS MANTENIDOS
✅ TODA LA LÓGICA DE MAPEO MANTENIDA

Este archivo está listo para producción.
=============================================================================
*/