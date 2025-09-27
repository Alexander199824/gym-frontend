// src/services/inventoryService.js
// SERVICIO PRINCIPAL QUE GESTIONA TODOS LOS SUB-SERVICIOS
// ✅ MANTIENE LA MISMA INTERFAZ PÚBLICA - NO REQUIERE CAMBIOS EN OTROS ARCHIVOS

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';
import { api } from './apiConfig.js';

// Importar todos los sub-servicios
import { SubProductService } from './subProductService.js';
import { SubBrandService } from './subBrandService.js';
import { SubCategoryService } from './subCategoryService.js';
import { SubImageService } from './subImageService.js';
import { SubSalesService } from './subSalesService.js';
import { SubStatsService } from './subStatsService.js';
import { SubPublicStoreService } from './subPublicStoreService.js';

class InventoryService extends BaseService {
  constructor() {
    super();
    
    // Cache para optimizar requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    
    // ✅ INICIALIZAR SUB-SERVICIOS
    this._initializeSubServices();
  }

  // ================================
  // 🎯 INICIALIZACIÓN DE SUB-SERVICIOS
  // ================================

  _initializeSubServices() {
    console.log('🎯 InventoryService: Initializing sub-services...');
    
    // Crear instancias de sub-servicios pasando `this` como base
    this.subProducts = new SubProductService(this);
    this.subBrands = new SubBrandService(this);
    this.subCategories = new SubCategoryService(this);
    this.subImages = new SubImageService(this);
    this.subSales = new SubSalesService(this);
    this.subStats = new SubStatsService(this);
    this.subPublicStore = new SubPublicStoreService(this);
    
    console.log('✅ InventoryService: All sub-services initialized');
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS E INVENTARIO (DELEGADOS)
  // ================================

  async getInventoryStats(period = 'month') {
    return this.subStats.getInventoryStats(period);
  }

  async getInventoryDashboard() {
    return this.subStats.getInventoryDashboard();
  }

  async getFinancialReport(startDate, endDate) {
    return this.subStats.getFinancialReport(startDate, endDate);
  }

  async getLowStockProducts() {
    return this.subStats.getLowStockProducts();
  }

  async getEmployeePerformance(startDate, endDate) {
    return this.subStats.getEmployeePerformance(startDate, endDate);
  }

  // ================================
  // 📦 MÉTODOS DE GESTIÓN DE PRODUCTOS (DELEGADOS)
  // ================================

  async createProductWithImage(formData) {
    return this.subProducts.createProductWithImage(formData);
  }

  async getProducts(params = {}) {
    return this.subProducts.getProducts(params);
  }

  async getProductById(productId) {
    return this.subProducts.getProductById(productId);
  }

  async createProduct(productData) {
    return this.subProducts.createProduct(productData);
  }

  async updateProduct(productId, productData) {
    return this.subProducts.updateProduct(productId, productData);
  }

  async updateProductStock(productId, stockData) {
    return this.subProducts.updateProductStock(productId, stockData);
  }

  async updateBulkStock(updates) {
    return this.subProducts.updateBulkStock(updates);
  }

  async deleteProduct(productId) {
    return this.subProducts.deleteProduct(productId);
  }

  async duplicateProduct(productId, newData = {}) {
    return this.subProducts.duplicateProduct(productId, newData);
  }

  async getProductStats() {
    return this.subProducts.getProductStats();
  }

  // ================================
  // 🖼️ MÉTODOS DE GESTIÓN DE IMÁGENES (DELEGADOS)
  // ================================

  async getProductImages(productId) {
    return this.subImages.getProductImages(productId);
  }

  async uploadProductImage(productId, imageFile, options = {}) {
    return this.subImages.uploadProductImage(productId, imageFile, options);
  }

  async uploadMultipleProductImages(productId, imageFiles) {
    return this.subImages.uploadMultipleProductImages(productId, imageFiles);
  }

  async updateProductImage(productId, imageId, imageData) {
    return this.subImages.updateProductImage(productId, imageId, imageData);
  }

  async deleteProductImage(productId, imageId) {
    return this.subImages.deleteProductImage(productId, imageId);
  }

  async reorderProductImages(productId, imageOrders) {
    return this.subImages.reorderProductImages(productId, imageOrders);
  }

  async setPrimaryProductImage(productId, imageId) {
    return this.subImages.setPrimaryProductImage(productId, imageId);
  }

  // ================================
  // 🏷️ MÉTODOS DE GESTIÓN DE MARCAS (DELEGADOS)
  // ================================

  async getBrands(params = {}) {
    return this.subBrands.getBrands(params);
  }

  async createBrand(brandData) {
    return this.subBrands.createBrand(brandData);
  }

  async createBrandWithUpload(formData) {
    return this.subBrands.createBrandWithUpload(formData);
  }

  async updateBrand(brandId, brandData) {
    return this.subBrands.updateBrand(brandId, brandData);
  }

  async updateBrandWithUpload(brandId, formData) {
    return this.subBrands.updateBrandWithUpload(brandId, formData);
  }

  async deleteBrand(brandId) {
    return this.subBrands.deleteBrand(brandId);
  }

  async searchBrands(query) {
    return this.subBrands.searchBrands(query);
  }

  async getBrandStats() {
    return this.subBrands.getBrandStats();
  }

  // ================================
  // 📂 MÉTODOS DE GESTIÓN DE CATEGORÍAS (DELEGADOS)
  // ================================

  async getCategories(params = {}) {
    return this.subCategories.getCategories(params);
  }

  async createCategory(categoryData) {
    return this.subCategories.createCategory(categoryData);
  }

  async updateCategory(categoryId, categoryData) {
    return this.subCategories.updateCategory(categoryId, categoryData);
  }

  async deleteCategory(categoryId) {
    return this.subCategories.deleteCategory(categoryId);
  }

  async reorderCategories(categoryOrders) {
    return this.subCategories.reorderCategories(categoryOrders);
  }

  async searchCategories(query) {
    return this.subCategories.searchCategories(query);
  }

  async getCategoryBySlug(slug) {
    return this.subCategories.getCategoryBySlug(slug);
  }

  async getCategoryStats() {
    return this.subCategories.getCategoryStats();
  }

  // ================================
  // 💰 MÉTODOS DE VENTAS LOCALES (DELEGADOS)
  // ================================

  async getLocalSales(params = {}) {
    return this.subSales.getLocalSales(params);
  }

  async createCashSale(saleData) {
    return this.subSales.createCashSale(saleData);
  }

  async createTransferSale(saleData) {
    return this.subSales.createTransferSale(saleData);
  }

  async confirmTransfer(saleId, notes = '') {
    return this.subSales.confirmTransfer(saleId, notes);
  }

  async getPendingTransfers() {
    return this.subSales.getPendingTransfers();
  }

  async searchProductsForSale(query, limit = 10) {
    return this.subSales.searchProductsForSale(query, limit);
  }

  async getDailySalesReport(date) {
    return this.subSales.getDailySalesReport(date);
  }

  async getMySalesStats() {
    return this.subSales.getMySalesStats();
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA PÚBLICA (DELEGADOS)
  // ================================

  async getPublicProducts(params = {}) {
    return this.subPublicStore.getPublicProducts(params);
  }

  async getFeaturedProducts(limit = 8) {
    return this.subPublicStore.getFeaturedProducts(limit);
  }

  async getPublicProductById(productId) {
    return this.subPublicStore.getPublicProductById(productId);
  }

  async getPublicCategories() {
    return this.subPublicStore.getPublicCategories();
  }

  async getPublicBrands() {
    return this.subPublicStore.getPublicBrands();
  }

  // ================================
  // 🔧 MÉTODOS AUXILIARES Y VALIDACIONES (LOCALES)
  // ================================

  // Validar datos de producto (delegado a sub-servicio)
  validateProductData(productData) {
    return this.subProducts.validateProductData(productData);
  }

  // Formatear datos de producto para API (delegado a sub-servicio)
  formatProductDataForAPI(productData) {
    return this.subProducts.formatProductDataForAPI(productData);
  }

  // ✅ Validar datos de marca (delegado a sub-servicio)
  validateBrandData(brandData) {
    return this.subBrands.validateBrandData(brandData);
  }

  // ✅ Validar datos de categoría (delegado a sub-servicio)
  validateCategoryData(categoryData) {
    return this.subCategories.validateCategoryData(categoryData);
  }

  // ✅ Validar archivos de imagen
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
    console.log('\n🔍 DEBUGGING INVENTORY SYSTEM (MODULAR)');
    console.log('=' .repeat(50));
    
    const results = {
      endpoints: {},
      auth: false,
      cache: {},
      subServices: {},
      errors: []
    };
    
    try {
      // Test de autenticación
      console.log('🔐 Testing authentication...');
      const token = localStorage.getItem('authToken');
      results.auth = !!token;
      console.log(`   Token present: ${results.auth}`);
      
      // Test de sub-servicios
      console.log('🔧 Testing sub-services...');
      results.subServices = {
        products: this.subProducts instanceof SubProductService,
        brands: this.subBrands instanceof SubBrandService,
        categories: this.subCategories instanceof SubCategoryService,
        images: this.subImages instanceof SubImageService,
        sales: this.subSales instanceof SubSalesService,
        stats: this.subStats instanceof SubStatsService,
        publicStore: this.subPublicStore instanceof SubPublicStoreService
      };
      
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
      console.log(`   Active sub-services: ${Object.values(results.subServices).filter(s => s).length}/${Object.keys(results.subServices).length}`);
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

  // ================================
  // 🛠️ INFORMACIÓN DEL SERVICIO
  // ================================

  // Información del servicio
  getServiceInfo() {
    return {
      name: 'InventoryService (Modular)',
      version: '2.2.0', // ✅ Actualizada con arquitectura modular
      description: 'Servicio especializado para gestión de inventario y tienda con arquitectura modular',
      architecture: 'Modular con sub-servicios especializados',
      subServices: {
        SubProductService: 'Gestión completa de productos',
        SubBrandService: 'Gestión de marcas con upload',
        SubCategoryService: 'Gestión de categorías',
        SubImageService: 'Gestión de imágenes de productos',
        SubSalesService: 'Ventas locales y transferencias',
        SubStatsService: 'Estadísticas e inventario',
        SubPublicStoreService: 'Tienda pública sin auth'
      },
      endpoints: {
        inventory: '/api/inventory/*',
        products: '/api/store/management/products/*',
        categories: '/api/store/management/categories/*',
        brands: '/api/store/management/brands/*',
        localSales: '/api/local-sales/*',
        publicStore: '/api/store/*'
      },
      features: [
        'Arquitectura modular interna',
        'Mismo API público (compatible)',
        'Gestión completa de productos',
        'Subida de imágenes a Cloudinary',
        'Categorías con iconos mejorados',
        'Marcas con upload de logos',
        'Productos con imagen al crear',
        'Ventas en tienda física',
        'Estadísticas e inventario',
        'Cache inteligente',
        'Validaciones automáticas',
        'Notificaciones toast',
        'Upload con FormData',
        'Drag & Drop support',
        'Sub-servicios especializados'
      ],
      cache: {
        enabled: true,
        timeout: this.cacheTimeout,
        entries: this.cache.size
      },
      improvements: {
        codeOrganization: {
          enabled: true,
          description: 'Código separado en sub-servicios especializados',
          benefits: ['Mejor mantenibilidad', 'Código más limpio', 'Responsabilidades claras']
        },
        samePublicAPI: {
          enabled: true,
          description: 'Mantiene la misma interfaz pública',
          benefits: ['No requiere cambios en código existente', 'Migración transparente']
        },
        modularArchitecture: {
          enabled: true,
          description: 'Arquitectura interna modular',
          benefits: ['Facilita debugging', 'Mejor escalabilidad', 'Testing más específico']
        }
      }
    };
  }
}

// Crear y exportar instancia singleton
const inventoryService = new InventoryService();

export { InventoryService };
export default inventoryService;