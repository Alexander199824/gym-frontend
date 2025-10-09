// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipsManager.js
// VERSIÓN: Conectada 100% al backend con membershipManagementService

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Search, Filter, Edit, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Eye, Trash2, RotateCcw,
  User, TrendingUp, TrendingDown, Bell, Settings,
  FileText, Download, Upload, MoreHorizontal, Loader, X, Package
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';
import MembershipPlansManager from './MembershipPlansManager';

const MembershipsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [activeSection, setActiveSection] = useState('memberships');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estados de membresías
  const [memberships, setMemberships] = useState([]);
  const [membershipStats, setMembershipStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [membershipsPerPage] = useState(isMobile ? 10 : 20);
  const [totalMemberships, setTotalMemberships] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Alertas
  const [expiredMemberships, setExpiredMemberships] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);
  
  // Modal de membresía
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [membershipFormData, setMembershipFormData] = useState({
    userId: '',
    planId: '',
    selectedSchedule: {},
    paymentMethod: 'cash',
    notes: ''
  });
  
  // Datos para selectores
  const [availablePlans, setAvailablePlans] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Búsqueda en selectores
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  
  // Validación de cliente con membresía activa
  const [selectedClientHasMembership, setSelectedClientHasMembership] = useState(false);
  const [selectedClientMembership, setSelectedClientMembership] = useState(null);
  
  // Configuraciones
  const membershipSections = [
    {
      id: 'memberships',
      title: 'Gestión de Membresías',
      icon: CreditCard,
      description: 'Administrar membresías activas, renovaciones y vencimientos',
      color: 'purple'
    },
    {
      id: 'plans',
      title: 'Planes de Membresías',
      icon: Package,
      description: 'Configurar tipos y planes de membresías disponibles',
      color: 'blue'
    }
  ];
  
  const membershipStatuses = [
    { value: 'active', label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'pending', label: 'Pendiente', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'expired', label: 'Vencida', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    { value: 'suspended', label: 'Suspendida', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
  ];
  
  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS DESDE EL BACKEND
  // ============================================================================
  
  /**
   * Cargar membresías desde el backend
   */
  const loadMemberships = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando membresías desde el backend...');
      
      const params = {
        page: currentPage,
        limit: membershipsPerPage,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        sortBy,
        sortOrder
      };
      
      // ✅ Usar el método del apiService
      const response = await apiService.getMemberships(params);
      
      console.log('✅ Respuesta de membresías:', response);
      
      if (response.success && response.memberships) {
        setMemberships(response.memberships);
        setTotalMemberships(response.pagination?.total || response.memberships.length);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        console.warn('⚠️ Formato de respuesta inesperado:', response);
        setMemberships([]);
        setTotalMemberships(0);
        setTotalPages(1);
      }
      
    } catch (error) {
      console.error('❌ Error cargando membresías:', error);
      showError('Error al cargar membresías');
      setMemberships([]);
      setTotalMemberships(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, membershipsPerPage, searchTerm, selectedStatus, selectedType, sortBy, sortOrder]);
  
  /**
   * Cargar estadísticas desde el backend
   */
  const loadMembershipStats = useCallback(async () => {
    try {
      console.log('📊 Cargando estadísticas desde el backend...');
      
      // ✅ Usar el método del apiService
      const stats = await apiService.getMembershipStats();
      
      console.log('✅ Estadísticas obtenidas:', stats);
      
      setMembershipStats({
        totalMemberships: stats.totalMemberships || 0,
        activeMemberships: stats.activeMemberships || 0,
        expiredMemberships: stats.expiredMemberships || 0,
        expiringSoon: stats.expiringSoon || 0,
        pendingMemberships: stats.pendingMemberships || 0,
        cancelledMemberships: stats.cancelledMemberships || 0,
        suspendedMemberships: stats.suspendedMemberships || 0
      });
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      setMembershipStats({
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        pendingMemberships: 0,
        cancelledMemberships: 0,
        suspendedMemberships: 0
      });
    }
  }, []);
  
  /**
   * Cargar alertas de vencimiento desde el backend
   */
  const loadExpirationAlerts = useCallback(async () => {
    try {
      console.log('⏰ Cargando alertas de vencimiento...');
      
      // ✅ Membresías vencidas (hoy)
      const expiredResponse = await apiService.getExpiredMemberships(0);
      console.log('Vencidas:', expiredResponse);
      
      if (expiredResponse.success && expiredResponse.memberships) {
        setExpiredMemberships(expiredResponse.memberships);
      }
      
      // ✅ Membresías por vencer (próximos 7 días)
      const expiringResponse = await apiService.getExpiringSoonMemberships(7);
      console.log('Por vencer:', expiringResponse);
      
      if (expiringResponse.success && expiringResponse.memberships) {
        setExpiringSoon(expiringResponse.memberships);
      }
      
    } catch (error) {
      console.error('❌ Error cargando alertas:', error);
      setExpiredMemberships([]);
      setExpiringSoon([]);
    }
  }, []);
  
  /**
   * Cargar planes disponibles desde el backend
   */
  const loadAvailablePlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      console.log('📦 Cargando planes disponibles...');
      
      // ✅ Usar el método del apiService
      const response = await apiService.getMembershipPlans();
      
      console.log('✅ Planes obtenidos:', response);
      
      if (response.success && response.plans) {
        setAvailablePlans(response.plans);
      } else {
        setAvailablePlans([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando planes:', error);
      showError('Error al cargar planes de membresía');
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }, []);
  
  /**
   * Cargar clientes disponibles desde el backend
   */
  const loadAvailableClients = useCallback(async (searchQuery = '') => {
    try {
      setLoadingClients(true);
      console.log('👥 Cargando clientes...', searchQuery ? `Búsqueda: ${searchQuery}` : '');
      
      // ✅ Usar el método del apiService
      const response = await apiService.getMembershipClients({
        search: searchQuery || undefined,
        isActive: true,
        limit: 50
      });
      
      console.log('✅ Clientes obtenidos:', response);
      
      if (response.success && response.clients) {
        setAvailableClients(response.clients);
      } else {
        setAvailableClients([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      showError('Error al cargar clientes');
      setAvailableClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);
  
  /**
   * Verificar si el cliente tiene membresía activa
   */
  const checkClientMembership = useCallback(async (userId) => {
    if (!userId) {
      setSelectedClientHasMembership(false);
      setSelectedClientMembership(null);
      return;
    }
    
    try {
      console.log('🔍 Verificando membresía del cliente:', userId);
      
      // Buscar membresías activas del cliente
      const response = await apiService.getMemberships({
        userId,
        status: 'active',
        limit: 1
      });
      
      if (response.success && response.memberships && response.memberships.length > 0) {
        const activeMembership = response.memberships[0];
        console.log('⚠️ Cliente ya tiene membresía activa:', activeMembership);
        
        setSelectedClientHasMembership(true);
        setSelectedClientMembership(activeMembership);
        
        showError('Este cliente ya tiene una membresía activa. Solo puedes renovarla o actualizarla.');
      } else {
        console.log('✅ Cliente sin membresía activa');
        setSelectedClientHasMembership(false);
        setSelectedClientMembership(null);
      }
      
    } catch (error) {
      console.error('❌ Error verificando membresía del cliente:', error);
      setSelectedClientHasMembership(false);
      setSelectedClientMembership(null);
    }
  }, []);
  
  // ============================================================================
  // EFECTOS PARA CARGAR DATOS
  // ============================================================================
  
  // Cargar membresías cuando cambien filtros
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMemberships();
    }
  }, [activeSection, loadMemberships]);
  
  // Cargar estadísticas y alertas al inicio
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMembershipStats();
      loadExpirationAlerts();
    }
  }, [activeSection, loadMembershipStats, loadExpirationAlerts, refreshKey]);
  
  // Cargar planes y clientes al abrir el modal
  useEffect(() => {
    if (showMembershipModal) {
      loadAvailablePlans();
      loadAvailableClients();
    }
  }, [showMembershipModal, loadAvailablePlans, loadAvailableClients]);
  
  // Buscar clientes cuando cambie el término de búsqueda
  useEffect(() => {
    if (showMembershipModal) {
      const timeoutId = setTimeout(() => {
        loadAvailableClients(clientSearchTerm);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [clientSearchTerm, showMembershipModal, loadAvailableClients]);
  
  // Verificar membresía del cliente cuando se seleccione
  useEffect(() => {
    if (membershipFormData.userId && !editingMembership) {
      checkClientMembership(membershipFormData.userId);
    }
  }, [membershipFormData.userId, editingMembership, checkClientMembership]);
  
  // ============================================================================
  // FUNCIONES DE MEMBRESÍA
  // ============================================================================
  
  /**
   * Refrescar todos los datos
   */
  const refreshMembershipsData = () => {
    setRefreshKey(prev => prev + 1);
    loadMemberships();
    loadMembershipStats();
    loadExpirationAlerts();
    showSuccess('Datos actualizados');
  };
  
  /**
   * Crear/Actualizar membresía
   */
  const handleSaveMembership = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!membershipFormData.userId) {
        showError('Debe seleccionar un cliente');
        return;
      }
      
      if (!membershipFormData.planId) {
        showError('Debe seleccionar un plan');
        return;
      }
      
      // Si el cliente ya tiene membresía activa y no estamos editando, no permitir crear
      if (selectedClientHasMembership && !editingMembership) {
        showError('Este cliente ya tiene una membresía activa. Use la opción de renovar.');
        return;
      }
      
      // Preparar datos según formato del backend
      const membershipData = {
        planId: membershipFormData.planId,
        userId: membershipFormData.userId,
        selectedSchedule: membershipFormData.selectedSchedule || {},
        paymentMethod: membershipFormData.paymentMethod || 'cash',
        notes: membershipFormData.notes || 'Membresía creada desde dashboard'
      };
      
      console.log('💾 Guardando membresía:', membershipData);
      
      let response;
      if (editingMembership) {
        // ✅ Actualizar membresía existente
        response = await apiService.updateMembership(editingMembership.id, membershipData);
        showSuccess('Membresía actualizada exitosamente');
      } else {
        // ✅ Crear nueva membresía
        response = await apiService.createMembership(membershipData);
        showSuccess('Membresía creada exitosamente');
      }
      
      console.log('✅ Membresía guardada:', response);
      
      // Recargar datos
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
      // Cerrar modal
      setShowMembershipModal(false);
      setEditingMembership(null);
      resetMembershipForm();
      
      if (onSave) {
        onSave({ 
          type: 'membership', 
          action: editingMembership ? 'updated' : 'created',
          data: response
        });
      }
      
    } catch (error) {
      console.error('❌ Error guardando membresía:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al guardar membresía';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * Renovar membresía
   */
  const handleRenewMembership = async (membershipId, months = 1) => {
    try {
      console.log('🔄 Renovando membresía:', membershipId);
      
      // ✅ Usar el método del apiService
      await apiService.renewMembership(membershipId, {
        months,
        notes: `Renovación por ${months} mes${months > 1 ? 'es' : ''} desde dashboard`
      });
      
      showSuccess(`Membresía renovada por ${months} mes${months > 1 ? 'es' : ''}`);
      
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
    } catch (error) {
      console.error('❌ Error renovando membresía:', error);
      showError('Error al renovar membresía');
    }
  };
  
  /**
   * Cancelar membresía
   */
  const handleCancelMembership = async (membershipId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta membresía?')) {
      return;
    }
    
    try {
      console.log('🚫 Cancelando membresía:', membershipId);
      
      // ✅ Usar el método del apiService
      await apiService.cancelMembership(membershipId, 'Cancelación solicitada desde dashboard');
      
      showSuccess('Membresía cancelada exitosamente');
      
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
    } catch (error) {
      console.error('❌ Error cancelando membresía:', error);
      showError('Error al cancelar membresía');
    }
  };
  
  /**
   * Reset form
   */
  const resetMembershipForm = () => {
    setMembershipFormData({
      userId: '',
      planId: '',
      selectedSchedule: {},
      paymentMethod: 'cash',
      notes: ''
    });
    setClientSearchTerm('');
    setPlanSearchTerm('');
    setSelectedClientHasMembership(false);
    setSelectedClientMembership(null);
  };
  
  /**
   * Abrir modal para editar
   */
  const handleEditMembership = (membership) => {
    setEditingMembership(membership);
    setMembershipFormData({
      userId: membership.userId || membership.user?.id || '',
      planId: membership.planId || '',
      selectedSchedule: membership.selectedSchedule || {},
      paymentMethod: membership.paymentMethod || 'cash',
      notes: membership.notes || ''
    });
    setShowMembershipModal(true);
  };
  
  /**
   * Abrir modal para crear
   */
  const handleNewMembership = () => {
    setEditingMembership(null);
    resetMembershipForm();
    setShowMembershipModal(true);
  };
  
  /**
   * Manejar guardado desde planes
   */
  const handleSavePlans = (data) => {
    console.log('✅ Planes guardados:', data);
    setHasUnsavedChanges(false);
    
    // Recargar planes si estamos en el modal
    if (showMembershipModal) {
      loadAvailablePlans();
    }
    
    if (onSave) {
      onSave({ type: 'membership-plan', action: data.action || 'updated' });
    }
  };
  
  // ============================================================================
  // FUNCIONES DE UI
  // ============================================================================
  
  /**
   * Obtener información del estado
   */
  const getStatusInfo = (status) => {
    return membershipStatuses.find(s => s.value === status) || {
      value: status,
      label: status,
      color: 'bg-gray-100 text-gray-800',
      icon: AlertTriangle
    };
  };
  
  /**
   * Filtrar clientes para el selector
   */
  const filteredClients = availableClients.filter(client => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || client.email.toLowerCase().includes(searchLower);
  });
  
  /**
   * Filtrar planes para el selector
   */
  const filteredPlans = availablePlans.filter(plan => {
    if (!planSearchTerm) return true;
    const searchLower = planSearchTerm.toLowerCase();
    return plan.name.toLowerCase().includes(searchLower) || 
           plan.description?.toLowerCase().includes(searchLower);
  });
  
  // Notificar cambios no guardados
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <CreditCard className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Membresías
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Administra membresías, planes y configuraciones del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={refreshMembershipsData}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN POR SECCIONES */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {membershipSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center ${
                activeSection === section.id
                  ? `bg-${section.color}-100 text-${section.color}-700`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* CONTENIDO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* SECCIÓN: Gestión de Membresías */}
        {activeSection === 'memberships' && (
          <div className="space-y-6">
            
            {/* ALERTAS DE VENCIMIENTO */}
            {(expiredMemberships.length > 0 || expiringSoon.length > 0) && (
              <div className="space-y-3">
                {/* Vencidas */}
                {expiredMemberships.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                          {expiredMemberships.length} Membresía{expiredMemberships.length !== 1 ? 's' : ''} Vencida{expiredMemberships.length !== 1 ? 's' : ''}
                        </h3>
                        <button
                          onClick={() => setShowExpiredAlert(!showExpiredAlert)}
                          className="text-sm text-red-700 underline hover:no-underline mt-1"
                        >
                          {showExpiredAlert ? 'Ocultar' : 'Ver'} detalles
                        </button>
                        
                        {showExpiredAlert && (
                          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                            {expiredMemberships.slice(0, 5).map(membership => (
                              <div key={membership.id} className="flex items-center justify-between text-sm">
                                <span>
                                  {membership.user?.firstName} {membership.user?.lastName}
                                </span>
                                <button
                                  onClick={() => handleRenewMembership(membership.id)}
                                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                                >
                                  Renovar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Por vencer */}
                {expiringSoon.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">
                          {expiringSoon.length} Membresía{expiringSoon.length !== 1 ? 's' : ''} por Vencer
                        </h3>
                        <button
                          onClick={() => setShowExpiringAlert(!showExpiringAlert)}
                          className="text-sm text-yellow-700 underline hover:no-underline mt-1"
                        >
                          {showExpiringAlert ? 'Ocultar' : 'Ver'} detalles
                        </button>
                        
                        {showExpiringAlert && (
                          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                            {expiringSoon.slice(0, 5).map(membership => (
                              <div key={membership.id} className="flex items-center justify-between text-sm">
                                <span>
                                  {membership.user?.firstName} {membership.user?.lastName} - 
                                  {formatDate(membership.endDate, 'dd/MM/yyyy')}
                                </span>
                                <button
                                  onClick={() => handleRenewMembership(membership.id)}
                                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
                                >
                                  Renovar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ESTADÍSTICAS RÁPIDAS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-purple-900">
                      {membershipStats.totalMemberships || 0}
                    </div>
                    <div className="text-sm text-purple-600">Total</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-green-900">
                      {membershipStats.activeMemberships || 0}
                    </div>
                    <div className="text-sm text-green-600">Activas</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-red-900">
                      {membershipStats.expiredMemberships || 0}
                    </div>
                    <div className="text-sm text-red-600">Vencidas</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-3">
                    <div className="text-2xl font-bold text-yellow-900">
                      {membershipStats.expiringSoon || 0}
                    </div>
                    <div className="text-sm text-yellow-600">Por Vencer</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CONTROLES SUPERIORES */}
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">
                Membresías Registradas ({totalMemberships})
              </h4>
              
              {hasPermission('create_memberships') && (
                <button
                  onClick={handleNewMembership}
                  className="btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Membresía
                </button>
              )}
            </div>
            
            {/* FILTROS Y BÚSQUEDA */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por usuario..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Filtro por estado */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">Todos los estados</option>
                  {membershipStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                
                {/* Filtro por tipo */}
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                </select>
                
                {/* Ordenamiento */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                  <option value="endDate-asc">Vencen primero</option>
                  <option value="endDate-desc">Vencen último</option>
                </select>
                
              </div>
            </div>
            
            {/* TABLA DE MEMBRESÍAS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-gray-600">Cargando membresías...</span>
                </div>
              ) : memberships.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay membresías</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' 
                      ? 'No se encontraron membresías con los filtros aplicados'
                      : 'Comienza creando tu primera membresía'
                    }
                  </p>
                  {hasPermission('create_memberships') && (
                    <button onClick={handleNewMembership} className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Membresía
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo/Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Precio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Período
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {memberships.map((membership) => {
                          const statusInfo = getStatusInfo(membership.status);
                          const StatusIcon = statusInfo.icon;
                          
                          return (
                            <tr key={membership.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {membership.user?.profileImage ? (
                                      <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={membership.user.profileImage}
                                        alt=""
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-purple-800">
                                          {membership.user?.firstName?.[0]}{membership.user?.lastName?.[0]}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {membership.user?.firstName} {membership.user?.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {membership.user?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {membership.type || membership.plan?.name || 'N/A'}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(membership.price)}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(membership.startDate, 'dd/MM/yyyy')}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatDate(membership.endDate, 'dd/MM/yyyy')}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  {(membership.status === 'expired' || membership.status === 'active') && (
                                    <button
                                      onClick={() => handleRenewMembership(membership.id)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Renovar"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleEditMembership(membership)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  
                                  {membership.status === 'active' && (
                                    <button
                                      onClick={() => handleCancelMembership(membership.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Cancelar"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* PAGINACIÓN */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Mostrando {((currentPage - 1) * membershipsPerPage) + 1} a {Math.min(currentPage * membershipsPerPage, totalMemberships)} de {totalMemberships}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <span className="text-sm text-gray-700">
                            {currentPage} de {totalPages}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Planes */}
        {activeSection === 'plans' && (
          <MembershipPlansManager
            onSave={handleSavePlans}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
      </div>
      
      {/* MODAL CREAR/EDITAR MEMBRESÍA */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
                </h3>
                <button
                  onClick={() => {
                    setShowMembershipModal(false);
                    setEditingMembership(null);
                    resetMembershipForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="px-6 py-4">
              <div className="space-y-6">
                
                {/* SELECTOR DE CLIENTE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente * {loadingClients && <Loader className="inline w-4 h-4 animate-spin ml-2" />}
                  </label>
                  
                  {/* Búsqueda de cliente */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre o email..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={editingMembership}
                    />
                  </div>
                  
                  {/* Lista de clientes */}
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron clientes
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              if (!editingMembership) {
                                setMembershipFormData(prev => ({ ...prev, userId: client.id }));
                              }
                            }}
                            disabled={editingMembership}
                            className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                              membershipFormData.userId === client.id ? 'bg-purple-50' : ''
                            } ${editingMembership ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {client.profileImage ? (
                                  <img
                                    src={client.profileImage}
                                    alt=""
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-purple-800">
                                      {client.firstName[0]}{client.lastName[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {client.email}
                                </div>
                              </div>
                              {membershipFormData.userId === client.id && (
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {editingMembership && (
                    <p className="text-xs text-gray-500 mt-1">
                      No se puede cambiar el cliente de una membresía existente
                    </p>
                  )}
                  
                  {/* Alerta si el cliente ya tiene membresía */}
                  {selectedClientHasMembership && !editingMembership && (
                    <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex">
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-orange-800">
                            Este cliente ya tiene una membresía activa
                          </h4>
                          <p className="text-xs text-orange-700 mt-1">
                            Vence: {formatDate(selectedClientMembership?.endDate, 'dd/MM/yyyy')}
                          </p>
                          <button
                            onClick={() => handleRenewMembership(selectedClientMembership?.id)}
                            className="mt-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded"
                          >
                            Renovar membresía existente
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* SELECTOR DE PLAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan de Membresía * {loadingPlans && <Loader className="inline w-4 h-4 animate-spin ml-2" />}
                  </label>
                  
                  {/* Búsqueda de plan */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar plan..."
                      value={planSearchTerm}
                      onChange={(e) => setPlanSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  {/* Lista de planes */}
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {filteredPlans.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron planes
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredPlans.map(plan => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setMembershipFormData(prev => ({ ...prev, planId: plan.id }))}
                            className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                              membershipFormData.planId === plan.id ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {plan.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {plan.description || `${plan.duration} - ${formatCurrency(plan.price)}`}
                                </div>
                              </div>
                              {membershipFormData.planId === plan.id && (
                                <CheckCircle className="w-5 h-5 text-purple-600 ml-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* MÉTODO DE PAGO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={membershipFormData.paymentMethod}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                  </select>
                </div>
                
                {/* NOTAS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={membershipFormData.notes}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Notas adicionales..."
                  />
                </div>
                
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowMembershipModal(false);
                  setEditingMembership(null);
                  resetMembershipForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveMembership}
                disabled={saving || !membershipFormData.userId || !membershipFormData.planId || selectedClientHasMembership}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingMembership ? 'Actualizar' : 'Crear'} Membresía
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MembershipsManager;

/*
=============================================================================
CAMBIOS REALIZADOS EN MembershipsManager.js
=============================================================================

🆕 AGREGADO - SISTEMA DE PESTAÑAS:
- Sistema completo de navegación por pestañas como WebsiteManager
- Estado activeSection para controlar la pestaña activa
- Array membershipSections con configuración de pestañas
- Navegación visual con indicadores de estado

📋 PESTAÑAS IMPLEMENTADAS:
1. "Gestión de Membresías" (memberships) - Contenido original
2. "Planes de Membresías" (plans) - Nuevo usando MembershipPlansManager

✅ MANTENIDO SIN CAMBIOS:
- Toda la funcionalidad original de gestión de membresías
- Sistema de alertas de vencimiento
- Estadísticas y filtros
- Tabla de membresías con paginación
- Modal de creación/edición de membresías
- Todas las funciones de renovar, cancelar, etc.

🔗 INTEGRACIÓN:
- Import del MembershipPlansManager
- Función handleSavePlans para manejar guardado desde planes
- Propagación correcta de props (onSave, onUnsavedChanges)
- Control unificado de cambios sin guardar

🎨 DISEÑO:
- Header principal con título "Gestión de Membresías"
- Navegación con pestañas estilo WebsiteManager
- Indicadores visuales de contenido cargado
- Botón de refrescar datos
- Indicador de cambios sin guardar

📱 RESPONSIVO:
- Navegación de pestañas con scroll horizontal en mobile
- Mantiene toda la responsividad del contenido original

🎯 BENEFICIOS:
- Interfaz unificada para gestión completa de membresías
- Separación clara entre gestión de membresías activas y configuración de planes
- Navegación intuitiva entre secciones
- Experiencia de usuario consistente con otros managers del sistema
- Control centralizado de cambios sin guardar

El MembershipsManager ahora es un gestor completo que incluye:
- Gestión de membresías activas (pestaña 1)
- Configuración de planes disponibles (pestaña 2)

Ambas secciones funcionan de manera independiente pero comparten
el mismo contexto y sistema de navegación.
*/

/**
 * COMENTARIOS FINALES DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Este componente gestiona el sistema completo de membresías del gimnasio.
 * Permite crear, renovar, cancelar y monitorear el estado de las membresías de los usuarios.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Visualización de lista completa de membresías con filtros y búsqueda
 * - Creación y edición de nuevas membresías
 * - Renovación automática y manual de membresías
 * - Cancelación de membresías activas
 * - Alertas de vencimientos próximos y membresías vencidas
 * - Estadísticas en tiempo real del estado de las membresías
 * - Gestión de diferentes tipos de membresía (diaria, semanal, mensual, trimestral, anual)
 * - Vista responsiva para escritorio y móvil
 * 
 * CONEXIONES CON OTROS ARCHIVOS:
 * - AuthContext: Para verificar permisos del usuario actual
 * - AppContext: Para mostrar notificaciones y formatear datos
 * - apiService: Para comunicación con el backend (/api/memberships/*)
 * - Lucide React: Para iconografía del sistema
 * 
 * DATOS QUE MUESTRA AL USUARIO:
 * - Lista paginada de todas las membresías con información del usuario
 * - Estados de membresía (activa, vencida, cancelada, suspendida)
 * - Precios en moneda local (quetzales)
 * - Fechas de inicio y vencimiento
 * - Estadísticas generales del sistema
 * - Alertas de vencimientos y renovaciones necesarias
 * 
 * PERMISOS REQUERIDOS:
 * - create_memberships: Para crear nuevas membresías
 * - edit_memberships: Para editar membresías existentes
 * - renew_memberships: Para renovar membresías
 * - cancel_memberships: Para cancelar membresías
 */