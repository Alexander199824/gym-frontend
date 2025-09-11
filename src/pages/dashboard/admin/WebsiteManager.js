// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/admin/WebsiteManager.js
// FUNCIÓN: Página principal para gestión de contenido web desde sidebar
// NUEVA ESTRUCTURA: Separada del AdminDashboard principal

import React, { useState, useEffect } from 'react';
import { 
  Globe, Settings, Target, CreditCard, ShoppingBag, Image,
  Save, RefreshCw, AlertTriangle, CheckCircle, Clock, BarChart3,
  Info, Copy, Download, Upload, Eye, Bug
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

// Componentes específicos para gestión de contenido web
import ContentEditor from '../components/ContentEditor';
import ServicesManager from '../components/ServicesManager';
import PlansManager from '../components/PlansManager';
import ProductsManager from '../components/ProductsManager';
import MediaUploader from '../components/MediaUploader';

const WebsiteManager = () => {
  const { user, canManageContent } = useAuth();
  const { showError, showSuccess, isMobile } = useApp();
  
  // Estados principales
  const [activeSection, setActiveSection] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingSection, setSavingSection] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Estados para datos de contenido con soporte para horarios flexibles
  const [gymConfigData, setGymConfigData] = useState({ data: null, isLoading: false, error: null });
  const [servicesData, setServicesData] = useState({ data: null, isLoading: false, error: null });
  const [membershipPlansData, setMembershipPlansData] = useState({ data: null, isLoading: false, error: null });
  const [featuredProductsData, setFeaturedProductsData] = useState({ data: null, isLoading: false, error: null });
  
  // Estados específicos para horarios flexibles
  const [capacityMetrics, setCapacityMetrics] = useState({ data: null, isLoading: false, error: null });
  
  // Verificar permisos
  useEffect(() => {
    if (!canManageContent) {
      showError('No tienes permisos para gestionar el contenido web');
      return;
    }
  }, [canManageContent, showError]);
  
  // Cargar datos de contenido con soporte para horarios flexibles
  const loadContentData = async () => {
    console.log('WebsiteManager - Cargando datos de gestión de contenido...');
    
    try {
      // Configuración del gimnasio con horarios flexibles
      setGymConfigData({ data: null, isLoading: true, error: null });
      try {
        console.log('Cargando configuración del gimnasio usando endpoint del editor...');
        const gymConfigResponse = await apiService.getGymConfigEditor();
        const configData = gymConfigResponse?.data || gymConfigResponse;
        setGymConfigData({ data: configData, isLoading: false, error: null });
        
        console.log('Configuración del gimnasio cargada para WebsiteManager con horarios flexibles:', {
          hasConfig: !!configData,
          hasName: !!configData?.name,
          hasHours: !!configData?.hours,
          hasFlexibleStructure: configData?.hours ? 
            Object.values(configData.hours).some(day => day?.timeSlots?.length > 0) : false
        });
      } catch (error) {
        console.log('Editor de configuración del gimnasio no disponible, intentando respaldo:', error.message);
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
        console.log('Servicios cargados para WebsiteManager:', services);
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
        console.log('Planes cargados para WebsiteManager:', plans);
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
        console.log('Productos cargados para WebsiteManager:', products);
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
        console.log('Métricas de capacidad cargadas para WebsiteManager:', capacity);
      } catch (error) {
        console.log('Métricas de capacidad no disponibles:', error.message);
        setCapacityMetrics({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('Error cargando datos de contenido:', error);
    }
  };
  
  // Refrescar datos con soporte para horarios flexibles
  const refreshWebsiteData = () => {
    setRefreshKey(prev => prev + 1);
    loadContentData();
    showSuccess('Datos de la página web actualizados');
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('WebsiteManager montado, cargando datos...');
    loadContentData();
  }, [refreshKey]);
  
  // Secciones de gestión web con indicadores de horarios flexibles
  const webSections = [
    {
      id: 'general',
      title: 'Información General',
      icon: Info,
      description: 'Nombre, descripción, contacto, horarios flexibles',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading,
      hasFlexibleHours: gymConfigData.data?.hours ? 
        Object.values(gymConfigData.data.hours).some(day => day?.timeSlots?.length > 0) : false,
      color: 'blue'
    },
    {
      id: 'services',
      title: 'Servicios',
      icon: Target,
      description: 'Servicios del gimnasio',
      dataLoaded: !!servicesData.data && !servicesData.isLoading,
      color: 'green'
    },
    {
      id: 'plans',
      title: 'Planes de Membresía',
      icon: CreditCard,
      description: 'Planes y precios en Quetzales',
      dataLoaded: !!membershipPlansData.data && !membershipPlansData.isLoading,
      color: 'purple'
    },
    {
      id: 'products',
      title: 'Productos',
      icon: ShoppingBag,
      description: 'Tienda del gimnasio',
      dataLoaded: !!featuredProductsData.data && !featuredProductsData.isLoading,
      color: 'pink'
    },
    {
      id: 'media',
      title: 'Multimedia',
      icon: Image,
      description: 'Logo, imágenes, videos',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading,
      color: 'indigo'
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
  
  // FUNCIONES PARA SISTEMA DE HORARIOS FLEXIBLES
  
  // Guardar configuración con soporte para horarios flexibles
  const handleSaveConfig = async (saveData) => {
    console.log('WebsiteManager - Guardando configuración del gimnasio con horarios flexibles:', saveData);
    
    try {
      setSavingSection('general');
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
      console.error('WebsiteManager - Fallo al guardar configuración:', error);
      
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
    } finally {
      setSavingSection(null);
    }
  };
  
  // Guardar servicios
  const handleSaveServices = async (data) => {
    console.log('WebsiteManager - Guardando servicios:', data);
    
    try {
      setSavingSection('services');
      const result = await apiService.updateGymServices(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Servicios guardados exitosamente');
      } else {
        showSuccess('Servicios guardados');
      }
      
    } catch (error) {
      console.error('WebsiteManager - Fallo al guardar servicios:', error);
      showError('Error al guardar servicios');
    } finally {
      setSavingSection(null);
    }
  };
  
  // Guardar planes
  const handleSavePlans = async (data) => {
    console.log('WebsiteManager - Guardando planes:', data);
    
    try {
      setSavingSection('plans');
      const result = await apiService.updateMembershipPlans(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Planes guardados exitosamente');
      } else {
        showSuccess('Planes guardados');
      }
      
    } catch (error) {
      console.error('WebsiteManager - Fallo al guardar planes:', error);
      showError('Error al guardar planes');
    } finally {
      setSavingSection(null);
    }
  };
  
  // Guardar productos
  const handleSaveProducts = async (data) => {
    console.log('WebsiteManager - Guardando productos:', data);
    
    try {
      setSavingSection('products');
      const result = await apiService.updateFeaturedProducts(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Productos guardados exitosamente');
      } else {
        showSuccess('Productos guardados');
      }
      
    } catch (error) {
      console.error('WebsiteManager - Fallo al guardar productos:', error);
      showError('Error al guardar productos');
    } finally {
      setSavingSection(null);
    }
  };
  
  // Guardar multimedia
  const handleSaveMedia = async (data) => {
    console.log('WebsiteManager - Guardando multimedia:', data);
    
    try {
      setSavingSection('media');
      const result = await apiService.updateGymMedia(data);
      
      if (result && result.success) {
        await loadContentData();
        showSuccess('Multimedia guardada exitosamente');
      } else {
        showSuccess('Multimedia guardada');
      }
      
    } catch (error) {
      console.error('WebsiteManager - Fallo al guardar multimedia:', error);
      showError('Error al guardar multimedia');
    } finally {
      setSavingSection(null);
    }
  };

  // Verificar permisos
  if (!canManageContent) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">Acceso Denegado</h3>
              <p className="text-red-800 mt-1">
                No tienes permisos para gestionar el contenido de la página web.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO DISCRETO - En esquina inferior derecha */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            title="Información de Debug - WebsiteManager"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute bottom-10 right-0 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">WebsiteManager - Horarios Flexibles</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName} ({user?.role})</div>
                <div>Puede gestionar contenido: {canManageContent ? 'Sí' : 'No'}</div>
                <div>Sección activa: {activeSection}</div>
                
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
                  <div>Productos: {featuredProductsData.data ? 'Sí' : 'No'} | Multimedia: {gymConfigData.data ? 'Sí' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HEADER DEL GESTOR WEB */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Globe className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Página Web
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Administra el contenido, horarios flexibles y elementos visuales de tu página web
          </p>
          
          {/* Mostrar métricas de horarios flexibles */}
          {capacityMetrics.data && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Capacidad total: {capacityMetrics.data.totalCapacity}
              </span>
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Ocupación: {capacityMetrics.data.averageOccupancy}%
              </span>
              {Object.values(gymConfigData.data?.hours || {}).some(day => day?.isOpen) && (
                <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Horarios flexibles activos
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Botón de actualizar */}
          <button
            onClick={refreshWebsiteData}
            className="btn-secondary btn-sm"
            title="Actualizar datos de la página web"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Botón ver página web */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Página Web
          </a>
          
          {/* Indicador de cambios sin guardar */}
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN POR SECCIONES WEB */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {webSections.map((section) => (
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
              {section.hasFlexibleHours && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded" title="Horarios flexibles activos">
                  flex
                </span>
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
        
        {/* SECCIÓN: Información General con horarios flexibles */}
        {activeSection === 'general' && (
          <ContentEditor 
            gymConfig={gymConfigData}
            capacityMetrics={capacityMetrics}
            onSave={handleSaveConfig}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
        {/* SECCIÓN: Servicios */}
        {activeSection === 'services' && (
          <ServicesManager
            services={servicesData.data}
            isLoading={servicesData.isLoading}
            onSave={handleSaveServices}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
        {/* SECCIÓN: Planes de Membresía */}
        {activeSection === 'plans' && (
          <PlansManager
            plans={membershipPlansData.data}
            isLoading={membershipPlansData.isLoading}
            onSave={handleSavePlans}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
        {/* SECCIÓN: Productos */}
        {activeSection === 'products' && (
          <ProductsManager
            products={featuredProductsData.data}
            isLoading={featuredProductsData.isLoading}
            onSave={handleSaveProducts}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
        {/* SECCIÓN: Multimedia */}
        {activeSection === 'media' && (
          <MediaUploader
            gymConfig={gymConfigData}
            onSave={handleSaveMedia}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
        
      </div>
      
    </div>
  );
};

export default WebsiteManager;

/*
=============================================================================
DOCUMENTACIÓN DEL COMPONENTE WebsiteManager
=============================================================================

PROPÓSITO:
Este componente es la nueva página principal para la gestión completa del contenido 
de la página web del gimnasio. Se ha separado del AdminDashboard principal para ser 
accesible desde el sidebar, proporcionando una experiencia dedicada para la 
administración de contenido web con horarios flexibles.

FUNCIONALIDADES PRINCIPALES:
- Gestión completa de información general con horarios flexibles avanzados
- Administración de servicios del gimnasio con características personalizables
- Gestión de planes de membresía con precios en Quetzales guatemaltecos
- Administración de productos de la tienda del gimnasio
- Gestión de multimedia (logo, videos, imágenes) para la página web
- Sistema de horarios flexibles con múltiples franjas por día
- Métricas de capacidad y ocupación en tiempo real
- Vista previa de cambios antes de publicar
- Sistema de guardado independiente por sección

ESTRUCTURA DE NAVEGACIÓN:
- Información General: Configuración básica, contacto, horarios flexibles, estadísticas
- Servicios: Creación y edición de servicios del gimnasio
- Planes de Membresía: Gestión de planes con precios en Quetzales
- Productos: Administración de la tienda online
- Multimedia: Logo, videos, imágenes y contenido visual

SISTEMA DE HORARIOS FLEXIBLES:
- Configuración independiente por día de la semana
- Múltiples franjas horarias por día (ej: mañana, tarde, noche)
- Capacidad individual para cada franja horaria
- Métricas en tiempo real de ocupación y disponibilidad
- Etiquetas personalizables para franjas especiales
- Herramientas de gestión masiva para aplicar cambios

INTEGRACIÓN CON BACKEND:
- Carga datos existentes desde múltiples endpoints especializados
- Guardado independiente por sección para eficiencia
- Soporte para horarios flexibles con endpoint dedicado
- Manejo de errores robusto con fallbacks automáticos
- Métricas de capacidad actualizadas en tiempo real

CARACTERÍSTICAS ESPECIALES:
- Debug info discreto para desarrollo con información de horarios flexibles
- Indicadores visuales de estado de carga y cambios sin guardar
- Vista previa en tiempo real de configuraciones
- Advertencias antes de perder cambios no guardados
- Botón directo para ver la página web pública
- Métricas de capacidad en el header para monitoreo rápido

CONEXIONES Y DEPENDENCIAS:
- AuthContext: Verificación de permisos para gestión de contenido
- AppContext: Notificaciones y utilidades del sistema
- apiService: Comunicación con backend para todos los endpoints
- ContentEditor: Gestión de información general y horarios flexibles
- ServicesManager: Administración de servicios del gimnasio
- PlansManager: Gestión de planes de membresía
- ProductsManager: Administración de productos de la tienda
- MediaUploader: Gestión de contenido multimedia

FLUJO DE USUARIO:
1. Acceso desde el sidebar del dashboard administrativo
2. Navegación por pestañas para diferentes secciones de contenido
3. Edición en tiempo real con vista previa instantánea
4. Guardado independiente por sección para evitar pérdida de datos
5. Actualización automática de métricas tras cambios en horarios
6. Vista previa de la página web pública desde botón dedicado

SEGURIDAD Y PERMISOS:
- Verificación de permisos canManageContent antes de mostrar contenido
- Manejo seguro de errores con mensajes descriptivos
- Validación de datos antes del guardado
- Fallbacks automáticos en caso de errores de API

Este componente centraliza toda la gestión de contenido web en una interfaz 
dedicada y especializada, separada del dashboard operativo principal, 
proporcionando una experiencia enfocada y profesional para la administración 
de la presencia online del gimnasio.
*/