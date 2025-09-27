// src/services/subProductService.js
// SUB-SERVICIO PARA GESTIÓN DE PRODUCTOS

import toast from 'react-hot-toast';

export class SubProductService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 📦 MÉTODOS DE GESTIÓN DE PRODUCTOS
  // ================================

  // ✅ CREAR PRODUCTO CON IMAGEN (usando FormData)
  async createProductWithImage(formData) {
    console.log('📦 SubProductService: Creating product with image...');
    
    try {
      const response = await this.baseService.post('/api/store/management/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });
      
      if (response.success) {
        console.log('✅ Product with image created successfully:', response.data?.product);
        
        if (response.data?.uploadInfo?.uploadedToCloudinary) {
          toast.success(`Producto creado con imagen subida a Cloudinary`);
        } else {
          toast.success('Producto creado exitosamente');
        }
        
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating product with image:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear producto con imagen';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Listar productos con filtros
  async getProducts(params = {}) {
    console.log('📦 SubProductService: Getting products...', params);
    
    try {
      const response = await this.baseService.get('/api/store/management/products', { params });
      console.log('✅ Products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting products:', error);
      throw error;
    }
  }

  // Obtener producto específico
  async getProductById(productId) {
    console.log('📦 SubProductService: Getting product by ID...', { productId });
    
    try {
      const response = await this.baseService.get(`/api/store/management/products/${productId}`);
      console.log('✅ Product by ID response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product by ID:', error);
      throw error;
    }
  }

  // Crear nuevo producto (método original sin imagen)
  async createProduct(productData) {
    console.log('📦 SubProductService: Creating product...', productData);
    
    try {
      this.validateProductData(productData);
      
      const response = await this.baseService.post('/api/store/management/products', productData);
      
      if (response.success) {
        console.log('✅ Product created successfully:', response.data?.product);
        toast.success('Producto creado exitosamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating product:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear producto';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Actualizar producto
  async updateProduct(productId, productData) {
    console.log('📦 SubProductService: Updating product...', { productId, productData });
    
    try {
      const response = await this.baseService.put(`/api/store/management/products/${productId}`, productData);
      
      if (response.success) {
        console.log('✅ Product updated successfully:', response.data?.product);
        toast.success('Producto actualizado exitosamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating product:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar producto';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Actualizar stock de producto
  async updateProductStock(productId, stockData) {
    console.log('📦 SubProductService: Updating product stock...', { productId, stockData });
    
    try {
      const response = await this.baseService.put(`/api/store/management/products/${productId}/stock`, stockData);
      
      if (response.success) {
        console.log('✅ Product stock updated successfully');
        toast.success('Stock actualizado exitosamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating product stock:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar stock';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Actualización masiva de stock
  async updateBulkStock(updates) {
    console.log('📦 SubProductService: Bulk updating stock...', { updates });
    
    try {
      const response = await this.baseService.put('/api/store/management/products/bulk-stock', { updates });
      
      if (response.success) {
        console.log('✅ Bulk stock updated successfully');
        toast.success('Stock actualizado masivamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error bulk updating stock:', error);
      const errorMessage = error.response?.data?.message || 'Error en actualización masiva';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Eliminar producto
  async deleteProduct(productId) {
    console.log('📦 SubProductService: Deleting product...', { productId });
    
    try {
      const response = await this.baseService.delete(`/api/store/management/products/${productId}`);
      
      if (response.success) {
        console.log('✅ Product deleted successfully');
        toast.success('Producto eliminado exitosamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar producto';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Duplicar producto
  async duplicateProduct(productId, newData = {}) {
    console.log('📦 SubProductService: Duplicating product...', { productId, newData });
    
    try {
      const response = await this.baseService.post(`/api/store/management/products/${productId}/duplicate`, newData);
      
      if (response.success) {
        console.log('✅ Product duplicated successfully');
        toast.success('Producto duplicado exitosamente');
        this.baseService.invalidateProductsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error duplicating product:', error);
      const errorMessage = error.response?.data?.message || 'Error al duplicar producto';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Estadísticas de productos
  async getProductStats() {
    console.log('📊 SubProductService: Getting product stats...');
    
    try {
      const response = await this.baseService.get('/api/store/management/products/stats');
      console.log('✅ Product stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product stats:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 VALIDACIONES ESPECÍFICAS
  // ================================

  validateProductData(productData) {
    console.log('🔍 SubProductService: Validando datos de producto...');
    
    const errors = [];
    
    if (!productData.name || productData.name.trim().length < 2) {
      errors.push('El nombre del producto debe tener al menos 2 caracteres');
    }
    
    if (!productData.price || parseFloat(productData.price) <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }
    
    if (!productData.categoryId || parseInt(productData.categoryId) <= 0) {
      errors.push('Debe seleccionar una categoría válida');
    }
    
    if (productData.stockQuantity && parseInt(productData.stockQuantity) < 0) {
      errors.push('La cantidad de stock no puede ser negativa');
    }
    
    if (productData.minStock && parseInt(productData.minStock) < 0) {
      errors.push('El stock mínimo no puede ser negativo');
    }
    
    if (productData.weight && parseFloat(productData.weight) < 0) {
      errors.push('El peso no puede ser negativo');
    }
    
    if (productData.originalPrice && parseFloat(productData.originalPrice) < 0) {
      errors.push('El precio original no puede ser negativo');
    }
    
    if (productData.originalPrice && productData.price) {
      const original = parseFloat(productData.originalPrice);
      const current = parseFloat(productData.price);
      if (original > 0 && current > original) {
        errors.push('El precio actual no puede ser mayor al precio original');
      }
    }
    
    if (productData.sku && productData.sku.trim().length > 100) {
      errors.push('El SKU no puede exceder 100 caracteres');
    }
    
    if (productData.description && productData.description.length > 2000) {
      errors.push('La descripción no puede exceder 2000 caracteres');
    }
    
    if (errors.length > 0) {
      console.error('❌ SubProductService: Errores de validación:', errors);
      throw new Error(errors.join(', '));
    }
    
    console.log('✅ SubProductService: Validación exitosa');
    return true;
  }

  formatProductDataForAPI(productData) {
    console.log('🔧 SubProductService: Formateando datos para API...');
    
    if (!productData) {
      throw new Error('Datos de producto no proporcionados');
    }
    
    if (!productData.name || !productData.name.trim()) {
      throw new Error('El nombre del producto es requerido');
    }
    
    if (!productData.price || parseFloat(productData.price) <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }
    
    if (!productData.categoryId) {
      throw new Error('La categoría es requerida');
    }
    
    const formattedData = {
      name: String(productData.name).trim(),
      description: productData.description ? String(productData.description).trim() : '',
      price: parseFloat(productData.price) || 0,
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      sku: productData.sku ? String(productData.sku).trim() : '',
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      minStock: parseInt(productData.minStock) || 5,
      weight: productData.weight ? parseFloat(productData.weight) : null,
      dimensions: productData.dimensions || null,
      categoryId: parseInt(productData.categoryId) || null,
      brandId: productData.brandId ? parseInt(productData.brandId) : null,
      isFeatured: Boolean(productData.isFeatured),
      allowOnlinePayment: productData.allowOnlinePayment !== false,
      allowCardPayment: productData.allowCardPayment !== false,
      allowCashOnDelivery: productData.allowCashOnDelivery !== false,
      deliveryTime: productData.deliveryTime ? String(productData.deliveryTime).trim() : '1-3 días hábiles'
    };
    
    console.log('✅ SubProductService: Datos formateados:', formattedData);
    
    if (!formattedData.categoryId) {
      throw new Error('CategoryId no válido después del formateo');
    }
    
    return formattedData;
  }
}