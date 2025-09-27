// src/services/subBrandService.js
// SUB-SERVICIO PARA GESTIÓN DE MARCAS

import toast from 'react-hot-toast';

export class SubBrandService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 🏷️ MÉTODOS DE GESTIÓN DE MARCAS
  // ================================

  // Listar marcas
  async getBrands(params = {}) {
    console.log('🏷️ SubBrandService: Getting brands...', params);
    
    try {
      const response = await this.baseService.get('/api/store/management/brands', { params });
      console.log('✅ Brands response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting brands:', error);
      throw error;
    }
  }

  // ✅ CREAR MARCA SIN UPLOAD (JSON TRADICIONAL)
  async createBrand(brandData) {
    console.log('🏷️ SubBrandService: Creating brand...', brandData);
    
    try {
      this.validateBrandData(brandData);
      
      const response = await this.baseService.post('/api/store/management/brands', brandData);
      
      if (response.success) {
        console.log('✅ Brand created successfully:', response.data?.brand);
        toast.success('Marca creada exitosamente');
        this.baseService.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating brand:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear marca';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ CREAR MARCA CON UPLOAD DE LOGO (FORMDATA)
  async createBrandWithUpload(formData) {
    console.log('🏷️ SubBrandService: Creating brand with upload...');
    
    try {
      const response = await this.baseService.post('/api/store/management/brands', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Brand created with upload successfully:', response.data?.brand);
        
        if (response.data?.uploadInfo?.uploadedToCloudinary) {
          toast.success(`Marca creada con logo subido a Cloudinary`);
        } else {
          toast.success('Marca creada exitosamente');
        }
        
        this.baseService.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating brand with upload:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear marca con logo';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ ACTUALIZAR MARCA SIN UPLOAD (JSON TRADICIONAL)
  async updateBrand(brandId, brandData) {
    console.log('🏷️ SubBrandService: Updating brand...', { brandId, brandData });
    
    try {
      const response = await this.baseService.put(`/api/store/management/brands/${brandId}`, brandData);
      
      if (response.success) {
        console.log('✅ Brand updated successfully');
        toast.success('Marca actualizada exitosamente');
        this.baseService.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating brand:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar marca';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ ACTUALIZAR MARCA CON UPLOAD DE LOGO (FORMDATA)
  async updateBrandWithUpload(brandId, formData) {
    console.log('🏷️ SubBrandService: Updating brand with upload...', { brandId });
    
    try {
      const response = await this.baseService.put(`/api/store/management/brands/${brandId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Brand updated with upload successfully');
        
        if (response.data?.uploadInfo?.uploadedToCloudinary) {
          const message = response.data.uploadInfo.replacedPreviousLogo 
            ? 'Marca actualizada con nuevo logo (anterior eliminado)'
            : 'Marca actualizada con logo subido a Cloudinary';
          toast.success(message);
        } else {
          toast.success('Marca actualizada exitosamente');
        }
        
        this.baseService.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating brand with upload:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar marca con logo';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Eliminar marca
  async deleteBrand(brandId) {
    console.log('🏷️ SubBrandService: Deleting brand...', { brandId });
    
    try {
      const response = await this.baseService.delete(`/api/store/management/brands/${brandId}`);
      
      if (response.success) {
        console.log('✅ Brand deleted successfully');
        toast.success('Marca eliminada exitosamente');
        this.baseService.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error deleting brand:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar marca';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Buscar marcas (autocomplete)
  async searchBrands(query) {
    console.log('🏷️ SubBrandService: Searching brands...', { query });
    
    try {
      const response = await this.baseService.get('/api/store/management/brands/search', {
        params: { q: query }
      });
      console.log('✅ Brand search response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error searching brands:', error);
      throw error;
    }
  }

  // Estadísticas de marcas
  async getBrandStats() {
    console.log('📊 SubBrandService: Getting brand stats...');
    
    try {
      const response = await this.baseService.get('/api/store/management/brands/stats');
      console.log('✅ Brand stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting brand stats:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 VALIDACIONES ESPECÍFICAS
  // ================================

  validateBrandData(brandData) {
    const errors = [];
    
    if (!brandData.name || brandData.name.trim().length < 2) {
      errors.push('El nombre de la marca debe tener al menos 2 caracteres');
    }
    
    if (brandData.description && brandData.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
    
    if (brandData.website && brandData.website.trim()) {
      try {
        new URL(brandData.website.trim());
      } catch {
        errors.push('La URL del sitio web debe ser válida');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return true;
  }
}