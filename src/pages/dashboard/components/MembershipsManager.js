// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipsManager.js
// VERSIÓN: Con Wizard + Vista Responsive + Controles con Iconos

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Search, Filter, Edit, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Eye, Trash2, RotateCcw,
  User, TrendingUp, TrendingDown, Bell, Settings,
  FileText, Download, Upload, MoreHorizontal, Loader, X, Package
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import membershipManagementService from '../../../services/membershipManagementService';
import MembershipPlansManager from './MembershipPlansManager';
import MembershipCreationWizard from './MembershipCreationWizard';

const MembershipsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [activeSection, setActiveSection] = useState('memberships');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estados de membresías
  const [memberships, setMemberships] = useState([]);
  
  // Estados separados para cada card
  const [activeMembershipsCount, setActiveMembershipsCount] = useState(0);
  const [expiredMembershipsCount, setExpiredMembershipsCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  
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
  
  // Estado para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState('table');
  
  // Estado para wizard de creación
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  
  // Modal de edición (para editar membresías EXISTENTES)
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [membershipFormData, setMembershipFormData] = useState({
    userId: '',
    planId: '',
    selectedSchedule: {},
    paymentMethod: 'cash',
    notes: ''
  });
  
  // Datos para selectores (modal de edición)
  const [availablePlans, setAvailablePlans] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Búsqueda en selectores (modal de edición)
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  
  // Validación de cliente con membresía activa (modal de edición)
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
    { value: 'expiring', label: 'Por Vencer', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    { value: 'suspended', label: 'Suspendida', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
  ];
  
  // ============================================================================
  // FUNCIÓN: Traducir tipos de membresía
  // ============================================================================
  
  const translateMembershipType = (type) => {
    const translations = {
      'daily': 'Diaria',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'annual': 'Anual',
      'yearly': 'Anual'
    };
    return translations[type?.toLowerCase()] || type || 'N/A';
  };
  
  // ============================================================================
  // CARGAR ESTADÍSTICAS
  // ============================================================================
  
  const loadMembershipStats = useCallback(async () => {
    try {
      console.log('📊 Cargando estadísticas desde endpoints específicos...');
      
      // 1. Membresías activas
      try {
        const activeResponse = await membershipManagementService.getMemberships({
          status: 'active',
          limit: 1
        });
        const count = activeResponse.pagination?.total || activeResponse.memberships?.length || 0;
        console.log(`✅ Activas: ${count}`);
        setActiveMembershipsCount(count);
      } catch (error) {
        console.warn('Error obteniendo activas:', error.message);
        setActiveMembershipsCount(0);
      }
      
      // 2. Membresías vencidas
      try {
        const expiredResponse = await membershipManagementService.getExpiredMemberships(0);
        const count = expiredResponse.total || expiredResponse.memberships?.length || 0;
        console.log(`✅ Vencidas: ${count}`);
        setExpiredMembershipsCount(count);
      } catch (error) {
        console.warn('Error obteniendo vencidas:', error.message);
        setExpiredMembershipsCount(0);
      }
      
      // 3. Membresías por vencer
      try {
        const expiringResponse = await membershipManagementService.getExpiringSoonMemberships(7);
        const count = expiringResponse.total || expiringResponse.memberships?.length || 0;
        console.log(`✅ Por vencer: ${count}`);
        setExpiringSoonCount(count);
      } catch (error) {
        console.warn('Error obteniendo por vencer:', error.message);
        setExpiringSoonCount(0);
      }
      
      console.log('✅ Estadísticas cargadas correctamente');
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      setActiveMembershipsCount(0);
      setExpiredMembershipsCount(0);
      setExpiringSoonCount(0);
    }
  }, []);
  
  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================================================
  
  const loadMemberships = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando membresías desde el backend...');
      
      let statusFilter = selectedStatus;
      let additionalParams = {};
      
      if (selectedStatus === 'expiring') {
        statusFilter = 'active';
        additionalParams.expiringSoon = true;
      }
      
      const params = {
        page: currentPage,
        limit: membershipsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        sortBy,
        sortOrder,
        ...additionalParams
      };
      
      console.log('🔍 Parámetros de búsqueda:', params);
      
      let response;
      if (selectedStatus === 'expiring') {
        response = await membershipManagementService.getExpiringSoonMemberships(7);
        console.log('✅ Respuesta de por vencer:', response);
        
        if (response.success && response.memberships) {
          setMemberships(response.memberships);
          setTotalMemberships(response.total || response.memberships.length);
          setTotalPages(Math.ceil((response.total || response.memberships.length) / membershipsPerPage));
        }
      } else {
        response = await membershipManagementService.getMemberships(params);
        console.log('✅ Respuesta de membresías:', response);
        
        if (response.success && response.memberships) {
          setMemberships(response.memberships);
          setTotalMemberships(response.pagination?.total || response.memberships.length);
          setTotalPages(response.pagination?.pages || 1);
        }
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
  
  const loadAvailablePlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      console.log('📦 Cargando planes disponibles...');
      
      const response = await membershipManagementService.getPlans();
      
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
  
  const loadAvailableClients = useCallback(async (searchQuery = '') => {
    try {
      setLoadingClients(true);
      console.log('👥 Cargando clientes...', searchQuery ? `Búsqueda: ${searchQuery}` : '');
      
      const response = await membershipManagementService.getClients({
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
  
  const checkClientMembership = useCallback(async (userId) => {
    if (!userId) {
      setSelectedClientHasMembership(false);
      setSelectedClientMembership(null);
      return;
    }
    
    try {
      console.log('🔍 Verificando membresía del cliente:', userId);
      
      const response = await membershipManagementService.getMemberships({
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
  
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMemberships();
    }
  }, [activeSection, loadMemberships]);
  
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMembershipStats();
    }
  }, [activeSection, loadMembershipStats, refreshKey]);
  
  useEffect(() => {
    if (showMembershipModal) {
      loadAvailablePlans();
      loadAvailableClients();
    }
  }, [showMembershipModal, loadAvailablePlans, loadAvailableClients]);
  
  useEffect(() => {
    if (showMembershipModal) {
      const timeoutId = setTimeout(() => {
        loadAvailableClients(clientSearchTerm);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [clientSearchTerm, showMembershipModal, loadAvailableClients]);
  
  useEffect(() => {
    if (membershipFormData.userId && !editingMembership) {
      checkClientMembership(membershipFormData.userId);
    }
  }, [membershipFormData.userId, editingMembership, checkClientMembership]);
  
  // ============================================================================
  // FUNCIONES DE MEMBRESÍA
  // ============================================================================
  
  const refreshMembershipsData = () => {
    setRefreshKey(prev => prev + 1);
    loadMemberships();
    loadMembershipStats();
    showSuccess('Datos actualizados');
  };
  
  const handleNewMembership = () => {
    setShowCreationWizard(true);
  };
  
  const handleWizardSuccess = async (result) => {
    console.log('✅ Membresía creada desde wizard:', result);
    
    await loadMemberships();
    await loadMembershipStats();
    
    if (onSave) {
      onSave({ 
        type: 'membership', 
        action: 'created',
        data: result
      });
    }
  };
  
  const handleSaveMembership = async () => {
    try {
      setSaving(true);
      
      if (!membershipFormData.userId) {
        showError('Debe seleccionar un cliente');
        return;
      }
      
      if (!membershipFormData.planId) {
        showError('Debe seleccionar un plan');
        return;
      }
      
      if (selectedClientHasMembership && !editingMembership) {
        showError('Este cliente ya tiene una membresía activa. Use la opción de renovar.');
        return;
      }
      
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
        response = await membershipManagementService.updateMembership(editingMembership.id, membershipData);
        showSuccess('Membresía actualizada exitosamente');
      } else {
        response = await membershipManagementService.createMembership(membershipData);
        showSuccess('Membresía creada exitosamente');
      }
      
      console.log('✅ Membresía guardada:', response);
      
      await loadMemberships();
      await loadMembershipStats();
      
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
  
  const handleRenewMembership = async (membershipId, months = 1) => {
    try {
      console.log('🔄 Renovando membresía:', membershipId);
      
      await membershipManagementService.renewMembership(membershipId, {
        months,
        notes: `Renovación por ${months} mes${months > 1 ? 'es' : ''} desde dashboard`
      });
      
      showSuccess(`Membresía renovada por ${months} mes${months > 1 ? 'es' : ''}`);
      
      await loadMemberships();
      await loadMembershipStats();
      
    } catch (error) {
      console.error('❌ Error renovando membresía:', error);
      showError('Error al renovar membresía');
    }
  };
  
  const handleCancelMembership = async (membershipId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta membresía?')) {
      return;
    }
    
    try {
      console.log('🚫 Cancelando membresía:', membershipId);
      
      await membershipManagementService.cancelMembership(membershipId, 'Cancelación solicitada desde dashboard');
      
      showSuccess('Membresía cancelada exitosamente');
      
      await loadMemberships();
      await loadMembershipStats();
      
    } catch (error) {
      console.error('❌ Error cancelando membresía:', error);
      showError('Error al cancelar membresía');
    }
  };
  
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
  
  const handleSavePlans = (data) => {
    console.log('✅ Planes guardados:', data);
    setHasUnsavedChanges(false);
    
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
  
  const getStatusInfo = (status) => {
    return membershipStatuses.find(s => s.value === status) || {
      value: status,
      label: status,
      color: 'bg-gray-100 text-gray-800',
      icon: AlertTriangle
    };
  };
  
  const filteredClients = availableClients.filter(client => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || client.email.toLowerCase().includes(searchLower);
  });
  
  const filteredPlans = availablePlans.filter(plan => {
    if (!planSearchTerm) return true;
    const searchLower = planSearchTerm.toLowerCase();
    return plan.name.toLowerCase().includes(searchLower) || 
           plan.description?.toLowerCase().includes(searchLower);
  });
  
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  return (
    <div className="space-y-6 relative">
      
      {/* ✅ HEADER CON CONTROLES INTEGRADOS */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Gestión de Membresías
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Administra membresías, planes y configuraciones del sistema
            </p>
          </div>
          
          {/* ✅ CONTROLES A LA DERECHA CON ICONOS */}
          <div className="flex items-center gap-2">
            {/* Botón Actualizar */}
            <button
              onClick={refreshMembershipsData}
              className="btn-secondary btn-sm flex-shrink-0 p-2"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {/* Toggle Vista (Solo Iconos) */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de Lista"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de Tarjetas"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            </div>
            
            {/* Botón Nueva Membresía */}
            {hasPermission('create_memberships') && (
              <button
                onClick={handleNewMembership}
                className="btn-primary btn-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nueva Membresía</span>
              </button>
            )}
            
            {/* Indicador de cambios sin guardar */}
            {hasUnsavedChanges && (
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                <span className="hidden sm:inline">Cambios sin guardar</span>
                <span className="sm:hidden">Sin guardar</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* NAVEGACIÓN POR SECCIONES */}
      <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {membershipSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center flex-shrink-0 ${
                activeSection === section.id
                  ? `bg-${section.color}-100 text-${section.color}-700`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">{section.title}</span>
              <span className="sm:hidden">{section.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* CONTENIDO */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        
        {/* SECCIÓN: Gestión de Membresías */}
        {activeSection === 'memberships' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* CARDS DE ESTADÍSTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Card Activas */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3">
                    <div className="text-xl sm:text-2xl font-bold text-green-900">
                      {activeMembershipsCount}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600">Activas</div>
                  </div>
                </div>
              </div>
              
              {/* Card Vencidas */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center">
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3">
                    <div className="text-xl sm:text-2xl font-bold text-red-900">
                      {expiredMembershipsCount}
                    </div>
                    <div className="text-xs sm:text-sm text-red-600">Vencidas</div>
                  </div>
                </div>
              </div>
              
              {/* Card Por Vencer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-900">
                      {expiringSoonCount}
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-600">Por Vencer</div>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* TÍTULO SIMPLE */}
            <div>
              <h4 className="text-base sm:text-lg font-medium text-gray-900">
                Membresías Registradas ({totalMemberships})
              </h4>
            </div>
            
            {/* FILTROS Y BÚSQUEDA */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Filtro por estado */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                  <option value="endDate-asc">Vencen primero</option>
                  <option value="endDate-desc">Vencen último</option>
                </select>
                
              </div>
            </div>
            
            {/* CONTENEDOR DE MEMBRESÍAS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600">Cargando...</span>
                </div>
              ) : memberships.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay membresías</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' 
                      ? 'No se encontraron membresías con los filtros aplicados'
                      : 'Comienza creando tu primera membresía'
                    }
                  </p>
                  {hasPermission('create_memberships') && (
                    <button onClick={handleNewMembership} className="btn-primary text-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Membresía
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* VISTA DE TARJETAS */}
                  {viewMode === 'cards' && (
                    <div className="p-3 sm:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {memberships.map((membership) => {
                          const statusInfo = getStatusInfo(membership.status);
                          const StatusIcon = statusInfo.icon;
                          
                          return (
                            <div key={membership.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                              {/* Usuario */}
                              <div className="flex items-center mb-3">
                                <div className="flex-shrink-0">
                                  {membership.user?.profileImage ? (
                                    <img
                                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                                      src={membership.user.profileImage}
                                      alt=""
                                    />
                                  ) : (
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                      <span className="text-xs sm:text-sm font-medium text-purple-800">
                                        {membership.user?.firstName?.[0]}{membership.user?.lastName?.[0]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {membership.user?.firstName} {membership.user?.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {membership.user?.email}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Estado */}
                              <div className="mb-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                  {statusInfo.label}
                                </span>
                              </div>
                              
                              {/* Información */}
                              <div className="space-y-1.5 mb-3 text-xs sm:text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Plan:</span>
                                  <span className="font-medium text-gray-900 truncate ml-2">
                                    {translateMembershipType(membership.type) || membership.plan?.name}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Precio:</span>
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(membership.price)}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Inicio:</span>
                                  <span className="text-gray-900">
                                    {formatDate(membership.startDate, 'dd/MM/yyyy')}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Vence:</span>
                                  <span className="text-gray-900">
                                    {formatDate(membership.endDate, 'dd/MM/yyyy')}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Acciones */}
                              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-3 border-t border-gray-200">
                                {(membership.status === 'expired' || membership.status === 'active') && (
                                  <button
                                    onClick={() => handleRenewMembership(membership.id)}
                                    className="flex items-center text-xs text-green-600 hover:text-green-800 px-2 py-1.5 rounded hover:bg-green-50 whitespace-nowrap"
                                    title="Renovar"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                    Renovar
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleEditMembership(membership)}
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 px-2 py-1.5 rounded hover:bg-blue-50 whitespace-nowrap"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                  Editar
                                </button>
                                
                                {membership.status === 'active' && (
                                  <button
                                    onClick={() => handleCancelMembership(membership.id)}
                                    className="flex items-center text-xs text-red-600 hover:text-red-800 px-2 py-1.5 rounded hover:bg-red-50 whitespace-nowrap"
                                    title="Cancelar"
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* VISTA DE TABLA RESPONSIVE */}
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                              Usuario
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                              Plan
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell whitespace-nowrap">
                              Precio
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell whitespace-nowrap">
                              Período
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                              Estado
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
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
                                {/* USUARIO */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                                  <div className="flex items-center min-w-0">
                                    <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                      {membership.user?.profileImage ? (
                                        <img
                                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                                          src={membership.user.profileImage}
                                          alt=""
                                        />
                                      ) : (
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                          <span className="text-xs sm:text-sm font-medium text-purple-800">
                                            {membership.user?.firstName?.[0]}{membership.user?.lastName?.[0]}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-2 sm:ml-3 min-w-0">
                                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                        {membership.user?.firstName} {membership.user?.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 hidden sm:block truncate max-w-[150px]">
                                        {membership.user?.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                
                                {/* PLAN - TRADUCIDO */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm text-gray-900">
                                    {translateMembershipType(membership.type) || membership.plan?.name}
                                  </div>
                                </td>
                                
                                {/* PRECIO */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                                  {formatCurrency(membership.price)}
                                </td>
                                
                                {/* PERÍODO */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-xs text-gray-500 hidden lg:table-cell">
                                  <div>
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {formatDate(membership.startDate, 'dd/MM/yyyy')}
                                    </div>
                                    <div className="flex items-center mt-1">
                                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {formatDate(membership.endDate, 'dd/MM/yyyy')}
                                    </div>
                                  </div>
                                </td>
                                
                                {/* ESTADO */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                    <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="hidden sm:inline">{statusInfo.label}</span>
                                  </span>
                                </td>
                                
                                {/* ACCIONES */}
                                <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end gap-1">
                                    {(membership.status === 'expired' || membership.status === 'active') && (
                                      <button
                                        onClick={() => handleRenewMembership(membership.id)}
                                        className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded"
                                        title="Renovar"
                                      >
                                        <RotateCcw className="w-4 h-4 flex-shrink-0" />
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => handleEditMembership(membership)}
                                      className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4 flex-shrink-0" />
                                    </button>
                                    
                                    {membership.status === 'active' && (
                                      <button
                                        onClick={() => handleCancelMembership(membership.id)}
                                        className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded"
                                        title="Cancelar"
                                      >
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
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
                  )}
                </>
              )}
            </div>
            
            {/* PAGINACIÓN */}
            {totalPages > 1 && !loading && memberships.length > 0 && (
              <div className="bg-white px-3 sm:px-4 py-3 border-t border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <span className="hidden sm:inline">Mostrando </span>
                      {((currentPage - 1) * membershipsPerPage) + 1} - {Math.min(currentPage * membershipsPerPage, totalMemberships)} 
                      <span className="hidden sm:inline"> de</span>
                      <span className="sm:hidden">/</span> {totalMemberships}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    <span className="text-xs sm:text-sm text-gray-700 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
      
      {/* MODAL EDITAR MEMBRESÍA (Solo para EDITAR existentes) */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
                </h3>
                <button
                  onClick={() => {
                    setShowMembershipModal(false);
                    setEditingMembership(null);
                    resetMembershipForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4">
              <div className="space-y-4 sm:space-y-6">
                
                {/* SELECTOR DE CLIENTE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente * {loadingClients && <Loader className="inline w-4 h-4 animate-spin ml-2" />}
                  </label>
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={editingMembership}
                    />
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
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
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {client.email}
                                </div>
                              </div>
                              {membershipFormData.userId === client.id && (
                                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
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
                  
                  {selectedClientHasMembership && !editingMembership && (
                    <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex">
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div className="ml-3 flex-1">
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
                  
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar plan..."
                      value={planSearchTerm}
                      onChange={(e) => setPlanSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {filteredPlans.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
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
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {plan.name}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {plan.description || `${plan.duration} - ${formatCurrency(plan.price)}`}
                                </div>
                              </div>
                              {membershipFormData.planId === plan.id && (
                                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Notas adicionales..."
                  />
                </div>
                
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white z-10">
              <button
                onClick={() => {
                  setShowMembershipModal(false);
                  setEditingMembership(null);
                  resetMembershipForm();
                }}
                className="btn-secondary w-full sm:w-auto text-sm py-2"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveMembership}
                disabled={saving || !membershipFormData.userId || !membershipFormData.planId || selectedClientHasMembership}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm py-2"
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
      
      {/* WIZARD DE CREACIÓN DE MEMBRESÍA */}
      {showCreationWizard && (
        <MembershipCreationWizard
          onClose={() => setShowCreationWizard(false)}
          onSuccess={handleWizardSuccess}
        />
      )}
      
    </div>
  );
};

export default MembershipsManager;