// src/services/subCategoryService.js
// SUB-SERVICIO PARA GESTIÓN DE CATEGORÍAS

import toast from 'react-hot-toast';

export class SubCategoryService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 📂 MÉTODOS DE GESTIÓN DE CATEGORÍAS
  // ================================

  // Listar categorías
  async getCategories(params = {}) {
    console.log('📂 SubCategoryService: Getting categories...', params);
    
    try {
      const response = await this.baseService.get('/api/store/management/categories', { params });
      console.log('✅ Categories response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      throw error;
    }
  }

  // Crear categoría
  async createCategory(categoryData) {
    console.log('📂 SubCategoryService: Creating category...', categoryData);
    
    try {
      this.validateCategoryData(categoryData);
      
      const response = await this.baseService.post('/api/store/management/categories', categoryData);
      
      if (response.success) {
        console.log('✅ Category created successfully:', response.data?.category);
        toast.success('Categoría creada exitosamente');
        this.baseService.invalidateCategoriesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating category:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear categoría';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Actualizar categoría
  async updateCategory(categoryId, categoryData) {
    console.log('📂 SubCategoryService: Updating category...', { categoryId, categoryData });
    
    try {
      const response = await this.baseService.put(`/api/store/management/categories/${categoryId}`, categoryData);
      
      if (response.success) {
        console.log('✅ Category updated successfully');
        toast.success('Categoría actualizada exitosamente');
        this.baseService.invalidateCategoriesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating category:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar categoría';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Eliminar categoría
  async deleteCategory(categoryId) {
    console.log('📂 SubCategoryService: Deleting category...', { categoryId });
    
    try {
      const response = await this.baseService.delete(`/api/store/management/categories/${categoryId}`);
      
      if (response.success) {
        console.log('✅ Category deleted successfully');
        toast.success('Categoría eliminada exitosamente');
        this.baseService.invalidateCategoriesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar categoría';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Reordenar categorías
  async reorderCategories(categoryOrders) {
    console.log('📂 SubCategoryService: Reordering categories...', { categoryOrders });
    
    try {
      const response = await this.baseService.put('/api/store/management/categories/reorder', { categoryOrders });
      
      if (response.success) {
        console.log('✅ Categories reordered successfully');
        toast.success('Orden de categorías actualizado');
        this.baseService.invalidateCategoriesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error reordering categories:', error);
      const errorMessage = error.response?.data?.message || 'Error al reordenar categorías';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Buscar categorías
  async searchCategories(query) {
    console.log('📂 SubCategoryService: Searching categories...', { query });
    
    try {
      const response = await this.baseService.get('/api/store/management/categories/search', {
        params: { q: query }
      });
      console.log('✅ Category search response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error searching categories:', error);
      throw error;
    }
  }

  // Obtener categoría por slug
  async getCategoryBySlug(slug) {
    console.log('📂 SubCategoryService: Getting category by slug...', { slug });
    
    try {
      const response = await this.baseService.get(`/api/store/management/categories/slug/${slug}`);
      console.log('✅ Category by slug response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting category by slug:', error);
      throw error;
    }
  }

  // Estadísticas de categorías
  async getCategoryStats() {
    console.log('📊 SubCategoryService: Getting category stats...');
    
    try {
      const response = await this.baseService.get('/api/store/management/categories/stats');
      console.log('✅ Category stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting category stats:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 VALIDACIONES ESPECÍFICAS
  // ================================

  validateCategoryData(categoryData) {
    const errors = [];
    
    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.push('El nombre de la categoría debe tener al menos 2 caracteres');
    }
    
    if (categoryData.slug && categoryData.slug.trim()) {
      if (!/^[a-z0-9-]+$/.test(categoryData.slug.trim())) {
        errors.push('El slug solo puede contener letras minúsculas, números y guiones');
      }
    }
    
    if (categoryData.description && categoryData.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
    
    if (categoryData.displayOrder && categoryData.displayOrder < 0) {
      errors.push('El orden de visualización debe ser un número positivo');
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return true;
  }
}