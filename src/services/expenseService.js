// src/services/expenseService.js
// SERVICIO DE GASTOS - Gestión completa de gastos del gimnasio
// Autor: Alexander Echeverria
// ✅ RUTAS EXACTAS DEL TEST BACKEND

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';

class ExpenseService extends BaseService {
  
  // ================================
  // 📋 CONSULTAR GASTOS (GET)
  // ================================
  
  /**
   * Obtener todos los gastos con filtros y paginación
   * GET /api/expenses
   */
  async getAllExpenses(params = {}) {
    console.log('💰 FETCHING ALL EXPENSES...');
    console.log('📤 Params:', params);
    
    try {
      const result = await this.get('/expenses', { params });
      
      console.log('✅ EXPENSES RECEIVED:', {
        total: result.pagination?.total || result.data?.length || 0,
        page: result.pagination?.page,
        count: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET EXPENSES FAILED:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener gasto por ID
   * GET /api/expenses/:id
   */
  async getExpenseById(expenseId) {
    console.log(`💰 FETCHING EXPENSE BY ID: ${expenseId}...`);
    
    try {
      const result = await this.get(`/expenses/${expenseId}`);
      
      console.log('✅ EXPENSE FOUND:', {
        id: result.data?.id,
        title: result.data?.title,
        amount: result.data?.amount,
        status: result.data?.status
      });
      
      return result;
    } catch (error) {
      console.error(`❌ GET EXPENSE ${expenseId} FAILED:`, error.message);
      
      if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener gastos pendientes de aprobación
   * GET /api/expenses/pending/approval
   */
  async getPendingApproval(minAmount = 500) {
    console.log('⏳ FETCHING PENDING APPROVAL EXPENSES...');
    console.log('📤 Min amount:', minAmount);
    
    try {
      const result = await this.get('/expenses/pending/approval', {
        params: { minAmount }
      });
      
      console.log('✅ PENDING EXPENSES RECEIVED:', {
        count: result.count || result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET PENDING APPROVAL FAILED:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener gastos por categoría
   * GET /api/expenses/category/:category
   */
  async getExpensesByCategory(category, params = {}) {
    console.log(`📁 FETCHING EXPENSES BY CATEGORY: ${category}...`);
    console.log('📤 Params:', params);
    
    try {
      const result = await this.get(`/expenses/category/${category}`, { params });
      
      console.log('✅ CATEGORY EXPENSES RECEIVED:', {
        category,
        count: result.count || result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error(`❌ GET CATEGORY ${category} FAILED:`, error.message);
      throw error;
    }
  }
  
  /**
   * Obtener gastos recurrentes próximos
   * GET /api/expenses/recurring/upcoming
   */
  async getUpcomingRecurring(daysAhead = 7) {
    console.log('🔄 FETCHING UPCOMING RECURRING EXPENSES...');
    console.log('📤 Days ahead:', daysAhead);
    
    try {
      const result = await this.get('/expenses/recurring/upcoming', {
        params: { daysAhead }
      });
      
      console.log('✅ UPCOMING RECURRING RECEIVED:', {
        count: result.count || result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET UPCOMING RECURRING FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // ➕ CREAR Y ACTUALIZAR (POST/PUT)
  // ================================
  
  /**
   * Crear nuevo gasto
   * POST /api/expenses
   */
  async createExpense(expenseData) {
    console.log('💾 CREATING NEW EXPENSE...');
    console.log('📤 Expense data:', expenseData);
    
    try {
      // Validar datos requeridos
      if (!expenseData.title || !expenseData.title.trim()) {
        throw new Error('El título del gasto es obligatorio');
      }
      
      if (!expenseData.amount || isNaN(expenseData.amount)) {
        throw new Error('El monto del gasto es inválido');
      }
      
      if (!expenseData.category) {
        throw new Error('La categoría del gasto es obligatoria');
      }
      
      // Formatear datos para el backend
      const requestData = {
        title: expenseData.title.trim(),
        description: expenseData.description || '',
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        vendor: expenseData.vendor || undefined,
        invoiceNumber: expenseData.invoiceNumber || undefined,
        expenseDate: expenseData.expenseDate || undefined,
        paymentMethod: expenseData.paymentMethod || undefined,
        notes: expenseData.notes || undefined,
        attachments: expenseData.attachments || undefined,
        // Gastos recurrentes
        isRecurring: expenseData.isRecurring || false,
        recurringFrequency: expenseData.recurringFrequency || undefined,
        recurringEndDate: expenseData.recurringEndDate || undefined
      };
      
      const result = await this.post('/expenses', requestData);
      
      console.log('✅ EXPENSE CREATED:', {
        id: result.data?.id,
        title: result.data?.title,
        amount: result.data?.amount
      });
      
      if (result.success) {
        toast.success(result.message || 'Gasto creado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ CREATE EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.error('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación: Verifica los datos del gasto');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para crear gastos');
      } else {
        toast.error(error.message || 'Error al crear gasto');
      }
      
      throw error;
    }
  }
  
  /**
   * Actualizar gasto existente
   * PUT /api/expenses/:id
   */
  async updateExpense(expenseId, updateData) {
    console.log(`💾 UPDATING EXPENSE: ${expenseId}...`);
    console.log('📤 Update data:', updateData);
    
    try {
      // Formatear datos para actualización
      const requestData = {};
      
      if (updateData.title !== undefined) requestData.title = updateData.title.trim();
      if (updateData.description !== undefined) requestData.description = updateData.description;
      if (updateData.amount !== undefined) requestData.amount = parseFloat(updateData.amount);
      if (updateData.category !== undefined) requestData.category = updateData.category;
      if (updateData.vendor !== undefined) requestData.vendor = updateData.vendor;
      if (updateData.invoiceNumber !== undefined) requestData.invoiceNumber = updateData.invoiceNumber;
      if (updateData.expenseDate !== undefined) requestData.expenseDate = updateData.expenseDate;
      if (updateData.paymentMethod !== undefined) requestData.paymentMethod = updateData.paymentMethod;
      if (updateData.notes !== undefined) requestData.notes = updateData.notes;
      if (updateData.attachments !== undefined) requestData.attachments = updateData.attachments;
      
      const result = await this.put(`/expenses/${expenseId}`, requestData);
      
      console.log('✅ EXPENSE UPDATED:', {
        id: result.data?.id,
        title: result.data?.title
      });
      
      if (result.success) {
        toast.success(result.message || 'Gasto actualizado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ UPDATE EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.error('📝 VALIDATION ERRORS:', error.response.data?.errors);
        toast.error('Error de validación en actualización');
      } else if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para actualizar gastos');
      } else {
        toast.error('Error al actualizar gasto');
      }
      
      throw error;
    }
  }
  
  // ================================
  // 🔄 ACCIONES DE ESTADO (POST)
  // ================================
  
  /**
   * Aprobar gasto
   * POST /api/expenses/:id/approve
   */
  async approveExpense(expenseId) {
    console.log(`✅ APPROVING EXPENSE: ${expenseId}...`);
    
    try {
      const result = await this.post(`/expenses/${expenseId}/approve`, {});
      
      console.log('✅ EXPENSE APPROVED:', {
        id: result.data?.id,
        status: result.data?.status
      });
      
      if (result.success) {
        toast.success(result.message || 'Gasto aprobado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ APPROVE EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'No se puede aprobar este gasto');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para aprobar gastos');
      } else {
        toast.error('Error al aprobar gasto');
      }
      
      throw error;
    }
  }
  
  /**
   * Rechazar gasto
   * POST /api/expenses/:id/reject
   */
  async rejectExpense(expenseId, reason = '') {
    console.log(`❌ REJECTING EXPENSE: ${expenseId}...`);
    console.log('📤 Reason:', reason);
    
    try {
      const result = await this.post(`/expenses/${expenseId}/reject`, { reason });
      
      console.log('✅ EXPENSE REJECTED:', {
        id: result.data?.id,
        status: result.data?.status
      });
      
      if (result.success) {
        toast.success(result.message || 'Gasto rechazado');
      }
      
      return result;
    } catch (error) {
      console.error('❌ REJECT EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'No se puede rechazar este gasto');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para rechazar gastos');
      } else {
        toast.error('Error al rechazar gasto');
      }
      
      throw error;
    }
  }
  
  /**
   * Cancelar gasto
   * POST /api/expenses/:id/cancel
   */
  async cancelExpense(expenseId, reason = '') {
    console.log(`🚫 CANCELLING EXPENSE: ${expenseId}...`);
    console.log('📤 Reason:', reason);
    
    try {
      const result = await this.post(`/expenses/${expenseId}/cancel`, { reason });
      
      console.log('✅ EXPENSE CANCELLED:', {
        id: result.data?.id,
        status: result.data?.status
      });
      
      if (result.success) {
        toast.success(result.message || 'Gasto cancelado');
      }
      
      return result;
    } catch (error) {
      console.error('❌ CANCEL EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'No se puede cancelar este gasto');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para cancelar gastos');
      } else {
        toast.error('Error al cancelar gasto');
      }
      
      throw error;
    }
  }
  
  /**
   * Procesar gastos recurrentes
   * POST /api/expenses/recurring/process
   */
  async processRecurringExpenses() {
    console.log('🔄 PROCESSING RECURRING EXPENSES...');
    
    try {
      const result = await this.post('/expenses/recurring/process', {});
      
      console.log('✅ RECURRING EXPENSES PROCESSED:', {
        processed: result.processed || result.data?.length || 0
      });
      
      if (result.success) {
        toast.success(result.message || 'Gastos recurrentes procesados');
      }
      
      return result;
    } catch (error) {
      console.error('❌ PROCESS RECURRING FAILED:', error.message);
      
      if (error.response?.status === 403) {
        toast.error('Sin permisos para procesar gastos recurrentes');
      } else {
        toast.error('Error al procesar gastos recurrentes');
      }
      
      throw error;
    }
  }
  
  // ================================
  // 📊 ESTADÍSTICAS Y REPORTES (GET)
  // ================================
  
  /**
   * Obtener resumen de estadísticas
   * GET /api/expenses/stats/summary
   */
  async getStatsSummary(startDate, endDate) {
    console.log('📊 FETCHING STATS SUMMARY...');
    console.log('📅 Period:', { startDate, endDate });
    
    try {
      const result = await this.get('/expenses/stats/summary', {
        params: { startDate, endDate }
      });
      
      console.log('✅ STATS SUMMARY RECEIVED:', {
        totalExpenses: result.data?.totalExpenses,
        totalAmount: result.data?.totalAmount
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET STATS SUMMARY FAILED:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener breakdown por categorías
   * GET /api/expenses/stats/breakdown
   */
  async getStatsBreakdown(startDate, endDate) {
    console.log('📊 FETCHING STATS BREAKDOWN...');
    console.log('📅 Period:', { startDate, endDate });
    
    try {
      const result = await this.get('/expenses/stats/breakdown', {
        params: { startDate, endDate }
      });
      
      console.log('✅ STATS BREAKDOWN RECEIVED:', {
        categories: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET STATS BREAKDOWN FAILED:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener top proveedores
   * GET /api/expenses/stats/vendors
   */
  async getTopVendors(startDate, endDate, limit = 10) {
    console.log('🏆 FETCHING TOP VENDORS...');
    console.log('📅 Period:', { startDate, endDate, limit });
    
    try {
      const result = await this.get('/expenses/stats/vendors', {
        params: { startDate, endDate, limit }
      });
      
      console.log('✅ TOP VENDORS RECEIVED:', {
        vendors: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ GET TOP VENDORS FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🗑️ ELIMINAR (DELETE)
  // ================================
  
  /**
   * Eliminar gasto
   * DELETE /api/expenses/:id
   */
  async deleteExpense(expenseId) {
    console.log(`🗑️ DELETING EXPENSE: ${expenseId}...`);
    
    try {
      const result = await this.delete(`/expenses/${expenseId}`);
      
      console.log('✅ EXPENSE DELETED:', { id: expenseId });
      
      if (result.success) {
        toast.success(result.message || 'Gasto eliminado exitosamente');
      }
      
      return result;
    } catch (error) {
      console.error('❌ DELETE EXPENSE FAILED:', error.message);
      
      if (error.response?.status === 404) {
        toast.error('Gasto no encontrado');
      } else if (error.response?.status === 403) {
        toast.error('Sin permisos para eliminar gastos');
      } else {
        toast.error('Error al eliminar gasto');
      }
      
      throw error;
    }
  }
  
  // ================================
  // 🔧 UTILIDADES Y VALIDACIONES
  // ================================
  
  /**
   * Validar datos de gasto
   */
  validateExpenseData(expenseData) {
    const errors = [];
    
    // Título
    if (!expenseData.title || !expenseData.title.trim()) {
      errors.push('El título es obligatorio');
    } else if (expenseData.title.length > 200) {
      errors.push('El título no puede exceder 200 caracteres');
    }
    
    // Monto
    if (!expenseData.amount || isNaN(expenseData.amount)) {
      errors.push('El monto es inválido');
    } else if (parseFloat(expenseData.amount) <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    
    // Categoría
    const validCategories = [
      'rent', 'utilities', 'equipment_purchase', 'equipment_maintenance',
      'staff_salary', 'cleaning_supplies', 'marketing', 'insurance',
      'taxes', 'other_expense'
    ];
    
    if (!expenseData.category) {
      errors.push('La categoría es obligatoria');
    } else if (!validCategories.includes(expenseData.category)) {
      errors.push('Categoría inválida');
    }
    
    // Gastos recurrentes
    if (expenseData.isRecurring) {
      const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
      
      if (!expenseData.recurringFrequency) {
        errors.push('La frecuencia es obligatoria para gastos recurrentes');
      } else if (!validFrequencies.includes(expenseData.recurringFrequency)) {
        errors.push('Frecuencia inválida');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Formatear datos para API
   */
  formatExpenseDataForAPI(expenseData) {
    return {
      title: expenseData.title?.trim(),
      description: expenseData.description || '',
      amount: parseFloat(expenseData.amount),
      category: expenseData.category,
      vendor: expenseData.vendor || undefined,
      invoiceNumber: expenseData.invoiceNumber || undefined,
      expenseDate: expenseData.expenseDate || undefined,
      paymentMethod: expenseData.paymentMethod || undefined,
      notes: expenseData.notes || undefined,
      attachments: expenseData.attachments || undefined,
      isRecurring: expenseData.isRecurring || false,
      recurringFrequency: expenseData.recurringFrequency || undefined,
      recurringEndDate: expenseData.recurringEndDate || undefined
    };
  }
  
  /**
   * Obtener categorías disponibles
   */
  getAvailableCategories() {
    return [
      { value: 'rent', label: 'Alquiler/Renta', icon: '🏢' },
      { value: 'utilities', label: 'Servicios Públicos', icon: '💡' },
      { value: 'equipment_purchase', label: 'Compra de Equipo', icon: '🏋️' },
      { value: 'equipment_maintenance', label: 'Mantenimiento de Equipo', icon: '🔧' },
      { value: 'staff_salary', label: 'Salarios del Personal', icon: '👥' },
      { value: 'cleaning_supplies', label: 'Suministros de Limpieza', icon: '🧹' },
      { value: 'marketing', label: 'Marketing y Publicidad', icon: '📢' },
      { value: 'insurance', label: 'Seguros', icon: '🛡️' },
      { value: 'taxes', label: 'Impuestos', icon: '📋' },
      { value: 'other_expense', label: 'Otros Gastos', icon: '📦' }
    ];
  }
  
  /**
   * Obtener estados disponibles
   */
  getAvailableStatuses() {
    return [
      { value: 'pending', label: 'Pendiente', color: 'yellow' },
      { value: 'approved', label: 'Aprobado', color: 'green' },
      { value: 'paid', label: 'Pagado', color: 'blue' },
      { value: 'rejected', label: 'Rechazado', color: 'red' },
      { value: 'cancelled', label: 'Cancelado', color: 'gray' }
    ];
  }
  
  /**
   * Obtener frecuencias recurrentes
   */
  getRecurringFrequencies() {
    return [
      { value: 'daily', label: 'Diario' },
      { value: 'weekly', label: 'Semanal' },
      { value: 'biweekly', label: 'Quincenal' },
      { value: 'monthly', label: 'Mensual' },
      { value: 'quarterly', label: 'Trimestral' },
      { value: 'annually', label: 'Anual' }
    ];
  }
  
  /**
   * Formatear moneda (Quetzales)
   */
  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return 'Q 0.00';
    return `Q ${parseFloat(amount).toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  /**
   * Health check del servicio
   */
  async healthCheck() {
    try {
      const testResponse = await this.get('/expenses', {
        params: { limit: 1 }
      });
      
      return {
        healthy: true,
        message: 'Expense service is operational',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  /**
   * Debug del servicio
   */
  async debugExpenseSystem() {
    console.log('\n🔍 DEBUGGING EXPENSE SYSTEM');
    console.log('=' .repeat(50));
    
    const results = {
      timestamp: new Date().toISOString(),
      endpoints: {},
      validation: {}
    };
    
    try {
      // Test GET all
      console.log('📋 Testing GET /api/expenses...');
      try {
        const expenses = await this.getAllExpenses({ limit: 1 });
        results.endpoints.getAllExpenses = '✅ OK';
        console.log(`✅ getAllExpenses: ${expenses.data?.length || 0} expenses`);
      } catch (error) {
        results.endpoints.getAllExpenses = `❌ ${error.message}`;
        console.log(`❌ getAllExpenses failed: ${error.message}`);
      }
      
      // Test categorías
      console.log('📁 Testing categories...');
      const categories = this.getAvailableCategories();
      results.validation.categories = categories.length;
      console.log(`✅ ${categories.length} categories available`);
      
      // Test estados
      console.log('🎯 Testing statuses...');
      const statuses = this.getAvailableStatuses();
      results.validation.statuses = statuses.length;
      console.log(`✅ ${statuses.length} statuses available`);
      
      console.log('\n✅ DEBUG COMPLETE');
      return results;
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      results.error = error.message;
      return results;
    }
  }
}

// Exportar instancia singleton
const expenseService = new ExpenseService();
export default expenseService;

/*
=============================================================================
EXPENSE SERVICE COMPLETO
=============================================================================

✅ TODAS LAS RUTAS DEL TEST IMPLEMENTADAS:

📋 GET:
- /api/expenses - Lista con filtros
- /api/expenses/:id - Por ID
- /api/expenses/pending/approval - Pendientes
- /api/expenses/category/:category - Por categoría
- /api/expenses/recurring/upcoming - Recurrentes

➕ POST:
- /api/expenses - Crear
- /api/expenses/:id/approve - Aprobar
- /api/expenses/:id/reject - Rechazar
- /api/expenses/:id/cancel - Cancelar
- /api/expenses/recurring/process - Procesar recurrentes

✏️ PUT:
- /api/expenses/:id - Actualizar

📊 STATS:
- /api/expenses/stats/summary - Resumen
- /api/expenses/stats/breakdown - Breakdown
- /api/expenses/stats/vendors - Top proveedores

🗑️ DELETE:
- /api/expenses/:id - Eliminar

🔧 UTILIDADES:
- Validaciones completas
- Formateo de datos
- Categorías y estados
- Frecuencias recurrentes
- Health check
- Debug system

✅ CARACTERÍSTICAS:
- Logging detallado
- Toasts automáticos
- Manejo de errores robusto
- Validaciones en frontend
- Formateo de moneda (Quetzales)
- Compatible con BaseService

=============================================================================
*/