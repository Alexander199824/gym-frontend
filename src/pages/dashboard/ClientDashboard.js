// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/ClientDashboard.js
// ACTUALIZADO: Para integrar con el nuevo sistema de compra de membresías y traducir tipos de membresía

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  Coins, 
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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import membershipService from '../../services/membershipService';

// Hook de traducción
import { useTranslation } from '../../hooks/useTranslation';

// Componentes existentes
import DashboardCard from '../../components/common/DashboardCard';
import MembershipCard from '../../components/memberships/MembershipCard';
import PaymentHistoryCard from '../../components/payments/PaymentHistoryCard';
import ScheduleCard from '../../components/memberships/ScheduleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Componente de checkout actualizado
import MembershipCheckout from '../../components/memberships/MembershipCheckout';

// Componente de testimonios
import TestimonialManager from './components/TestimonialManager';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return 'Q 0.00';
  return `Q ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const { formatDate, showError, showSuccess, showInfo, isMobile } = useApp();
  
  // Hook de traducción
  const { translateMembershipType } = useTranslation();
  
  // Estado para navegación entre secciones
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // QUERIES PARA DATOS DEL CLIENTE - USANDO SERVICIOS ACTUALIZADOS
  
  // Membresía actual del cliente
  const { data: currentMembership, isLoading: membershipLoading, refetch: refetchMembership } = useQuery({
    queryKey: ['currentMembership', user?.id],
    queryFn: () => membershipService.getCurrentMembership(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        showError('Error al cargar tu membresía actual');
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
  
  // Historial de pagos
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['userPayments', user?.id],
    queryFn: () => apiService.getPayments({ userId: user?.id, limit: 10 }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar tu historial de pagos')
  });
  
  // Planes de membresía disponibles - USANDO NUEVO SERVICIO
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => membershipService.getPlans(),
    staleTime: 10 * 60 * 1000,
    onError: (error) => showError('Error al cargar planes de membresía')
  });
  
  // Testimonios del usuario
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['myTestimonials', user?.id],
    queryFn: () => apiService.getMyTestimonials(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        console.warn('Error cargando testimonios:', error.message);
      }
    }
  });

  // Procesar datos de pagos
  const recentPayments = payments?.data?.payments || [];
  const totalPaid = recentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  
  // Procesar datos de testimonios
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitTestimonial = testimonialData.canSubmitNew !== false;
  const publishedCount = testimonialData.publishedCount || 0;
  const pendingCount = testimonialData.pendingCount || 0;
  
  // Calcular días hasta vencimiento
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysUntilExpiry = currentMembership ? getDaysUntilExpiry(currentMembership.endDate) : null;
  
  // Estado de la membresía mejorado
  const getMembershipStatus = () => {
    if (!currentMembership) return { status: 'none', message: 'Sin membresía activa', color: 'red' };
    
    // Verificar si está pendiente de validación
    if (currentMembership.status === 'pending_validation') {
      return { status: 'pending', message: 'Pendiente validación', color: 'yellow' };
    }
    
    if (daysUntilExpiry === null) return { status: 'active', message: 'Activa', color: 'green' };
    
    if (daysUntilExpiry < 0) return { status: 'expired', message: 'Vencida', color: 'red' };
    if (daysUntilExpiry <= 3) return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
    if (daysUntilExpiry <= 7) return { status: 'warning', message: 'Vence pronto', color: 'orange' };
    
    return { status: 'active', message: 'Activa', color: 'green' };
  };
  
  const membershipStatus = getMembershipStatus();

  // Función para obtener el tipo de membresía traducido
  const getTranslatedMembershipType = () => {
    if (!currentMembership) return null;
    return translateMembershipType(currentMembership);
  };

  // Manejar selección de plan
  const handleSelectPlan = (plan) => {
    console.log('Plan seleccionado:', plan);
    setSelectedPlan(plan);
    setActiveSection('checkout');
  };

  // Manejar éxito de compra - ACTUALIZADO
  const handleMembershipSuccess = (membership) => {
    console.log('Membresía adquirida exitosamente:', membership);
    
    // Mostrar mensaje según método de pago
    if (membership.paymentMethod === 'card') {
      showSuccess('¡Membresía activada exitosamente! Ya puedes usar todas nuestras instalaciones.');
    } else if (membership.paymentMethod === 'transfer') {
      showSuccess('Solicitud de membresía enviada. Te notificaremos cuando se valide tu transferencia.');
    } else if (membership.paymentMethod === 'cash') {
      showSuccess('Membresía registrada. Visita el gimnasio para completar tu pago en efectivo.');
    }
    
    // Refrescar datos
    refetchMembership();
    
    // Volver al dashboard
    setSelectedPlan(null);
    setActiveSection('dashboard');
  };

  // Volver desde checkout
  const handleBackFromCheckout = () => {
    setSelectedPlan(null);
    setActiveSection('memberships');
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

  // Si está en la sección de testimonios
  if (activeSection === 'testimonials') {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="btn-secondary btn-sm mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Panel
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Mis Testimonios</h2>
        </div>
        <TestimonialManager />
      </div>
    );
  }

  // Si está en checkout de membresía
  if (activeSection === 'checkout' && selectedPlan) {
    return (
      <MembershipCheckout
        selectedPlan={selectedPlan}
        onBack={handleBackFromCheckout}
        onSuccess={handleMembershipSuccess}
      />
    );
  }

  // Si está en la sección de compra de membresías
  if (activeSection === 'memberships') {
    return (
      <div className="space-y-6">
        {/* Navegación de regreso */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="btn-secondary btn-sm flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Panel
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentMembership ? 'Cambiar Plan' : 'Obtener Membresía'}
          </h2>
          <button
            onClick={() => refetchPlans()}
            className="btn-outline btn-sm flex items-center"
            disabled={plansLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${plansLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Alerta de estado actual */}
        {!currentMembership && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  No tienes membresía activa
                </h3>
                <p className="text-red-700 mt-1">
                  Para acceder a todas nuestras instalaciones y servicios, necesitas una membresía activa. 
                  Elige el plan que mejor se adapte a tus necesidades.
                </p>
              </div>
            </div>
          </div>
        )}

        {membershipStatus.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Membresía pendiente de validación
                  </h3>
                  <p className="text-yellow-700 mt-1">
                    Tu membresía está siendo validada por nuestro equipo. Te notificaremos cuando esté lista.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefreshPaymentStatus}
                className="btn-warning btn-sm flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar estado
              </button>
            </div>
          </div>
        )}

        {membershipStatus.status === 'expired' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800">
                  Tu membresía ha vencido
                </h3>
                <p className="text-orange-700 mt-1">
                  Renueva tu membresía para continuar disfrutando de nuestros servicios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Componente de planes de membresía actualizado */}
        <MembershipPlansSection 
          plans={plans || []} 
          isLoading={plansLoading}
          currentMembership={currentMembership}
          isMobile={isMobile}
          onSelectPlan={handleSelectPlan}
        />
      </div>
    );
  }

  // Vista principal del dashboard actualizada
  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO PERSONALIZADO */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              ¡Hola, {user?.firstName}!
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
      
      {/* MÉTRICAS PERSONALES ACTUALIZADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Estado de membresía con indicador de pago pendiente */}
        <div 
          className={`cursor-pointer transition-transform hover:scale-105 ${
            !currentMembership || membershipStatus.status === 'pending' ? 'ring-2 ring-opacity-50' : ''
          } ${
            !currentMembership ? 'ring-red-500' : 
            membershipStatus.status === 'pending' ? 'ring-yellow-500' : ''
          }`}
          onClick={() => {
            if (!currentMembership || membershipStatus.status === 'pending') {
              setActiveSection('memberships');
            }
          }}
        >
          <DashboardCard
            title="Mi Membresía"
            value={membershipStatus.message}
            icon={CreditCard}
            color={membershipStatus.color}
            isLoading={membershipLoading}
            subtitle={
              currentMembership ? 
                getTranslatedMembershipType() || 'Membresía activa' :
                'Haz clic para obtener una'
            }
            alert={!currentMembership || membershipStatus.status === 'pending'}
          />
        </div>
        
        {/* Días restantes con estado de validación */}
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
        
        {/* Total pagado en Quetzales */}
        <DashboardCard
          title="Total pagado"
          value={formatQuetzales(totalPaid)}
          icon={Coins}
          color="green"
          isLoading={paymentsLoading}
          subtitle={`${recentPayments.length} pagos`}
        />
        
        {/* Estado de testimonios */}
        <DashboardCard
          title="Mis Testimonios"
          value={
            userTestimonials.length === 0 ? 'Ninguno' :
            userTestimonials.length === 1 ? '1 testimonio' :
            `${userTestimonials.length} testimonios`
          }
          icon={MessageSquare}
          color={
            publishedCount > 0 ? 'green' :
            pendingCount > 0 ? 'yellow' :
            'blue'
          }
          isLoading={testimonialsLoading}
          subtitle={
            publishedCount > 0 && pendingCount > 0 ? 
              `${publishedCount} publicados, ${pendingCount} en revisión` :
            publishedCount > 0 ? 
              `${publishedCount} publicado${publishedCount !== 1 ? 's' : ''}` :
            pendingCount > 0 ? 
              `${pendingCount} en revisión` :
            'Comparte tu experiencia'
          }
        />
        
      </div>
      
      {/* ALERTAS IMPORTANTES ACTUALIZADAS */}
      {!currentMembership && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-4" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">
                ¡Necesitas una membresía para acceder al gimnasio!
              </h3>
              <p className="text-red-700 mt-2">
                Para disfrutar de todas nuestras instalaciones y servicios exclusivos, 
                necesitas obtener una membresía. Elige entre pago con tarjeta, transferencia o efectivo.
              </p>
              {plans && plans.length > 0 && plans[0].features && (
                <ul className="mt-3 text-sm text-red-600 space-y-1">
                  {plans[0].features.slice(0, 4).map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="ml-6">
              <button
                onClick={() => setActiveSection('memberships')}
                className="btn-primary font-bold py-3 px-6 text-lg hover:scale-105 transition-transform"
              >
                <Gift className="w-5 h-5 mr-2" />
                Obtener Membresía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta para membresía pendiente de validación */}
      {membershipStatus.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Tu membresía está siendo validada
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {currentMembership?.payment?.paymentMethod === 'transfer' && 
                    'Validando transferencia bancaria - Te notificaremos cuando esté lista'
                  }
                  {currentMembership?.payment?.paymentMethod === 'cash' && 
                    'Visita el gimnasio para completar tu pago en efectivo'
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshPaymentStatus}
                className="btn-warning btn-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </button>
              {currentMembership?.payment?.paymentMethod === 'cash' && (
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
      )}

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
            <button
              onClick={() => setActiveSection('memberships')}
              className="ml-auto btn-danger btn-sm"
            >
              Renovar ahora
            </button>
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
            <button
              onClick={() => setActiveSection('memberships')}
              className="ml-auto btn-warning btn-sm"
            >
              Renovar
            </button>
          </div>
        </div>
      )}
      
      {/* Alerta para testimonios */}
      {canSubmitTestimonial && currentMembership && membershipStatus.status !== 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                {userTestimonials.length === 0 ? 
                  '¡Comparte tu experiencia!' :
                  '¡Comparte más experiencias!'
                }
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {userTestimonials.length === 0 ? 
                  'Tu opinión es muy valiosa. Ayuda a otros miembros compartiendo tu experiencia en el gimnasio.' :
                  `Ya tienes ${userTestimonials.length} testimonio${userTestimonials.length !== 1 ? 's' : ''}. ¿Tienes más experiencias que compartir?`
                }
              </p>
            </div>
            <button
              onClick={() => setActiveSection('testimonials')}
              className="ml-auto btn-primary btn-sm"
            >
              {userTestimonials.length === 0 ? 'Escribir testimonio' : 'Agregar otro'}
            </button>
          </div>
        </div>
      )}
      
      {/* CONTENIDO PRINCIPAL ACTUALIZADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MI MEMBRESÍA con estados actualizados */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mi Membresía
            </h3>
            {currentMembership ? (
              <div className="flex space-x-2">
                {membershipStatus.status === 'pending' && (
                  <button
                    onClick={handleRefreshPaymentStatus}
                    className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                  >
                    Actualizar estado
                  </button>
                )}
                <Link 
                  to={`/dashboard/memberships/${currentMembership.id}`}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Ver detalles
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setActiveSection('memberships')}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
              
              {/* Información adicional para membresías pendientes */}
              {membershipStatus.status === 'pending' && currentMembership.payment && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Estado del pago</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>Método: {
                      currentMembership.payment.paymentMethod === 'transfer' ? 'Transferencia bancaria' :
                      currentMembership.payment.paymentMethod === 'cash' ? 'Efectivo en gimnasio' :
                      currentMembership.payment.paymentMethod
                    }</div>
                    <div>Estado: Pendiente de validación</div>
                    {currentMembership.payment.paymentMethod === 'cash' && (
                      <div className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>Visita el gimnasio para completar tu pago</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No tienes membresía activa
              </h4>
              <p className="text-gray-600 mb-6">
                Para acceder a todas nuestras instalaciones y servicios, 
                necesitas obtener una membresía.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveSection('memberships')}
                  className="btn-primary w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Obtener Membresía Ahora
                </button>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>💳 Pago con tarjeta - Activación inmediata</div>
                  <div>🏦 Transferencia bancaria - Validación 1-2 días</div>
                  <div>💵 Efectivo en gimnasio - Pago en sucursal</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* MI TESTIMONIO - Sin cambios mayores */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mis Testimonios
              {userTestimonials.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({userTestimonials.length})
                </span>
              )}
            </h3>
            <button
              onClick={() => setActiveSection('testimonials')}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              {userTestimonials.length > 0 ? 'Ver todos' : 'Escribir testimonio'}
            </button>
          </div>
          
          {testimonialsLoading ? (
            <LoadingSpinner />
          ) : userTestimonials.length > 0 ? (
            <div className="space-y-4">
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-green-800">{publishedCount}</div>
                  <div className="text-xs text-green-600">Publicado{publishedCount !== 1 ? 's' : ''}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-800">{pendingCount}</div>
                  <div className="text-xs text-blue-600">En revisión</div>
                </div>
              </div>
              
              {/* Mostrar los 2 testimonios más recientes */}
              {userTestimonials.slice(0, 2).map((testimonial, index) => (
                <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4">
                  
                  {/* Estado del testimonio */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      testimonial.status === 'Publicado' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {testimonial.status === 'Publicado' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {testimonial.status === 'En revisión' && <Clock className="w-3 h-3 mr-1" />}
                      {testimonial.status}
                      {index === 0 && userTestimonials.length > 1 && (
                        <span className="ml-1 text-xs">• Más reciente</span>
                      )}
                    </span>
                    
                    {/* Calificación */}
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= testimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({testimonial.rating}/5)
                      </span>
                    </div>
                  </div>
                  
                  {/* Contenido del testimonio */}
                  <p className="text-gray-800 text-sm leading-relaxed mb-3">
                    "{testimonial.text.length > 100 ? 
                      testimonial.text.substring(0, 100) + '...' : 
                      testimonial.text}"
                  </p>
                  
                  {/* Meta información */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Como {testimonial.role}</span>
                    <span>Enviado el {formatDate(testimonial.submittedAt)}</span>
                  </div>
                  
                  {/* Destacado */}
                  {testimonial.featured && (
                    <div className="mt-2 flex items-center text-xs text-purple-600">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Testimonio destacado
                    </div>
                  )}
                </div>
              ))}
              
              {/* Indicador de más testimonios */}
              {userTestimonials.length > 2 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setActiveSection('testimonials')}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Ver {userTestimonials.length - 2} testimonio{userTestimonials.length - 2 !== 1 ? 's' : ''} más →
                  </button>
                </div>
              )}
              
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Comparte tu experiencia
              </h4>
              <p className="text-gray-600 mb-4">
                Tu testimonio ayuda a otros miembros a conocer los beneficios del gimnasio
              </p>
              <button
                onClick={() => setActiveSection('testimonials')}
                className="btn-primary"
                disabled={!currentMembership || membershipStatus.status === 'pending'}
              >
                <Plus className="w-4 h-4 mr-2" />
                {!currentMembership ? 'Obtén membresía primero' : 
                 membershipStatus.status === 'pending' ? 'Espera validación' :
                 'Escribir testimonio'}
              </button>
            </div>
          )}
        </div>
        
      </div>
      
    </div>
  );
};

// COMPONENTE: Planes de membresía actualizado para producción
const MembershipPlansSection = ({ 
  plans, 
  isLoading, 
  currentMembership, 
  isMobile, 
  onSelectPlan
}) => {
  const { showSuccess, showError } = useApp();

  const handleSelectPlan = async (plan) => {
    try {
      console.log(`Plan ${plan.name} seleccionado para checkout`);
      onSelectPlan(plan);
    } catch (error) {
      showError('Error al seleccionar el plan');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando planes de membresía...</p>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay planes disponibles
        </h3>
        <p className="text-gray-600">
          Contacta con el gimnasio para más información sobre membresías.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header de métodos de pago */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          Múltiples opciones de pago
        </h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
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
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' :
        plans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
        plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {plans.map((plan) => {
          const IconComponent = plan.iconName === 'crown' ? Crown : 
                              plan.iconName === 'calendar-days' ? Calendar : 
                              plan.iconName === 'calendar' ? Calendar :
                              plan.iconName === 'calendar-range' ? Calendar :
                              Shield;
          
          const isCurrentPlan = currentMembership && currentMembership.planId === plan.id;
          
          return (
            <div key={plan.id} className={`
              relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-300 hover:scale-105
              ${plan.isPopular ? 'ring-2 ring-primary-500 scale-105' : ''}
              ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
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
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-primary-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {plan.name}
                </h3>
                
                <div className="mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      Q{plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      /{plan.durationType}
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
                  {plan.availability && (
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.availability.availableSpaces} espacios disponibles
                    </div>
                  )}
                </div>
                
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-6">
                    {plan.description}
                  </p>
                )}
                
                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                  <ul className="space-y-4 mb-8 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan || plan.availability?.availableSpaces === 0}
                  className={`
                    w-full btn text-center font-semibold py-4 transition-all
                    ${isCurrentPlan ? 'btn-secondary opacity-50 cursor-not-allowed' :
                      plan.availability?.availableSpaces === 0 ? 'btn-secondary opacity-50 cursor-not-allowed' :
                      plan.isPopular ? 'btn-primary hover:scale-105' : 'btn-secondary hover:scale-105'}
                  `}
                >
                  {isCurrentPlan ? 'Plan Actual' :
                   plan.availability?.availableSpaces === 0 ? 'Sin disponibilidad' :
                   plan.isPopular ? 'Adquirir Plan Popular' : 'Adquirir Plan'}
                </button>

                {!currentMembership && plan.isPopular && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ¡Oferta especial para nuevos miembros!
                  </p>
                )}
                
                {plan.availability?.availableSpaces === 0 && (
                  <p className="text-xs text-red-600 font-medium mt-2">
                    Sin espacios disponibles actualmente
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
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

    </div>
  );
};

export default ClientDashboard;
/*
=== ACTUALIZACIONES PARA SISTEMA DE PRODUCCIÓN ===

INTEGRACIÓN CON SERVICIOS ACTUALIZADOS:
- membershipService.getCurrentMembership() para obtener membresía actual
- membershipService.getUserMemberships() para historial completo
- membershipService.getPlans() para planes con el nuevo formato de datos

ESTADOS DE MEMBRESÍA MEJORADOS:
- 'none': Sin membresía activa
- 'pending': Pendiente de validación (transferencia/efectivo)
- 'active': Membresía activa y validada
- 'expired': Membresía vencida
- 'expiring': Por vencer (≤7 días)

ALERTAS INTELIGENTES:
- Sin membresía: CTA prominente para obtener una
- Pendiente validación: Opciones para actualizar estado o ver ubicación
- Por vencer: Recordatorios de renovación
- Testimonios: Solo para miembros con membresía validada

INFORMACIÓN DE MÉTODOS DE PAGO:
- Tarjeta: Activación inmediata con Stripe
- Transferencia: Validación manual 1-2 días
- Efectivo: Pago en sucursal del gimnasio

FUNCIONALIDADES NUEVAS:
- Botón "Actualizar estado" para pagos pendientes
- Enlaces a ubicación del gimnasio para pagos en efectivo
- Información detallada del estado de cada pago
- Restricciones para testimonios hasta validar membresía

EXPERIENCIA DE USUARIO:
- Feedback claro sobre el estado de cada proceso
- Instrucciones específicas según método de pago elegido
- Actualizaciones en tiempo real del estado de membresía
- Navegación intuitiva entre secciones relacionadas

SEGURIDAD Y VALIDACIÓN:
- Verificación de disponibilidad antes de mostrar planes
- Estados consistentes entre frontend y backend
- Manejo de errores específico por tipo de operación
- Protección contra acciones no permitidas según estado
*/