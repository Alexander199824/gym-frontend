// src/services/subPublicStoreService.js
// SUB-SERVICIO PARA TIENDA PÚBLICA

export class SubPublicStoreService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA PÚBLICA
  // ================================

  // Productos públicos (sin autenticación)
  async getPublicProducts(params = {}) {
    console.log('🛍️ SubPublicStoreService: Getting public products...', params);
    
    try {
      const response = await this.baseService.get('/api/store/products', { params });
      console.log('✅ Public products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public products:', error);
      throw error;
    }
  }

  // Productos destacados
  async getFeaturedProducts(limit = 8) {
    console.log('🛍️ SubPublicStoreService: Getting featured products...', { limit });
    
    try {
      const response = await this.baseService.get('/api/store/products/featured', {
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
    console.log('🛍️ SubPublicStoreService: Getting public product by ID...', { productId });
    
    try {
      const response = await this.baseService.get(`/api/store/products/${productId}`);
      console.log('✅ Public product by ID response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public product by ID:', error);
      throw error;
    }
  }

  // Categorías públicas
  async getPublicCategories() {
    console.log('🛍️ SubPublicStoreService: Getting public categories...');
    
    try {
      const response = await this.baseService.get('/api/store/categories');
      console.log('✅ Public categories response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public categories:', error);
      throw error;
    }
  }

  // Marcas públicas
  async getPublicBrands() {
    console.log('🛍️ SubPublicStoreService: Getting public brands...');
    
    try {
      const response = await this.baseService.get('/api/store/brands');
      console.log('✅ Public brands response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting public brands:', error);
      throw error;
    }
  }
}