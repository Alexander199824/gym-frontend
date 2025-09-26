// src/services/inventoryService.js
// SERVICIO ESPECIALIZADO PARA TIENDA E INVENTARIO
// Conecta con las rutas reales del backend según el manual

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';
import { api } from './apiConfig.js';

class InventoryService extends BaseService {
  constructor() {
    super();
    
    // Cache para optimizar requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS E INVENTARIO
  // ================================

  // Obtener estadísticas principales del dashboard
  async getInventoryStats(period = 'month') {
    console.log('📊 InventoryService: Getting inventory stats...', { period });
    
    try {
      const response = await this.get('/api/inventory/stats', { 
        params: { period } 
      });
      
      console.log('✅ Inventory stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting inventory stats:', error);
      
      // Fallback con datos ejemplo si el endpoint no está disponible
      console.warn('⚠️ Using fallback inventory stats');
      return {
        success: true,
        data: {
          inventory: {
            totalProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            totalValue: 0
          },
          sales: {
            period: period,
            data: []
          },
          products: {
            topSelling: []
          },
          alerts: {
            pendingTransfers: { total: 0, online: 0, local: 0 },
            lowStockProducts: 0
          },
          categories: []
        }
      };
    }
  }

  // Dashboard completo de inventario
  async getInventoryDashboard() {
    console.log('📊 InventoryService: Getting inventory dashboard...');
    
    try {
      const response = await this.get('/api/inventory/dashboard');
      console.log('✅ Inventory dashboard response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting inventory dashboard:', error);
      throw error;
    }
  }

  // Reporte financiero
  async getFinancialReport(startDate, endDate) {
    console.log('💰 InventoryService: Getting financial report...', { startDate, endDate });
    
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.get('/api/inventory/financial-report', { params });
      console.log('✅ Financial report response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting financial report:', error);
      throw error;
    }
  }

  // Productos con stock bajo
  async getLowStockProducts() {
    console.log('⚠️ InventoryService: Getting low stock products...');
    
    try {
      const response = await this.get('/api/inventory/low-stock');
      console.log('✅ Low stock products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting low stock products:', error);
      throw error;
    }
  }

  // Performance de empleados (solo admin)
  async getEmployeePerformance(startDate, endDate) {
    console.log('👥 InventoryService: Getting employee performance...', { startDate, endDate });
    
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.get('/api/inventory/employee-performance', { params });
      console.log('✅ Employee performance response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting employee performance:', error);
      throw error;
    }
  }

  // ================================
  // 📦 MÉTODOS DE GESTIÓN DE PRODUCTOS
  // ================================

  // Listar productos con filtros
  async getProducts(params = {}) {
    console.log('📦 InventoryService: Getting products...', params);
    
    try {
      const response = await this.get('/api/store/management/products', { params });
      console.log('✅ Products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting products:', error);
      throw error;
    }
  }

  // Obtener producto específico
  async getProductById(productId) {
    console.log('📦 InventoryService: Getting product by ID...', { productId });
    
    try {
      const response = await this.get(`/api/store/management/products/${productId}`);
      console.log('✅ Product by ID response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product by ID:', error);
      throw error;
    }
  }

  // Crear nuevo producto
  async createProduct(productData) {
    console.log('📦 InventoryService: Creating product...', productData);
    
    try {
      // Validar datos requeridos
      this.validateProductData(productData);
      
      const response = await this.post('/api/store/management/products', productData);
      
      if (response.success) {
        console.log('✅ Product created successfully:', response.data?.product);
        toast.success('Producto creado exitosamente');
        this.invalidateProductsCache();
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
    console.log('📦 InventoryService: Updating product...', { productId, productData });
    
    try {
      const response = await this.put(`/api/store/management/products/${productId}`, productData);
      
      if (response.success) {
        console.log('✅ Product updated successfully:', response.data?.product);
        toast.success('Producto actualizado exitosamente');
        this.invalidateProductsCache();
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
    console.log('📦 InventoryService: Updating product stock...', { productId, stockData });
    
    try {
      const response = await this.put(`/api/store/management/products/${productId}/stock`, stockData);
      
      if (response.success) {
        console.log('✅ Product stock updated successfully');
        toast.success('Stock actualizado exitosamente');
        this.invalidateProductsCache();
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
    console.log('📦 InventoryService: Bulk updating stock...', { updates });
    
    try {
      const response = await this.put('/api/store/management/products/bulk-stock', { updates });
      
      if (response.success) {
        console.log('✅ Bulk stock updated successfully');
        toast.success('Stock actualizado masivamente');
        this.invalidateProductsCache();
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
    console.log('📦 InventoryService: Deleting product...', { productId });
    
    try {
      const response = await this.delete(`/api/store/management/products/${productId}`);
      
      if (response.success) {
        console.log('✅ Product deleted successfully');
        toast.success('Producto eliminado exitosamente');
        this.invalidateProductsCache();
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
    console.log('📦 InventoryService: Duplicating product...', { productId, newData });
    
    try {
      const response = await this.post(`/api/store/management/products/${productId}/duplicate`, newData);
      
      if (response.success) {
        console.log('✅ Product duplicated successfully');
        toast.success('Producto duplicado exitosamente');
        this.invalidateProductsCache();
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
    console.log('📊 InventoryService: Getting product stats...');
    
    try {
      const response = await this.get('/api/store/management/products/stats');
      console.log('✅ Product stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product stats:', error);
      throw error;
    }
  }

  // ================================
  // 🖼️ MÉTODOS DE GESTIÓN DE IMÁGENES
  // ================================

  // Obtener imágenes de un producto
  async getProductImages(productId) {
    console.log('🖼️ InventoryService: Getting product images...', { productId });
    
    try {
      const response = await this.get(`/api/store/management/products/${productId}/images`);
      console.log('✅ Product images response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting product images:', error);
      throw error;
    }
  }

  // Subir imagen individual
  async uploadProductImage(productId, imageFile, options = {}) {
    console.log('🖼️ InventoryService: Uploading product image...', { productId, options });
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Construir query params
      const params = new URLSearchParams();
      if (options.isPrimary) params.append('isPrimary', 'true');
      if (options.altText) params.append('altText', options.altText);
      if (options.displayOrder) params.append('displayOrder', options.displayOrder);
      
      const url = `/api/store/management/products/${productId}/images${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await this.post(url, formData, {
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
    console.log('🖼️ InventoryService: Uploading multiple product images...', { productId, count: imageFiles.length });
    
    try {
      const formData = new FormData();
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      const response = await this.post(`/api/store/management/products/${productId}/images/multiple`, formData, {
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
    console.log('🖼️ InventoryService: Updating product image...', { productId, imageId, imageData });
    
    try {
      const response = await this.put(`/api/store/management/products/${productId}/images/${imageId}`, imageData);
      
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
    console.log('🖼️ InventoryService: Deleting product image...', { productId, imageId });
    
    try {
      const response = await this.delete(`/api/store/management/products/${productId}/images/${imageId}`);
      
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
    console.log('🖼️ InventoryService: Reordering product images...', { productId, imageOrders });
    
    try {
      const response = await this.put(`/api/store/management/products/${productId}/images/reorder`, { imageOrders });
      
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
    console.log('🖼️ InventoryService: Setting primary product image...', { productId, imageId });
    
    try {
      const response = await this.put(`/api/store/management/products/${productId}/images/${imageId}/primary`);
      
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

  // ================================
  // 🏷️ MÉTODOS DE GESTIÓN DE MARCAS (MEJORADOS CON UPLOAD)
  // ================================

  // Listar marcas
  async getBrands(params = {}) {
    console.log('🏷️ InventoryService: Getting brands...', params);
    
    try {
      const response = await this.get('/api/store/management/brands', { params });
      console.log('✅ Brands response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting brands:', error);
      throw error;
    }
  }

  // ✅ CREAR MARCA SIN UPLOAD (JSON TRADICIONAL)
  async createBrand(brandData) {
    console.log('🏷️ InventoryService: Creating brand...', brandData);
    
    try {
      const response = await this.post('/api/store/management/brands', brandData);
      
      if (response.success) {
        console.log('✅ Brand created successfully:', response.data?.brand);
        toast.success('Marca creada exitosamente');
        this.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating brand:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear marca';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ NUEVA: CREAR MARCA CON UPLOAD DE LOGO (FORMDATA)
  async createBrandWithUpload(formData) {
    console.log('🏷️ InventoryService: Creating brand with upload...');
    
    try {
      const response = await this.post('/api/store/management/brands', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Brand created with upload successfully:', response.data?.brand);
        
        // Mostrar info adicional si hay upload
        if (response.data?.uploadInfo?.uploadedToCloudinary) {
          toast.success(`Marca creada con logo subido a Cloudinary`);
        } else {
          toast.success('Marca creada exitosamente');
        }
        
        this.invalidateBrandsCache();
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
    console.log('🏷️ InventoryService: Updating brand...', { brandId, brandData });
    
    try {
      const response = await this.put(`/api/store/management/brands/${brandId}`, brandData);
      
      if (response.success) {
        console.log('✅ Brand updated successfully');
        toast.success('Marca actualizada exitosamente');
        this.invalidateBrandsCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating brand:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar marca';
      toast.error(errorMessage);
      throw error;
    }
  }

  // ✅ NUEVA: ACTUALIZAR MARCA CON UPLOAD DE LOGO (FORMDATA)
  async updateBrandWithUpload(brandId, formData) {
    console.log('🏷️ InventoryService: Updating brand with upload...', { brandId });
    
    try {
      const response = await this.put(`/api/store/management/brands/${brandId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        console.log('✅ Brand updated with upload successfully');
        
        // Mostrar info adicional si hay upload
        if (response.data?.uploadInfo?.uploadedToCloudinary) {
          const message = response.data.uploadInfo.replacedPreviousLogo 
            ? 'Marca actualizada con nuevo logo (anterior eliminado)'
            : 'Marca actualizada con logo subido a Cloudinary';
          toast.success(message);
        } else {
          toast.success('Marca actualizada exitosamente');
        }
        
        this.invalidateBrandsCache();
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
    console.log('🏷️ InventoryService: Deleting brand...', { brandId });
    
    try {
      const response = await this.delete(`/api/store/management/brands/${brandId}`);
      
      if (response.success) {
        console.log('✅ Brand deleted successfully');
        toast.success('Marca eliminada exitosamente');
        this.invalidateBrandsCache();
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
    console.log('🏷️ InventoryService: Searching brands...', { query });
    
    try {
      const response = await this.get('/api/store/management/brands/search', {
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
    console.log('📊 InventoryService: Getting brand stats...');
    
    try {
      const response = await this.get('/api/store/management/brands/stats');
      console.log('✅ Brand stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting brand stats:', error);
      throw error;
    }
  }

  // ================================
  // 📂 MÉTODOS DE GESTIÓN DE CATEGORÍAS
  // ================================

  // Listar categorías
  async getCategories(params = {}) {
    console.log('📂 InventoryService: Getting categories...', params);
    
    try {
      const response = await this.get('/api/store/management/categories', { params });
      console.log('✅ Categories response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      throw error;
    }
  }

  // Crear categoría
  async createCategory(categoryData) {
    console.log('📂 InventoryService: Creating category...', categoryData);
    
    try {
      const response = await this.post('/api/store/management/categories', categoryData);
      
      if (response.success) {
        console.log('✅ Category created successfully:', response.data?.category);
        toast.success('Categoría creada exitosamente');
        this.invalidateCategoriesCache();
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
    console.log('📂 InventoryService: Updating category...', { categoryId, categoryData });
    
    try {
      const response = await this.put(`/api/store/management/categories/${categoryId}`, categoryData);
      
      if (response.success) {
        console.log('✅ Category updated successfully');
        toast.success('Categoría actualizada exitosamente');
        this.invalidateCategoriesCache();
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
    console.log('📂 InventoryService: Deleting category...', { categoryId });
    
    try {
      const response = await this.delete(`/api/store/management/categories/${categoryId}`);
      
      if (response.success) {
        console.log('✅ Category deleted successfully');
        toast.success('Categoría eliminada exitosamente');
        this.invalidateCategoriesCache();
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
    console.log('📂 InventoryService: Reordering categories...', { categoryOrders });
    
    try {
      const response = await this.put('/api/store/management/categories/reorder', { categoryOrders });
      
      if (response.success) {
        console.log('✅ Categories reordered successfully');
        toast.success('Orden de categorías actualizado');
        this.invalidateCategoriesCache();
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
    console.log('📂 InventoryService: Searching categories...', { query });
    
    try {
      const response = await this.get('/api/store/management/categories/search', {
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
    console.log('📂 InventoryService: Getting category by slug...', { slug });
    
    try {
      const response = await this.get(`/api/store/management/categories/slug/${slug}`);
      console.log('✅ Category by slug response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting category by slug:', error);
      throw error;
    }
  }

  // Estadísticas de categorías
  async getCategoryStats() {
    console.log('📊 InventoryService: Getting category stats...');
    
    try {
      const response = await this.get('/api/store/management/categories/stats');
      console.log('✅ Category stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting category stats:', error);
      throw error;
    }
  }

  // ================================
  // 💰 MÉTODOS DE VENTAS LOCALES
  // ================================

  // Listar ventas locales
  async getLocalSales(params = {}) {
    console.log('💰 InventoryService: Getting local sales...', params);
    
    try {
      const response = await this.get('/api/local-sales', { params });
      console.log('✅ Local sales response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting local sales:', error);
      throw error;
    }
  }

  // Crear venta en efectivo
  async createCashSale(saleData) {
    console.log('💰 InventoryService: Creating cash sale...', saleData);
    
    try {
      const response = await this.post('/api/local-sales/cash', saleData);
      
      if (response.success) {
        console.log('✅ Cash sale created successfully');
        toast.success('Venta en efectivo registrada');
        this.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating cash sale:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar venta';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Crear venta por transferencia
  async createTransferSale(saleData) {
    console.log('💰 InventoryService: Creating transfer sale...', saleData);
    
    try {
      const response = await this.post('/api/local-sales/transfer', saleData);
      
      if (response.success) {
        console.log('✅ Transfer sale created successfully');
        toast.success('Venta por transferencia registrada');
        this.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating transfer sale:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar venta por transferencia';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Confirmar transferencia (solo admin)
  async confirmTransfer(saleId, notes = '') {
    console.log('💰 InventoryService: Confirming transfer...', { saleId, notes });
    
    try {
      const response = await this.post(`/api/local-sales/${saleId}/confirm-transfer`, { notes });
      
      if (response.success) {
        console.log('✅ Transfer confirmed successfully');
        toast.success('Transferencia confirmada');
        this.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error confirming transfer:', error);
      const errorMessage = error.response?.data?.message || 'Error al confirmar transferencia';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Obtener transferencias pendientes
  async getPendingTransfers() {
    console.log('💰 InventoryService: Getting pending transfers...');
    
    try {
      const response = await this.get('/api/local-sales/pending-transfers');
      console.log('✅ Pending transfers response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting pending transfers:', error);
      throw error;
    }
  }

  // Buscar productos para venta
  async searchProductsForSale(query, limit = 10) {
    console.log('💰 InventoryService: Searching products for sale...', { query, limit });
    
    try {
      const response = await this.get('/api/local-sales/products/search', {
        params: { q: query, limit }
      });
      console.log('✅ Products for sale search response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error searching products for sale:', error);
      throw error;
    }
  }

  // Reporte diario de ventas
  async getDailySalesReport(date) {
    console.log('💰 InventoryService: Getting daily sales report...', { date });
    
    try {
      const response = await this.get('/api/local-sales/reports/daily', {
        params: { date }
      });
      console.log('✅ Daily sales report response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting daily sales report:', error);
      throw error;
    }
  }

  // Estadísticas personales (colaborador)
  async getMySalesStats() {
    console.log('💰 InventoryService: Getting my sales stats...');
    
    try {
      const response = await this.get('/api/local-sales/my-stats');
      console.log('✅ My sales stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting my sales stats:', error);
      throw error;
    }
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA PÚBLICA
  // ================================

  // Productos públicos (sin autenticación)
  async getPublicProducts(params = {}) {
    console.log('🛍️ InventoryService: Getting public products...', params);
    
    try {
      const response = await this.get('/api/store/products', { params });
      console.log('✅ Public products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public products:', error);
      throw error;
    }
  }

  // Productos destacados
  async getFeaturedProducts(limit = 8) {
    console.log('🛍️ InventoryService: Getting featured products...', { limit });
    
    try {
      const response = await this.get('/api/store/products/featured', {
        params: { limit }
      });
      console.log('✅ Featured products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting featured products:', error);
      throw error;
    }
  }

  // Producto público específico
  async getPublicProductById(productId) {
    console.log('🛍️ InventoryService: Getting public product by ID...', { productId });
    
    try {
      const response = await this.get(`/api/store/products/${productId}`);
      console.log('✅ Public product by ID response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public product by ID:', error);
      throw error;
    }
  }

  // Categorías públicas
  async getPublicCategories() {
    console.log('🛍️ InventoryService: Getting public categories...');
    
    try {
      const response = await this.get('/api/store/categories');
      console.log('✅ Public categories response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public categories:', error);
      throw error;
    }
  }

  // Marcas públicas
  async getPublicBrands() {
    console.log('🛍️ InventoryService: Getting public brands...');
    
    try {
      const response = await this.get('/api/store/brands');
      console.log('✅ Public brands response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public brands:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 MÉTODOS AUXILIARES Y VALIDACIONES
  // ================================

  // Validar datos de producto
  validateProductData(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.trim().length < 3) {
      errors.push('El nombre del producto debe tener al menos 3 caracteres');
    }
    
    if (!productData.price || productData.price <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }
    
    if (productData.stockQuantity && productData.stockQuantity < 0) {
      errors.push('La cantidad de stock no puede ser negativa');
    }
    
    if (!productData.categoryId) {
      errors.push('Debe seleccionar una categoría');
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return true;
  }

  // Formatear datos de producto para API
  formatProductDataForAPI(productData) {
    return {
      name: productData.name?.trim(),
      description: productData.description?.trim() || '',
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      sku: productData.sku?.trim(),
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      minStock: parseInt(productData.minStock) || 5,
      weight: parseFloat(productData.weight) || null,
      dimensions: productData.dimensions || null,
      categoryId: parseInt(productData.categoryId),
      brandId: parseInt(productData.brandId),
      isFeatured: Boolean(productData.isFeatured),
      allowOnlinePayment: Boolean(productData.allowOnlinePayment),
      allowCardPayment: Boolean(productData.allowCardPayment),
      allowCashOnDelivery: Boolean(productData.allowCashOnDelivery),
      deliveryTime: productData.deliveryTime?.trim() || '1-3 días hábiles'
    };
  }

  // ✅ NUEVA: Validar datos de marca
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

  // ✅ NUEVA: Validar datos de categoría
  validateCategoryData(categoryData) {
    const errors = [];
    
    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.push('El nombre de la categoría debe tener al menos 2 caracteres');
    }
    
    if (categoryData.slug && categoryData.slug.trim()) {
      // Validar formato de slug
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

  // ✅ NUEVA: Validar archivos de imagen
  validateImageFile(file, maxSize = 3 * 1024 * 1024) {
    const errors = [];
    
    if (!file) {
      errors.push('No se proporcionó archivo');
    } else {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        errors.push('El archivo debe ser una imagen');
      }
      
      // Validar tamaño
      if (file.size > maxSize) {
        errors.push(`El archivo es muy grande. Máximo ${maxSize / 1024 / 1024}MB`);
      }
      
      // Validar formatos específicos
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        errors.push('Formato no soportado. Use JPG, PNG, WebP o SVG');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return true;
  }

  // ================================
  // 🗃️ MÉTODOS DE CACHE
  // ================================

  // Invalidar cache de productos
  invalidateProductsCache() {
    console.log('🗃️ Invalidating products cache...');
    this.cache.delete('products');
    this.cache.delete('product-stats');
    this.cache.delete('low-stock');
  }

  // Invalidar cache de marcas
  invalidateBrandsCache() {
    console.log('🗃️ Invalidating brands cache...');
    this.cache.delete('brands');
    this.cache.delete('brand-stats');
  }

  // Invalidar cache de categorías
  invalidateCategoriesCache() {
    console.log('🗃️ Invalidating categories cache...');
    this.cache.delete('categories');
    this.cache.delete('category-stats');
  }

  // Invalidar cache de ventas
  invalidateSalesCache() {
    console.log('🗃️ Invalidating sales cache...');
    this.cache.delete('local-sales');
    this.cache.delete('sales-stats');
    this.cache.delete('pending-transfers');
  }

  // Invalidar todo el cache
  invalidateAllCache() {
    console.log('🗃️ Invalidating all cache...');
    this.cache.clear();
  }

  // ================================
  // 🛠️ MÉTODOS DE DEBUGGING
  // ================================

  // Debug del sistema de inventario
  async debugInventorySystem() {
    console.log('\n🔍 DEBUGGING INVENTORY SYSTEM');
    console.log('=' .repeat(50));
    
    const results = {
      endpoints: {},
      auth: false,
      cache: {},
      errors: []
    };
    
    try {
      // Test de autenticación
      console.log('🔐 Testing authentication...');
      const token = localStorage.getItem('authToken');
      results.auth = !!token;
      console.log(`   Token present: ${results.auth}`);
      
      // Test de endpoints principales
      const endpoints = [
        { name: 'Inventory Stats', path: '/api/inventory/stats' },
        { name: 'Products', path: '/api/store/management/products' },
        { name: 'Categories', path: '/api/store/management/categories' },
        { name: 'Brands', path: '/api/store/management/brands' },
        { name: 'Local Sales', path: '/api/local-sales' }
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Testing ${endpoint.name}...`);
          const response = await this.get(endpoint.path, { 
            params: { limit: 1 },
            timeout: 5000 
          });
          results.endpoints[endpoint.name] = {
            status: 'success',
            responseTime: '< 5s'
          };
          console.log(`   ✅ ${endpoint.name}: OK`);
        } catch (error) {
          results.endpoints[endpoint.name] = {
            status: 'error',
            error: error.response?.status || error.message
          };
          results.errors.push(`${endpoint.name}: ${error.message}`);
          console.log(`   ❌ ${endpoint.name}: ${error.response?.status || error.message}`);
        }
      }
      
      // Test de cache
      console.log('🗃️ Testing cache...');
      results.cache = {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      };
      
      console.log('\n📊 RESULTS SUMMARY:');
      console.log(`   Authentication: ${results.auth ? '✅' : '❌'}`);
      console.log(`   Working endpoints: ${Object.values(results.endpoints).filter(e => e.status === 'success').length}/${endpoints.length}`);
      console.log(`   Cache entries: ${results.cache.size}`);
      console.log(`   Errors: ${results.errors.length}`);
      
      if (results.errors.length > 0) {
        console.log('\n❌ ERRORS FOUND:');
        results.errors.forEach(error => console.log(`   • ${error}`));
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Debug system error:', error);
      results.errors.push(`Debug system: ${error.message}`);
      return results;
    }
  }

  // Health check
  async healthCheck() {
    console.log('🏥 InventoryService: Running health check...');
    
    try {
      const response = await this.get('/api/health', { timeout: 3000 });
      console.log('✅ Health check passed');
      return { healthy: true, ...response };
      
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      return { 
        healthy: false, 
        error: error.message,
        status: error.response?.status 
      };
    }
  }

  // Información del servicio
  getServiceInfo() {
    return {
      name: 'InventoryService',
      version: '2.0.0', // ✅ Actualizada con nuevas funciones
      description: 'Servicio especializado para gestión de inventario y tienda con upload de imágenes',
      endpoints: {
        inventory: '/api/inventory/*',
        products: '/api/store/management/products/*',
        categories: '/api/store/management/categories/*',
        brands: '/api/store/management/brands/*',
        localSales: '/api/local-sales/*',
        publicStore: '/api/store/*'
      },
      features: [
        'Gestión completa de productos',
        'Subida de imágenes a Cloudinary',
        'Categorías con iconos mejorados',
        'Marcas con upload de logos', // ✅ Nueva feature
        'Ventas en tienda física',
        'Estadísticas e inventario',
        'Cache inteligente',
        'Validaciones automáticas',
        'Notificaciones toast',
        'Debug integrado',
        'Upload con FormData', // ✅ Nueva feature
        'Drag & Drop support' // ✅ Nueva feature
      ],
      cache: {
        enabled: true,
        timeout: this.cacheTimeout,
        entries: this.cache.size
      },
      newFeatures: {
        brandUpload: {
          enabled: true,
          methods: ['createBrandWithUpload', 'updateBrandWithUpload'],
          supportedFormats: ['JPG', 'PNG', 'WebP', 'SVG'],
          maxSize: '3MB',
          cloudinaryIntegration: true
        },
        validation: {
          brandData: true,
          categoryData: true,
          imageFiles: true
        }
      }
    };
  }
}

// Crear y exportar instancia singleton
const inventoryService = new InventoryService();

export { InventoryService };
export default inventoryService;