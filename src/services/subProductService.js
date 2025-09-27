// src/services/subProductService.js
// SUB-SERVICIO PARA GESTIÓN DE PRODUCTOS - USANDO PATRÓN EXACTO DEL TEST

import toast from 'react-hot-toast';

export class SubProductService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 📦 MÉTODOS DE GESTIÓN DE PRODUCTOS - PATRÓN DEL TEST
  // ================================

  // ✅ CREAR PRODUCTO CON IMAGEN - EXACTAMENTE COMO EL TEST
  async createProductWithImage(formData) {
    console.log('📦 SubProductService: Creating product with image (test pattern)...');
    
    try {
      // ✅ PASO 1: EXTRAER DATOS DEL PRODUCTO DEL FORMDATA
      const productData = this.extractProductDataFromFormData(formData);
      const imageFile = formData.get('image');
      const isPrimary = formData.get('isPrimary') === 'true';
      const altText = formData.get('altText') || '';
      const displayOrder = formData.get('displayOrder') || '1';
      
      console.log('📋 Extracted product data:', productData);
      console.log('🖼️ Image file:', imageFile?.name);
      
      // ✅ PASO 2: CREAR PRODUCTO PRIMERO (IGUAL QUE EL TEST)
      console.log('📤 Creating product first...');
      const productResponse = await this.baseService.post('/api/store/management/products', productData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!productResponse.success) {
        throw new Error('Error creating product');
      }
      
      const createdProduct = productResponse.data.product;
      console.log('✅ Product created:', createdProduct);
      
      // ✅ PASO 3: SUBIR IMAGEN SI EXISTE (EXACTAMENTE COMO EL TEST)
      if (imageFile) {
        console.log('📤 Uploading image to product...');
        
        try {
          // ✅ CREAR FORMDATA PARA IMAGEN SOLAMENTE (COMO EN EL TEST)
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile, {
            filename: imageFile.name,
            contentType: this.getImageContentType(imageFile)
          });
          
          // ✅ USAR EXACTAMENTE LA MISMA URL DEL TEST
          const imageUploadUrl = `/api/store/management/products/${createdProduct.id}/images?isPrimary=${isPrimary}&altText=${encodeURIComponent(altText)}&displayOrder=${displayOrder}`;
          
          console.log('☁️ Uploading to Cloudinary via:', imageUploadUrl);
          
          const imageResponse = await this.baseService.post(imageUploadUrl, imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000 // 60 segundos como en el test
          });
          
          if (imageResponse.success) {
            console.log('✅ Image uploaded to Cloudinary:', imageResponse.data.image.imageUrl);
            
            // ✅ RETORNAR PRODUCTO CON INFO DE IMAGEN
            return {
              success: true,
              data: {
                product: createdProduct,
                image: imageResponse.data.image,
                uploadInfo: {
                  uploadedToCloudinary: true,
                  imageUrl: imageResponse.data.image.imageUrl
                }
              }
            };
          } else {
            console.log('⚠️ Product created but image upload failed');
            return {
              success: true,
              data: {
                product: createdProduct,
                uploadInfo: {
                  uploadedToCloudinary: false,
                  error: 'Image upload failed'
                }
              }
            };
          }
          
        } catch (imageError) {
          console.error('❌ Error uploading image:', imageError);
          // Producto ya fue creado, solo falló la imagen
          return {
            success: true,
            data: {
              product: createdProduct,
              uploadInfo: {
                uploadedToCloudinary: false,
                error: imageError.message
              }
            }
          };
        }
      }
      
      // ✅ PRODUCTO SIN IMAGEN
      return {
        success: true,
        data: {
          product: createdProduct,
          uploadInfo: {
            uploadedToCloudinary: false,
            reason: 'No image provided'
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Error in createProductWithImage:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear producto con imagen';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ FUNCIÓN AUXILIAR PARA EXTRAER DATOS DEL FORMDATA
  extractProductDataFromFormData(formData) {
    const productData = {};
    
    // ✅ EXTRAER TODOS LOS CAMPOS EXCEPTO LA IMAGEN
    for (let [key, value] of formData.entries()) {
      if (!['image', 'isPrimary', 'altText', 'displayOrder'].includes(key)) {
        if (key === 'dimensions') {
          try {
            productData[key] = JSON.parse(value);
          } catch (e) {
            productData[key] = null;
          }
        } else if (['price', 'originalPrice', 'weight'].includes(key)) {
          productData[key] = value ? parseFloat(value) : null;
        } else if (['stockQuantity', 'minStock', 'categoryId', 'brandId'].includes(key)) {
          productData[key] = value ? parseInt(value) : null;
        } else if (['isFeatured', 'allowOnlinePayment', 'allowCardPayment', 'allowCashOnDelivery'].includes(key)) {
          productData[key] = value === 'true';
        } else {
          productData[key] = value || '';
        }
      }
    }
    
    return productData;
  }

  // ✅ FUNCIÓN AUXILIAR PARA CONTENT TYPE (IGUAL QUE EL TEST)
  getImageContentType(file) {
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase();
    const types = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg', 
      'png': 'image/png',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    return types[ext] || 'image/jpeg';
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

  // ✅ CREAR PRODUCTO SIN IMAGEN - EXACTAMENTE COMO EL TEST
  async createProduct(productData) {
    console.log('📦 SubProductService: Creating product (test pattern)...', productData);
    
    try {
      // ✅ VALIDAR Y FORMATEAR DATOS EXACTAMENTE COMO EL TEST
      const formattedProductData = this.formatProductDataForAPI(productData);
      
      console.log('📋 Formatted product data for API:', formattedProductData);
      
      // ✅ USAR EXACTAMENTE LA MISMA RUTA Y HEADERS DEL TEST
      const response = await this.baseService.post('/api/store/management/products', formattedProductData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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

  // ✅ ACTUALIZAR PRODUCTO - EXACTAMENTE COMO EL TEST
  async updateProduct(productId, productData) {
    console.log('📦 SubProductService: Updating product (test pattern)...', { productId, productData });
    
    try {
      // ✅ FORMATEAR DATOS EXACTAMENTE COMO EL TEST
      const formattedProductData = this.formatProductDataForAPI(productData);
      
      const response = await this.baseService.put(`/api/store/management/products/${productId}`, formattedProductData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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
  // 🔧 VALIDACIONES Y FORMATEO - EXACTAMENTE COMO EL TEST
  // ================================

  validateProductData(productData) {
    console.log('🔍 SubProductService: Validating product data (test pattern)...');
    
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
      console.error('❌ SubProductService: Validation errors:', errors);
      throw new Error(errors.join(', '));
    }
    
    console.log('✅ SubProductService: Validation successful');
    return true;
  }

  // ✅ FORMATEAR DATOS EXACTAMENTE COMO EL TEST
  formatProductDataForAPI(productData) {
    console.log('🔧 SubProductService: Formatting data for API (test pattern)...');
    
    if (!productData) {
      throw new Error('Product data not provided');
    }
    
    // ✅ VALIDACIONES PREVIAS IGUAL QUE EL TEST
    if (!productData.name || !productData.name.trim()) {
      throw new Error('Product name is required');
    }
    
    if (!productData.price || parseFloat(productData.price) <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    if (!productData.categoryId) {
      throw new Error('Category is required');
    }
    
    // ✅ FORMATEAR EXACTAMENTE COMO EN EL TEST
    const formattedData = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      sku: productData.sku,
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      minStock: parseInt(productData.minStock) || 5,
      weight: productData.weight ? parseFloat(productData.weight) : null,
      dimensions: productData.dimensions,
      categoryId: parseInt(productData.categoryId), // ✅ Asegurar que sea entero
      brandId: productData.brandId ? parseInt(productData.brandId) : null,
      isFeatured: productData.isFeatured,
      allowOnlinePayment: productData.allowOnlinePayment,
      allowCardPayment: productData.allowCardPayment,
      allowCashOnDelivery: productData.allowCashOnDelivery,
      deliveryTime: productData.deliveryTime
    };
    
    console.log('✅ SubProductService: Data formatted for API:', formattedData);
    
    // ✅ VALIDACIÓN FINAL IGUAL QUE EL TEST
    if (!formattedData.categoryId || isNaN(formattedData.categoryId)) {
      throw new Error('Invalid categoryId after formatting');
    }
    
    return formattedData;
  }
}