import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { 
  CreditCard, 
  Calendar, 
  Clock, 
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Upload,
  User,
  Users,
  Bell,
  ShoppingBag,
  MessageSquare,
  Star,
  Plus,
  ArrowLeft,
  Crown,
  Shield,
  Check,
  Zap,
  Gift,
  ArrowRight,
  AlertTriangle,
  Loader2,
  MapPin,
  DollarSign,
  RefreshCw,
  Timer,
  BarChart3,
  Settings,
  Heart
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import membershipService from '../../services/membershipService';

// Hook de traducción
import { useTranslation } from '../../hooks/useTranslation';

// ✅ IMPORTAR CONFIG DEL GIMNASIO
import gymConfig, { 
  getContactInfo, 
  getBankInfo, 
  getPaymentConfig,
  getGymConfig 
} from '../../config/gymConfig';

// Componentes existentes
import DashboardCard from '../../components/common/DashboardCard';
import MembershipCard from '../../components/memberships/MembershipCard';
import PaymentHistoryCard from '../../components/payments/PaymentHistoryCard';
import ScheduleCard from '../../components/memberships/ScheduleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Componente de checkout actualizado
import MembershipCheckout from '../../components/memberships/MembershipCheckout';

// Componentes de gestión
import TestimonialManager from './components/TestimonialManager';
import MembershipManager from './client/MembershipManager';
import ScheduleManager from './client/ScheduleManager';

// ✅ Función auxiliar mejorada para formatear en Quetzales usando config
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return `${gymConfig.regional.currencySymbol} 0.00`;
  return `${gymConfig.regional.currencySymbol} ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const { formatDate, showError, showSuccess, showInfo, isMobile } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Hook de traducción
  const { translateMembershipType } = useTranslation();
  
  // Estado para navegación entre secciones usando URL params
  const section = searchParams.get('section') || 'dashboard';
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // ✅ OBTENER CONFIGURACIÓN DEL GIMNASIO DESDE EL BACKEND O .ENV
  const { data: backendConfig } = useQuery({
    queryKey: ['gymConfig'],
    queryFn: () => apiService.getGymConfig(),
    staleTime: 30 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.log('ℹ️ Usando configuración del .env (backend no disponible)');
    }
  });

  // ✅ COMBINAR DATOS DEL BACKEND CON DEFAULTS DEL .ENV
  const contactInfo = getContactInfo(backendConfig?.contact);
  const bankInfo = getBankInfo(backendConfig?.banking);
  const paymentConfig = getPaymentConfig(backendConfig?.payment);
  const appConfig = getGymConfig(backendConfig?.gym);
  
  // QUERIES PARA DATOS DEL CLIENTE
  
  // Membresía actual del cliente
  const { data: currentMembership, isLoading: membershipLoading, refetch: refetchMembership } = useQuery({
    queryKey: ['currentMembership', user?.id],
    queryFn: async () => {
      console.log('🔄 ClientDashboard: Obteniendo membresía actual...');
      try {
        const membership = await membershipService.getCurrentMembership();
        
        if (membership) {
          console.log('✅ ClientDashboard: Membresía encontrada:', {
            id: membership.id,
            status: membership.status,
            isPending: membership.isPending,
            paymentMethod: membership.payment?.paymentMethod
          });
        } else {
          console.log('ℹ️ ClientDashboard: No hay membresía activa');
        }
        
        return membership;
      } catch (error) {
        console.error('❌ ClientDashboard: Error obteniendo membresía:', error);
        if (error.response?.status !== 404 && error.response?.status !== 401) {
          throw error;
        }
        return null;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });
  
  // Horarios actuales del cliente
  const { data: currentSchedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['currentSchedule', user?.id],
    queryFn: () => apiService.getCurrentSchedule(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: section === 'dashboard' || section === 'schedule',
    onError: (error) => {
      if (error.response?.status !== 404) {
        console.warn('Error cargando horarios:', error.message);
      }
    }
  });
  
  // Historial de membresías
  const { data: memberships, isLoading: membershipsLoading } = useQuery({
    queryKey: ['userMemberships', user?.id],
    queryFn: () => membershipService.getUserMemberships(),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar tu historial de membresías')
  });
  
  // Planes de membresía disponibles
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => membershipService.getPlans(),
    staleTime: 10 * 60 * 1000,
    enabled: section === 'membership',
    onError: (error) => showError('Error al cargar planes de membresía')
  });
  
  // Reseñas del usuario
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['myTestimonials', user?.id],
    queryFn: () => apiService.getMyTestimonials(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        console.warn('Error cargando Reseñas:', error.message);
      }
    }
  });

  // Procesar datos
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitTestimonial = testimonialData.canSubmitNew !== false;
  const publishedCount = testimonialData.publishedCount || 0;
  const pendingCount = testimonialData.pendingCount || 0;
  
  // Procesar datos de horarios
  const scheduleData = currentSchedule?.currentSchedule || {};
  const totalScheduledSlots = Object.values(scheduleData).reduce((sum, day) => 
    sum + (day.hasSlots ? day.slots.length : 0), 0
  );
  const scheduledDays = Object.values(scheduleData).filter(day => day.hasSlots).length;
  
  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (endDate, membershipStatus) => {
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
  
  // Estado de la membresía
  const getMembershipStatus = () => {
    if (!currentMembership) {
      return { status: 'none', message: 'Sin membresía', color: 'red' };
    }
    
    console.log('🔍 Evaluando estado de membresía:', {
      id: currentMembership.id,
      status: currentMembership.status,
      isPending: currentMembership.isPending,
      requiresValidation: currentMembership.requiresValidation,
      paymentMethod: currentMembership.payment?.paymentMethod,
      daysUntilExpiry: daysUntilExpiry
    });
    
    if (currentMembership.status === 'pending' || currentMembership.isPending || currentMembership.requiresValidation) {
      console.log('⏳ Membresía en estado PENDIENTE');
      return { status: 'pending', message: 'Pendiente validación', color: 'yellow' };
    }
    
    if (currentMembership.status === 'cancelled') {
      console.log('🚫 Estado: CANCELADA');
      return { status: 'cancelled', message: 'Cancelada', color: 'gray' };
    }
    
    if (currentMembership.status === 'active') {
      if (daysUntilExpiry === null || daysUntilExpiry === undefined) {
        console.log('✅ Membresía ACTIVA sin límite de tiempo');
        return { status: 'active', message: 'Activa', color: 'green' };
      }
      
      if (daysUntilExpiry < 0) {
        console.log('❌ Membresía VENCIDA');
        return { status: 'expired', message: 'Vencida', color: 'red' };
      }
      
      if (daysUntilExpiry <= 3) {
        console.log('⚠️ Membresía POR VENCER (≤3 días)');
        return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
      }
      
      if (daysUntilExpiry <= 7) {
        console.log('⚠️ Membresía VENCE PRONTO (≤7 días)');
        return { status: 'warning', message: 'Vence pronto', color: 'orange' };
      }
      
      console.log('✅ Membresía ACTIVA');
      return { status: 'active', message: 'Activa', color: 'green' };
    }
    
    if (currentMembership.status === 'expired') {
      console.log('❌ Estado explícito: VENCIDA');
      return { status: 'expired', message: 'Vencida', color: 'red' };
    }
    
    console.log('⚠️ Estado de membresía desconocido:', currentMembership.status);
    return { 
      status: 'unknown', 
      message: currentMembership.status || 'Estado desconocido', 
      color: 'gray' 
    };
  };
  
  const membershipStatus = getMembershipStatus();

  // ✅ Función para obtener el nombre del método de pago desde config
  const getPaymentMethodName = (method) => {
    if (method === 'transfer') return 'Transferencia bancaria';
    if (method === 'cash') return 'Efectivo en gimnasio';
    if (method === 'card') return 'Tarjeta de crédito/débito';
    return method;
  };

  // ✅ Función para obtener la URL del gimnasio en mapas desde config
  const getGymMapUrl = () => {
    return gymConfig.location.mapsUrl || 'https://maps.google.com';
  };

  // Función para cambiar sección
  const navigateToSection = (newSection) => {
    setSearchParams({ section: newSection });
  };

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    setSearchParams({});
  };

  // Función para obtener el tipo de membresía traducido
  const getTranslatedMembershipType = () => {
    if (!currentMembership) return null;
    return translateMembershipType(currentMembership);
  };

  // Manejar selección de plan
  const handleSelectPlan = (plan) => {
    console.log('Plan seleccionado:', plan);
    setSelectedPlan(plan);
    navigateToSection('checkout');
  };

  // Manejar éxito de compra
  const handleMembershipSuccess = (membership) => {
    console.log('Membresía adquirida exitosamente:', membership);
    
    if (membership.paymentMethod === 'card') {
      showSuccess('¡Membresía activada exitosamente! Ya puedes usar todas nuestras instalaciones.');
    } else if (membership.paymentMethod === 'transfer') {
      showSuccess('Solicitud de membresía enviada. Te notificaremos cuando se valide tu transferencia.');
    } else if (membership.paymentMethod === 'cash') {
      showSuccess('Membresía registrada. Visita el gimnasio para completar tu pago en efectivo.');
    }
    
    refetchMembership();
    setSelectedPlan(null);
    navigateToSection('dashboard');
  };

  // Volver desde checkout
  const handleBackFromCheckout = () => {
    setSelectedPlan(null);
    navigateToSection('membership');
  };

  // Función para refrescar estado de pagos pendientes
  const handleRefreshPaymentStatus = async () => {
    try {
      await refetchMembership();
      showInfo('Estado actualizado');
    } catch (error) {
      showError('Error actualizando estado');
    }
  };

  // Renderizado condicional según la sección
  if (section === 'testimonials') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDashboard}
            className="btn-outline btn-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Panel
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Mis Reseñas</h2>
        </div>
        <TestimonialManager />
      </div>
    );
  }

  if (section === 'membership') {
    return (
      <MembershipManager 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (section === 'schedule') {
    return (
      <ScheduleManager 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (section === 'checkout' && selectedPlan) {
    return (
      <MembershipCheckout
        selectedPlan={selectedPlan}
        onBack={handleBackFromCheckout}
        onSuccess={handleMembershipSuccess}
      />
    );
  }

  // Vista principal del dashboard
  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* ENCABEZADO PERSONALIZADO */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              ¡Hola, {user?.firstName}!
            </h1>
            <p className="text-primary-100 mt-1 text-sm md:text-base">
              Bienvenido a {appConfig.name}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs md:text-sm text-primary-100">
              Miembro desde
            </div>
            <div className="text-base md:text-lg font-semibold">
              {formatDate(new Date(user?.createdAt || Date.now()), 'MMM yyyy')}
            </div>
          </div>
        </div>
      </div>
      
      {/* MÉTRICAS PERSONALES - 4 COLUMNAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        
        {/* Estado de membresía */}
        <div 
          className={`cursor-pointer transition-transform hover:scale-105 ${
            !currentMembership || membershipStatus.status === 'pending' ? 'ring-2 ring-opacity-50' : ''
          } ${
            !currentMembership ? 'ring-red-500' : 
            membershipStatus.status === 'pending' ? 'ring-yellow-500' : ''
          }`}
          onClick={() => navigateToSection('membership')}
        >
          <DashboardCard
            title="Mi Membresía"
            value={membershipStatus.message}
            icon={CreditCard}
            color={membershipStatus.color}
            isLoading={membershipLoading}
            subtitle={
              membershipLoading ? 'Verificando estado...' :
              currentMembership ? 
                (membershipStatus.status === 'pending' ? 
                  `${getPaymentMethodName(currentMembership.payment?.paymentMethod)} pendiente` :
                  getTranslatedMembershipType() || 'Membresía activa'
                ) :
                'Haz clic para obtener una'
            }
            alert={!currentMembership || membershipStatus.status === 'pending'}
          />
        </div>
        
        {/* Horarios del cliente */}
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigateToSection('schedule')}
        >
          <DashboardCard
            title="Mis Horarios"
            value={
              !currentSchedule?.hasMembership ? 'Sin membresía' :
              totalScheduledSlots === 0 ? 'Sin horarios' :
              totalScheduledSlots === 1 ? '1 horario' :
              `${totalScheduledSlots} horarios`
            }
            icon={Timer}
            color={
              !currentSchedule?.hasMembership ? 'red' :
              totalScheduledSlots === 0 ? 'yellow' : 'green'
            }
            isLoading={scheduleLoading}
            subtitle={
              !currentSchedule?.hasMembership ? 'Obtén membresía primero' :
              totalScheduledSlots === 0 ? 'Configura tus horarios' :
              scheduledDays === 1 ? '1 día activo' : `${scheduledDays} días activos`
            }
            alert={!currentSchedule?.hasMembership || totalScheduledSlots === 0}
          />
        </div>
        
        {/* ✅ NUEVO: Tarjeta de Reseñas */}
        <div 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigateToSection('testimonials')}
        >
          <DashboardCard
            title="Mis Reseñas"
            value={
              userTestimonials.length === 0 ? 'Sin Reseñas ahora' :
              userTestimonials.length === 1 ? '1 Reseña nueva' :
              `${userTestimonials.length} Reseñas`
            }
            icon={Heart}
            color={
              userTestimonials.length === 0 ? 'yellow' : 
              publishedCount > 0 ? 'green' : 'blue'
            }
            isLoading={testimonialsLoading}
            subtitle={
              userTestimonials.length === 0 ? 'Comparte tu experiencia' :
              publishedCount > 0 ? `${publishedCount} Gracias${publishedCount !== 1 ? 's' : ''}` :
              ` Gracias tu opinion es muy valiosa`
            }
            alert={canSubmitTestimonial && userTestimonials.length === 0}
          />
        </div>
        
        {/* Días restantes */}
        <DashboardCard
          title="Días restantes"
          value={
            membershipStatus.status === 'pending' ? 'Validando...' :
            daysUntilExpiry !== null ? 
              (daysUntilExpiry < 0 ? 'Vencida' : `${daysUntilExpiry} días`) : 
              'N/A'
          }
          icon={Clock}
          color={
            membershipStatus.status === 'pending' ? 'yellow' :
            daysUntilExpiry !== null ? 
              (daysUntilExpiry < 0 ? 'red' : 
               daysUntilExpiry <= 3 ? 'yellow' : 'green') : 
              'gray'
          }
          isLoading={membershipLoading}
          alert={daysUntilExpiry !== null && daysUntilExpiry <= 3}
        />
        
      </div>
      
      {/* ALERTAS IMPORTANTES */}
      {!currentMembership && !membershipLoading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 md:gap-4 flex-1">
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold text-red-800">
                  ¡Necesitas una membresía para acceder al gimnasio!
                </h3>
                <p className="text-sm md:text-base text-red-700 mt-2">
                  Para disfrutar de todas nuestras instalaciones y servicios exclusivos, 
                  necesitas obtener una membresía.
                </p>
                {/* Info de métodos de pago - solo en desktop */}
                <div className="hidden md:block text-xs text-red-600 mt-2 space-y-1">
                  {paymentConfig.cardEnabled && (
                    <div>💳 {paymentConfig.cardProcessingNote}</div>
                  )}
                  {paymentConfig.transferEnabled && (
                    <div>🏦 {paymentConfig.transferProcessingNote}</div>
                  )}
                  {paymentConfig.cashEnabled && (
                    <div>💵 {paymentConfig.cashProcessingNote}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto md:ml-4">
              <button
                onClick={() => navigateToSection('membership')}
                className="btn-primary w-full md:w-auto font-bold py-2.5 md:py-3 px-4 md:px-6 text-base md:text-lg hover:scale-105 transition-transform"
              >
                <Gift className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Obtener Membresía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVA ALERTA: Invitación a dejar Reseña (prominente) */}
      {canSubmitTestimonial && userTestimonials.length === 0 && (  
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 md:gap-4 flex-1">
              <div className="bg-white rounded-full p-2 md:p-3 flex-shrink-0">
                <Heart className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold text-purple-900">
                  ¡Comparte tu experiencia en {appConfig.name}!
                </h3>
                <p className="text-sm md:text-base text-purple-800 mt-2">
                  Déjanos una Reseña, testimonio o cuéntanos tu experiencia. 
                  Tu opinión es valiosa. Ayuda a otros a conocernos.
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto md:ml-4">
              <button
                onClick={() => navigateToSection('testimonials')}
                className="btn-primary w-full md:w-auto font-bold py-2.5 md:py-3 px-4 md:px-6 text-base md:text-lg hover:scale-105 transition-transform bg-purple-600 hover:bg-purple-700"
              >
                <Star className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Dejar Reseña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta para membresía pendiente */}
      {membershipStatus.status === 'pending' && currentMembership && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-yellow-800">
                  Tu membresía está siendo validada
                </h3>
                <p className="text-xs md:text-sm text-yellow-700 mt-1">
                  {currentMembership.payment?.paymentMethod === 'transfer' && 
                    `Validando transferencia bancaria - ${paymentConfig.transferProcessingNote || 'Validación en proceso'}`
                  }
                  {currentMembership.payment?.paymentMethod === 'cash' && 
                    `Visita ${appConfig.name} en ${contactInfo.address || gymConfig.location.address} para completar tu pago`
                  }
                  {(!currentMembership.payment?.paymentMethod || 
                    (currentMembership.payment?.paymentMethod !== 'transfer' && 
                     currentMembership.payment?.paymentMethod !== 'cash')) && 
                    'Procesando tu membresía - Te notificaremos pronto'
                  }
                </p>
                <div className="text-xs text-yellow-600 mt-2">
                  Plan: {currentMembership.plan?.name || currentMembership.type || 'Membresía'} • 
                  Precio: {formatQuetzales(currentMembership.price)} • 
                  ID: {currentMembership.id}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefreshPaymentStatus}
                className="btn-warning btn-sm flex-1 sm:flex-none"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </button>
              {currentMembership.payment?.paymentMethod === 'cash' && (
                <button
                  onClick={() => window.open(getGymMapUrl(), '_blank')}
                  className="btn-outline btn-sm flex-1 sm:flex-none"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Ver ubicación
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alertas de vencimiento */}
      {membershipStatus.status === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Tu membresía ha vencido
                </h3>
                <p className="text-xs md:text-sm text-red-700 mt-1">
                  Renueva tu membresía para continuar disfrutando de nuestros servicios.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateToSection('membership')}
              className="btn-danger btn-sm w-full sm:w-auto sm:ml-auto"
            >
              Renovar ahora
            </button>
          </div>
        </div>
      )}
      
      {membershipStatus.status === 'expiring' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Tu membresía vence en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs md:text-sm text-yellow-700 mt-1">
                  Renueva pronto para evitar interrupciones en tu rutina.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateToSection('membership')}
              className="btn-warning btn-sm w-full sm:w-auto sm:ml-auto"
            >
              Renovar
            </button>
          </div>
        </div>
      )}

      {/* Alerta para configurar horarios */}
      {currentMembership && membershipStatus.status === 'active' && totalScheduledSlots === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <Timer className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  ¡Configura tus horarios de entrenamiento!
                </h3>
                <p className="text-xs md:text-sm text-blue-700 mt-1">
                  Ya tienes membresía activa. Ahora configura tus horarios para aprovechar al máximo el gimnasio.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateToSection('schedule')}
              className="btn-primary btn-sm w-full sm:w-auto sm:ml-auto"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Configurar Horarios
            </button>
          </div>
        </div>
      )}
      
      {/* ✅ CONTENIDO PRINCIPAL - 3 COLUMNAS (incluye Reseñas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* MI MEMBRESÍA */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-gray-900">
              Mi Membresía
            </h3>
            {currentMembership ? (
              <div className="flex space-x-2">
                {membershipStatus.status === 'pending' && (
                  <button
                    onClick={handleRefreshPaymentStatus}
                    className="text-yellow-600 hover:text-yellow-500 text-xs md:text-sm font-medium"
                  >
                    Actualizar estado
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigateToSection('membership')}
                className="text-primary-600 hover:text-primary-500 text-xs md:text-sm font-medium"
              >
                Obtener membresía
              </button>
            )}
          </div>
          
          {membershipLoading ? (
            <LoadingSpinner />
          ) : currentMembership ? (
            <div>
              <MembershipCard 
                membership={currentMembership}
                showActions={true}
                isOwner={true}
              />
              
              {membershipStatus.status === 'pending' && currentMembership.payment && (
                <div className="mt-4 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 text-sm md:text-base">Estado del pago</h4>
                  <div className="text-xs md:text-sm text-yellow-700 space-y-1">
                    <div>Método: {getPaymentMethodName(currentMembership.payment.paymentMethod)}</div>
                    <div>Estado: Pendiente de validación</div>
                    {currentMembership.payment.paymentMethod === 'cash' && (
                      <div className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>Visita {appConfig.name} en {contactInfo.address}</span>
                      </div>
                    )}
                    {currentMembership.payment.paymentMethod === 'transfer' && (
                      <div className="mt-2 text-xs">
                        <div>Tiempo estimado: {paymentConfig.transferValidationTime || '1-2 días'}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => navigateToSection('membership')}
                className="w-full mt-4 btn-outline text-center text-sm"
              >
                <CreditCard className="w-4 h-4 mr-2 inline" />
                Ver detalles completos
              </button>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3 md:mb-4" />
              <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                No tienes membresía activa
              </h4>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 px-2">
                Para acceder a todas nuestras instalaciones y servicios, 
                necesitas obtener una membresía.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigateToSection('membership')}
                  className="btn-primary w-full text-sm md:text-base"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Obtener Membresía Ahora
                </button>
                <div className="text-xs text-gray-500 space-y-1">
                  {paymentConfig.cardEnabled && (
                    <div>💳 {paymentConfig.cardProcessingNote}</div>
                  )}
                  {paymentConfig.transferEnabled && (
                    <div>🏦 {paymentConfig.transferProcessingNote}</div>
                  )}
                  {paymentConfig.cashEnabled && (
                    <div>💵 {paymentConfig.cashProcessingNote}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* MIS HORARIOS */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-gray-900">
              Mis Horarios
            </h3>
            <button
              onClick={() => navigateToSection('schedule')}
              className="text-primary-600 hover:text-primary-500 text-xs md:text-sm font-medium"
            >
              {totalScheduledSlots > 0 ? 'Gestionar horarios' : 'Configurar horarios'}
            </button>
          </div>
          
          {scheduleLoading ? (
            <LoadingSpinner />
          ) : !currentSchedule?.hasMembership ? (
            <div className="text-center py-6 md:py-8">
              <Timer className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3 md:mb-4" />
              <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                Necesitas membresía activa
              </h4>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 px-2">
                Para configurar horarios de entrenamiento, 
                primero necesitas obtener una membresía.
              </p>
              <button
                onClick={() => navigateToSection('membership')}
                className="btn-primary w-full text-sm md:text-base"
              >
                <Zap className="w-4 h-4 mr-2" />
                Obtener Membresía
              </button>
            </div>
          ) : totalScheduledSlots === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-yellow-500 mx-auto mb-3 md:mb-4" />
              <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                Sin horarios configurados
              </h4>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 px-2">
                Configura tus horarios de entrenamiento para 
                aprovechar al máximo tu membresía.
              </p>
              <button
                onClick={() => navigateToSection('schedule')}
                className="btn-primary w-full text-sm md:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Configurar Horarios
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center">
                  <div className="text-base md:text-lg font-semibold text-blue-800">{totalScheduledSlots}</div>
                  <div className="text-xs text-blue-600">Horarios activos</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center">
                  <div className="text-base md:text-lg font-semibold text-green-800">{scheduledDays}</div>
                  <div className="text-xs text-green-600">Días programados</div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(scheduleData)
                  .filter(([_, dayData]) => dayData.hasSlots)
                  .map(([day, dayData]) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-2 md:p-3">
                      <div className="font-medium text-gray-900 mb-1 text-sm md:text-base">
                        {dayData.dayName}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dayData.slots.map((slot, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            {slot.timeRange}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
              
              <button
                onClick={() => navigateToSection('schedule')}
                className="w-full mt-4 btn-outline text-center text-sm"
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Gestionar todos los horarios
              </button>
            </div>
          )}
        </div>

        {/* ✅ MIS Reseñas - NUEVA COLUMNA */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-medium text-gray-900">
              Mis Reseñas
              {userTestimonials.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({userTestimonials.length})
                </span>
              )}
            </h3>
            <button
              onClick={() => navigateToSection('testimonials')}
              className="text-primary-600 hover:text-primary-500 text-xs md:text-sm font-medium"
            >
              {userTestimonials.length > 0 ? 'Ver todos' : 'Escribir'}
            </button>
          </div>
          
          {testimonialsLoading ? (
            <LoadingSpinner />
          ) : userTestimonials.length > 0 ? (
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center">
                  <div className="text-base md:text-lg font-semibold text-green-800">{publishedCount}</div>
                  <div className="text-xs text-green-600">Gracias{publishedCount !== 1 ? 's' : ''}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center">
                  <div className="text-base md:text-lg font-semibold text-blue-800">{pendingCount}</div>
                  <div className="text-xs text-blue-600">tu opinion es valiosa para nosotros</div>
                </div>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {userTestimonials.slice(0, 2).map((testimonial, index) => (
                  <div key={testimonial.id} className="border border-gray-200 rounded-lg p-2 md:p-3">
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        testimonial.status === 'Gracias' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {testimonial.status === 'Gracias' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {testimonial.status === 'tu opinion es valiosa para nosotros' && <Clock className="w-3 h-3 mr-1" />}
                        {testimonial.status}
                      </span>
                      
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= testimonial.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-gray-800 text-xs leading-relaxed">
                      "{testimonial.text.length > 80 ? 
                        testimonial.text.substring(0, 80) + '...' : 
                        testimonial.text}"
                    </p>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {formatDate(testimonial.submittedAt)}
                    </div>
                  </div>
                ))}
              </div>
              
              {userTestimonials.length > 2 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => navigateToSection('testimonials')}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Ver {userTestimonials.length - 2} más →
                  </button>
                </div>
              )}
              
              <button
                onClick={() => navigateToSection('testimonials')}
                className="w-full mt-4 btn-outline text-center text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2 inline" />
                Gestionar Reseñas
              </button>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Heart className="w-7 h-7 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                Comparte tu experiencia
              </h4>
              <p className="text-gray-600 text-xs md:text-sm mb-4 px-2">
                Deja un Reseña, reseña, recomendación o cuéntanos tu experiencia en {appConfig.name}
              </p>
              <button
                onClick={() => navigateToSection('testimonials')}
                className="btn-primary w-full text-sm md:text-base"
              >
                <Star className="w-4 h-4 mr-2" />
                Dejar Reseña
              </button>
            </div>
          )}
        </div>
        
      </div>
      
    </div>
  );
};

export default ClientDashboard;