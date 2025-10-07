// src/services/statisticsService.js
// Autor: Alexander Echeverria
// FUNCIÓN: Servicio completo para gestión de estadísticas dinámicas
// ARCHIVO COMPLETO - Copiar y pegar directamente

import { BaseService } from './baseService.js';

class StatisticsService extends BaseService {
  constructor() {
    super();
    this.baseUrl = '/api/statistics';
    
    console.log('📊 StatisticsService inicializado');
  }

  // ================================
  // 📊 MÉTODOS PRINCIPALES
  // ================================

  /**
   * Obtener todas las estadísticas (admin)
   */
  async getAllStatistics() {
    try {
      console.log('📊 Obteniendo todas las estadísticas...');
      const response = await this.get(this.baseUrl);
      
      if (response.success) {
        console.log(`✅ ${response.data?.length || 0} estadísticas cargadas`);
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas activas (público)
   */
  async getActiveStatistics() {
    try {
      console.log('📊 Obteniendo estadísticas activas...');
      const response = await this.get(`${this.baseUrl}/active`);
      
      if (response.success) {
        console.log(`✅ ${response.data?.length || 0} estadísticas activas`);
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas activas:', error);
      throw error;
    }
  }

  /**
   * Crear nueva estadística
   */
  async createStatistic(statisticData) {
    try {
      console.log('➕ Creando estadística:', statisticData);
      
      // Formatear datos
      const formattedData = {
        statKey: statisticData.statKey?.trim(),
        statValue: parseInt(statisticData.statValue) || 0,
        label: statisticData.label?.trim(),
        iconName: statisticData.iconName?.trim() || 'TrendingUp',
        valueSuffix: statisticData.valueSuffix?.trim() || '+',
        colorScheme: statisticData.colorScheme?.trim() || 'primary',
        displayOrder: parseInt(statisticData.displayOrder) || 999,
        description: statisticData.description?.trim() || null,
        isActive: statisticData.isActive !== undefined ? statisticData.isActive : true
      };
      
      const response = await this.post(this.baseUrl, formattedData);
      
      if (response.success) {
        console.log('✅ Estadística creada:', response.data.id);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creando estadística:', error);
      throw error;
    }
  }

  /**
   * Actualizar estadística
   */
  async updateStatistic(id, updates) {
    try {
      console.log(`✏️ Actualizando estadística ${id}:`, updates);
      
      const response = await this.put(`${this.baseUrl}/${id}`, updates);
      
      if (response.success) {
        console.log('✅ Estadística actualizada');
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error actualizando estadística ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar estadística
   */
  async deleteStatistic(id) {
    try {
      console.log(`🗑️ Eliminando estadística ${id}...`);
      
      const response = await this.delete(`${this.baseUrl}/${id}`);
      
      if (response.success) {
        console.log('✅ Estadística eliminada');
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error eliminando estadística ${id}:`, error);
      throw error;
    }
  }

  /**
   * Activar/Desactivar estadística
   */
  async toggleStatistic(id) {
    try {
      console.log(`🔄 Cambiando estado de estadística ${id}...`);
      
      const response = await this.patch(`${this.baseUrl}/${id}/toggle`, {});
      
      if (response.success) {
        console.log('✅ Estado cambiado');
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error cambiando estado ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reordenar estadísticas
   */
  async reorderStatistics(orderData) {
    try {
      console.log('🔢 Reordenando estadísticas...', orderData);
      
      const response = await this.put(`${this.baseUrl}/reorder/batch`, {
        order: orderData
      });
      
      if (response.success) {
        console.log('✅ Estadísticas reordenadas');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error reordenando:', error);
      throw error;
    }
  }

  /**
   * Crear estadísticas por defecto
   */
  async seedDefaultStatistics() {
    try {
      console.log('🌱 Creando estadísticas por defecto...');
      
      const response = await this.post(`${this.baseUrl}/seed/defaults`, {});
      
      if (response.success) {
        console.log(`✅ ${response.data?.length || 0} estadísticas creadas`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creando defaults:', error);
      throw error;
    }
  }

  // ================================
  // 🎨 UTILIDADES
  // ================================

  /**
   * Obtener colores disponibles
   */
  getAvailableColors() {
    return [
      { value: 'primary', label: 'Primario', icon: '🔵' },
      { value: 'secondary', label: 'Secundario', icon: '🟣' },
      { value: 'success', label: 'Éxito', icon: '🟢' },
      { value: 'warning', label: 'Advertencia', icon: '🟡' },
      { value: 'danger', label: 'Peligro', icon: '🔴' },
      { value: 'info', label: 'Información', icon: '🔷' }
    ];
  }

  /**
   * Obtener iconos disponibles
   */
  getAvailableIcons() {
    return [
      'Users', 'Award', 'Trophy', 'Star', 'TrendingUp',
      'Heart', 'Dumbbell', 'Activity', 'Target', 'Calendar',
      'Clock', 'Zap', 'CheckCircle', 'DollarSign'
    ];
  }

  /**
   * Obtener sufijos comunes
   */
  getCommonSuffixes() {
    return ['+', '%', 'K', 'M', '★', ''];
  }

  /**
   * Generar key desde label
   */
  generateKey(label) {
    return label
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
  }

  /**
   * Validar datos básicos
   */
  validateStatisticData(data) {
    const errors = [];
    
    if (!data.statKey || data.statKey.trim() === '') {
      errors.push('Key es requerida');
    }
    
    if (data.statValue === undefined || data.statValue === null) {
      errors.push('Valor es requerido');
    }
    
    if (!data.label || data.label.trim() === '') {
      errors.push('Label es requerida');
    }
    
    if (data.statValue !== undefined && isNaN(data.statValue)) {
      errors.push('Valor debe ser un número');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Exportar instancia única
const statisticsService = new StatisticsService();
export default statisticsService;