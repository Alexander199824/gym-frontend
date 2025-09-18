// Autor: Alexander Echeverria
// src/pages/dashboard/client/MembershipManager.js
// VERSIÓN COMPLETA CON MEJORAS: Sin bloqueo de secciones + Traducciones + Lógica corregida

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Crown,
  ArrowLeft,
  RefreshCw,
  Gift,
  DollarSign,
  MapPin,
  Upload,
  Star,
  TrendingUp,
  Coins,
  AlertTriangle,
  Info,
  ExternalLink,
  Phone,
  Mail,
  Zap,
  Shield,
  Ban,
  HourglassIcon,
  XCircle
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import membershipService from '../../../services/membershipService';
import { useTranslation } from '../../../hooks/useTranslation';

// Componentes
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import MembershipCard from '../../../components/memberships/MembershipCard';
import MembershipCheckout from '../../../components/memberships/MembershipCheckout';

const MembershipManager = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, formatDate, isMobile } = useApp();
  const { translateMembershipType } = useTranslation();
  
  // Estados
  const [activeSection, setActiveSection] = useState('current'); // current, plans, checkout
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Queries
  const { data: currentMembership, isLoading: membershipLoading, refetch: refetchMembership } = useQuery({
    queryKey: ['currentMembership', user?.id, refreshTrigger],
    queryFn: () => membershipService.getCurrentMembership(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        showError('Error al cargar tu membresía actual');
      }
    }
  });

  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => membershipService.getPlans(),
    staleTime: 10 * 60 * 1000,
    enabled: activeSection === 'plans',
    onError: (error) => showError('Error al cargar planes de membresía')
  });

  const { data: userMemberships, isLoading: historyLoading } = useQuery({
    queryKey: ['userMemberships', user?.id],
    queryFn: () => membershipService.getUserMemberships(),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar tu historial de membresías')
  });

  // ✅ FUNCIÓN CORREGIDA: Información del estado (sin bloqueo)
  const getPlanChangeInfo = () => {
    if (!currentMembership) {
      return { 
        canShow: true, 
        reason: 'no_membership',
        buttonText: 'Obtener Membresía'
      };
    }

    // ✅ PERMITIR navegación pero mostrar advertencia si está pendiente
    if (currentMembership.status === 'pending' || currentMembership.isPending) {
      return {
        canShow: true,
        showWarning: true,
        reason: 'pending_membership',
        buttonText: 'Cambiar Plan',
        warningTitle: 'Tu plan actual está pendiente',
        warningMessage: 'Por el momento no es posible cambiar de plan hasta que se confirme tu membresía actual.',
        warningDetails: currentMembership.payment?.paymentMethod === 'transfer' ? 
          'Esperando validación de transferencia bancaria' :
          currentMembership.payment?.paymentMethod === 'cash' ?
          'Esperando pago en gimnasio' : 
          'En proceso de validación'
      };
    }

    // ✅ PERMITIR para todos los demás estados
    if (currentMembership.status === 'active') {
      return {
        canShow: true,
        reason: 'active_membership',
        buttonText: 'Cambiar Plan'
      };
    }

    if (currentMembership.status === 'expired') {
      return {
        canShow: true,
        reason: 'expired_membership',
        buttonText: 'Renovar Plan'
      };
    }

    if (currentMembership.status === 'cancelled') {
      return {
        canShow: true,
        reason: 'cancelled_membership',
        buttonText: 'Nueva Membresía'
      };
    }

    // ✅ DEFAULT: Permitir navegación
    return {
      canShow: true,
      reason: 'unknown_status',
      buttonText: 'Ver Planes'
    };
  };

  // ✅ FUNCIÓN CORREGIDA: Calcular días hasta vencimiento (excluir canceladas)
  const getDaysUntilExpiry = (endDate, membershipStatus) => {
    // ✅ Las membresías canceladas NO tienen días activos
    if (membershipStatus === 'cancelled') {
      return null;
    }
    
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = currentMembership ? 
    getDaysUntilExpiry(currentMembership.endDate, currentMembership.status) : null;

  // ✅ FUNCIÓN CORREGIDA: Estado de la membresía
  const getMembershipStatus = () => {
    if (!currentMembership) return { status: 'none', message: 'Sin membresía', color: 'red' };
    
    // ✅ PRIORIDAD 1: Estados pendientes
    if (currentMembership.status === 'pending' || currentMembership.isPending) {
      return { status: 'pending', message: 'Pendiente validación', color: 'yellow' };
    }
    
    // ✅ PRIORIDAD 2: Estado cancelado (sin días)
    if (currentMembership.status === 'cancelled') {
      return { status: 'cancelled', message: 'Cancelada', color: 'gray' };
    }
    
    // ✅ PRIORIDAD 3: Estados por vencimiento (solo para activas)
    if (currentMembership.status === 'active') {
      if (daysUntilExpiry === null) return { status: 'active', message: 'Activa', color: 'green' };
      
      if (daysUntilExpiry < 0) return { status: 'expired', message: 'Vencida', color: 'red' };
      if (daysUntilExpiry <= 3) return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
      if (daysUntilExpiry <= 7) return { status: 'warning', message: 'Vence pronto', color: 'orange' };
      
      return { status: 'active', message: 'Activa', color: 'green' };
    }
    
    // ✅ PRIORIDAD 4: Otros estados
    if (currentMembership.status === 'expired') {
      return { status: 'expired', message: 'Vencida', color: 'red' };
    }
    
    // ✅ FALLBACK
    return { 
      status: 'unknown', 
      message: currentMembership.status || 'Estado desconocido', 
      color: 'gray' 
    };
  };

  const membershipStatus = getMembershipStatus();
  const planChangeInfo = getPlanChangeInfo();

  // Handlers
  const handleSelectPlan = (plan) => {
    // Verificar si puede comprar (lógica del backend)
    if (planChangeInfo.showWarning) {
      showError(planChangeInfo.warningMessage);
      return;
    }

    setSelectedPlan(plan);
    setActiveSection('checkout');
  };

  const handleMembershipSuccess = (membership) => {
    showSuccess('¡Membresía procesada exitosamente!');
    setRefreshTrigger(prev => prev + 1);
    setSelectedPlan(null);
    setActiveSection('current');
  };

  const handleRefreshStatus = async () => {
    try {
      await refetchMembership();
      showInfo('Estado actualizado');
    } catch (error) {
      showError('Error actualizando estado');
    }
  };

  // Render checkout
  if (activeSection === 'checkout' && selectedPlan) {
    return (
      <MembershipCheckout
        selectedPlan={selectedPlan}
        onBack={() => setActiveSection('plans')}
        onSuccess={handleMembershipSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="btn-secondary btn-sm mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestión de Membresías
            </h2>
            <p className="text-gray-600">
              Administra tu membresía y explora opciones disponibles
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshStatus}
            className="btn-outline btn-sm flex items-center"
            disabled={membershipLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${membershipLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Navegación de secciones - SIN BLOQUEOS */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('current')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'current'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2 inline" />
            Mi Membresía
          </button>
          
          {/* ✅ BOTÓN SIEMPRE HABILITADO */}
          <button
            onClick={() => setActiveSection('plans')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'plans'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Crown className="w-4 h-4 mr-2 inline" />
            {planChangeInfo.buttonText}
          </button>
          
          <button
            onClick={() => setActiveSection('history')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'history'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 mr-2 inline" />
            Historial
          </button>
        </div>
      </div>

      {/* Contenido de la sección actual */}
      {activeSection === 'current' && (
        <CurrentMembershipSection
          membership={currentMembership}
          membershipStatus={membershipStatus}
          daysUntilExpiry={daysUntilExpiry}
          isLoading={membershipLoading}
          onRefresh={handleRefreshStatus}
          onGetMembership={() => setActiveSection('plans')}
          translateMembershipType={translateMembershipType}
        />
      )}

      {activeSection === 'plans' && (
        <PlansSection
          plans={plans}
          isLoading={plansLoading}
          currentMembership={currentMembership}
          onSelectPlan={handleSelectPlan}
          onRefresh={() => refetchPlans()}
          planChangeInfo={planChangeInfo}
        />
      )}

      {activeSection === 'history' && (
        <HistorySection
          memberships={userMemberships}
          isLoading={historyLoading}
          currentMembership={currentMembership}
        />
      )}
    </div>
  );
};

// ✅ SECCIÓN CORREGIDA: Membresía actual
const CurrentMembershipSection = ({ 
  membership, 
  membershipStatus, 
  daysUntilExpiry, 
  isLoading, 
  onRefresh, 
  onGetMembership,
  translateMembershipType
}) => {
  const { formatDate } = useApp();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando información de tu membresía...</p>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-red-800 mb-3">
            No tienes membresía activa
          </h3>
          
          <p className="text-red-700 mb-6 max-w-md">
            Para acceder a todas nuestras instalaciones y servicios exclusivos, 
            necesitas obtener una membresía. ¡Elige el plan perfecto para ti!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGetMembership}
              className="btn-primary px-8 py-3 text-lg font-bold hover:scale-105 transition-transform"
            >
              <Gift className="w-5 h-5 mr-2" />
              Obtener Membresía Ahora
            </button>
            
            <button
              onClick={() => window.open('/contact', '_blank')}
              className="btn-outline px-6 py-3"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contactar Gimnasio
            </button>
          </div>
          
          <div className="mt-6 text-xs text-red-600 space-y-1">
            <div>💳 Pago con tarjeta - Activación inmediata</div>
            <div>🏦 Transferencia bancaria - Validación 1-2 días</div>
            <div>💵 Efectivo en gimnasio - Pago en sucursal</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ✅ ESTADO CORREGIDO: Con iconos apropiados para cada estado */}
      <div className={`rounded-xl p-6 ${
        membershipStatus.status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-200' :
        membershipStatus.status === 'expired' ? 'bg-red-50 border-2 border-red-200' :
        membershipStatus.status === 'cancelled' ? 'bg-gray-50 border-2 border-gray-200' :
        membershipStatus.status === 'expiring' ? 'bg-orange-50 border-2 border-orange-200' :
        'bg-green-50 border-2 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {membershipStatus.status === 'pending' && <HourglassIcon className="w-6 h-6 text-yellow-500 mr-3" />}
            {membershipStatus.status === 'expired' && <XCircle className="w-6 h-6 text-red-500 mr-3" />}
            {membershipStatus.status === 'cancelled' && <Ban className="w-6 h-6 text-gray-500 mr-3" />}
            {membershipStatus.status === 'expiring' && <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />}
            {membershipStatus.status === 'active' && <CheckCircle className="w-6 h-6 text-green-500 mr-3" />}
            
            <div>
              <h3 className={`text-lg font-bold ${
                membershipStatus.status === 'pending' ? 'text-yellow-800' :
                membershipStatus.status === 'expired' ? 'text-red-800' :
                membershipStatus.status === 'cancelled' ? 'text-gray-800' :
                membershipStatus.status === 'expiring' ? 'text-orange-800' :
                'text-green-800'
              }`}>
                Estado: {membershipStatus.message}
              </h3>
              
              <p className={`text-sm ${
                membershipStatus.status === 'pending' ? 'text-yellow-700' :
                membershipStatus.status === 'expired' ? 'text-red-700' :
                membershipStatus.status === 'cancelled' ? 'text-gray-700' :
                membershipStatus.status === 'expiring' ? 'text-orange-700' :
                'text-green-700'
              }`}>
                {membershipStatus.status === 'pending' && 'Tu membresía está siendo validada por nuestro equipo'}
                {membershipStatus.status === 'expired' && 'Tu membresía ha vencido. Renueva para continuar'}
                {membershipStatus.status === 'cancelled' && 'Tu membresía fue cancelada'}
                {membershipStatus.status === 'expiring' && `Tu membresía vence en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}`}
                {membershipStatus.status === 'active' && `${daysUntilExpiry ? `${daysUntilExpiry} días restantes` : 'Membresía activa'}`}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {membershipStatus.status === 'pending' && (
              <button
                onClick={onRefresh}
                className="btn-warning btn-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </button>
            )}
            
            {(membershipStatus.status === 'expired' || membershipStatus.status === 'cancelled') && (
              <button
                onClick={onGetMembership}
                className="btn-primary"
              >
                Obtener Nueva
              </button>
            )}
            
            {membershipStatus.status === 'expiring' && (
              <button
                onClick={onGetMembership}
                className="btn-primary"
              >
                Renovar Ahora
              </button>
            )}
            
            {membershipStatus.status === 'pending' && membership?.payment?.paymentMethod === 'cash' && (
              <button
                onClick={() => window.open('https://maps.google.com/?q=Elite+Fitness+Club', '_blank')}
                className="btn-outline btn-sm"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Ver ubicación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detalles de la membresía */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Crown className="w-5 h-5 text-primary-600 mr-2" />
          Detalles de tu Membresía
        </h3>
        
        <MembershipCard 
          membership={membership}
          showActions={true}
          isOwner={true}
        />
        
        {/* ✅ INFORMACIÓN ESPECÍFICA PARA PENDIENTES */}
        {membershipStatus.status === 'pending' && membership.payment && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Estado del pago</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>Método: {
                membership.payment.paymentMethod === 'transfer' ? 'Transferencia bancaria' :
                membership.payment.paymentMethod === 'cash' ? 'Efectivo en gimnasio' :
                membership.payment.paymentMethod
              }</div>
              <div>Estado: Pendiente de validación</div>
              <div className="flex items-center mt-2">
                <Info className="w-4 h-4 mr-1" />
                <span className="font-medium">No puedes cambiar de plan hasta que esta membresía sea confirmada</span>
              </div>
              {membership.payment.paymentMethod === 'cash' && (
                <div className="flex items-center mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Visita el gimnasio para completar tu pago</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ ESTADÍSTICAS CORREGIDAS: Con traducción completa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {translateMembershipType(membership) || 'Membresía'}
          </div>
          <div className="text-sm text-gray-600">Tipo de plan</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatDate(membership.startDate)}
          </div>
          <div className="text-sm text-gray-600">Fecha de inicio</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {membershipStatus.status === 'cancelled' ? 
              'Cancelada' : 
              formatDate(membership.endDate)
            }
          </div>
          <div className="text-sm text-gray-600">
            {membershipStatus.status === 'cancelled' ? 
              'Estado' : 
              'Fecha de vencimiento'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ SECCIÓN CORREGIDA: Planes (sin bloqueos, solo advertencias)
const PlansSection = ({ plans, isLoading, currentMembership, onSelectPlan, onRefresh, planChangeInfo }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando planes disponibles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ✅ ADVERTENCIA INFORMATIVA (sin bloquear funcionalidad) */}
      {planChangeInfo.showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Info className="w-8 h-8 text-yellow-500 mr-4" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                {planChangeInfo.warningTitle}
              </h3>
              <p className="text-yellow-700 mb-3">
                {planChangeInfo.warningMessage}
              </p>
              <div className="text-sm text-yellow-600">
                <strong>Estado:</strong> {planChangeInfo.warningDetails}
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>¿Qué sigue?</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Si pagaste por transferencia: Espera la validación (1-2 días hábiles)</li>
                <li>• Si elegiste pago en efectivo: Visita el gimnasio para completar el pago</li>
                <li>• Una vez confirmada tu membresía, podrás cambiar de plan</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {currentMembership ? 'Cambiar Plan de Membresía' : 'Obtener tu Membresía'}
        </h3>
        <p className="text-gray-600">
          {currentMembership 
            ? 'Explora otros planes disponibles y cambia cuando quieras'
            : 'Elige el plan perfecto para tus objetivos de fitness'
          }
        </p>
      </div>

      {/* Validación de planes */}
      {!plans || plans.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay planes disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            Contacta con el gimnasio para más información sobre membresías.
          </p>
          <button
            onClick={onRefresh}
            className="btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <>
          {/* Métodos de pago */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
              Múltiples opciones de pago
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium">Tarjeta de crédito/débito</span>
                  <div className="text-xs text-gray-600">Activación inmediata</div>
                </div>
              </div>
              <div className="flex items-center">
                <Upload className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium">Transferencia bancaria</span>
                  <div className="text-xs text-gray-600">Validación 1-2 días</div>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium">Efectivo en gimnasio</span>
                  <div className="text-xs text-gray-600">Pago en sucursal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de planes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentMembership && currentMembership.planId === plan.id;
              const isDisabledByWarning = planChangeInfo.showWarning && !isCurrentPlan;
              
              return (
                <div key={plan.id} className={`
                  relative bg-white rounded-3xl shadow-xl p-6 transition-all duration-300 hover:scale-105
                  ${plan.isPopular ? 'ring-2 ring-primary-500 scale-105' : ''}
                  ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
                  ${isDisabledByWarning ? 'opacity-75' : ''}
                `}>
                  
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        Más Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        Plan Actual
                      </span>
                    </div>
                  )}

                  {isDisabledByWarning && (
                    <div className="absolute -top-2 -right-2">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Bloqueado
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          Q{plan.price}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{plan.durationType === 'monthly' ? 'mes' : 
                            plan.durationType === 'yearly' ? 'año' : 
                            plan.durationType}
                        </span>
                      </div>
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <div className="text-sm text-gray-500">
                          <span className="line-through">Q{plan.originalPrice}</span>
                          <span className="ml-2 text-green-600 font-semibold">
                            Ahorra Q{plan.originalPrice - plan.price}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {plan.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {plan.description}
                      </p>
                    )}
                    
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-2 mb-6 text-left">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <button 
                      onClick={() => onSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full btn font-semibold py-3 transition-all ${
                        isCurrentPlan 
                          ? 'btn-secondary opacity-50 cursor-not-allowed' 
                          : isDisabledByWarning
                          ? 'btn-warning hover:scale-105'
                          : plan.isPopular 
                          ? 'btn-primary hover:scale-105' 
                          : 'btn-secondary hover:scale-105'
                      }`}
                      title={isDisabledByWarning ? planChangeInfo.warningMessage : ''}
                    >
                      {isCurrentPlan ? 'Plan Actual' : 
                       isDisabledByWarning ? 'Confirma membresía actual' :
                       'Seleccionar Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Garantías */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-500 mr-2" />
              <span className="font-semibold text-gray-900">
                Garantía de satisfacción
              </span>
            </div>
            <div className="text-center text-gray-600 text-sm">
              <p>Proceso de compra 100% seguro • Múltiples métodos de pago • Soporte 24/7</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ✅ SECCIÓN CORREGIDA: Historial (con estados correctos y traducción)
const HistorySection = ({ memberships, isLoading, currentMembership }) => {
  const { formatDate } = useApp();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="text-gray-600 mt-4">Cargando tu historial...</p>
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin historial de membresías
        </h3>
        <p className="text-gray-600">
          {currentMembership 
            ? 'Tu membresía actual será visible aquí cuando expire o renueves'
            : 'Una vez que obtengas una membresía, aparecerá en tu historial'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Historial de Membresías
        </h3>
        <p className="text-gray-600">
          Revisa todas tus membresías anteriores y actuales
        </p>
      </div>

      <div className="space-y-4">
        {memberships.map((membership, index) => {
          const isCurrentMembership = membership.id === currentMembership?.id;
          
          // ✅ LÓGICA CORREGIDA: Determinar estado visual correcto
          const getVisualStatus = () => {
            if (isCurrentMembership) {
              // Si es la membresía actual, usar su estado real
              if (membership.status === 'pending') {
                return {
                  color: 'yellow',
                  bgColor: 'bg-yellow-50 border-yellow-200',
                  dotColor: 'bg-yellow-500',
                  label: 'Pendiente',
                  isCurrent: true
                };
              } else if (membership.status === 'active') {
                return {
                  color: 'green',
                  bgColor: 'bg-green-50 border-green-200',
                  dotColor: 'bg-green-500',
                  label: 'Activa',
                  isCurrent: true
                };
              } else if (membership.status === 'cancelled') {
                return {
                  color: 'gray',
                  bgColor: 'bg-gray-50 border-gray-200',
                  dotColor: 'bg-gray-500',
                  label: 'Cancelada',
                  isCurrent: true
                };
              }
            }
            
            // Para membresías históricas
            if (membership.status === 'cancelled') {
              return {
                color: 'gray',
                bgColor: 'bg-gray-50 border-gray-200',
                dotColor: 'bg-gray-400',
                label: 'Cancelada',
                isCurrent: false
              };
            }
            
            // Verificar si están vencidas por fecha
            const isExpired = membership.endDate && new Date(membership.endDate) < new Date();
            
            if (isExpired) {
              return {
                color: 'gray',
                bgColor: 'bg-gray-50 border-gray-200',
                dotColor: 'bg-gray-400',
                label: 'Vencida',
                isCurrent: false
              };
            } else {
              return {
                color: 'blue',
                bgColor: 'bg-blue-50 border-blue-200',
                dotColor: 'bg-blue-500',
                label: 'Histórica',
                isCurrent: false
              };
            }
          };

          const visualStatus = getVisualStatus();
          
          return (
            <div key={membership.id} className={`
              bg-white rounded-lg shadow-sm p-6 border-2 ${visualStatus.bgColor}
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${visualStatus.dotColor}`} />
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {/* ✅ TRADUCIR NOMBRE DEL PLAN */}
                      {membership.plan?.name || 
                       (membership.type === 'monthly' ? 'Plan Mensual' : 
                        membership.type === 'yearly' ? 'Plan Anual' : 
                        membership.type || 'Membresía')}
                      {visualStatus.isCurrent && (
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          visualStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          visualStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Actual
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
                    </p>
                    
                    {/* ✅ INFORMACIÓN ADICIONAL PARA ESTADOS ESPECIALES */}
                    {membership.status === 'pending' && (
                      <div className="flex items-center mt-1">
                        <HourglassIcon className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-yellow-600">
                          {membership.payment?.paymentMethod === 'transfer' ? 
                            'Validando transferencia...' : 
                            membership.payment?.paymentMethod === 'cash' ?
                            'Esperando pago en gimnasio...' :
                            'En proceso de validación...'
                          }
                        </span>
                      </div>
                    )}
                    
                    {membership.status === 'cancelled' && (
                      <div className="flex items-center mt-1">
                        <Ban className="w-3 h-3 text-gray-500 mr-1" />
                        <span className="text-xs text-gray-600">
                          Membresía cancelada - Sin días restantes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    Q{membership.price}
                  </div>
                  <div className={`text-sm ${
                    visualStatus.color === 'yellow' ? 'text-yellow-600' :
                    visualStatus.color === 'green' ? 'text-green-600' : 
                    visualStatus.color === 'blue' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {visualStatus.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipManager;