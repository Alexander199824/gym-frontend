// src/services/testimonialService.js
// SERVICIO DE GESTIÓN DE TESTIMONIOS

import { BaseService } from './baseService.js';
import toast from 'react-hot-toast';

class TestimonialService extends BaseService {
  
  // ================================
  // 📋 MÉTODOS DE LECTURA
  // ================================
  
  /**
   * Obtener todos los testimonios (admin)
   */
  async getAllTestimonials(params = {}) {
    console.log('💬 TestimonialService: Getting all testimonials (admin)...');
    console.log('📋 Params:', params);
    
    try {
      const response = await this.get('/testimonials/all', { params });
      
      console.log('✅ Testimonials fetched:', {
        total: response.data?.length || 0,
        pagination: response.pagination
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching testimonials:', error);
      toast.error('Error al cargar testimonios');
      throw error;
    }
  }
  
  /**
   * Obtener testimonios públicos/activos
   */
  async getPublicTestimonials() {
    console.log('💬 TestimonialService: Getting public testimonials...');
    
    try {
      const response = await this.get('/testimonials');
      console.log('✅ Public testimonials fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching public testimonials:', error);
      throw error;
    }
  }
  
  /**
   * Obtener testimonios pendientes
   */
  async getPendingTestimonials() {
    console.log('💬 TestimonialService: Getting pending testimonials...');
    
    try {
      const response = await this.get('/testimonials/pending');
      console.log('✅ Pending testimonials fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching pending testimonials:', error);
      toast.error('Error al cargar testimonios pendientes');
      throw error;
    }
  }
  
  /**
   * Obtener testimonios del usuario autenticado
   */
  async getMyTestimonials() {
    console.log('💬 TestimonialService: Getting my testimonials...');
    
    try {
      const response = await this.get('/testimonials/my-testimonials');
      console.log('✅ My testimonials fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching my testimonials:', error);
      toast.error('Error al cargar tus testimonios');
      throw error;
    }
  }
  
  /**
   * Obtener detalles de un testimonio específico
   */
  async getTestimonialDetails(testimonialId) {
    console.log('💬 TestimonialService: Getting testimonial details:', testimonialId);
    
    try {
      const response = await this.get(`/testimonials/${testimonialId}/details`);
      console.log('✅ Testimonial details fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching testimonial details:', error);
      toast.error('Error al cargar detalles del testimonio');
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de testimonios
   */
  async getTestimonialStats() {
    console.log('💬 TestimonialService: Getting testimonial stats...');
    
    try {
      const response = await this.get('/testimonials/stats');
      console.log('✅ Testimonial stats fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching testimonial stats:', error);
      toast.error('Error al cargar estadísticas');
      throw error;
    }
  }
  
  // ================================
  // ✍️ MÉTODOS DE CREACIÓN
  // ================================
  
  /**
   * Crear testimonio desde cliente
   */
  async createTestimonial(testimonialData) {
    console.log('💬 TestimonialService: Creating testimonial (client)...');
    console.log('📤 Data:', testimonialData);
    
    try {
      const response = await this.post('/testimonials', testimonialData);
      
      if (response.success) {
        console.log('✅ Testimonial created successfully:', response);
        toast.success(response.message || 'Testimonio enviado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creating testimonial:', error);
      
      const errorMsg = error.response?.data?.message || 'Error al crear testimonio';
      toast.error(errorMsg);
      
      throw error;
    }
  }
  
  /**
   * Crear testimonio desde admin
   */
  async createTestimonialAdmin(testimonialData) {
    console.log('💬 TestimonialService: Creating testimonial (admin)...');
    console.log('📤 Data:', testimonialData);
    
    try {
      const response = await this.post('/testimonials/admin/create', testimonialData);
      
      if (response.success) {
        console.log('✅ Admin testimonial created successfully:', response);
        toast.success('Testimonio creado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creating admin testimonial:', error);
      
      const errorMsg = error.response?.data?.message || 'Error al crear testimonio';
      toast.error(errorMsg);
      
      throw error;
    }
  }
  
  // ================================
  // ✏️ MÉTODOS DE ACTUALIZACIÓN
  // ================================
  
  /**
   * Actualizar testimonio
   */
  async updateTestimonial(testimonialId, updates) {
    console.log('💬 TestimonialService: Updating testimonial:', testimonialId);
    console.log('📤 Updates:', updates);
    
    try {
      const response = await this.put(`/testimonials/${testimonialId}`, updates);
      
      if (response.success) {
        console.log('✅ Testimonial updated successfully');
        toast.success('Testimonio actualizado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error updating testimonial:', error);
      
      const errorMsg = error.response?.data?.message || 'Error al actualizar testimonio';
      toast.error(errorMsg);
      
      throw error;
    }
  }
  
  /**
   * Aprobar testimonio pendiente
   */
  async approveTestimonial(testimonialId, approvalData = {}) {
    console.log('💬 TestimonialService: Approving testimonial:', testimonialId);
    console.log('📤 Approval data:', approvalData);
    
    try {
      const response = await this.post(`/testimonials/${testimonialId}/approve`, approvalData);
      
      if (response.success) {
        console.log('✅ Testimonial approved successfully');
        toast.success('Testimonio aprobado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error approving testimonial:', error);
      
      const errorMsg = error.response?.data?.message || 'Error al aprobar testimonio';
      toast.error(errorMsg);
      
      throw error;
    }
  }
  
  /**
   * Toggle estado activo del testimonio
   */
  async toggleActive(testimonialId) {
    console.log('💬 TestimonialService: Toggling active status:', testimonialId);
    
    try {
      const response = await this.patch(`/testimonials/${testimonialId}/toggle-active`, {});
      
      if (response.success) {
        console.log('✅ Testimonial status toggled');
        toast.success(response.message || 'Estado actualizado');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error toggling testimonial status:', error);
      toast.error('Error al cambiar estado');
      throw error;
    }
  }
  
  /**
   * Toggle estado destacado del testimonio
   */
  async toggleFeatured(testimonialId) {
    console.log('💬 TestimonialService: Toggling featured status:', testimonialId);
    
    try {
      const response = await this.patch(`/testimonials/${testimonialId}/toggle-featured`, {});
      
      if (response.success) {
        console.log('✅ Testimonial featured status toggled');
        toast.success(response.message || 'Estado de destacado actualizado');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error toggling featured status:', error);
      toast.error('Error al cambiar destacado');
      throw error;
    }
  }
  
  // ================================
  // 🗑️ MÉTODOS DE ELIMINACIÓN
  // ================================
  
  /**
   * Eliminar testimonio
   */
  async deleteTestimonial(testimonialId) {
    console.log('💬 TestimonialService: Deleting testimonial:', testimonialId);
    
    try {
      const response = await this.delete(`/testimonials/${testimonialId}`);
      
      if (response.success) {
        console.log('✅ Testimonial deleted successfully');
        toast.success('Testimonio eliminado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error deleting testimonial:', error);
      
      const errorMsg = error.response?.data?.message || 'Error al eliminar testimonio';
      toast.error(errorMsg);
      
      throw error;
    }
  }
  
  // ================================
  // 🔧 VALIDACIONES Y UTILIDADES
  // ================================
  
  /**
   * Validar datos de testimonio
   */
  validateTestimonialData(testimonialData) {
    const errors = {};
    
    // Validar texto
    if (!testimonialData.text || !testimonialData.text.trim()) {
      errors.text = 'El texto del testimonio es obligatorio';
    } else if (testimonialData.text.trim().length < 10) {
      errors.text = 'El testimonio debe tener al menos 10 caracteres';
    } else if (testimonialData.text.length > 500) {
      errors.text = 'El testimonio no puede superar los 500 caracteres';
    }
    
    // Validar rating
    if (!testimonialData.rating) {
      errors.rating = 'La calificación es obligatoria';
    } else if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      errors.rating = 'La calificación debe estar entre 1 y 5';
    }
    
    // Validar rol (para clientes)
    if (!testimonialData.name && !testimonialData.role) {
      errors.role = 'La profesión/rol es obligatoria';
    }
    
    // Validar nombre (para admin)
    if (testimonialData.name !== undefined && !testimonialData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  /**
   * Formatear datos de testimonio para API
   */
  formatTestimonialDataForAPI(testimonialData) {
    const formatted = {
      text: testimonialData.text?.trim(),
      rating: parseInt(testimonialData.rating),
      role: testimonialData.role?.trim()
    };
    
    // Campos opcionales para admin
    if (testimonialData.name !== undefined) {
      formatted.name = testimonialData.name.trim();
    }
    
    if (testimonialData.isFeatured !== undefined) {
      formatted.isFeatured = Boolean(testimonialData.isFeatured);
    }
    
    if (testimonialData.isActive !== undefined) {
      formatted.isActive = Boolean(testimonialData.isActive);
    }
    
    if (testimonialData.displayOrder !== undefined) {
      formatted.displayOrder = parseInt(testimonialData.displayOrder) || 0;
    }
    
    if (testimonialData.imageUrl) {
      formatted.imageUrl = testimonialData.imageUrl.trim();
    }
    
    return formatted;
  }
  
  /**
   * Sanitizar fecha para evitar errores de formateo
   */
  sanitizeDate(date) {
    if (!date) return null;
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate.toISOString();
    } catch (error) {
      console.warn('Invalid date format:', date);
      return null;
    }
  }
  
  /**
   * Health check del servicio
   */
  async healthCheck() {
    try {
      console.log('🏥 TestimonialService: Running health check...');
      
      const response = await this.get('/testimonials/health');
      
      return {
        healthy: true,
        message: 'Testimonial service is operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Testimonial service is not available',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new TestimonialService();