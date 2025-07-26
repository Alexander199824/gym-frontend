// src/services/gymContentService.js
// FUNCIÓN: Servicio para manejar contenido dinámico del gimnasio SOLO desde backend
// CONECTA CON: Backend API /api/gym/content (SIN fallbacks hardcodeados)

// ✅ IMPORTACIÓN CORREGIDA - default export en lugar de named export
import apiService from './apiService';

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
      
      // Si el backend no tiene datos, retornar estructura con mensaje "Not Found"
      return {
        status: 'not_found',
        message: 'Contenido no encontrado en el servidor',
        data: null
      };
      
    } catch (error) {
      console.error('Error fetching gym content:', error);
      
      // Si hay error de conexión, retornar estructura con error
      return {
        status: 'error',
        message: 'Error de conexión con el servidor',
        error: error.message,
        data: null
      };
    }
  }

  // 🔍 Obtener contenido de una sección específica SOLO desde backend
  async getSectionContent(section) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${section}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Si no hay datos para la sección, retornar estructura con mensaje "Not Found"
      return {
        status: 'not_found',
        message: `Contenido de la sección "${section}" no encontrado`,
        section,
        data: null
      };
      
    } catch (error) {
      console.error(`Error fetching ${section} content:`, error);
      
      // Si hay error, retornar estructura con error
      return {
        status: 'error',
        message: `Error al obtener contenido de la sección "${section}"`,
        section,
        error: error.message,
        data: null
      };
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
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Si no hay estadísticas en backend, retornar estructura con mensaje "Not Found"
      return {
        status: 'not_found',
        message: 'Estadísticas de contenido no encontradas',
        data: null
      };
      
    } catch (error) {
      console.error('Error fetching content stats:', error);
      
      // Si hay error, retornar estructura con error
      return {
        status: 'error',
        message: 'Error al obtener estadísticas de contenido',
        error: error.message,
        data: null
      };
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

  // 🛠️ MÉTODOS UTILITARIOS PARA MANEJAR ESTADOS

  // Verificar si la respuesta es "not found"
  isNotFound(response) {
    return response && response.status === 'not_found';
  }

  // Verificar si la respuesta tiene error
  hasError(response) {
    return response && response.status === 'error';
  }

  // Obtener mensaje de estado apropiado
  getStatusMessage(response) {
    if (this.isNotFound(response)) {
      return response.message || 'Contenido no encontrado';
    }
    
    if (this.hasError(response)) {
      return response.message || 'Error al cargar contenido';
    }
    
    return 'Contenido cargado exitosamente';
  }

  // Obtener datos o fallback
  getDataOrFallback(response, fallback = null) {
    if (response && response.data) {
      return response.data;
    }
    
    return fallback;
  }

  // Generar estructura de contenido vacío para mostrar "Not Found"
  createNotFoundResponse(section = 'general', customMessage = null) {
    return {
      status: 'not_found',
      message: customMessage || `Contenido de ${section} no disponible`,
      section,
      data: null,
      timestamp: Date.now()
    };
  }

  // Generar estructura de error
  createErrorResponse(section = 'general', error = 'Error desconocido') {
    return {
      status: 'error',
      message: `Error al cargar ${section}`,
      section,
      error,
      data: null,
      timestamp: Date.now()
    };
  }
}

// Exportar instancia única del servicio
export const gymContentService = new GymContentService();
export default gymContentService;