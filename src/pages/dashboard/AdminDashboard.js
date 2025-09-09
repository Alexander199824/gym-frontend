// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, CreditCard, TrendingUp, AlertCircle,
  Calendar, Clock, ArrowRight, RefreshCw, Download,
  BarChart3, PieChart, Activity, Target, Zap, Crown, Save,
  Globe, Image, ShoppingBag, Info, CheckCircle, Package,
  Truck, Plus, Loader, Bug, Coins
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Componentes específicos del dashboard
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Componentes para gestión de contenido con horarios flexibles
import ContentEditor from './components/ContentEditor';
import ServicesManager from './components/ServicesManager';
import PlansManager from './components/PlansManager';
import ProductsManager from './components/ProductsManager';
import MediaUploader from './components/MediaUploader';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return 'Q 0.00';
  return `Q ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const AdminDashboard = () => {
  const { user, canManageContent } = useAuth();
  const { formatDate, showError, showSuccess, isMobile } = useApp();
  
  // Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // Estados locales para operaciones
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para gestión de contenido
  const [activeContentTab, setActiveContentTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estado para debug info
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Estados para datos operativos
  const [userStats, setUserStats] = useState({ data: null, isLoading: false, error: null });
  const [membershipStats, setMembershipStats] = useState({ data: null, isLoading: false, error: null });
  const [paymentReports, setPaymentReports] = useState({ data: null, isLoading: false, error: null });
  const [expiredMemberships, setExpiredMemberships] = useState({ data: null, isLoading: false, error: null });
  const [expiringSoon, setExpiringSoon] = useState({ data: null, isLoading: false, error: null });
  const [pendingTransfers, setPendingTransfers] = useState({ data: null, isLoading: false, error: null });
  const [todayPayments, setTodayPayments] = useState({ data: null, isLoading: false, error: null });
  
  // Estados para datos de contenido con soporte para horarios flexibles
  const [gymConfigData, setGymConfigData] = useState({ data: null, isLoading: false, error: null });
  const [servicesData, setServicesData] = useState({ data: null, isLoading: false, error: null });
  const [membershipPlansData, setMembershipPlansData] = useState({ data: null, isLoading: false, error: null });
  const [featuredProductsData, setFeaturedProductsData] = useState({ data: null, isLoading: false, error: null });
  
  // Estados específicos para horarios flexibles
  const [capacityMetrics, setCapacityMetrics] = useState({ data: null, isLoading: false, error: null });
  
  // Estados para gestión de inventario
  const [inventoryStats, setInventoryStats] = useState({ data: null, isLoading: false, error: null });
  
  // Cargar datos operativos
  const loadDashboardData = async () => {
    console.log('Cargando datos del dashboard...');
    
    try {
      // Stats de usuarios
      setUserStats({ data: null, isLoading: true, error: null });
      try {
        const userStatsData = await apiService.getUserStats();
        setUserStats({ data: userStatsData, isLoading: false, error: null });
      } catch (error) {
        console.log('Estadísticas de usuarios no disponibles:', error.message);
        setUserStats({ data: null, isLoading: false, error });
      }
      
      // Stats de membresías
      setMembershipStats({ data: null, isLoading: true, error: null });
      try {
        const membershipStatsData = await apiService.getMembershipStats();
        setMembershipStats({ data: membershipStatsData, isLoading: false, error: null });
      } catch (error) {
        console.log('Estadísticas de membresías no disponibles:', error.message);
        setMembershipStats({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  };
  
  // Cargar datos de contenido con soporte para horarios flexibles
  const loadContentData = async () => {
    if (!canManageContent) return;
    
    console.log('Cargando datos de gestión de contenido...');
    
    try {
      // Usar el endpoint específico para ContentEditor que incluye horarios flexibles
      setGymConfigData({ data: null, isLoading: true, error: null });
      try {
        console.log('Cargando configuración del gimnasio usando endpoint del editor...');
        const gymConfigResponse = await apiService.getGymConfigEditor();
        const configData = gymConfigResponse?.data || gymConfigResponse;
        setGymConfigData({ data: configData, isLoading: false, error: null });
        
        console.log('Configuración del gimnasio cargada para AdminDashboard con horarios flexibles:', {
          hasConfig: !!configData,
          hasName: !!configData?.name,
          hasHours: !!configData?.hours,
          hasFlexibleStructure: configData?.hours ? 
            Object.values(configData.hours).some(day => day?.timeSlots?.length > 0) : false
        });
        
        // Mostrar estructura de horarios cargados para debug
        if (configData?.hours) {
          const openDays = Object.keys(configData.hours).filter(day => configData.hours[day]?.isOpen);
          const totalSlots = openDays.reduce((sum, day) => {
            return sum + (configData.hours[day]?.timeSlots?.length || 0);
          }, 0);
          
          console.log('Horarios flexibles cargados:', {
            openDays: openDays.length,
            totalSlots: totalSlots,
            hasMultipleSlots: openDays.some(day => configData.hours[day]?.timeSlots?.length > 1)
          });
        }
        
      } catch (error) {
        console.log('Editor de configuración del gimnasio no disponible, intentando respaldo:', error.message);
        
        // Fallback al endpoint regular
        try {
          const gymConfigResponse = await apiService.getGymConfig();
          const configData = gymConfigResponse?.data || gymConfigResponse;
          setGymConfigData({ data: configData, isLoading: false, error: null });
          console.log('Configuración del gimnasio cargada usando endpoint de respaldo:', configData);
        } catch (fallbackError) {
          console.log('Ambos endpoints de configuración del gimnasio fallaron:', fallbackError.message);
          setGymConfigData({ data: null, isLoading: false, error: fallbackError });
        }
      }
      
      // Servicios
      setServicesData({ data: null, isLoading: true, error: null });
      try {
        const servicesResponse = await apiService.getGymServices();
        const services = servicesResponse?.data || servicesResponse;
        setServicesData({ data: services, isLoading: false, error: null });
        console.log('Servicios cargados para AdminDashboard:', services);
      } catch (error) {
        console.log('Servicios no disponibles:', error.message);
        setServicesData({ data: null, isLoading: false, error });
      }
      
      // Planes de membresía
      setMembershipPlansData({ data: null, isLoading: true, error: null });
      try {
        const plansResponse = await apiService.getMembershipPlans();
        const plans = plansResponse?.data || plansResponse;
        setMembershipPlansData({ data: plans, isLoading: false, error: null });
        console.log('Planes cargados para AdminDashboard:', plans);
      } catch (error) {
        console.log('Planes no disponibles:', error.message);
        setMembershipPlansData({ data: null, isLoading: false, error });
      }
      
      // Productos destacados
      setFeaturedProductsData({ data: null, isLoading: true, error: null });
      try {
        const productsResponse = await apiService.getFeaturedProducts();
        const products = productsResponse?.data || productsResponse;
        setFeaturedProductsData({ data: products, isLoading: false, error: null });
        console.log('Productos cargados para AdminDashboard:', products);
      } catch (error) {
        console.log('Productos no disponibles:', error.message);
        setFeaturedProductsData({ data: null, isLoading: false, error });
      }
      
      // Cargar métricas de capacidad para horarios flexibles
      setCapacityMetrics({ data: null, isLoading: true, error: null });
      try {
        const capacityResponse = await apiService.getCapacityMetrics();
        const capacity = capacityResponse?.data || capacityResponse;
        setCapacityMetrics({ data: capacity, isLoading: false, error: null });
        console.log('Métricas de capacidad cargadas para AdminDashboard:', capacity);
      } catch (error) {
        console.log('Métricas de capacidad no disponibles:', error.message);
        setCapacityMetrics({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('Error cargando datos de contenido:', error);
    }
  };
  
  // Cargar datos de inventario
  const loadInventoryData = async () => {
    console.log('Cargando datos de inventario...');
    
    try {
      setInventoryStats({ data: null, isLoading: true, error: null });
      try {
        const inventoryData = await apiService.getInventoryStats();
        setInventoryStats({ data: inventoryData, isLoading: false, error: null });
        console.log('Estadísticas de inventario cargadas:', inventoryData);
      } catch (error) {
        console.log('Estadísticas de inventario no disponibles:', error.message);
        setInventoryStats({ data: null, isLoading: false, error });
      }
    } catch (error) {
      console.error('Error cargando datos de inventario:', error);
    }
  };
  
  // Refrescar datos con soporte para horarios flexibles
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    loadDashboardData();
    if (canManageContent) {
      loadContentData();
    }
    if (activeTab === 'inventory') {
      loadInventoryData();
    }
    showSuccess('Datos actualizados');
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('AdminDashboard montado, cargando datos...');
    loadDashboardData();
    if (canManageContent) {
      loadContentData();
    }
  }, [refreshKey, selectedPeriod]);
  
  // Auto-refresh para operaciones
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'operations') {
        loadDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // Cargar datos de inventario cuando se cambia a esa tab
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventoryData();
    }
  }, [activeTab]);
  
  // Calcular métricas principales
  const mainMetrics = {
    totalUsers: userStats?.data?.totalActiveUsers || 0,
    activeMemberships: membershipStats?.data?.activeMemberships || 0,
    expiredCount: expiredMemberships?.data?.total || 0,
    expiringSoonCount: expiringSoon?.data?.total || 0,
    pendingTransfersCount: pendingTransfers?.data?.total || 0,
    todayPaymentsCount: todayPayments?.data?.payments?.length || 0
  };
  
  // Calcular métricas de inventario en Quetzales
  const inventoryMetrics = {
    totalProducts: inventoryStats?.data?.totalProducts || 0,
    lowStockProducts: inventoryStats?.data?.lowStockProducts || 0,
    outOfStockProducts: inventoryStats?.data?.outOfStockProducts || 0,
    totalInventoryValue: inventoryStats?.data?.totalValue || 0,
    totalSalesToday: inventoryStats?.data?.salesToday || 0
  };
  
  // Períodos disponibles
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // Tabs para gestión de contenido con indicadores de horarios flexibles
  const contentTabs = [
    {
      id: 'general',
      title: 'Información General',
      icon: Info,
      description: 'Nombre, descripción, contacto, horarios flexibles, estadísticas',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading,
      hasFlexibleHours: gymConfigData.data?.hours ? 
        Object.values(gymConfigData.data.hours).some(day => day?.timeSlots?.length > 0) : false
    },
    {
      id: 'services',
      title: 'Servicios',
      icon: Target,
      description: 'Servicios del gimnasio',
      dataLoaded: !!servicesData.data && !servicesData.isLoading
    },
    {
      id: 'plans',
      title: 'Planes de Membresía',
      icon: CreditCard,
      description: 'Planes y precios',
      dataLoaded: !!membershipPlansData.data && !membershipPlansData.isLoading
    },
    {
      id: 'products',
      title: 'Productos',
      icon: ShoppingBag,
      description: 'Tienda del gimnasio',
      dataLoaded: !!featuredProductsData.data && !featuredProductsData.isLoading
    },
    {
      id: 'media',
      title: 'Multimedia',
      icon: Image,
      description: 'Logo, imágenes, videos',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading
    }
  ];
  
  // Advertencia de cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // Estado de carga general
  const isLoading = userStats.isLoading || membershipStats.isLoading;

  // FUNCIONES PARA SISTEMA DE HORARIOS FLEXIBLES
  
  // Guardar configuración con soporte para horarios flexibles
  const handleSaveConfig = async (saveData) => {
    console.log('AdminDashboard - Guardando configuración del gimnasio con horarios flexibles:', saveData);
    
    try {
      let result;
      
      // Verificar si es guardado por secciones (nuevo sistema de horarios flexibles)
      if (saveData.section && saveData.data) {
        console.log(`Guardando sección: ${saveData.section}`);
        
        // Usar el nuevo método para guardar por secciones
        if (saveData.section === 'schedule') {
          // Guardar horarios flexibles
          result = await apiService.saveFlexibleSchedule(saveData.data.hours);
        } else {
          // Guardar otras secciones
          result = await apiService.saveGymConfigSection(saveData.section, saveData.data);
        }
        
      } else {
        // Guardado tradicional (mantener compatibilidad)
        console.log('Usando método de guardado tradicional');
        result = await apiService.updateGymConfig(saveData);
      }
      
      if (result && result.success) {
        console.log('Configuración guardada exitosamente:', result);
        
        // Actualizar datos locales después del guardado exitoso
        await loadContentData();
        
        // Mostrar mensaje de éxito específico
        const successMessage = result.message || 'Configuración guardada exitosamente';
        showSuccess(successMessage);
        
        // Si se guardaron horarios, actualizar métricas de capacidad
        if (saveData.section === 'schedule') {
          console.log('Refrescando métricas de capacidad después de guardar horarios...');
          try {
            const capacityResponse = await apiService.getCapacityMetrics();
            const capacity = capacityResponse?.data || capacityResponse;
            setCapacityMetrics({ data: capacity, isLoading: false, error: null });
            console.log('Métricas de capacidad actualizadas:', capacity);
          } catch (error) {
            console.log('No se pudieron actualizar las métricas de capacidad:', error.message);
          }
        }
        
      } else {
        console.warn('El resultado del guardado podría ser diferente al esperado:', result);
        showSuccess('Configuración guardada');
      }
      
    } catch (error) {
      console.error('AdminDashboard - Fallo al guardar configuración:', error);
      
      // Mostrar mensaje de error específico
      if (error.response?.status === 422) {
        showError('Error de validación en los datos');
      } else if (error.response?.status === 403) {
        showError('Sin permisos para guardar configuración');
      } else if (error.response?.status === 404) {
        showError('Función no disponible en el servidor');
      } else {
        showError('Error al guardar configuración');
      }
    }
  };
  
  // Guardar servicios
  const handleSaveServices = async (data) => {
    console.log('AdminDashboard - Guardando servicios:', data);
    
    try {
      const result = await apiService.updateGymServices(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Servicios guardados exitosamente');
      } else {
        showSuccess('Servicios guardados');
      }
      
    } catch (error) {
      console.error('AdminDashboard - Fallo al guardar servicios:', error);
      showError('Error al guardar servicios');
    }
  };
  
  // Guardar planes
  const handleSavePlans = async (data) => {
    console.log('AdminDashboard - Guardando planes:', data);
    
    try {
      const result = await apiService.updateMembershipPlans(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Planes guardados exitosamente');
      } else {
        showSuccess('Planes guardados');
      }
      
    } catch (error) {
      console.error('AdminDashboard - Fallo al guardar planes:', error);
      showError('Error al guardar planes');
    }
  };
  
  // Guardar productos
  const handleSaveProducts = async (data) => {
    console.log('AdminDashboard - Guardando productos:', data);
    
    try {
      const result = await apiService.updateFeaturedProducts(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Productos guardados exitosamente');
      } else {
        showSuccess('Productos guardados');
      }
      
    } catch (error) {
      console.error('AdminDashboard - Fallo al guardar productos:', error);
      showError('Error al guardar productos');
    }
  };
  
  // Guardar multimedia
  const handleSaveMedia = async (data) => {
    console.log('AdminDashboard - Guardando multimedia:', data);
    
    try {
      const result = await apiService.updateGymMedia(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Multimedia guardada exitosamente');
      } else {
        showSuccess('Multimedia guardada');
      }
      
    } catch (error) {
      console.error('AdminDashboard - Fallo al guardar multimedia:', error);
      showError('Error al guardar multimedia');
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO DISCRETO - En esquina inferior derecha */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            title="Información de Debug"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute bottom-10 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">Información de Debug - Horarios Flexibles</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName} ({user?.role})</div>
                <div>Puede gestionar contenido: {canManageContent ? 'Sí' : 'No'}</div>
                <div>Pestaña activa: {activeTab}</div>
                <div>Pestaña de contenido: {activeContentTab}</div>
                
                {/* Debug info específico para horarios flexibles */}
                <div className="border-t pt-1 mt-1">
                  <div className="font-medium text-green-700">Estado de Horarios Flexibles:</div>
                  <div>Configuración cargada: {gymConfigData.data ? 'Sí' : 'No'}</div>
                  <div>Tiene horarios: {gymConfigData.data?.hours ? 'Sí' : 'No'}</div>
                  {gymConfigData.data?.hours && (
                    <>
                      <div>Días abiertos: {Object.keys(gymConfigData.data.hours).filter(day => gymConfigData.data.hours[day]?.isOpen).length}/7</div>
                      <div>Total de horarios: {Object.values(gymConfigData.data.hours).reduce((sum, day) => sum + (day?.timeSlots?.length || 0), 0)}</div>
                      <div>Tiene flexibilidad: {Object.values(gymConfigData.data.hours).some(day => day?.timeSlots?.length > 1) ? 'Sí' : 'No'}</div>
                    </>
                  )}
                  <div>Métricas de capacidad: {capacityMetrics.data ? 'Sí' : 'No'}</div>
                  {capacityMetrics.data && (
                    <>
                      <div>Capacidad total: {capacityMetrics.data.totalCapacity || 0}</div>
                      <div>Ocupación: {capacityMetrics.data.averageOccupancy || 0}%</div>
                    </>
                  )}
                </div>
                
                <div className="border-t pt-1 mt-1">
                  <div>Servicios: {servicesData.data ? 'Sí' : 'No'} | Planes: {membershipPlansData.data ? 'Sí' : 'No'}</div>
                  <div>Cargando: Config {gymConfigData.isLoading ? 'Sí' : 'No'} | Servicios {servicesData.isLoading ? 'Sí' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Bienvenido, {user?.firstName}. Gestiona tu página web y gimnasio con horarios flexibles.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Selector de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-input py-2 px-3 text-sm"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
          {/* Botón de actualizar */}
          <button
            onClick={refreshDashboard}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Botón de reportes */}
          <Link
            to="/dashboard/reports"
            className="btn-primary btn-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reportes
          </Link>
          
          {/* Indicador de cambios sin guardar */}
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          
          {/* PESTAÑA: Resumen Ejecutivo */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Resumen Ejecutivo
          </button>
          
          {/* PESTAÑA: Operaciones */}
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Operaciones Diarias
          </button>
          
          {/* PESTAÑA: Gestión de Página Web con indicador de horarios flexibles */}
          {canManageContent && (
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Página Web
              {/* Indicador de horarios flexibles activos */}
              {contentTabs[0]?.hasFlexibleHours && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" title="Horarios flexibles configurados"></span>
              )}
              {hasUnsavedChanges && activeTab === 'content' && (
                <span className="ml-1 w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
              )}
            </button>
          )}
          
          {/* PESTAÑA: Gestión de Inventario/Tienda */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Inventario y Ventas
          </button>
          
        </nav>
      </div>
      
      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      
      {/* PESTAÑA: RESUMEN EJECUTIVO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* MÉTRICAS PRINCIPALES EJECUTIVAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <DashboardCard
              title="Usuarios Activos"
              value={mainMetrics.totalUsers}
              icon={Users}
              color="blue"
              isLoading={userStats.isLoading}
              link="/dashboard/users"
              subtitle="Total registrados"
            />
            
            <DashboardCard
              title="Membresías Activas"
              value={mainMetrics.activeMemberships}
              icon={CreditCard}
              color="green"
              isLoading={membershipStats.isLoading}
              link="/dashboard/memberships"
              subtitle="Total vigentes"
            />
            
            <DashboardCard
              title="Productos Totales"
              value={inventoryMetrics.totalProducts}
              icon={Package}
              color="purple"
              isLoading={inventoryStats.isLoading}
              link="#"
              subtitle="Total en catálogo"
            />
            
          </div>
          
          {/* Métricas de horarios flexibles si están disponibles */}
          {capacityMetrics.data && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                Métricas de Capacidad (Horarios Flexibles)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{capacityMetrics.data.totalCapacity || 0}</div>
                  <div className="text-sm text-gray-600">Capacidad Total</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{capacityMetrics.data.availableSpaces || 0}</div>
                  <div className="text-sm text-gray-600">Espacios Libres</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    (capacityMetrics.data.averageOccupancy || 0) >= 90 ? 'text-red-600' :
                    (capacityMetrics.data.averageOccupancy || 0) >= 75 ? 'text-yellow-600' :
                    (capacityMetrics.data.averageOccupancy || 0) >= 50 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {capacityMetrics.data.averageOccupancy || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Ocupación Promedio</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{capacityMetrics.data.busiestDay || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Día Más Ocupado</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setActiveTab('content');
                    setActiveContentTab('general');
                  }}
                  className="btn-secondary btn-sm"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Configurar Horarios
                </button>
              </div>
            </div>
          )}
          
          {/* GRÁFICOS Y ANÁLISIS EJECUTIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Distribución de usuarios por rol */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribución de Usuarios
              </h3>
              
              {userStats.isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  {Object.entries(userStats?.data?.roleStats || {}).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded mr-3 ${
                          role === 'admin' ? 'bg-purple-500' :
                          role === 'colaborador' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {role === 'admin' ? 'Administradores' : 
                           role === 'colaborador' ? 'Personal' : 'Clientes'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {count}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({Math.round((count / mainMetrics.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Estadísticas de membresías */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado de Membresías
              </h3>
              
              {membershipStats.isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded mr-3 bg-green-500" />
                      <span className="text-sm text-gray-600">Activas</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {membershipStats?.data?.activeMemberships || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded mr-3 bg-yellow-500" />
                      <span className="text-sm text-gray-600">Por Vencer</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {membershipStats?.data?.expiringSoon || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded mr-3 bg-red-500" />
                      <span className="text-sm text-gray-600">Vencidas</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {membershipStats?.data?.expired || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
          </div>
          
          {/* ACCIONES EJECUTIVAS RÁPIDAS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Ejecutivas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/dashboard/analytics"
                className="btn-primary text-center py-3"
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                Analíticas
              </Link>
              
              <button
                onClick={() => setActiveTab('content')}
                className="btn-primary text-center py-3"
              >
                <Globe className="w-5 h-5 mx-auto mb-1" />
                Editar Página Web
              </button>
              
              <Link
                to="/dashboard/backup"
                className="btn-primary text-center py-3"
              >
                <Download className="w-5 h-5 mx-auto mb-1" />
                Respaldo
              </Link>
            </div>
          </div>
          
        </div>
      )}
      
      {/* PESTAÑA: OPERACIONES DIARIAS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          
          {/* MÉTRICAS OPERATIVAS DEL DÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Vencidas"
              value={mainMetrics.expiredCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredMemberships.isLoading}
              link="/dashboard/memberships/expired"
              subtitle="Hoy"
            />
            
            <DashboardCard
              title="Por Vencer"
              value={mainMetrics.expiringSoonCount}
              icon={Clock}
              color="yellow"
              isLoading={expiringSoon.isLoading}
              link="/dashboard/memberships/expiring-soon"
              subtitle="Esta semana"
            />
            
            <DashboardCard
              title="Transacciones"
              value={mainMetrics.todayPaymentsCount}
              icon={Activity}
              color="green"
              isLoading={todayPayments.isLoading}
              link="/dashboard/payments"
              subtitle="Hoy"
            />
            
            <DashboardCard
              title="Productos Vendidos"
              value={inventoryMetrics.totalSalesToday}
              icon={ShoppingBag}
              color="purple"
              isLoading={inventoryStats.isLoading}
              link="#"
              subtitle="Hoy"
            />
            
          </div>
          
          {/* ACCIONES RÁPIDAS OPERATIVAS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Rápidas Operativas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="Nuevo Cliente"
                description="Registrar nuevo usuario"
                icon={Users}
                color="blue"
                link="/dashboard/users/create"
              />
              
              <QuickActionCard
                title="Nueva Membresía"
                description="Crear membresía"
                icon={CreditCard}
                color="green"
                link="/dashboard/memberships/create"
              />
              
              <QuickActionCard
                title="Registrar Actividad"
                description="Actividad del gimnasio"
                icon={Activity}
                color="yellow"
                link="/dashboard/activities/create"
              />
              
              <QuickActionCard
                title="Venta en Tienda"
                description="Registrar venta física"
                icon={ShoppingBag}
                color="purple"
                onClick={() => setActiveTab('inventory')}
              />
            </div>
          </div>
          
          {/* CONTENIDO OPERATIVO PRINCIPAL */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resumen Operativo
            </h3>
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Módulo operativo en construcción</p>
              <p className="text-sm">Los datos se cargarán cuando el backend esté listo</p>
            </div>
          </div>
          
        </div>
      )}
      
      {/* PESTAÑA: PÁGINA WEB con soporte completo para horarios flexibles */}
      {activeTab === 'content' && canManageContent && (
        <div className="space-y-6">
          
          {/* SUB-NAVEGACIÓN PARA GESTIÓN DE PÁGINA WEB */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-1 overflow-x-auto">
                {contentTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveContentTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center ${
                      activeContentTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.title}
                    {/* Indicadores con horarios flexibles */}
                    {tab.dataLoaded && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    {tab.hasFlexibleHours && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded" title="Horarios flexibles activos">
                        flex
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={() => {
                      setHasUnsavedChanges(false);
                      showSuccess('Cambios guardados');
                    }}
                    className="btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Guardar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* CONTENIDO SEGÚN SUB-PESTAÑA ACTIVA */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            
            {/* SUB-PESTAÑA: Información General con horarios flexibles */}
            {activeContentTab === 'general' && (
              <ContentEditor 
                gymConfig={gymConfigData}
                capacityMetrics={capacityMetrics}
                onSave={handleSaveConfig}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-PESTAÑA: Servicios */}
            {activeContentTab === 'services' && (
              <ServicesManager
                services={servicesData.data}
                isLoading={servicesData.isLoading}
                onSave={handleSaveServices}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-PESTAÑA: Planes de Membresía */}
            {activeContentTab === 'plans' && (
              <PlansManager
                plans={membershipPlansData.data}
                isLoading={membershipPlansData.isLoading}
                onSave={handleSavePlans}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-PESTAÑA: Productos */}
            {activeContentTab === 'products' && (
              <ProductsManager
                products={featuredProductsData.data}
                isLoading={featuredProductsData.isLoading}
                onSave={handleSaveProducts}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-PESTAÑA: Multimedia */}
            {activeContentTab === 'media' && (
              <MediaUploader
                gymConfig={gymConfigData}
                onSave={handleSaveMedia}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
          </div>
          
        </div>
      )}
      
      {/* PESTAÑA: GESTIÓN DE INVENTARIO Y VENTAS en Quetzales */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* HEADER DE INVENTARIO */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Inventario y Ventas
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Gestiona productos y ventas en tienda física.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="btn-primary btn-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva Venta
                </button>
                
                <button className="btn-secondary btn-sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Reportes
                </button>
              </div>
            </div>
          </div>
          
          {/* MÉTRICAS DE INVENTARIO en Quetzales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Productos Totales"
              value={inventoryMetrics.totalProducts}
              icon={Package}
              color="blue"
              isLoading={inventoryStats.isLoading}
              subtitle="En catálogo"
            />
            
            <DashboardCard
              title="Stock Bajo"
              value={inventoryMetrics.lowStockProducts}
              icon={AlertCircle}
              color="yellow"
              isLoading={inventoryStats.isLoading}
              alert={inventoryMetrics.lowStockProducts > 0}
              subtitle="Requieren reposición"
            />
            
            <DashboardCard
              title="Sin Stock"
              value={inventoryMetrics.outOfStockProducts}
              icon={AlertCircle}
              color="red"
              isLoading={inventoryStats.isLoading}
              alert={inventoryMetrics.outOfStockProducts > 0}
              subtitle="Agotados"
            />
            
            {/* VALOR EN QUETZALES */}
            <DashboardCard
              title="Valor Inventario"
              value={formatQuetzales(inventoryMetrics.totalInventoryValue)}
              icon={Coins}
              color="green"
              isLoading={inventoryStats.isLoading}
              subtitle="Valor total en stock"
            />
            
          </div>
          
          {/* CONTENIDO EN CONSTRUCCIÓN */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sistema de Inventario y Ventas
            </h3>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Sistema en Desarrollo
              </h4>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                El sistema completo de inventario y ventas estará disponible próximamente. 
                Incluirá gestión de stock, ventas en tienda física, control de productos y reportes detallados.
                <span className="block mt-2 font-medium text-purple-600">
                  Todos los precios se mostrarán en Quetzales (Q)
                </span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Control de Stock</h5>
                  <p className="text-sm text-gray-600">Añadir, reducir y ajustar inventario</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <ShoppingBag className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Ventas en Tienda</h5>
                  <p className="text-sm text-gray-600">Registrar ventas físicas directas</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <BarChart3 className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Reportes Detallados</h5>
                  <p className="text-sm text-gray-600">Analíticas de ventas y stock</p>
                </div>
              </div>
              
              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  Por ahora, los productos se gestionan desde la pestaña "Página Web" → "Productos"
                </p>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
    </div>
  );
};

export default AdminDashboard;

/*
EXPLICACIÓN DEL ARCHIVO:

Este archivo define el componente AdminDashboard, que es el panel principal de administración 
para la aplicación web del gimnasio. Proporciona una interfaz completa para gestionar todos 
los aspectos del negocio.

FUNCIONALIDADES PRINCIPALES:
- Dashboard ejecutivo con métricas de usuarios, membresías y productos
- Sistema de horarios flexibles con métricas de capacidad en tiempo real
- Gestión completa de contenido web (información, servicios, planes, productos, multimedia)
- Panel operativo para tareas diarias
- Sistema de inventario y ventas (en construcción) con precios en Quetzales
- Navegación por pestañas para organizar diferentes secciones

CONEXIONES CON OTROS ARCHIVOS:
- useAuth (../../contexts/AuthContext): Manejo de autenticación y permisos
- useApp (../../contexts/AppContext): Funciones globales de la aplicación
- apiService (../../services/apiService): Comunicación con el backend
- DashboardCard, QuickActionCard, LoadingSpinner: Componentes reutilizables de UI
- ContentEditor, ServicesManager, PlansManager, ProductsManager, MediaUploader: 
  Componentes específicos para gestión de contenido

CARACTERÍSTICAS ESPECIALES:
- Soporte completo para horarios flexibles del gimnasio
- Formateo automático de precios en Quetzales guatemaltecos
- Sistema de debug discreto para desarrollo
- Indicadores visuales de estado de carga y cambios sin guardar
- Auto-actualización de datos para operaciones en tiempo real
- Interfaz responsive para dispositivos móviles y desktop

PROPÓSITO:
Servir como centro de control principal para administradores del gimnasio, permitiendo
gestionar tanto la presencia web como las operaciones del día a día de manera eficiente
y organizada, con especial énfasis en la flexibilidad de horarios y la experiencia 
del usuario en Guatemala.
*/