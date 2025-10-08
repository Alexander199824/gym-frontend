// src/services/apiService.js
// ARCHIVO PRINCIPAL COMPLETO CON ESTADÍSTICAS
// PARTE 1/2 - Copiar junto con Parte 2

// ================================
// 📁 IMPORTACIONES DE MÓDULOS
// ================================
import { BaseService } from './baseService.js';
import { AuthService } from './authService.js';
import { GymService } from './gymService.js';
import { UserService } from './userService.js';
import { StoreService } from './storeService.js';
import { StripeService } from './stripeService.js';
import paymentService from './paymentService.js'; 
import scheduleService from './scheduleService.js';
import inventoryService from './inventoryService.js';
import statisticsService from './statisticsService.js';
import testimonialService from './testimonialService.js';

// ================================
// 🏠 CLASE PRINCIPAL DEL SERVICIO API
// ================================
class ApiService extends BaseService {
  constructor() {
    super();
    
    // ✅ INSTANCIAR TODOS LOS SERVICIOS MODULARES
    this.authService = new AuthService();
    this.gymService = new GymService();
    this.userService = new UserService();
    this.storeService = new StoreService();
    this.stripeService = new StripeService();
    this.paymentService = paymentService;
    this.scheduleService = scheduleService;
    this.inventoryService = inventoryService;
    this.statisticsService = statisticsService; 
    this.testimonialService = testimonialService;

  }

  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN - DELEGACIÓN A authService
  // ================================
  
  async login(credentials) {
    return this.authService.login(credentials);
  }
  
  async register(userData) {
    return this.authService.register(userData);
  }
  
  async getProfile() {
    return this.authService.getProfile();
  }
  
  async updateProfile(profileData) {
    return this.authService.updateProfile(profileData);
  }
  
  async updateProfileField(fieldName, fieldValue) {
    return this.authService.updateProfileField(fieldName, fieldValue);
  }
  
  validateProfileData(profileData) {
    return this.authService.validateProfileData(profileData);
  }
  
  async uploadProfileImage(formData) {
    return this.authService.uploadProfileImage(formData);
  }
  
  async changePassword(passwordData) {
    return this.authService.changePassword(passwordData);
  }
  
  async updatePreferences(preferences) {
    return this.authService.updatePreferences(preferences);
  }
  
  async checkProfileEndpoints() {
    return this.authService.checkProfileEndpoints();
  }
  
  async debugProfileSystem() {
    return this.authService.debugProfileSystem();
  }

  // ================================
  // 🏢 MÉTODOS DE GIMNASIO - DELEGACIÓN A gymService
  // ================================
  
  async getGymConfig() {
    return this.gymService.getGymConfig();
  }
  
  async getGymStats() {
    return this.gymService.getGymStats();
  }
  
  async getGymServices() {
    return this.gymService.getGymServices();
  }
  
  async getMembershipPlans() {
    return this.gymService.getMembershipPlans();
  }
  
  async getTestimonials() {
    return this.gymService.getTestimonials();
  }
  
  async getGymVideo() {
    return this.gymService.getGymVideo();
  }
  
  async getSectionsContent() {
    return this.gymService.getSectionsContent();
  }
  
  async getNavigation() {
    return this.gymService.getNavigation();
  }
  
  async getPromotions() {
    return this.gymService.getPromotions();
  }
  
  async getBranding() {
    return this.gymService.getBranding();
  }
  
  async getLandingContent() {
    return this.gymService.getLandingContent();
  }
  
  // 🆕 MÉTODOS DE HORARIOS FLEXIBLES
  async getGymConfigEditor() {
    return this.gymService.getGymConfigEditor();
  }
  
  async saveFlexibleSchedule(scheduleData) {
    return this.gymService.saveFlexibleSchedule(scheduleData);
  }
  
  async getCapacityMetrics() {
    return this.gymService.getCapacityMetrics();
  }
  
  async toggleDayOpen(day) {
    return this.gymService.toggleDayOpen(day);
  }
  
  async addTimeSlot(day, slotData) {
    return this.gymService.addTimeSlot(day, slotData);
  }
  
  async removeTimeSlot(day, slotIndex) {
    return this.gymService.removeTimeSlot(day, slotIndex);
  }
  
  async updateTimeSlot(day, slotIndex, field, value) {
    return this.gymService.updateTimeSlot(day, slotIndex, field, value);
  }
  
  async duplicateTimeSlot(day, slotIndex) {
    return this.gymService.duplicateTimeSlot(day, slotIndex);
  }
  
  async applyCapacityToAllSlots(capacity) {
    return this.gymService.applyCapacityToAllSlots(capacity);
  }
  
  async saveGymConfigSection(section, data) {
    return this.gymService.saveGymConfigSection(section, data);
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS - DELEGACIÓN A statisticsService
  // ================================

  /**
   * Obtener todas las estadísticas (admin)
   */
  async getAllStatistics() {
    return this.statisticsService.getAllStatistics();
  }

  /**
   * Obtener estadísticas activas (público)
   */
  async getActiveStatistics() {
    return this.statisticsService.getActiveStatistics();
  }

  /**
   * Crear nueva estadística
   */
  async createStatistic(statisticData) {
    return this.statisticsService.createStatistic(statisticData);
  }

  /**
   * Actualizar estadística existente
   */
  async updateStatistic(id, updates) {
    return this.statisticsService.updateStatistic(id, updates);
  }

  /**
   * Eliminar estadística
   */
  async deleteStatistic(id) {
    return this.statisticsService.deleteStatistic(id);
  }

  /**
   * Activar o desactivar estadística
   */
  async toggleStatistic(id) {
    return this.statisticsService.toggleStatistic(id);
  }

  /**
   * Reordenar múltiples estadísticas
   */
  async reorderStatistics(orderData) {
    return this.statisticsService.reorderStatistics(orderData);
  }

  /**
   * Crear estadísticas predeterminadas del sistema
   */
  async seedDefaultStatistics() {
    return this.statisticsService.seedDefaultStatistics();
  }

  /**
   * Obtener colores disponibles para estadísticas
   */
  getAvailableStatisticColors() {
    return this.statisticsService.getAvailableColors();
  }

  /**
   * Obtener iconos disponibles para estadísticas
   */
  getAvailableStatisticIcons() {
    return this.statisticsService.getAvailableIcons();
  }

  /**
   * Obtener sufijos comunes para estadísticas
   */
  getCommonStatisticSuffixes() {
    return this.statisticsService.getCommonSuffixes();
  }

  /**
   * Generar key única desde label
   */
  generateStatisticKey(label) {
    return this.statisticsService.generateKey(label);
  }

  /**
   * Validar datos de estadística
   */
  validateStatisticData(data) {
    return this.statisticsService.validateStatisticData(data);
  }


// ================================
// 💬 MÉTODOS DE TESTIMONIOS - DELEGACIÓN A testimonialService
// ================================

/**
 * Obtener todos los testimonios (admin)
 */
async getAllTestimonials(params = {}) {
  return this.testimonialService.getAllTestimonials(params);
}

/**
 * Obtener testimonios públicos
 */
async getPublicTestimonials() {
  return this.testimonialService.getPublicTestimonials();
}

/**
 * Obtener testimonios pendientes
 */
async getPendingTestimonials() {
  return this.testimonialService.getPendingTestimonials();
}

/**
 * Obtener mis testimonios
 */
async getMyTestimonials() {
  return this.testimonialService.getMyTestimonials();
}

/**
 * Obtener detalles de testimonio
 */
async getTestimonialDetails(testimonialId) {
  return this.testimonialService.getTestimonialDetails(testimonialId);
}

/**
 * Obtener estadísticas de testimonios
 */
async getTestimonialStats() {
  return this.testimonialService.getTestimonialStats();
}

/**
 * Crear testimonio (cliente)
 */
async createTestimonial(testimonialData) {
  return this.testimonialService.createTestimonial(testimonialData);
}

/**
 * Crear testimonio (admin)
 */
async createTestimonialAdmin(testimonialData) {
  return this.testimonialService.createTestimonialAdmin(testimonialData);
}

/**
 * Actualizar testimonio
 */
async updateTestimonial(testimonialId, updates) {
  return this.testimonialService.updateTestimonial(testimonialId, updates);
}

/**
 * Aprobar testimonio
 */
async approveTestimonial(testimonialId, approvalData = {}) {
  return this.testimonialService.approveTestimonial(testimonialId, approvalData);
}

/**
 * Toggle estado activo
 */
async toggleTestimonialActive(testimonialId) {
  return this.testimonialService.toggleActive(testimonialId);
}

/**
 * Toggle estado destacado
 */
async toggleTestimonialFeatured(testimonialId) {
  return this.testimonialService.toggleFeatured(testimonialId);
}

/**
 * Eliminar testimonio
 */
async deleteTestimonial(testimonialId) {
  return this.testimonialService.deleteTestimonial(testimonialId);
}

/**
 * Validar datos de testimonio
 */
validateTestimonialData(testimonialData) {
  return this.testimonialService.validateTestimonialData(testimonialData);
}

/**
 * Formatear datos de testimonio
 */
formatTestimonialDataForAPI(testimonialData) {
  return this.testimonialService.formatTestimonialDataForAPI(testimonialData);
}




  // ================================
  // 👥 MÉTODOS DE USUARIOS - DELEGACIÓN A userService
  // ================================
  
  async getUsers(params = {}) {
    return this.userService.getUsers(params);
  }
  
  async getClientUsers(params = {}) {
    return this.userService.getClientUsers(params);
  }
  
  async getUsersByCurrentUserRole(currentUserRole, params = {}) {
    return this.userService.getUsersByCurrentUserRole(currentUserRole, params);
  }
  
  async createUser(userData, currentUserRole = null) {
    return this.userService.createUser(userData, currentUserRole);
  }
  
  async updateUser(userId, userData, currentUserRole = null, currentUserId = null) {
    return this.userService.updateUser(userId, userData, currentUserRole, currentUserId);
  }
  
  async deleteUser(userId, currentUserRole = null, currentUserId = null) {
    return this.userService.deleteUser(userId, currentUserRole, currentUserId);
  }
  
  async getUserStats(currentUserRole = null) {
    return this.userService.getUserStats(currentUserRole);
  }
  
  // 🎫 MÉTODOS DE MEMBRESÍAS
  async getMemberships(params = {}) {
    return this.userService.getMemberships(params);
  }
  
  async getMembershipStats() {
    return this.userService.getMembershipStats();
  }
  
  async getExpiredMemberships(days = 0) {
    return this.userService.getExpiredMemberships(days);
  }
  
  async getExpiringSoonMemberships(days = 7) {
    return this.userService.getExpiringSoonMemberships(days);
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA - DELEGACIÓN A storeService
  // ================================
  
  async getFeaturedProducts() {
    return this.storeService.getFeaturedProducts();
  }
  
  // 🆕 MANTENEMOS COMPATIBILIDAD PERO DELEGAMOS A INVENTORY SERVICE
  async getProducts(params = {}) {
    // Si es para gestión (parámetros de admin), usar inventoryService
    if (params.management || params.admin) {
      return this.inventoryService.getProducts(params);
    }
    // Si es para tienda pública, usar storeService
    return this.storeService.getProducts(params);
  }
  
  async getProductCategories() {
    return this.storeService.getProductCategories();
  }
  
  async getProductBrands() {
    return this.storeService.getProductBrands();
  }
  
  async getProductById(productId) {
    return this.storeService.getProductById(productId);
  }
  
  // 🛒 MÉTODOS DEL CARRITO
  async getCart(sessionId = null) {
    return this.storeService.getCart(sessionId);
  }
  
  async addToCart(productData, sessionId = null) {
    return this.storeService.addToCart(productData, sessionId);
  }
  
  async updateCartItemQuantity(cartItemId, quantity, sessionId = null) {
    return this.storeService.updateCartItemQuantity(cartItemId, quantity, sessionId);
  }
  
  async removeFromCart(cartItemId, sessionId = null) {
    return this.storeService.removeFromCart(cartItemId, sessionId);
  }
  
  async clearCart(sessionId = null) {
    return this.storeService.clearCart(sessionId);
  }
  
  async updateCart(items) {
    return this.storeService.updateCart(items);
  }
  
  async getCartSummary(sessionId = null) {
    return this.storeService.getCartSummary(sessionId);
  }
  
  async validateCart(sessionId = null) {
    return this.storeService.validateCart(sessionId);
  }
  
  async getCartItem(cartItemId, sessionId = null) {
    return this.storeService.getCartItem(cartItemId, sessionId);
  }
  
  // 🛍️ MÉTODOS DE ÓRDENES
  async createOrder(orderData) {
    return this.storeService.createOrder(orderData);
  }
  
  async getMyOrders(params = {}) {
    return this.storeService.getMyOrders(params);
  }
  
  async getOrderById(orderId) {
    return this.storeService.getOrderById(orderId);
  }
  
  validateOrderData(orderData) {
    return this.storeService.validateOrderData(orderData);
  }
  
  formatOrderDataForAPI(orderData) {
    return this.storeService.formatOrderDataForAPI(orderData);
  }
  
  async processCheckout(orderData) {
    return this.storeService.processCheckout(orderData);
  }
  
  // 💬 MÉTODOS DE TESTIMONIOS
  async createTestimonial(testimonialData) {
    return this.storeService.createTestimonial(testimonialData);
  }
  
  async getMyTestimonials() {
    return this.storeService.getMyTestimonials();
  }
  
  validateTestimonialData(testimonialData) {
    return this.storeService.validateTestimonialData(testimonialData);
  }
  
  formatTestimonialDataForAPI(testimonialData) {
    return this.storeService.formatTestimonialDataForAPI(testimonialData);
  }
  
  async submitTestimonial(testimonialData) {
    return this.storeService.submitTestimonial(testimonialData);
  }
  
  async debugCartAndCheckoutSystem() {
    return this.storeService.debugCartAndCheckoutSystem();
  }

 // ================================
  // 📦 MÉTODOS DE INVENTARIO Y GESTIÓN - DELEGACIÓN A inventoryService
  // ================================

  // 📊 ESTADÍSTICAS E INVENTARIO
  async getInventoryStats(period = 'month') {
    return this.inventoryService.getInventoryStats(period);
  }

  async getInventoryDashboard() {
    return this.inventoryService.getInventoryDashboard();
  }

  async getFinancialReport(startDate, endDate) {
    return this.inventoryService.getFinancialReport(startDate, endDate);
  }

  async getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  async getEmployeePerformance(startDate, endDate) {
    return this.inventoryService.getEmployeePerformance(startDate, endDate);
  }

  // 📦 GESTIÓN DE PRODUCTOS (ADMIN)
  async getManagementProducts(params = {}) {
    return this.inventoryService.getProducts(params);
  }

  async getManagementProductById(productId) {
    return this.inventoryService.getProductById(productId);
  }

  async createProduct(productData) {
    return this.inventoryService.createProduct(productData);
  }

  async updateProduct(productId, productData) {
    return this.inventoryService.updateProduct(productId, productData);
  }

  async updateProductStock(productId, stockData) {
    return this.inventoryService.updateProductStock(productId, stockData);
  }

  async updateBulkStock(updates) {
    return this.inventoryService.updateBulkStock(updates);
  }

  async deleteProduct(productId) {
    return this.inventoryService.deleteProduct(productId);
  }

  async duplicateProduct(productId, newData = {}) {
    return this.inventoryService.duplicateProduct(productId, newData);
  }

  async getProductStats() {
    return this.inventoryService.getProductStats();
  }

  // 🖼️ GESTIÓN DE IMÁGENES
  async getProductImages(productId) {
    return this.inventoryService.getProductImages(productId);
  }

  async uploadProductImage(productId, imageFile, options = {}) {
    return this.inventoryService.uploadProductImage(productId, imageFile, options);
  }

  async uploadMultipleProductImages(productId, imageFiles) {
    return this.inventoryService.uploadMultipleProductImages(productId, imageFiles);
  }

  async updateProductImage(productId, imageId, imageData) {
    return this.inventoryService.updateProductImage(productId, imageId, imageData);
  }

  async deleteProductImage(productId, imageId) {
    return this.inventoryService.deleteProductImage(productId, imageId);
  }

  async reorderProductImages(productId, imageOrders) {
    return this.inventoryService.reorderProductImages(productId, imageOrders);
  }

  async setPrimaryProductImage(productId, imageId) {
    return this.inventoryService.setPrimaryProductImage(productId, imageId);
  }

  // 🏷️ GESTIÓN DE MARCAS
  async getBrands(params = {}) {
    return this.inventoryService.getBrands(params);
  }

  async createBrand(brandData) {
    return this.inventoryService.createBrand(brandData);
  }

  async updateBrand(brandId, brandData) {
    return this.inventoryService.updateBrand(brandId, brandData);
  }

  async deleteBrand(brandId) {
    return this.inventoryService.deleteBrand(brandId);
  }

  async searchBrands(query) {
    return this.inventoryService.searchBrands(query);
  }

  async getBrandStats() {
    return this.inventoryService.getBrandStats();
  }

  // 📂 GESTIÓN DE CATEGORÍAS
  async getCategories(params = {}) {
    return this.inventoryService.getCategories(params);
  }

  async createCategory(categoryData) {
    return this.inventoryService.createCategory(categoryData);
  }

  async updateCategory(categoryId, categoryData) {
    return this.inventoryService.updateCategory(categoryId, categoryData);
  }

  async deleteCategory(categoryId) {
    return this.inventoryService.deleteCategory(categoryId);
  }

  async reorderCategories(categoryOrders) {
    return this.inventoryService.reorderCategories(categoryOrders);
  }

  async searchCategories(query) {
    return this.inventoryService.searchCategories(query);
  }

  async getCategoryBySlug(slug) {
    return this.inventoryService.getCategoryBySlug(slug);
  }

  async getCategoryStats() {
    return this.inventoryService.getCategoryStats();
  }

  // 💰 VENTAS LOCALES
  async getLocalSales(params = {}) {
    return this.inventoryService.getLocalSales(params);
  }

  async createCashSale(saleData) {
    return this.inventoryService.createCashSale(saleData);
  }

  async createTransferSale(saleData) {
    return this.inventoryService.createTransferSale(saleData);
  }

  async confirmTransfer(saleId, notes = '') {
    return this.inventoryService.confirmTransfer(saleId, notes);
  }

  async getPendingTransfers() {
    return this.inventoryService.getPendingTransfers();
  }

  async searchProductsForSale(query, limit = 10) {
    return this.inventoryService.searchProductsForSale(query, limit);
  }

  async getDailySalesReport(date) {
    return this.inventoryService.getDailySalesReport(date);
  }

  async getMySalesStats() {
    return this.inventoryService.getMySalesStats();
  }

  // 🛍️ TIENDA PÚBLICA
  async getPublicProducts(params = {}) {
    return this.inventoryService.getPublicProducts(params);
  }

  async getFeaturedPublicProducts(limit = 8) {
    return this.inventoryService.getFeaturedProducts(limit);
  }

  async getPublicProductById(productId) {
    return this.inventoryService.getPublicProductById(productId);
  }

  async getPublicCategories() {
    return this.inventoryService.getPublicCategories();
  }

  async getPublicBrands() {
    return this.inventoryService.getPublicBrands();
  }

  // 🔧 UTILIDADES DE INVENTARIO
  validateProductData(productData) {
    return this.inventoryService.validateProductData(productData);
  }

  formatProductDataForAPI(productData) {
    return this.inventoryService.formatProductDataForAPI(productData);
  }

  // ================================
  // 💳 MÉTODOS DE STRIPE - DELEGACIÓN A stripeService
  // ================================
  
  async getStripeConfig() {
    return this.stripeService.getStripeConfig();
  }
  
  async handleStripeWebhook(webhookData) {
    return this.stripeService.handleStripeWebhook(webhookData);
  }
  
  async getStripePayments(params = {}) {
    return this.stripeService.getStripePayments(params);
  }
  
  async cancelStripePaymentIntent(paymentIntentId) {
    return this.stripeService.cancelStripePaymentIntent(paymentIntentId);
  }
  
  async getStripePaymentMethods(customerId) {
    return this.stripeService.getStripePaymentMethods(customerId);
  }
  
  async createStripeCustomer(customerData) {
    return this.stripeService.createStripeCustomer(customerData);
  }
  
  async checkStripeHealth() {
    return this.stripeService.checkStripeHealth();
  }
  
  async createMembershipPaymentIntent(membershipData) {
    return this.stripeService.createMembershipPaymentIntent(membershipData);
  }
  
  async createDailyPaymentIntent(dailyData) {
    return this.stripeService.createDailyPaymentIntent(dailyData);
  }
  
  async createStorePaymentIntent(storeData) {
    return this.stripeService.createStorePaymentIntent(storeData);
  }
  
  async confirmStripePayment(paymentData) {
    return this.stripeService.confirmStripePayment(paymentData);
  }
  
  async createStripeRefund(refundData) {
    return this.stripeService.createStripeRefund(refundData);
  }
  
  async getStripeStatus() {
    return this.stripeService.getStripeStatus();
  }

  // ================================
  // 📅 MÉTODOS DE GESTIÓN DE HORARIOS - DELEGACIÓN A scheduleService
  // ================================

  // OBTENER: Horarios actuales del cliente autenticado
  async getCurrentSchedule() {
    return this.scheduleService.getCurrentSchedule();
  }

  // OBTENER: Opciones de horarios disponibles para reservar
  async getAvailableScheduleOptions(day = null) {
    return this.scheduleService.getAvailableOptions(day);
  }

  // CAMBIAR: Horarios seleccionados del cliente
  async changeClientSchedule(changes) {
    return this.scheduleService.changeSchedule(changes);
  }

  // CANCELAR: Horario específico por día y slot ID
  async cancelScheduleSlot(day, slotId) {
    return this.scheduleService.cancelSlot(day, slotId);
  }

  // OBTENER: Estadísticas de uso de horarios del cliente
  async getScheduleStats() {
    return this.scheduleService.getScheduleStats();
  }

  // PREVISUALIZAR: Cambios de horarios antes de confirmar
  async previewScheduleChanges(changes) {
    return this.scheduleService.previewChanges(changes);
  }

  // VALIDAR: Cambios de horarios antes de envío
  validateScheduleChanges(changes) {
    return this.scheduleService.validateChanges(changes);
  }

  // FORMATEAR: Horarios para visualización en UI
  formatScheduleForDisplay(schedule) {
    return this.scheduleService.formatScheduleForDisplay(schedule);
  }

  // CACHE: Métodos con cache para optimizar peticiones
  async getCurrentScheduleWithCache() {
    return this.scheduleService.getCurrentScheduleWithCache();
  }

  async getAvailableOptionsWithCache(day = null) {
    return this.scheduleService.getAvailableOptionsWithCache(day);
  }

  // CACHE: Invalidar cache después de cambios
  invalidateScheduleCache() {
    return this.scheduleService.invalidateCache();
  }

  // UTILIDADES: Helpers para trabajo con horarios
  isToday(day) {
    return this.scheduleService.isToday(day);
  }

  isPastTime(timeRange) {
    return this.scheduleService.isPastTime(timeRange);
  }

  formatTimeRange(timeRange) {
    return this.scheduleService.formatTimeRange(timeRange);
  }

  calculateLocalScheduleStats(schedule) {
    return this.scheduleService.calculateLocalStats(schedule);
  }

  // ================================
  // 🛠️ MÉTODOS DE DEBUGGING Y UTILIDADES
  // ================================

  // Debug completo del sistema
  async debugAllSystems() {
    console.log('\n🔍 DEBUGGING ALL SYSTEMS');
    console.log('=' .repeat(50));
    
    const results = {
      timestamp: new Date().toISOString(),
      systems: {}
    };
    
    try {
      // Debug inventario
      console.log('📦 Testing Inventory System...');
      results.systems.inventory = await this.inventoryService.debugInventorySystem();
      
      // Debug pagos
      console.log('💰 Testing Payment System...');
      results.systems.payments = await this.paymentService.debugPaymentSystem();
      
      // Health checks
      console.log('🏥 Running Health Checks...');
      results.systems.health = {
        inventory: await this.inventoryService.healthCheck(),
        payments: await this.paymentService.paymentHealthCheck()
      };
      
      console.log('\n✅ DEBUG COMPLETE');
      return results;
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      results.error = error.message;
      return results;
    }
  }

  // Información de todos los servicios
  getServicesInfo() {
    return {
      version: '2.0.0',
      services: {
        auth: this.authService.constructor.name,
        gym: this.gymService.constructor.name,
        user: this.userService.constructor.name,
        store: this.storeService.constructor.name,
        stripe: this.stripeService.constructor.name,
        payments: 'PaymentService',
        schedule: 'ScheduleService',
        inventory: this.inventoryService.constructor.name,
        statistics: this.statisticsService.constructor.name // 🆕 ESTADÍSTICAS
      },
      features: [
        'Autenticación JWT',
        'Gestión de usuarios y roles',
        'Configuración dinámica del gimnasio',
        'Tienda online completa',
        'Pagos con Stripe',
        'Gestión de horarios flexibles',
        'Sistema de inventario completo',
        'Ventas locales y transferencias',
        'Gestión de productos con imágenes',
        'Reportes financieros',
        'Estadísticas dinámicas personalizables', // 🆕 ESTADÍSTICAS
        'Cache inteligente',
        'Debug integrado'
      ],
      endpoints: {
        auth: '/api/auth/*',
        users: '/api/users/*',
        gym: '/api/gym/*',
        store: '/api/store/*',
        payments: '/api/payments/*',
        schedule: '/api/schedule/*',
        inventory: '/api/inventory/*',
        management: '/api/store/management/*',
        localSales: '/api/local-sales/*',
        statistics: '/api/statistics/*' // 🆕 ESTADÍSTICAS
      }
    };
  }

  // Health check general
  async healthCheck() {
    console.log('🏥 ApiService: Running comprehensive health check...');
    
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      services: {}
    };
    
    try {
      // Test de conectividad básica
      results.services.connectivity = await this.testConnectivity();
      
      // Health check de inventario
      results.services.inventory = await this.inventoryService.healthCheck();
      
      // Health check de pagos
      results.services.payments = await this.paymentService.paymentHealthCheck();
      
      // Determinar estado general
      const healthyServices = Object.values(results.services).filter(s => s.healthy).length;
      const totalServices = Object.keys(results.services).length;
      
      if (healthyServices === totalServices) {
        results.overall = 'healthy';
      } else if (healthyServices > totalServices / 2) {
        results.overall = 'degraded';
      } else {
        results.overall = 'unhealthy';
      }
      
      console.log(`🏥 Health check complete: ${results.overall} (${healthyServices}/${totalServices} services healthy)`);
      return results;
      
    } catch (error) {
      console.error('❌ Health check error:', error);
      results.overall = 'error';
      results.error = error.message;
      return results;
    }
  }

  // Test de conectividad básica
  async testConnectivity() {
    try {
      const response = await this.get('/api/health', { timeout: 3000 });
      return { healthy: true, responseTime: '< 3s' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // ================================
  // 🔄 MÉTODOS DE COMPATIBILIDAD PARA NO ROMPER CÓDIGO EXISTENTE
  // ================================

  // Mantener compatibilidad con código que llama a estos métodos sin el prefijo "inventory"
  async getRecentSales() {
    return this.getLocalSales({ limit: 10 });
  }

  async getInventoryProducts() {
    return this.getManagementProducts();
  }
}

// ================================
// 🏭 EXPORTAR INSTANCIA SINGLETON
// ================================
const apiService = new ApiService();

export default apiService;
// ✅ INVENTARIO Y TIENDA COMPLETAMENTE INTEGRADOS AL SERVICIO PRINCIPAL
// 
// 📁 ARCHIVOS RELACIONADOS:
// 1. inventoryService.js - Servicio especializado para inventario y tienda
// 2. apiService.js - Archivo principal con delegación completa (este archivo)
// 3. ProductsManager.js - Componente actualizado para usar rutas correctas
// 4. InventoryDashboard.js - Dashboard actualizado con conexión real al backend
// 
// ✅ RUTAS IMPLEMENTADAS SEGÚN EL MANUAL:
// 
// 📊 ESTADÍSTICAS E INVENTARIO:
// - GET /api/inventory/stats?period={period}
// - GET /api/inventory/dashboard
// - GET /api/inventory/financial-report?startDate=X&endDate=Y
// - GET /api/inventory/low-stock
// - GET /api/inventory/employee-performance?startDate=X&endDate=Y
// 
// 📦 GESTIÓN DE PRODUCTOS:
// - GET /api/store/management/products?page=1&limit=20&search=X&category=Y
// - GET /api/store/management/products/{id}
// - POST /api/store/management/products
// - PUT /api/store/management/products/{id}
// - PUT /api/store/management/products/{id}/stock
// - PUT /api/store/management/products/bulk-stock
// - DELETE /api/store/management/products/{id}
// - POST /api/store/management/products/{id}/duplicate
// - GET /api/store/management/products/stats
// 
// 🖼️ GESTIÓN DE IMÁGENES:
// - GET /api/store/management/products/{id}/images
// - POST /api/store/management/products/{id}/images?isPrimary=true&altText=X
// - POST /api/store/management/products/{id}/images/multiple
// - PUT /api/store/management/products/{id}/images/{imageId}
// - DELETE /api/store/management/products/{id}/images/{imageId}
// - PUT /api/store/management/products/{id}/images/reorder
// - PUT /api/store/management/products/{id}/images/{imageId}/primary
// 
// 🏷️ GESTIÓN DE MARCAS:
// - GET /api/store/management/brands?page=1&limit=20&search=X
// - POST /api/store/management/brands
// - PUT /api/store/management/brands/{id}
// - DELETE /api/store/management/brands/{id}
// - GET /api/store/management/brands/search?q=X
// - GET /api/store/management/brands/stats
// 
// 📂 GESTIÓN DE CATEGORÍAS:
// - GET /api/store/management/categories?page=1&limit=20
// - POST /api/store/management/categories
// - PUT /api/store/management/categories/{id}
// - DELETE /api/store/management/categories/{id}
// - PUT /api/store/management/categories/reorder
// - GET /api/store/management/categories/search?q=X
// - GET /api/store/management/categories/slug/{slug}
// - GET /api/store/management/categories/stats
// 
// 💰 VENTAS LOCALES:
// - GET /api/local-sales?page=1&limit=20&startDate=X&status=Y
// - POST /api/local-sales/cash
// - POST /api/local-sales/transfer
// - POST /api/local-sales/{id}/confirm-transfer
// - GET /api/local-sales/pending-transfers
// - GET /api/local-sales/products/search?q=X&limit=10
// - GET /api/local-sales/reports/daily?date=X
// - GET /api/local-sales/my-stats
// - GET /api/local-sales/{id}
// 
// 🛍️ TIENDA PÚBLICA:
// - GET /api/store/products?page=1&category=X&search=Y&minPrice=A&maxPrice=B
// - GET /api/store/products/featured?limit=8
// - GET /api/store/products/{id}
// - GET /api/store/categories
// - GET /api/store/brands
// - GET /api/store/search?q=X&category=Y&featured=true
// - GET /api/store/category/{slug}/products
// - GET /api/store/products/{id}/related?limit=4
// - GET /api/store/stats
// - POST /api/store/check-stock
// 
// 🚀 USO ACTUALIZADO EN COMPONENTES:
// import apiService from './services/apiService.js'
// 
// // Dashboard de inventario
// const stats = await apiService.getInventoryStats('month')
// const dashboard = await apiService.getInventoryDashboard()
// const lowStock = await apiService.getLowStockProducts()
// 
// // Gestión de productos
// const products = await apiService.getManagementProducts({ page: 1, limit: 20 })
// const newProduct = await apiService.createProduct(productData)
// await apiService.updateProduct(productId, updates)
// await apiService.deleteProduct(productId)
// 
// // Subida de imágenes
// await apiService.uploadProductImage(productId, imageFile, { isPrimary: true })
// await apiService.uploadMultipleProductImages(productId, [file1, file2])
// 
// // Gestión de categorías y marcas
// const categories = await apiService.getCategories()
// const brands = await apiService.getBrands()
// await apiService.createCategory(categoryData)
// await apiService.createBrand(brandData)
// 
// // Ventas locales
// const sales = await apiService.getLocalSales({ page: 1, limit: 20 })
// await apiService.createCashSale(saleData)
// await apiService.createTransferSale(saleData)
// await apiService.confirmTransfer(saleId, notes)
// 
// // Reportes
// const financialReport = await apiService.getFinancialReport(startDate, endDate)
// const dailyReport = await apiService.getDailySalesReport(date)
// const myStats = await apiService.getMySalesStats()
// 
// // Tienda pública
// const publicProducts = await apiService.getPublicProducts({ page: 1 })
// const featured = await apiService.getFeaturedPublicProducts(8)
// const product = await apiService.getPublicProductById(productId)
// 
// 🔧 UTILIDADES Y VALIDACIONES:
// const isValid = apiService.validateProductData(productData)
// const formatted = apiService.formatProductDataForAPI(productData)
// 
// 🛠️ DEBUGGING Y HEALTH CHECK:
// await apiService.debugAllSystems()
// await apiService.healthCheck()
// const info = apiService.getServicesInfo()
// 
// ✅ BENEFICIOS DE LA INTEGRACIÓN:
// - Rutas correctas según el manual oficial del backend
// - Conexión real con APIs funcionando
// - Manejo robusto de errores con fallbacks
// - Sistema de cache inteligente en inventoryService
// - Validaciones completas de datos
// - Notificaciones toast automáticas
// - Debugging avanzado integrado
// - Compatibilidad total con código existente
// - Subida de imágenes a Cloudinary funcionando
// - Soporte completo para quetzales guatemaltecos
// - Separación clara entre tienda pública y gestión admin
// - Sistema de roles y permisos integrado
// 
// El frontend ahora puede usar todas estas funciones con las rutas
// correctas del manual, manteniendo el mismo diseño pero con 
// funcionalidad completamente operativa conectada al backend real.