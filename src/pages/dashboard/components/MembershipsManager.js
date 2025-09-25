// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MembershipsManager.js
// FUNCIÓN: Gestión completa de membresías y planes - Con sistema de pestañas
// CONECTA CON: Backend API /api/memberships/* y /api/membership-plans/*

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Search, Filter, Edit, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Eye, Trash2, RotateCcw,
  User, TrendingUp, TrendingDown, Bell, Settings,
  FileText, Download, Upload, MoreHorizontal, Loader, X, Package
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

// Importar el componente de planes de membresías
import MembershipPlansManager from './MembershipPlansManager';

const MembershipsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales para pestañas
  const [activeSection, setActiveSection] = useState('memberships');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingSection, setSavingSection] = useState(null);
  
  // Estados principales para membresías
  const [memberships, setMemberships] = useState([]);
  const [membershipStats, setMembershipStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [membershipsPerPage] = useState(isMobile ? 10 : 20);
  const [totalMemberships, setTotalMemberships] = useState(0);
  
  // Estados para alertas especiales
  const [expiredMemberships, setExpiredMemberships] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);
  
  // Estados para crear/editar membresía
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [membershipFormData, setMembershipFormData] = useState({
    userId: '',
    type: 'monthly',
    price: 250.00,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    preferredSchedule: {},
    notes: '',
    autoRenew: false
  });
  
  // Secciones del gestor de membresías
  const membershipSections = [
    {
      id: 'memberships',
      title: 'Gestión de Membresías',
      icon: CreditCard,
      description: 'Administrar membresías activas, renovaciones y vencimientos',
      dataLoaded: !loading,
      color: 'purple'
    },
    {
      id: 'plans',
      title: 'Planes de Membresías',
      icon: Package,
      description: 'Configurar tipos y planes de membresías disponibles',
      dataLoaded: true,
      color: 'blue'
    }
  ];
  
  // Tipos de membresía disponibles
  const membershipTypes = [
    { value: 'daily', label: 'Diaria', duration: 1, color: 'bg-blue-100 text-blue-800', price: 25 },
    { value: 'weekly', label: 'Semanal', duration: 7, color: 'bg-green-100 text-green-800', price: 150 },
    { value: 'monthly', label: 'Mensual', duration: 30, color: 'bg-purple-100 text-purple-800', price: 250 },
    { value: 'quarterly', label: 'Trimestral', duration: 90, color: 'bg-orange-100 text-orange-800', price: 600 },
    { value: 'annual', label: 'Anual', duration: 365, color: 'bg-red-100 text-red-800', price: 2400 }
  ];
  
  // Estados de membresía
  const membershipStatuses = [
    { value: 'active', label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'pending', label: 'Pendiente', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'por_vencer', label: 'Por Vencer', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    { value: 'expired', label: 'Vencida', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    { value: 'suspended', label: 'Suspendida', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
  ];
  
  // Notificar cambios no guardados
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // CARGAR DATOS
  const loadMemberships = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: membershipsPerPage,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        sortBy,
        sortOrder
      };
      
      console.log('Cargando membresías con parámetros:', params);
      
      const response = await apiService.get('/memberships', { params });
      const membershipData = response.data || response;
      
      if (membershipData.memberships && Array.isArray(membershipData.memberships)) {
        setMemberships(membershipData.memberships);
        setTotalMemberships(membershipData.pagination?.total || membershipData.memberships.length);
      } else if (Array.isArray(membershipData)) {
        setMemberships(membershipData);
        setTotalMemberships(membershipData.length);
      } else {
        console.warn('Formato de datos de membresías inesperado:', membershipData);
        setMemberships([]);
        setTotalMemberships(0);
      }
      
    } catch (error) {
      console.error('Error al cargar membresías:', error);
      showError('Error al cargar membresías');
      setMemberships([]);
      setTotalMemberships(0);
    } finally {
      setLoading(false);
    }
  };
  
  // CARGAR ESTADÍSTICAS
  const loadMembershipStats = async () => {
    try {
      console.log('🔄 Cargando estadísticas de membresías...');
      
      // Intentar obtener stats del backend
      let backendStats = {};
      try {
        backendStats = await apiService.getMembershipStats();
        console.log('📊 Estadísticas del backend:', backendStats);
      } catch (backendError) {
        console.warn('⚠️ Error obteniendo stats del backend, calculando localmente:', backendError);
      }
      
      // Calcular estadísticas locales como respaldo
      const localStats = calculateLocalStats();
      console.log('📊 Estadísticas locales calculadas:', localStats);
      
      // Combinar estadísticas (priorizar backend, usar local como fallback)
      const finalStats = {
        totalMemberships: backendStats.totalMemberships || localStats.totalMemberships || 0,
        activeMemberships: backendStats.activeMemberships || localStats.activeMemberships || 0,
        expiredMemberships: backendStats.expiredMemberships || localStats.expiredMemberships || 0,
        expiringSoon: backendStats.expiringSoon || localStats.expiringSoon || 0,
        pendingMemberships: backendStats.pendingMemberships || localStats.pendingMemberships || 0,
        pendingValidation: backendStats.pendingValidation || localStats.pendingValidation || 0,
        cancelledMemberships: backendStats.cancelledMemberships || localStats.cancelledMemberships || 0,
        suspendedMemberships: backendStats.suspendedMemberships || localStats.suspendedMemberships || 0
      };
      
      console.log('✅ Estadísticas finales:', finalStats);
      setMembershipStats(finalStats);
      
    } catch (error) {
      console.error('❌ Error general cargando estadísticas:', error);
      
      // Fallback completo usando solo datos locales
      const localStats = calculateLocalStats();
      console.log('🔄 Usando solo estadísticas locales como fallback:', localStats);
      setMembershipStats(localStats);
    }
  };
  
  // Calcular estadísticas desde datos locales
  const calculateLocalStats = () => {
    if (!memberships || !Array.isArray(memberships)) {
      console.log('📊 No hay membresías locales para calcular');
      return {
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        pendingMemberships: 0,
        pendingValidation: 0,
        cancelledMemberships: 0,
        suspendedMemberships: 0
      };
    }
    
    console.log(`📊 Calculando estadísticas de ${memberships.length} membresías locales`);
    
    const now = new Date();
    const stats = {
      totalMemberships: memberships.length,
      activeMemberships: 0,
      expiredMemberships: 0,
      expiringSoon: 0,
      pendingMemberships: 0,
      pendingValidation: 0,
      cancelledMemberships: 0,
      suspendedMemberships: 0
    };
    
    memberships.forEach(membership => {
      const currentStatus = getCurrentStatus(membership);
      const endDate = new Date(membership.endDate);
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // Contar por estado
      switch (currentStatus) {
        case 'active':
          stats.activeMemberships++;
          // Verificar si está por vencer (próximos 7 días)
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            stats.expiringSoon++;
          }
          break;
        case 'expired':
          stats.expiredMemberships++;
          break;
        case 'pending':
          stats.pendingMemberships++;
          break;
        case 'pending_validation':
          stats.pendingValidation++;
          break;
        case 'cancelled':
          stats.cancelledMemberships++;
          break;
        case 'suspended':
          stats.suspendedMemberships++;
          break;
        default:
          console.warn('⚠️ Estado no reconocido en estadísticas:', currentStatus);
      }
    });
    
    console.log('📊 Estadísticas calculadas por estado:', {
      total: stats.totalMemberships,
      activas: stats.activeMemberships,
      vencidas: stats.expiredMemberships,
      porVencer: stats.expiringSoon,
      pendientes: stats.pendingMemberships,
      pendientesValidacion: stats.pendingValidation,
      canceladas: stats.cancelledMemberships,
      suspendidas: stats.suspendedMemberships
    });
    
    return stats;
  };
  
  // CARGAR ALERTAS DE VENCIMIENTO
  const loadExpirationAlerts = async () => {
    try {
      // Membresías vencidas
      const expiredResponse = await apiService.getExpiredMemberships(0);
      const expiredData = expiredResponse.data || expiredResponse;
      setExpiredMemberships(Array.isArray(expiredData) ? expiredData : expiredData.memberships || []);
      
      // Membresías por vencer (próximos 7 días)
      const expiringResponse = await apiService.getExpiringSoonMemberships(7);
      const expiringData = expiringResponse.data || expiringResponse;
      setExpiringSoon(Array.isArray(expiringData) ? expiringData : expiringData.memberships || []);
      
    } catch (error) {
      console.error('Error al cargar alertas de vencimiento:', error);
      setExpiredMemberships([]);
      setExpiringSoon([]);
    }
  };
  
  // Refrescar todos los datos
  const refreshMembershipsData = () => {
    setRefreshKey(prev => prev + 1);
    loadMemberships();
    loadMembershipStats();
    loadExpirationAlerts();
    showSuccess('Datos de membresías actualizados');
  };
  
  // Cargar datos al montar y cuando cambien filtros
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMemberships();
    }
  }, [activeSection, currentPage, searchTerm, selectedStatus, selectedType, sortBy, sortOrder, refreshKey]);
  
  useEffect(() => {
    if (activeSection === 'memberships') {
      loadMembershipStats();
      loadExpirationAlerts();
    }
  }, [activeSection]);
  
  // FILTRAR MEMBRESÍAS (para datos locales)
  const filteredMemberships = memberships.filter(membership => {
    const memberName = `${membership.user?.firstName || ''} ${membership.user?.lastName || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      memberName.includes(searchTerm.toLowerCase()) ||
      membership.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || membership.status === selectedStatus;
    const matchesType = selectedType === 'all' || membership.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // FUNCIONES DE MEMBRESÍA
  
  // Crear/Actualizar membresía
  const handleSaveMembership = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!membershipFormData.userId) {
        showError('Debe seleccionar un usuario');
        return;
      }
      
      if (!membershipFormData.startDate) {
        showError('Fecha de inicio es obligatoria');
        return;
      }
      
      if (membershipFormData.price <= 0) {
        showError('El precio debe ser mayor a 0');
        return;
      }
      
      // Calcular fecha de fin si no se proporcionó
      let endDate = membershipFormData.endDate;
      if (!endDate) {
        const startDate = new Date(membershipFormData.startDate);
        const typeInfo = membershipTypes.find(t => t.value === membershipFormData.type);
        const duration = typeInfo?.duration || 30;
        
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setDate(calculatedEndDate.getDate() + duration);
        endDate = calculatedEndDate.toISOString().split('T')[0];
      }
      
      const membershipData = {
        ...membershipFormData,
        endDate,
        preferredSchedule: Object.keys(membershipFormData.preferredSchedule).length > 0 
          ? membershipFormData.preferredSchedule 
          : undefined
      };
      
      let response;
      if (editingMembership) {
        response = await apiService.put(`/memberships/${editingMembership.id}`, membershipData);
        showSuccess('Membresía actualizada exitosamente');
      } else {
        response = await apiService.post('/memberships', membershipData);
        showSuccess('Membresía creada exitosamente');
      }
      
      // Recargar datos
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
      // Cerrar modal
      setShowMembershipModal(false);
      setEditingMembership(null);
      resetMembershipForm();
      
      // Notificar cambios guardados
      if (onSave) {
        onSave({ type: 'membership', action: editingMembership ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('Error al guardar membresía:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar membresía';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Renovar membresía
  const handleRenewMembership = async (membershipId, months = 1) => {
    try {
      const typeInfo = membershipTypes.find(t => t.value === 'monthly');
      const price = typeInfo?.price || 250;
      
      await apiService.post(`/memberships/${membershipId}/renew`, {
        months,
        price: price * months
      });
      
      showSuccess(`Membresía renovada por ${months} mes${months > 1 ? 'es' : ''}`);
      
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
    } catch (error) {
      console.error('Error al renovar membresía:', error);
      showError('Error al renovar membresía');
    }
  };
  
  // Cancelar membresía
  const handleCancelMembership = async (membershipId, reason = '') => {
    if (!window.confirm('¿Estás seguro de cancelar esta membresía?')) {
      return;
    }
    
    try {
      await apiService.post(`/memberships/${membershipId}/cancel`, {
        reason: reason || 'Cancelación solicitada por administrador'
      });
      
      showSuccess('Membresía cancelada exitosamente');
      
      await loadMemberships();
      await loadMembershipStats();
      await loadExpirationAlerts();
      
    } catch (error) {
      console.error('Error al cancelar membresía:', error);
      showError('Error al cancelar membresía');
    }
  };
  
  // Reset form
  const resetMembershipForm = () => {
    setMembershipFormData({
      userId: '',
      type: 'monthly',
      price: 250.00,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      preferredSchedule: {},
      notes: '',
      autoRenew: false
    });
  };
  
  // Abrir modal para editar
  const handleEditMembership = (membership) => {
    setEditingMembership(membership);
    setMembershipFormData({
      userId: membership.userId || membership.user?.id || '',
      type: membership.type || 'monthly',
      price: membership.price || 250.00,
      startDate: membership.startDate ? membership.startDate.split('T')[0] : '',
      endDate: membership.endDate ? membership.endDate.split('T')[0] : '',
      preferredSchedule: membership.preferredSchedule || {},
      notes: membership.notes || '',
      autoRenew: membership.autoRenew || false
    });
    setShowMembershipModal(true);
  };
  
  // Abrir modal para crear
  const handleNewMembership = () => {
    setEditingMembership(null);
    resetMembershipForm();
    setShowMembershipModal(true);
  };
  
  // Obtener información del tipo de membresía
  const getTypeInfo = (type) => {
    return membershipTypes.find(t => t.value === type) || membershipTypes[2]; // Default: monthly
  };
  
  // Obtener información del estado
  const getStatusInfo = (status) => {
    // Mapeo completo de todos los estados posibles
    const statusMap = {
      'active': { 
        value: 'active', 
        label: 'Activa', 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle 
      },
      'pending': { 
        value: 'pending', 
        label: 'Pendiente', 
        color: 'bg-blue-100 text-blue-800', 
        icon: Clock 
      },
      'pending_validation': { 
        value: 'por_vencer', 
        label: 'POR VENCER', 
        color: 'bg-orange-100 text-orange-800', 
        icon: AlertTriangle 
      },
      'expired': { 
        value: 'expired', 
        label: 'Vencida', 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle 
      },
      'cancelled': { 
        value: 'cancelled', 
        label: 'Cancelada', 
        color: 'bg-gray-100 text-gray-800', 
        icon: XCircle 
      },
      'suspended': { 
        value: 'suspended', 
        label: 'Suspendida', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertTriangle 
      }
    };
    
    // Buscar el estado en el mapeo
    const statusInfo = statusMap[status];
    
    // Si el estado no existe, crear uno genérico
    if (!statusInfo) {
      console.warn('⚠️ Estado no reconocido en getStatusInfo:', status);
      return {
        value: status,
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Desconocido',
        color: 'bg-gray-100 text-gray-800',
        icon: AlertTriangle
      };
    }
    
    return statusInfo;
  };
  
  // Determinar estado actual de la membresía
  const getCurrentStatus = (membership) => {
    const now = new Date();
    const endDate = new Date(membership.endDate);
    
    // PRIORIDAD 1: Estados explícitos de cancelación/suspensión
    if (membership.status === 'cancelled') {
      return 'cancelled';
    }
    
    if (membership.status === 'suspended') {
      return 'suspended';
    }
    
    // PRIORIDAD 2: Estados pendientes
    if (membership.status === 'pending') {
      return 'pending';
    }
    
    if (membership.status === 'por_vencer') {
      return 'por_vencer';
    }
    
    // PRIORIDAD 3: Verificar expiración SOLO para membresías activas
    if (membership.status === 'active') {
      if (endDate < now) {
        return 'expired';
      }
      return 'active';
    }
    
    // PRIORIDAD 4: Estado explícito de expiración
    if (membership.status === 'expired') {
      return 'expired';
    }
    
    // FALLBACK: Estado no reconocido
    console.warn('⚠️ Estado no reconocido:', membership.status);
    return membership.status || 'pending';
  };
  
  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalMemberships / membershipsPerPage));

  // Manejar guardado desde planes
  const handleSavePlans = (data) => {
    console.log('Planes guardados:', data);
    setHasUnsavedChanges(false);
    
    if (onSave) {
      onSave({ type: 'membership-plan', action: data.action || 'updated' });
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER DEL GESTOR DE MEMBRESÍAS */}
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
          
          {/* Mostrar resumen de secciones cargadas */}
          <div className="mt-3 flex flex-wrap gap-2">
            {membershipSections.map(section => section.dataLoaded && (
              <span key={section.id} className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                {section.title} ✓
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Botón de actualizar */}
          <button
            onClick={refreshMembershipsData}
            className="btn-secondary btn-sm"
            title="Actualizar datos de membresías"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Indicador de cambios sin guardar */}
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
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center relative ${
                activeSection === section.id
                  ? `bg-${section.color}-100 text-${section.color}-700`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.title}
              
              {/* Indicadores de estado */}
              {section.dataLoaded && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              
              {/* Indicador de guardando */}
              {savingSection === section.id && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* CONTENIDO SEGÚN SECCIÓN ACTIVA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* SECCIÓN: Gestión de Membresías */}
        {activeSection === 'memberships' && (
          <div className="space-y-6">
            
            {/* ALERTAS DE VENCIMIENTO */}
            {(expiredMemberships.length > 0 || expiringSoon.length > 0) && (
              <div className="space-y-3">
                {/* Membresías vencidas */}
                {expiredMemberships.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {expiredMemberships.length} Membresía{expiredMemberships.length !== 1 ? 's' : ''} Vencida{expiredMemberships.length !== 1 ? 's' : ''}
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Hay membresías que requieren renovación inmediata.</p>
                          <button
                            onClick={() => setShowExpiredAlert(!showExpiredAlert)}
                            className="font-medium underline hover:no-underline"
                          >
                            {showExpiredAlert ? 'Ocultar' : 'Ver'} detalles
                          </button>
                        </div>
                        
                        {showExpiredAlert && (
                          <div className="mt-3 max-h-40 overflow-y-auto">
                            {expiredMemberships.slice(0, 5).map(membership => (
                              <div key={membership.id} className="flex items-center justify-between py-1">
                                <span className="text-sm">
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
                
                {/* Membresías por vencer */}
                {expiringSoon.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          {expiringSoon.length} Membresía{expiringSoon.length !== 1 ? 's' : ''} por Vencer
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Membresías que vencen en los próximos 7 días.</p>
                          <button
                            onClick={() => setShowExpiringAlert(!showExpiringAlert)}
                            className="font-medium underline hover:no-underline"
                          >
                            {showExpiringAlert ? 'Ocultar' : 'Ver'} detalles
                          </button>
                        </div>
                        
                        {showExpiringAlert && (
                          <div className="mt-3 max-h-40 overflow-y-auto">
                            {expiringSoon.slice(0, 5).map(membership => (
                              <div key={membership.id} className="flex items-center justify-between py-1">
                                <span className="text-sm">
                                  {membership.user?.firstName} {membership.user?.lastName} - Vence: {formatDate(membership.endDate, 'dd/MM/yyyy')}
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
                    <div className="text-sm text-purple-600">Total Membresías</div>
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
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-medium text-gray-900">
                  Membresías Registradas
                </h4>
              </div>
              
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Filtro por estado */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">Todos los tipos</option>
                  {membershipTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                
                {/* Ordenamiento */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                  <option value="endDate-asc">Vencen primero</option>
                  <option value="endDate-desc">Vencen último</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="price-asc">Menor precio</option>
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
              ) : filteredMemberships.length === 0 ? (
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Período
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMemberships.map((membership) => {
                          const typeInfo = getTypeInfo(membership.type);
                          const currentStatus = getCurrentStatus(membership);
                          const statusInfo = getStatusInfo(currentStatus);
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
                                        alt={`${membership.user.firstName} ${membership.user.lastName}`}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-purple-800">
                                          {membership.user?.firstName?.[0] || 'U'}{membership.user?.lastName?.[0] || ''}
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
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
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
                                  {/* Renovar */}
                                  {(currentStatus === 'expired' || currentStatus === 'active') && hasPermission('renew_memberships') && (
                                    <button
                                      onClick={() => handleRenewMembership(membership.id)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Renovar membresía"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Editar */}
                                  {hasPermission('edit_memberships') && (
                                    <button
                                      onClick={() => handleEditMembership(membership)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Editar membresía"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Cancelar */}
                                  {currentStatus === 'active' && hasPermission('cancel_memberships') && (
                                    <button
                                      onClick={() => handleCancelMembership(membership.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Cancelar membresía"
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
                  
                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {filteredMemberships.map((membership) => {
                      const typeInfo = getTypeInfo(membership.type);
                      const currentStatus = getCurrentStatus(membership);
                      const statusInfo = getStatusInfo(currentStatus);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={membership.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {membership.user?.profileImage ? (
                                  <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={membership.user.profileImage}
                                    alt={`${membership.user.firstName} ${membership.user.lastName}`}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-lg font-medium text-purple-800">
                                      {membership.user?.firstName?.[0] || 'U'}{membership.user?.lastName?.[0] || ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {membership.user?.firstName} {membership.user?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {membership.user?.email}
                                </div>
                                <div className="flex items-center mt-1 space-x-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {formatCurrency(membership.price)} • {formatDate(membership.startDate, 'dd/MM')} - {formatDate(membership.endDate, 'dd/MM')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {(currentStatus === 'expired' || currentStatus === 'active') && hasPermission('renew_memberships') && (
                                <button
                                  onClick={() => handleRenewMembership(membership.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              
                              {hasPermission('edit_memberships') && (
                                <button
                                  onClick={() => handleEditMembership(membership)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* PAGINACIÓN */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm text-gray-700">
                            Mostrando {((currentPage - 1) * membershipsPerPage) + 1} a {Math.min(currentPage * membershipsPerPage, totalMemberships)} de {totalMemberships} membresías
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
        
        {/* SECCIÓN: Planes de Membresías */}
        {activeSection === 'plans' && (
          <MembershipPlansManager
            onSave={handleSavePlans}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
      </div>
      
      {/* MODAL PARA CREAR/EDITAR MEMBRESÍA */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
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
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Usuario */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={membershipFormData.userId}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="ID del usuario"
                    disabled={editingMembership}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingMembership ? 'No se puede cambiar el usuario una vez creada la membresía' : 'Ingrese el ID del usuario'}
                  </p>
                </div>
                
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Membresía *
                  </label>
                  <select
                    value={membershipFormData.type}
                    onChange={(e) => {
                      const selectedType = membershipTypes.find(t => t.value === e.target.value);
                      setMembershipFormData(prev => ({ 
                        ...prev, 
                        type: e.target.value,
                        price: selectedType?.price || prev.price
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {membershipTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {formatCurrency(type.price)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={membershipFormData.price}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Fecha de inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={membershipFormData.startDate}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Fecha de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={membershipFormData.endDate}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se calculará automáticamente si no se especifica
                  </p>
                </div>
                
                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={membershipFormData.notes}
                    onChange={(e) => setMembershipFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Notas adicionales sobre la membresía..."
                  />
                </div>
                
                {/* Auto renovar */}
                <div className="md:col-span-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={membershipFormData.autoRenew}
                      onChange={(e) => setMembershipFormData(prev => ({ ...prev, autoRenew: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-renovar membresía</span>
                  </label>
                </div>
                
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
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
                disabled={saving}
                className="btn-primary"
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