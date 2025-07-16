// src/pages/dashboard/ClientDashboard.js
// UBICACIÓN: /gym-frontend/src/pages/dashboard/ClientDashboard.js
// FUNCIÓN: Dashboard personal para clientes con su información y membresías
// CONECTA CON: Endpoints específicos del cliente logueado

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock, 
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Upload,
  Settings,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes
import DashboardCard from '../../components/common/DashboardCard';
import MembershipCard from '../../components/memberships/MembershipCard';
import PaymentHistoryCard from '../../components/payments/PaymentHistoryCard';
import ScheduleCard from '../../components/memberships/ScheduleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, showError } = useApp();
  
  // 📊 QUERIES PARA DATOS DEL CLIENTE
  
  // Membresías del cliente
  const { data: memberships, isLoading: membershipsLoading } = useQuery({
    queryKey: ['userMemberships', user?.id],
    queryFn: () => apiService.getMemberships({ userId: user?.id }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar tus membresías')
  });
  
  // Historial de pagos
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['userPayments', user?.id],
    queryFn: () => apiService.getPayments({ userId: user?.id, limit: 10 }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar tu historial de pagos')
  });
  
  // Perfil del usuario
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiService.getProfile(),
    staleTime: 10 * 60 * 1000
  });
  
  // 📊 Procesar datos
  const activeMembership = memberships?.data?.memberships?.find(m => m.status === 'active');
  const recentPayments = payments?.data?.payments || [];
  const totalPaid = recentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  
  // 📅 Calcular días hasta vencimiento
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysUntilExpiry = activeMembership ? getDaysUntilExpiry(activeMembership.endDate) : null;
  
  // 🎯 Estado de la membresía
  const getMembershipStatus = () => {
    if (!activeMembership) return { status: 'none', message: 'Sin membresía activa', color: 'gray' };
    
    if (daysUntilExpiry === null) return { status: 'active', message: 'Activa', color: 'green' };
    
    if (daysUntilExpiry < 0) return { status: 'expired', message: 'Vencida', color: 'red' };
    if (daysUntilExpiry <= 3) return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
    if (daysUntilExpiry <= 7) return { status: 'warning', message: 'Vence pronto', color: 'orange' };
    
    return { status: 'active', message: 'Activa', color: 'green' };
  };
  
  const membershipStatus = getMembershipStatus();

  return (
    <div className="space-y-6">
      
      {/* 🏠 HEADER PERSONALIZADO */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              ¡Hola, {user?.firstName}! 👋
            </h1>
            <p className="text-primary-100 mt-1">
              Bienvenido a tu espacio personal del gimnasio
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-100">
              Miembro desde
            </div>
            <div className="text-lg font-semibold">
              {formatDate(new Date(user?.createdAt || Date.now()), 'MMM yyyy')}
            </div>
          </div>
        </div>
      </div>
      
      {/* 📊 MÉTRICAS PERSONALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 🎫 Estado de membresía */}
        <DashboardCard
          title="Mi Membresía"
          value={membershipStatus.message}
          icon={CreditCard}
          color={membershipStatus.color}
          isLoading={membershipsLoading}
          subtitle={activeMembership ? 
            `${activeMembership.type === 'monthly' ? 'Mensual' : 'Diaria'}` : 
            'No tienes membresía activa'
          }
        />
        
        {/* ⏰ Días restantes */}
        <DashboardCard
          title="Días restantes"
          value={daysUntilExpiry !== null ? 
            (daysUntilExpiry < 0 ? 'Vencida' : `${daysUntilExpiry} días`) : 
            'N/A'
          }
          icon={Clock}
          color={daysUntilExpiry !== null ? 
            (daysUntilExpiry < 0 ? 'red' : 
             daysUntilExpiry <= 3 ? 'yellow' : 'green') : 
            'gray'
          }
          isLoading={membershipsLoading}
          alert={daysUntilExpiry !== null && daysUntilExpiry <= 3}
        />
        
        {/* 💰 Total pagado */}
        <DashboardCard
          title="Total pagado"
          value={formatCurrency(totalPaid)}
          icon={DollarSign}
          color="green"
          isLoading={paymentsLoading}
          subtitle={`${recentPayments.length} pagos`}
        />
        
        {/* 📈 Progreso */}
        <DashboardCard
          title="Progreso"
          value="En forma"
          icon={TrendingUp}
          color="blue"
          subtitle="¡Sigue así!"
        />
        
      </div>
      
      {/* 🚨 ALERTAS IMPORTANTES */}
      {membershipStatus.status === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Tu membresía ha vencido
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Renueva tu membresía para continuar disfrutando de nuestros servicios.
              </p>
            </div>
            <Link
              to="/dashboard/memberships/renew"
              className="ml-auto btn-danger btn-sm"
            >
              Renovar ahora
            </Link>
          </div>
        </div>
      )}
      
      {membershipStatus.status === 'expiring' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Tu membresía vence en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Renueva pronto para evitar interrupciones en tu rutina.
              </p>
            </div>
            <Link
              to="/dashboard/memberships/renew"
              className="ml-auto btn-warning btn-sm"
            >
              Renovar
            </Link>
          </div>
        </div>
      )}
      
      {/* 📋 CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🎫 MI MEMBRESÍA */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mi Membresía
            </h3>
            {activeMembership && (
              <Link 
                to={`/dashboard/memberships/${activeMembership.id}`}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Ver detalles
              </Link>
            )}
          </div>
          
          {membershipsLoading ? (
            <LoadingSpinner />
          ) : activeMembership ? (
            <MembershipCard 
              membership={activeMembership}
              showActions={true}
              isOwner={true}
            />
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No tienes membresía activa
              </h4>
              <p className="text-gray-600 mb-4">
                Obtén una membresía para acceder a todas las instalaciones
              </p>
              <Link
                to="/dashboard/memberships/plans"
                className="btn-primary"
              >
                Ver planes
              </Link>
            </div>
          )}
        </div>
        
        {/* 📅 HORARIOS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mis Horarios
            </h3>
            {activeMembership && (
              <Link 
                to={`/dashboard/memberships/${activeMembership.id}/schedule`}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Editar
              </Link>
            )}
          </div>
          
          {activeMembership ? (
            <ScheduleCard 
              schedule={activeMembership.preferredSchedule}
              editable={true}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <p>Define tus horarios preferidos</p>
            </div>
          )}
        </div>
        
      </div>
      
      {/* 💰 HISTORIAL DE PAGOS */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Pagos
          </h3>
          <Link 
            to="/dashboard/payments"
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Ver todos
          </Link>
        </div>
        
        {paymentsLoading ? (
          <LoadingSpinner />
        ) : (
          <PaymentHistoryCard 
            payments={recentPayments.slice(0, 5)}
            showActions={true}
          />
        )}
      </div>
      
      {/* 🎯 ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 🔄 Renovar membresía */}
        {activeMembership && (
          <Link
            to={`/dashboard/memberships/${activeMembership.id}/renew`}
            className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Renovar membresía
                </h4>
                <p className="text-xs text-gray-600">
                  Extiende tu membresía
                </p>
              </div>
            </div>
          </Link>
        )}
        
        {/* 📤 Subir comprobante */}
        <Link
          to="/dashboard/payments/upload-proof"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Subir comprobante
              </h4>
              <p className="text-xs text-gray-600">
                Pago por transferencia
              </p>
            </div>
          </div>
        </Link>
        
        {/* 👤 Editar perfil */}
        <Link
          to="/dashboard/profile"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Mi perfil
              </h4>
              <p className="text-xs text-gray-600">
                Actualizar información
              </p>
            </div>
          </div>
        </Link>
        
        {/* 🔔 Notificaciones */}
        <Link
          to="/dashboard/notifications"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Notificaciones
              </h4>
              <p className="text-xs text-gray-600">
                Configurar alertas
              </p>
            </div>
          </div>
        </Link>
        
      </div>
      
      {/* 💡 CONSEJOS Y MOTIVACIÓN */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              ¡Consejo del día!
            </h3>
            <p className="text-gray-600 mt-1">
              La constancia es la clave del éxito. Cada día que entrenas te acercas más a tu objetivo. 
              ¡Sigue así y verás resultados increíbles!
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ClientDashboard;