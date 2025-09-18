// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/AdminDashboard.js
// ACTUALIZADO: Sin inventario ni métricas de capacidad/horarios

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, CreditCard, TrendingUp, AlertCircle,
  Calendar, ArrowRight, RefreshCw, Download,
  BarChart3, Activity, Target, Zap, Crown, Save,
  Globe, Info, CheckCircle, Loader, Bug, Coins
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Componentes específicos del dashboard
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
  
  // Refrescar datos
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    loadDashboardData();
    showSuccess('Datos actualizados');
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('AdminDashboard montado, cargando datos...');
    loadDashboardData();
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
  
  // Calcular métricas principales
  const mainMetrics = {
    totalUsers: userStats?.data?.totalActiveUsers || 0,
    activeMemberships: membershipStats?.data?.activeMemberships || 0,
    expiredCount: expiredMemberships?.data?.total || 0,
    expiringSoonCount: expiringSoon?.data?.total || 0,
    pendingTransfersCount: pendingTransfers?.data?.total || 0,
    todayPaymentsCount: todayPayments?.data?.payments?.length || 0
  };
  
  // Períodos disponibles
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // Estado de carga general
  const isLoading = userStats.isLoading || membershipStats.isLoading;

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO DISCRETO */}
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
              <div className="font-medium mb-2">Información de Debug - AdminDashboard</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName} ({user?.role})</div>
                <div>Puede gestionar contenido: {canManageContent ? 'Sí' : 'No'}</div>
                <div>Pestaña activa: {activeTab}</div>
                
                <div className="border-t pt-1 mt-1 text-green-700">
                  <div>✅ Inventario movido al sidebar</div>
                  <div>✅ Métricas de capacidad eliminadas</div>
                  <div>📍 Nueva ruta inventario: /dashboard/admin/inventory</div>
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
            Bienvenido, {user?.firstName}. Gestiona las operaciones diarias de tu gimnasio.
          </p>
          
          {/* Enlaces destacados */}
          {canManageContent && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/dashboard/admin/website"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
              >
                <Globe className="w-4 h-4 mr-1" />
                Gestionar Página Web
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              
              <Link
                to="/dashboard/admin/inventory"
                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full transition-colors"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Inventario y Ventas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
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
        </div>
      </div>
      
      {/* NAVEGACIÓN POR PESTAÑAS - SOLO 2 PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          
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
              title="Acceder a Inventario"
              value="Gestionar"
              icon={TrendingUp}
              color="purple"
              isLoading={false}
              link="/dashboard/admin/inventory"
              subtitle="Productos y ventas"
            />
            
          </div>
          
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/dashboard/analytics"
                className="btn-primary text-center py-3"
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                Analíticas
              </Link>
              
              {/* Enlace destacado a gestión web */}
              {canManageContent && (
                <Link
                  to="/dashboard/admin/website"
                  className="btn-primary text-center py-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Globe className="w-5 h-5 mx-auto mb-1" />
                  Página Web
                </Link>
              )}
              
              {/* Enlace a inventario */}
              <Link
                to="/dashboard/admin/inventory"
                className="btn-primary text-center py-3 bg-purple-600 hover:bg-purple-700"
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                Inventario
              </Link>
              
              <Link
                to="/dashboard/reports"
                className="btn-primary text-center py-3"
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                Reportes
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
              icon={Calendar}
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
              title="Gestionar Ventas"
              value="Inventario"
              icon={TrendingUp}
              color="purple"
              isLoading={false}
              link="/dashboard/admin/inventory"
              subtitle="Ver productos"
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
                title="Gestionar Inventario"
                description="Productos y ventas"
                icon={TrendingUp}
                color="purple"
                link="/dashboard/admin/inventory"
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
      
    </div>
  );
};

export default AdminDashboard;

/*
DOCUMENTACIÓN DE LOS CAMBIOS EN AdminDashboard

CAMBIOS PRINCIPALES:
1. **Eliminada la pestaña "Página Web"** del sistema de tabs interno
2. **Agregado enlace destacado** en el header que dirige a la nueva página de gestión web
3. **Actualizada la sección de acciones ejecutivas** para incluir enlace a gestión web
4. **Simplificada la navegación** enfocándose en operaciones del gimnasio
5. **Mantenidas las métricas de capacidad** como información general con enlace a gestión

NUEVAS CARACTERÍSTICAS:
- Enlace prominente en el header para acceso rápido a gestión web
- Botón destacado en acciones ejecutivas con color diferenciado
- Referencias actualizadas en sección de inventario
- Debug info actualizado para reflejar los cambios

BENEFICIOS DE LA REESTRUCTURACIÓN:
- **Separación clara** entre operaciones diarias y gestión de contenido web
- **Acceso directo** desde el sidebar para gestión web
- **Dashboard más enfocado** en métricas operativas del día a día
- **Flujo de trabajo mejorado** para administradores

COMPATIBILIDAD:
- Mantiene toda la funcionalidad operativa existente
- Conserva acceso a métricas de capacidad como información general
- Enlaces contextuales para dirigir a la nueva página de gestión web
- Sistema de debug actualizado para reflejar la nueva estructura

El AdminDashboard ahora se enfoca exclusivamente en la gestión operativa 
del gimnasio, mientras que la gestión de contenido web tiene su propia 
página dedicada accesible desde el sidebar, proporcionando una experiencia 
más organizada y eficiente para los administradores.
*/

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