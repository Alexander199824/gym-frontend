// src/services/apiService.js
// ARCHIVO PRINCIPAL - MANTIENE LA MISMA INTERFAZ EXACTA PARA NO ROMPER NADA
// AHORA ORGANIZADO EN MÓDULOS SEPARADOS + GESTIÓN DE HORARIOS

// ================================
// 📁 IMPORTACIONES DE MÓDULOS
// ================================
import { BaseService } from './baseService.js';
import { AuthService } from './authService.js';
import { GymService } from './gymService.js';
import { UserService } from './userService.js';
import { StoreService } from './storeService.js';
import { StripeService } from './stripeService.js';
import scheduleService from './scheduleService.js';

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
    this.scheduleService = scheduleService; // Usar instancia singleton
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
  
  // 💰 MÉTODOS DE PAGOS
  async getPayments(params = {}) {
    return this.userService.getPayments(params);
  }
  
  async getPaymentReports(params = {}) {
    return this.userService.getPaymentReports(params);
  }
  
  async createPaymentFromOrder(orderData) {
    return this.userService.createPaymentFromOrder(orderData);
  }
  
  async getPendingTransfers() {
    return this.userService.getPendingTransfers();
  }
  
  async createSimplePayment(paymentData) {
    return this.userService.createSimplePayment(paymentData);
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA - DELEGACIÓN A storeService
  // ================================
  
  async getFeaturedProducts() {
    return this.storeService.getFeaturedProducts();
  }
  
  async getProducts(params = {}) {
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
  // 📅 NUEVOS MÉTODOS DE GESTIÓN DE HORARIOS - DELEGACIÓN A scheduleService
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
}

// ================================
// 🏭 EXPORTAR INSTANCIA SINGLETON
// ================================
const apiService = new ApiService();

export default apiService;

// ✅ GESTIÓN DE HORARIOS AGREGADA AL SERVICIO PRINCIPAL
// 
// 📁 ARCHIVOS RELACIONADOS:
// 1. scheduleService.js - Servicio especializado para gestión de horarios
// 2. membershipService.js - Actualizado con métodos de horarios
// 3. apiService.js - Archivo principal con delegación a servicios
// 
// ✅ NUEVOS MÉTODOS DISPONIBLES:
// - getCurrentSchedule(): Horarios actuales del cliente
// - getAvailableScheduleOptions(): Opciones disponibles por día
// - changeClientSchedule(): Modificar horarios con validación
// - cancelScheduleSlot(): Cancelar horario específico
// - getScheduleStats(): Estadísticas de uso
// - previewScheduleChanges(): Vista previa antes de confirmar
// - validateScheduleChanges(): Validación de datos
// - formatScheduleForDisplay(): Formateo para UI
// - Cache y utilidades para optimización
// 
// ✅ ENDPOINTS INTEGRADOS:
// - GET /api/memberships/my-schedule
// - GET /api/memberships/my-schedule/available-options
// - POST /api/memberships/my-schedule/change
// - DELETE /api/memberships/my-schedule/{day}/{slotId}
// - GET /api/memberships/my-schedule/stats
// - POST /api/memberships/my-schedule/preview-change
// 
// 🔄 COMPATIBILIDAD TOTAL:
// - Mantiene todos los métodos existentes sin cambios
// - Agrega nuevos métodos de forma no invasiva
// - Misma importación y uso que antes
// - No rompe funcionalidad existente
// 
// 🚀 USO EN COMPONENTES:
// import apiService from './services/apiService.js'
// 
// const horarios = await apiService.getCurrentSchedule()
// const opciones = await apiService.getAvailableScheduleOptions()
// await apiService.changeClientSchedule(cambios)
// await apiService.cancelScheduleSlot('monday', 123)
// const stats = await apiService.getScheduleStats()
// 
// 📱 INTEGRACIÓN CON REACT QUERY:
// const { data } = useQuery({
//   queryKey: ['currentSchedule'],
//   queryFn: () => apiService.getCurrentSchedule()
// })
// 
// const mutation = useMutation({
//   mutationFn: (changes) => apiService.changeClientSchedule(changes)
// })
// 
// ✅ BENEFICIOS:
// - Gestión completa de horarios integrada
// - Misma interfaz consistente del apiService
// - Validaciones y formateo incluidos
// - Sistema de cache para optimización
// - Manejo de errores específicos
// - Compatibilidad total con código existente
// ✅ SEPARACIÓN MODULAR COMPLETADA
// 
// 📁 ARCHIVOS CREADOS:
// 1. apiConfig.js - Configuración de axios e interceptors
// 2. baseService.js - Métodos CRUD base y utilidades
// 3. authService.js - Autenticación y perfil de usuario
// 4. gymService.js - Gimnasio y sistema de horarios flexibles
// 5. userService.js - Gestión de usuarios y membresías
// 6. storeService.js - Tienda, carrito y órdenes
// 7. stripeService.js - Integración con Stripe y pagos
// 8. apiService.js - Archivo principal que mantiene la interfaz exacta
// 
// ✅ BENEFICIOS OBTENIDOS:
// - Código más organizado y mantenible
// - Separación clara de responsabilidades
// - Archivos más pequeños y enfocados
// - Fácil debugging y testing individual
// - Reutilización de servicios
// - Misma interfaz externa (no rompe nada)
// 
// 🔄 COMPATIBILIDAD TOTAL:
// - Todos los componentes existentes siguen funcionando
// - Misma importación: import apiService from './services/apiService.js'
// - Mismos métodos disponibles
// - Misma funcionalidad
// - Sin cambios en el resto del proyecto
// 
// 🚀 INSTRUCCIONES DE USO:
// 1. Crear los 8 archivos en src/services/
// 2. Reemplazar el apiService.js original
// 3. Todo sigue funcionando igual
// 4. Ahora puedes modificar módulos individuales sin afectar otros