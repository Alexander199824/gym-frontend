// src/services/gymContentService.js
// FUNCIÓN: Servicio para manejar contenido dinámico del gimnasio SOLO desde backend
// CONECTA CON: Backend API /api/gym/content (SIN fallbacks hardcodeados)

import { apiService } from './apiService';

class GymContentService {
  constructor() {
    this.baseUrl = '/api/gym/content';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // 🔍 Obtener todo el contenido del gimnasio SOLO desde backend
  async getGymContent() {
    try {
      // Verificar cache
      const cacheKey = 'gym_content_all';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Hacer petición al backend
      const response = await apiService.get(this.baseUrl);
      
      if (response.success && response.data) {
        // Guardar en cache
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        
        return response.data;
      }
      
      // Si no hay datos en el backend, retornar null
      return null;
      
    } catch (error) {
      console.error('Error fetching gym content:', error);
      throw error;
    }
  }

  // 🔍 Obtener contenido de una sección específica SOLO desde backend
  async getSectionContent(section) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${section}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Si no hay datos, retornar null
      return null;
      
    } catch (error) {
      console.error(`Error fetching ${section} content:`, error);
      throw error;
    }
  }

  // ✏️ Actualizar contenido de una sección
  async updateSection(section, data) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${section}`, data);
      
      if (response.success) {
        // Limpiar cache
        this.clearCache();
        return response.data;
      }
      
      throw new Error('Failed to update content');
      
    } catch (error) {
      console.error(`Error updating ${section} content:`, error);
      throw error;
    }
  }

  // ✏️ Actualizar todo el contenido
  async updateAllContent(content) {
    try {
      const response = await apiService.put(this.baseUrl, content);
      
      if (response.success) {
        // Limpiar cache
        this.clearCache();
        return response.data;
      }
      
      throw new Error('Failed to update content');
      
    } catch (error) {
      console.error('Error updating all content:', error);
      throw error;
    }
  }

  // 🗑️ Limpiar cache
  clearCache() {
    this.cache.clear();
  }

  // 🔍 Verificar si el contenido está disponible en el backend
  async isContentAvailable() {
    try {
      const response = await apiService.get(`${this.baseUrl}/health`);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // 📊 Obtener estadísticas de contenido desde backend
  async getContentStats() {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats`);
      
      if (response.success) {
        return response.data;
      }
      
      // Si no hay stats en backend, retornar null
      return null;
      
    } catch (error) {
      console.error('Error fetching content stats:', error);
      throw error;
    }
  }

  // 🔄 Crear contenido inicial en el backend
  async createInitialContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/initialize`);
      
      if (response.success) {
        this.clearCache();
        return response.data;
      }
      
      throw new Error('Failed to create initial content');
      
    } catch (error) {
      console.error('Error creating initial content:', error);
      throw error;
    }
  }

  // 🔄 Reiniciar contenido en el backend
  async resetContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/reset`);
      
      if (response.success) {
        this.clearCache();
        return response.data;
      }
      
      throw new Error('Failed to reset content');
      
    } catch (error) {
      console.error('Error resetting content:', error);
      throw error;
    }
  }
}

// Exportar instancia única del servicio
export const gymContentService = new GymContentService();
export default gymContentService;