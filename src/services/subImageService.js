// src/services/subImageService.js
// SUB-SERVICIO PARA GESTIÓN DE IMÁGENES

import toast from 'react-hot-toast';

export class SubImageService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 🖼️ MÉTODOS DE GESTIÓN DE IMÁGENES
  // ================================

  // Obtener imágenes de un producto
  async getProductImages(productId) {
    console.log('🖼️ SubImageService: Getting product images...', { productId });
    
    try {
      const response = await this.baseService.get(`/api/store/management/products/${productId}/images`);
      console.log('✅ Product images response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product images:', error);
      throw error;
    }
  }

  // Subir imagen individual
  async uploadProductImage(productId, imageFile, options = {}) {
    console.log('🖼️ SubImageService: Uploading product image...', { productId, options });
    
    try {
      this.baseService.validateImageFile(imageFile);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const params = new URLSearchParams();
      if (options.isPrimary) params.append('isPrimary', 'true');
      if (options.altText) params.append('altText', options.altText);
      if (options.displayOrder) params.append('displayOrder', options.displayOrder);
      
      const url = `/api/store/management/products/${productId}/images${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await this.baseService.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Product image uploaded successfully:', response.data?.image);
        toast.success('Imagen subida exitosamente');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error uploading product image:', error);
      const errorMessage = error.response?.data?.message || 'Error al subir imagen';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Subir múltiples imágenes
  async uploadMultipleProductImages(productId, imageFiles) {
    console.log('🖼️ SubImageService: Uploading multiple product images...', { productId, count: imageFiles.length });
    
    try {
      // Validar cada archivo
      imageFiles.forEach(file => this.baseService.validateImageFile(file));
      
      const formData = new FormData();
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      const response = await this.baseService.post(`/api/store/management/products/${productId}/images/multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Multiple images uploaded successfully');
        toast.success(`${imageFiles.length} imágenes subidas exitosamente`);
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error uploading multiple images:', error);
      const errorMessage = error.response?.data?.message || 'Error al subir imágenes';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Actualizar imagen
  async updateProductImage(productId, imageId, imageData) {
    console.log('🖼️ SubImageService: Updating product image...', { productId, imageId, imageData });
    
    try {
      const response = await this.baseService.put(`/api/store/management/products/${productId}/images/${imageId}`, imageData);
      
      if (response.success) {
        console.log('✅ Product image updated successfully');
        toast.success('Imagen actualizada exitosamente');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating product image:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar imagen';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Eliminar imagen
  async deleteProductImage(productId, imageId) {
    console.log('🖼️ SubImageService: Deleting product image...', { productId, imageId });
    
    try {
      const response = await this.baseService.delete(`/api/store/management/products/${productId}/images/${imageId}`);
      
      if (response.success) {
        console.log('✅ Product image deleted successfully');
        toast.success('Imagen eliminada exitosamente');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error deleting product image:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar imagen';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Reordenar imágenes
  async reorderProductImages(productId, imageOrders) {
    console.log('🖼️ SubImageService: Reordering product images...', { productId, imageOrders });
    
    try {
      const response = await this.baseService.put(`/api/store/management/products/${productId}/images/reorder`, { imageOrders });
      
      if (response.success) {
        console.log('✅ Product images reordered successfully');
        toast.success('Orden de imágenes actualizado');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error reordering product images:', error);
      const errorMessage = error.response?.data?.message || 'Error al reordenar imágenes';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Establecer imagen primaria
  async setPrimaryProductImage(productId, imageId) {
    console.log('🖼️ SubImageService: Setting primary product image...', { productId, imageId });
    
    try {
      const response = await this.baseService.put(`/api/store/management/products/${productId}/images/${imageId}/primary`);
      
      if (response.success) {
        console.log('✅ Primary image set successfully');
        toast.success('Imagen principal establecida');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error setting primary image:', error);
      const errorMessage = error.response?.data?.message || 'Error al establecer imagen principal';
      toast.error(errorMessage);
      throw error;
    }
  }
}