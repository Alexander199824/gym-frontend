// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/StaffDashboard.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  CreditCard, 
  Coins, 
  Clock, 
  UserPlus,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// Componentes
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return 'Q 0.00';
  return `Q ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const { formatDate, showError } = useApp();
  const navigate = useNavigate();
  
  // Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // Queries para datos del staff
  
  // Membresías vencidas (prioridad alta)
  const { data: expiredMemberships, isLoading: expiredLoading } = useQuery({
    queryKey: ['expiredMemberships'],
    queryFn: () => apiService.getExpiredMemberships(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    onError: (error) => showError('Error al cargar membresías vencidas')
  });
  
  // Membresías que vencen pronto
  const { data: expiringSoon, isLoading: expiringSoonLoading } = useQuery({
    queryKey: ['expiringSoon'],
    queryFn: () => apiService.getExpiringSoonMemberships(7),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar membresías próximas a vencer')
  });
  
  // Pagos del día filtrados por colaborador actual
  const { data: todayPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['todayPayments', user?.id],
    queryFn: () => apiService.getPayments({ 
      startDate: today,
      endDate: today,
      createdBy: user?.id // Filtrar por colaborador actual
    }),
    staleTime: 1 * 60 * 1000, // 1 minuto
    onError: (error) => showError('Error al cargar pagos del día')
  });
  
  // Usuarios recientes - solo clientes
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['recentUsers'],
    queryFn: () => apiService.getUsers({ 
      limit: 10,
      page: 1,
      role: 'cliente' // Solo clientes para colaboradores
    }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar usuarios recientes')
  });
  
  // Calcular métricas del día - solo del colaborador actual
  const todayMetrics = {
    expiredCount: expiredMemberships?.data?.total || 0,
    expiringSoonCount: expiringSoon?.data?.total || 0,
    todayPaymentsCount: todayPayments?.data?.payments?.length || 0,
    // Importante: Solo ingresos registrados por este colaborador
    todayRevenue: todayPayments?.data?.payments?.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0) || 0
  };

  // Funciones de navegación
  const handleCreateUser = () => {
    navigate('/dashboard/users?action=create');
  };

  const handleCreateMembership = () => {
    navigate('/dashboard/memberships?action=create');
  };

  const handleCreatePayment = () => {
    navigate('/dashboard/payments?action=create');
  };

  const handleViewUsers = () => {
    navigate('/dashboard/users');
  };

  return (
    <div className="space-y-6">
      
      {/* Header del dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Trabajo
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.firstName}. Aquí están tus tareas del día.
          </p>
        </div>
        
        <div className="flex items-center mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            {formatDate(new Date(), 'dd/MM/yyyy')}
          </div>
        </div>
      </div>
      
      {/* Métricas diarias con tamaños uniformes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Membresías vencidas */}
        <DashboardCard
          title="Vencidas Hoy"
          value={todayMetrics.expiredCount}
          icon={AlertCircle}
          color="red"
          isLoading={expiredLoading}
          onClick={() => navigate('/dashboard/memberships?filter=expired')}
          alert={todayMetrics.expiredCount > 0}
        />
        
        {/* Vencen pronto */}
        <DashboardCard
          title="Vencen esta semana"
          value={todayMetrics.expiringSoonCount}
          icon={Clock}
          color="yellow"
          isLoading={expiringSoonLoading}
          onClick={() => navigate('/dashboard/memberships?filter=expiring')}
          alert={todayMetrics.expiringSoonCount > 0}
        />
        
        {/* Pagos del día - solo los registrados por el colaborador */}
        <DashboardCard
          title="Mis Pagos Hoy"
          value={todayMetrics.todayPaymentsCount}
          icon={Coins}
          color="green"
          isLoading={paymentsLoading}
          onClick={() => navigate('/dashboard/payments?filter=today&createdBy=me')}
          subtitle={`${formatQuetzales(todayMetrics.todayRevenue)} registrados por ti`}
        />
        
        {/* Usuarios (Clientes) */}
        <DashboardCard
          title="Clientes"
          value={recentUsers?.data?.pagination?.total || 0}
          icon={Users}
          color="blue"
          isLoading={usersLoading}
          onClick={handleViewUsers}
        />
        
      </div>
      
      {/* Acciones rápidas con tamaños uniformes y redirecciones corregidas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Nuevo Cliente"
            description="Registrar nuevo usuario"
            icon={UserPlus}
            color="blue"
            onClick={handleCreateUser}
          />
          
          <QuickActionCard
            title="Nueva Membresía"
            description="Crear membresía"
            icon={CreditCard}
            color="green"
            onClick={handleCreateMembership}
          />
          
          <QuickActionCard
            title="Registrar Pago"
            description="Pago en efectivo"
            icon={Coins}
            color="yellow"
            onClick={handleCreatePayment}
          />
          
          <QuickActionCard
            title="Buscar Cliente"
            description="Encontrar cliente"
            icon={Users}
            color="purple"
            onClick={handleViewUsers}
          />
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Membresías vencidas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Membresías Vencidas
            </h3>
            <button
              onClick={() => navigate('/dashboard/memberships?filter=expired')}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Ver todas
            </button>
          </div>
          
          {expiredLoading ? (
            <LoadingSpinner />
          ) : (
            <ExpiredMembershipsList 
              memberships={expiredMemberships?.data?.memberships?.slice(0, 5) || []} 
              onRenew={(id) => navigate(`/dashboard/memberships?action=renew&id=${id}`)}
              onView={(id) => navigate(`/dashboard/memberships?view=${id}`)}
            />
          )}
        </div>
        
        {/* Mis pagos recientes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mis Pagos de Hoy
            </h3>
            <button
              onClick={() => navigate('/dashboard/payments?filter=today&createdBy=me')}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
          
          {paymentsLoading ? (
            <LoadingSpinner />
          ) : (
            <RecentPaymentsList 
              payments={todayPayments?.data?.payments?.slice(0, 5) || []} 
            />
          )}
        </div>
        
      </div>
      
      {/* Próximas a vencer */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Vencen esta semana
          </h3>
          <span className="text-sm text-gray-500">
            {todayMetrics.expiringSoonCount} membresías
          </span>
        </div>
        
        {expiringSoonLoading ? (
          <LoadingSpinner />
        ) : (
          <ExpiringSoonList 
            memberships={expiringSoon?.data?.memberships || []}
            onRenew={(id) => navigate(`/dashboard/memberships?action=renew&id=${id}`)}
            onView={(id) => navigate(`/dashboard/memberships?view=${id}`)}
          />
        )}
      </div>
      
      {/* Resumen personal del colaborador */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Mi Resumen del Día
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatQuetzales(todayMetrics.todayRevenue)}
            </div>
            <div className="text-sm text-gray-600">Ingresos registrados por ti hoy</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {todayMetrics.todayPaymentsCount}
            </div>
            <div className="text-sm text-gray-600">Pagos que has procesado</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {todayMetrics.expiredCount + todayMetrics.expiringSoonCount}
            </div>
            <div className="text-sm text-gray-600">Membresías que requieren tu atención</div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

// Componente: Dashboard Card uniforme
const DashboardCard = ({ title, value, icon: Icon, color, isLoading, onClick, alert, subtitle }) => {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  const iconColors = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  };

  return (
    <div 
      className={`
        ${colors[color] || colors.blue} 
        border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200
        ${alert ? 'ring-2 ring-red-400 animate-pulse' : ''}
        min-h-[120px] flex flex-col justify-center
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium opacity-80 mb-1">
            {title}
          </div>
          {isLoading ? (
            <div className="w-8 h-8 bg-current opacity-20 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold">
              {value}
            </div>
          )}
          {subtitle && (
            <div className="text-xs opacity-70 mt-1">
              {subtitle}
            </div>
          )}
        </div>
        <Icon className={`w-8 h-8 ${iconColors[color] || iconColors.blue} opacity-80`} />
      </div>
    </div>
  );
};

// Componente: Quick Action Card uniforme
const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${colors[color] || colors.blue}
        border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md
        min-h-[100px] flex flex-col justify-center w-full
      `}
    >
      <div className="flex items-center mb-2">
        <Icon className={`w-6 h-6 ${iconColors[color] || iconColors.blue} mr-3`} />
        <div className="text-sm font-medium">
          {title}
        </div>
      </div>
      <div className="text-xs opacity-70">
        {description}
      </div>
    </button>
  );
};

// Componente: Lista de membresías vencidas
const ExpiredMembershipsList = ({ memberships, onRenew, onView }) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p>¡Excelente! No hay membresías vencidas hoy.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {memberships.map((membership) => (
        <div key={membership.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {membership.user?.firstName} {membership.user?.lastName}
            </p>
            <p className="text-xs text-gray-600">
              {membership.type === 'monthly' ? 'Mensual' : 'Diaria'} - 
              Venció: {new Date(membership.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onView(membership.id)}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center"
            >
              <Eye className="w-3 h-3 mr-1" />
              Ver
            </button>
            <button
              onClick={() => onRenew(membership.id)}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              Renovar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente: Lista de pagos recientes con Quetzales
const RecentPaymentsList = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Coins className="w-8 h-8 mx-auto mb-2" />
        <p>No has registrado pagos hoy.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {payment.user?.firstName} {payment.user?.lastName || 
               payment.anonymousClientInfo?.name || 'Cliente Anónimo'}
            </p>
            <p className="text-xs text-gray-600">
              {payment.paymentType === 'membership' ? 'Membresía' : 'Pago diario'} - 
              {payment.paymentMethod === 'cash' ? 'Efectivo' : 
               payment.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">
              Q{payment.amount}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(payment.paymentDate).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente: Lista de próximas a vencer
const ExpiringSoonList = ({ memberships, onRenew, onView }) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p>No hay membresías que venzan esta semana.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Días restantes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {memberships.map((membership) => {
            const daysLeft = Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <tr key={membership.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {membership.user?.firstName} {membership.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {membership.user?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {membership.type === 'monthly' ? 'Mensual' : 'Diaria'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(membership.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    daysLeft <= 1 ? 'bg-red-100 text-red-800' :
                    daysLeft <= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onView(membership.id)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => onRenew(membership.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Renovar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StaffDashboard;

/*
EXPLICACIÓN DEL ARCHIVO:

Este archivo define el componente StaffDashboard, que es el panel de trabajo específico 
para el personal y colaboradores del gimnasio. Proporciona una interfaz operativa 
enfocada en las tareas diarias del personal de atención al cliente.

FUNCIONALIDADES PRINCIPALES:
- Dashboard operativo con métricas específicas del colaborador (membresías vencidas, próximas a vencer, pagos procesados)
- Sistema de seguimiento de pagos filtrado por colaborador para accountability individual
- Gestión de membresías vencidas y próximas a vencer con acciones rápidas de renovación
- Panel de acciones rápidas para tareas comunes (registrar cliente, crear membresía, procesar pago)
- Lista detallada de clientes que requieren atención inmediata
- Resumen personal del rendimiento diario del colaborador
- Interfaz optimizada para flujo de trabajo operativo

CONEXIONES CON OTROS ARCHIVOS:
- useAuth (../../contexts/AuthContext): Información del colaborador autenticado
- useApp (../../contexts/AppContext): Funciones globales como formateo de fechas y notificaciones
- apiService (../../services/apiService): Comunicación con el backend para datos operativos
- @tanstack/react-query: Gestión de estado y cache para consultas de API frecuentes
- LoadingSpinner: Componente reutilizable para estados de carga
- React Router: Para navegación entre diferentes módulos del sistema

CARACTERÍSTICAS ESPECIALES:
- Formateo automático de pagos en Quetzales guatemaltecos
- Filtrado de datos por colaborador específico para evitar confusión de responsabilidades
- Sistema de alertas visuales para membresías críticas (vencidas y próximas a vencer)
- Navegación inteligente hacia formularios específicos con parámetros preconfigurados
- Actualización automática de métricas cada pocos minutos para datos en tiempo real
- Diseño responsivo optimizado para estaciones de trabajo del personal
- Tarjetas de acción rápida para flujo de trabajo eficiente

PROPÓSITO:
Servir como centro de control operativo para el personal del gimnasio, permitiendo
gestionar eficientemente las tareas diarias como registro de nuevos clientes,
procesamiento de pagos, renovación de membresías y seguimiento de clientes que
requieren atención. El dashboard está diseñado para maximizar la productividad
del personal mientras mantiene un control granular de las actividades individuales
de cada colaborador, especialmente importante para el manejo de pagos en Quetzales
y el seguimiento de responsabilidades en el contexto guatemalteco.
*/