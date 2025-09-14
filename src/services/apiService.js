// src/services/apiService.js
// ARCHIVO PRINCIPAL ACTUALIZADO CON NUEVA GESTIÓN DE PAGOS

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
    this.paymentService = paymentService; // 🆕 SERVICIO ACTUALIZADO
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


}

// ================================
// 🏭 EXPORTAR INSTANCIA SINGLETON
// ================================
const apiService = new ApiService();

export default apiService;

// ✅ GESTIÓN DE PAGOS MEJORADA AGREGADA AL SERVICIO PRINCIPAL
// 
// 📁 ARCHIVOS RELACIONADOS:
// 1. paymentService.js - Servicio especializado actualizado con rutas del manual
// 2. apiService.js - Archivo principal con delegación mejorada (este archivo)
// 
// ✅ MÉTODOS ACTUALIZADOS DISPONIBLES:
// 
// 📊 DASHBOARD FINANCIERO:
// - getFinancialDashboard(): Dashboard financiero completo (GET /api/financial/dashboard)
// - getPendingPaymentsDashboard(): Dashboard de pendientes (GET /api/payments/pending-dashboard) 
// - getPendingPaymentsDashboardWithCache(): Con cache optimizado
// 
// 📈 ESTADÍSTICAS Y REPORTES:
// - getPaymentStatistics(): Estadísticas por período (GET /api/payments/statistics)
// - getPaymentReports(): Reportes predefinidos (GET /api/payments/reports?period=xxx)
// - exportPaymentReport(): Exportar reportes en CSV/PDF
// 
// 🏦 TRANSFERENCIAS BANCARIAS:
// - getPendingTransfersDetailed(): Transferencias con detalles (GET /api/payments/transfers/pending-detailed)
// - getPendingTransfersBasic(): Transferencias básicas (GET /api/payments/transfers/pending)
// - validateTransfer(): Aprobar transferencia (POST /api/payments/:id/validate-transfer)
// - rejectTransfer(): Rechazar transferencia (POST /api/payments/:id/reject-transfer)
// 
// 💵 MEMBRESÍAS EN EFECTIVO:
// - getPendingCashMemberships(): Membresías esperando pago en efectivo
// - activateCashMembership(): Activar membresía (POST /api/payments/activate-cash-membership)
// 
// 💳 PAGOS REGULARES:
// - getPayments(): Lista de pagos con filtros
// - createPayment(): Crear nuevo pago
// - updatePayment(): Actualizar pago existente
// - getPaymentById(): Obtener pago específico
// 
// 🔧 UTILIDADES Y CONFIGURACIONES:
// - getTransferPriorityConfig(): Configuración de prioridades por tiempo
// - getPaymentMethodConfig(): Configuración de métodos de pago
// - getPaymentStatusConfig(): Configuración de estados
// - getPaymentTypeConfig(): Configuración de tipos
// - validatePaymentData(): Validación completa de datos
// - formatPaymentDataForAPI(): Formateo para backend
// 
// 🗃️ CACHE Y OPTIMIZACIÓN:
// - invalidatePaymentCache(): Limpiar cache
// - getCachedPaymentData(): Obtener del cache
// - setCachedPaymentData(): Guardar en cache
// 
// 🛠️ DEBUGGING:
// - debugPaymentSystem(): Debug completo del sistema de pagos
// - paymentHealthCheck(): Verificar conectividad
// - getPaymentServiceInfo(): Información del servicio
// - debugAllSystems(): Debug de todos los sistemas
// 
// ✅ RUTAS IMPLEMENTADAS SEGÚN EL MANUAL:
// - GET /api/financial/dashboard
// - GET /api/payments/statistics  
// - GET /api/payments/reports?period={period}
// - GET /api/payments/pending-dashboard
// - GET /api/payments/transfers/pending-detailed
// - POST /api/payments/{id}/validate-transfer
// - POST /api/payments/{id}/reject-transfer
// - POST /api/payments/activate-cash-membership
// 
// 🔄 COMPATIBILIDAD TOTAL:
// - Mantiene todos los métodos existentes sin cambios
// - Agrega nuevos métodos con rutas correctas del manual
// - Misma importación y uso: import apiService from './services/apiService.js'
// - No rompe funcionalidad existente
// - PaymentsManager funciona perfectamente con las nuevas rutas
// 
// 🚀 USO ACTUALIZADO EN COMPONENTES:
// import apiService from './services/apiService.js'
// 
// // Dashboard financiero
// const dashboard = await apiService.getFinancialDashboard()
// 
// // Estadísticas con período
// const stats = await apiService.getPaymentStatistics('2024-01-01', '2024-01-31')
// 
// // Reportes predefinidos
// const monthlyReport = await apiService.getPaymentReports('month')
// const weeklyReport = await apiService.getPaymentReports('week')
// const todayReport = await apiService.getPaymentReports('today')
// 
// // Transferencias pendientes
// const transfers = await apiService.getPendingTransfersDetailed()
// const urgentTransfers = await apiService.getPendingTransfersDetailed(72) // +72 horas
// 
// // Validar transferencia
// await apiService.validateTransfer(paymentId, true, 'Comprobante válido')
// await apiService.rejectTransfer(paymentId, 'Comprobante no válido')
// 
// // Membresías en efectivo
// const cashMemberships = await apiService.getPendingCashMemberships()
// await apiService.activateCashMembership(membershipId)
// 
// // Configuraciones para UI
// const priorityConfig = apiService.getTransferPriorityConfig(48) // 48 horas
// const methodConfig = apiService.getPaymentMethodConfig('transfer')
// 
// 📱 INTEGRACIÓN PERFECTA CON REACT QUERY:
// const { data: dashboard } = useQuery({
//   queryKey: ['financialDashboard'],
//   queryFn: () => apiService.getFinancialDashboard()
// })
// 
// const { data: stats } = useQuery({
//   queryKey: ['paymentStats', period],
//   queryFn: () => apiService.getPaymentReports(period),
//   enabled: !!period
// })
// 
// const validateMutation = useMutation({
//   mutationFn: ({paymentId, approved, notes}) => 
//     apiService.validateTransfer(paymentId, approved, notes),
//   onSuccess: () => {
//     queryClient.invalidateQueries(['pendingTransfers'])
//   }
// })
// 
// ✅ BENEFICIOS DE LA ACTUALIZACIÓN:
// - Rutas correctas según el manual oficial
// - Manejo robusto de errores con fallbacks
// - Sistema de cache inteligente
// - Validaciones completas
// - Configuraciones de UI integradas
// - Debugging avanzado
// - Compatibilidad total con código existente
// - Soporte completo para quetzales guatemaltecos
// - Optimización de rendimiento
// - Trazabilidad completa de transacciones
// 
// El PaymentsManager ahora puede usar todas estas funciones mejoradas
// con las rutas correctas del manual, manteniendo el mismo diseño
// pero con funcionalidad completamente operativa.