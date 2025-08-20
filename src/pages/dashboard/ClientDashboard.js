// src/pages/dashboard/ClientDashboard.js
// FUNCIÓN: Dashboard personal para clientes ACTUALIZADO con compra de membresías completa
// NUEVA FUNCIONALIDAD: ✅ MembershipCheckout integrado con Stripe y transferencias

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes existentes
import DashboardCard from '../../components/common/DashboardCard';
import MembershipCard from '../../components/memberships/MembershipCard';
import PaymentHistoryCard from '../../components/payments/PaymentHistoryCard';
import ScheduleCard from '../../components/memberships/ScheduleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ✅ NUEVO: Componente de checkout de membresías
import MembershipCheckout from '../../components/memberships/MembershipCheckout';

// ✅ NUEVO: Componente de testimonios
import TestimonialManager from './components/TestimonialManager';

// ✅ NUEVO: Hook para planes de membresía
import useMembershipPlans from '../../hooks/useMembershipPlans';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, showError, showSuccess, isMobile } = useApp();
  
  // ✅ NUEVO: Estado para navegación entre secciones (incluyendo membresías)
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedPlan, setSelectedPlan] = useState(null); // ✅ NUEVO: Plan seleccionado para checkout
  
  // 📊 QUERIES EXISTENTES PARA DATOS DEL CLIENTE
  
  // Membresías del cliente
  const { data: memberships, isLoading: membershipsLoading, refetch: refetchMemberships } = useQuery({
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
  
  // ✅ NUEVO: Testimonios del usuario
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['myTestimonials', user?.id],
    queryFn: () => apiService.getMyTestimonials(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 404) {
        console.warn('Error loading testimonials:', error.message);
      }
    }
  });

  // ✅ NUEVO: Planes de membresía disponibles
  const { plans, isLoaded: plansLoaded, isLoading: plansLoading } = useMembershipPlans();
  
  // 📊 Procesar datos existentes
  const activeMembership = memberships?.data?.memberships?.find(m => m.status === 'active');
  const recentPayments = payments?.data?.payments || [];
  const totalPaid = recentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  
  // ✅ NUEVO: Procesar datos de testimonios
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitTestimonial = testimonialData.canSubmitNew !== false;
  const publishedCount = testimonialData.publishedCount || 0;
  const pendingCount = testimonialData.pendingCount || 0;
  
  // ✅ NUEVO: Detectar si necesita membresía y redirigir automáticamente
  useEffect(() => {
    if (!membershipsLoading && !activeMembership && activeSection === 'dashboard') {
      // Solo mostrar alerta prominente, no redirigir automáticamente
      console.log('🚨 Cliente sin membresía activa detectado');
    }
  }, [membershipsLoading, activeMembership, activeSection]);
  
  // 📅 Calcular días hasta vencimiento (existente)
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysUntilExpiry = activeMembership ? getDaysUntilExpiry(activeMembership.endDate) : null;
  
  // 🎯 Estado de la membresía (existente)
  const getMembershipStatus = () => {
    if (!activeMembership) return { status: 'none', message: 'Sin membresía activa', color: 'red' };
    
    if (daysUntilExpiry === null) return { status: 'active', message: 'Activa', color: 'green' };
    
    if (daysUntilExpiry < 0) return { status: 'expired', message: 'Vencida', color: 'red' };
    if (daysUntilExpiry <= 3) return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
    if (daysUntilExpiry <= 7) return { status: 'warning', message: 'Vence pronto', color: 'orange' };
    
    return { status: 'active', message: 'Activa', color: 'green' };
  };
  
  const membershipStatus = getMembershipStatus();

  // ✅ NUEVA FUNCIÓN: Manejar selección de plan
  const handleSelectPlan = (plan) => {
    console.log('📋 Plan seleccionado:', plan);
    setSelectedPlan(plan);
    setActiveSection('checkout');
  };

  // ✅ NUEVA FUNCIÓN: Manejar éxito de compra
  const handleMembershipSuccess = (membership) => {
    console.log('✅ Membresía adquirida exitosamente:', membership);
    
    // Mostrar mensaje de éxito
    if (membership.paymentMethod === 'stripe') {
      showSuccess('¡Membresía activada exitosamente! Ya puedes usar todas nuestras instalaciones.');
    } else {
      showSuccess('Solicitud de membresía enviada. Te notificaremos cuando se valide tu transferencia.');
    }
    
    // Refrescar datos de membresías
    refetchMemberships();
    
    // Volver al dashboard
    setSelectedPlan(null);
    setActiveSection('dashboard');
  };

  // ✅ NUEVA FUNCIÓN: Volver desde checkout
  const handleBackFromCheckout = () => {
    setSelectedPlan(null);
    setActiveSection('memberships');
  };

  // ✅ NUEVO: Si está en la sección de testimonios
  if (activeSection === 'testimonials') {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="btn-secondary btn-sm mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Mis Testimonios</h2>
        </div>
        <TestimonialManager />
      </div>
    );
  }

  // ✅ NUEVO: Si está en checkout de membresía
  if (activeSection === 'checkout' && selectedPlan) {
    return (
      <MembershipCheckout
        selectedPlan={selectedPlan}
        onBack={handleBackFromCheckout}
        onSuccess={handleMembershipSuccess}
      />
    );
  }

  // ✅ NUEVO: Si está en la sección de compra de membresías
  if (activeSection === 'memberships') {
    return (
      <div className="space-y-6">
        {/* Navegación de regreso */}
        <div className="flex items-center">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="btn-secondary btn-sm mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Dashboard
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {activeMembership ? 'Cambiar Plan' : 'Obtener Membresía'}
          </h2>
        </div>

        {/* Alerta de estado actual */}
        {!activeMembership && (
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

        {/* Componente de planes de membresía */}
        <MembershipPlansSection 
          plans={plans} 
          isLoaded={plansLoaded}
          isLoading={plansLoading}
          currentMembership={activeMembership}
          isMobile={isMobile}
          onSelectPlan={handleSelectPlan} // ✅ NUEVO: Callback para selección
        />
      </div>
    );
  }

  // Vista principal del dashboard
  return (
    <div className="space-y-6">
      
      {/* 🏠 HEADER PERSONALIZADO (existente) */}
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
      
      {/* 📊 MÉTRICAS PERSONALES - CON TESTIMONIOS Y MEMBRESÍA MEJORADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 🎫 Estado de membresía - MEJORADO CON CLICK */}
        <div 
          className={`cursor-pointer transition-transform hover:scale-105 ${
            !activeMembership ? 'ring-2 ring-red-500 ring-opacity-50' : ''
          }`}
          onClick={() => !activeMembership && setActiveSection('memberships')}
        >
          <DashboardCard
            title="Mi Membresía"
            value={membershipStatus.message}
            icon={CreditCard}
            color={membershipStatus.color}
            isLoading={membershipsLoading}
            subtitle={activeMembership ? 
              `${activeMembership.type === 'monthly' ? 'Mensual' : 'Diaria'}` : 
              'Haz clic para obtener una'
            }
            alert={!activeMembership}
          />
        </div>
        
        {/* ⏰ Días restantes (existente) */}
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
        
        {/* 💰 Total pagado (existente) */}
        <DashboardCard
          title="Total pagado"
          value={formatCurrency(totalPaid)}
          icon={DollarSign}
          color="green"
          isLoading={paymentsLoading}
          subtitle={`${recentPayments.length} pagos`}
        />
        
        {/* ✅ Estado de testimonios - EXISTENTE */}
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
      
      {/* 🚨 ALERTAS IMPORTANTES - PRIORIDAD A MEMBRESÍA */}
      {!activeMembership && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-4" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">
                ⚠️ ¡Necesitas una membresía para acceder al gimnasio!
              </h3>
              <p className="text-red-700 mt-2">
                Para disfrutar de todas nuestras instalaciones y servicios exclusivos, 
                necesitas obtener una membresía.
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
      
      {/* ✅ Alerta para testimonios - EXISTENTE */}
      {canSubmitTestimonial && activeMembership && (
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
                  `Ya tienes ${userTestimonials.length} testimonio${userTestimonials.length !== 1 ? 's' : ''}. ¿Tienes más experiencias que compartir sobre diferentes aspectos del gimnasio?`
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
      
      {/* 📋 CONTENIDO PRINCIPAL - CON ACCESO A MEMBRESÍAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🎫 MI MEMBRESÍA - MEJORADO CON BOTÓN DE COMPRA */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mi Membresía
            </h3>
            {activeMembership ? (
              <Link 
                to={`/dashboard/memberships/${activeMembership.id}`}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Ver detalles
              </Link>
            ) : (
              <button
                onClick={() => setActiveSection('memberships')}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Obtener membresía
              </button>
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
                {plans && plans.length > 0 && (
                  <p className="text-xs text-gray-500">
                    ⭐ Planes desde Q{Math.min(...plans.map(p => p.price))}/mes • Beneficios incluidos
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ✅ MI TESTIMONIO - Resumen EXISTENTE */}
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
                disabled={!activeMembership}
              >
                <Plus className="w-4 h-4 mr-2" />
                {!activeMembership ? 'Obtén membresía primero' : 'Escribir testimonio'}
              </button>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Resto del componente: horarios, pagos, acciones rápidas, etc. - EXISTENTE */}
      {/* [El resto del código permanece igual...] */}
      
    </div>
  );
};

// ✅ NUEVO: Componente para mostrar planes de membresía con callback de selección
const MembershipPlansSection = ({ 
  plans, 
  isLoaded, 
  isLoading, 
  currentMembership, 
  isMobile, 
  onSelectPlan // ✅ NUEVO: Callback para seleccionar plan
}) => {
  const { showSuccess, showError } = useApp();

  // ✅ ACTUALIZADO: Usar callback en lugar de navegación directa
  const handleSelectPlan = async (plan) => {
    try {
      console.log(`✅ Plan ${plan.name} seleccionado para checkout`);
      onSelectPlan(plan); // ✅ NUEVO: Llamar callback
    } catch (error) {
      showError('Error al seleccionar el plan');
    }
  };

  // Obtener beneficios únicos de todos los planes
  const getAllBenefits = () => {
    if (!plans || plans.length === 0) return [];
    
    const allFeatures = plans.flatMap(plan => plan.features || []);
    const uniqueFeatures = [...new Set(allFeatures)];
    return uniqueFeatures.slice(0, 4); // Mostrar máximo 4
  };

  const globalBenefits = getAllBenefits();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando planes de membresía...</p>
      </div>
    );
  }

  if (!isLoaded || !plans || plans.length === 0) {
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
      
      {/* Header de beneficios - DINÁMICO */}
      {globalBenefits.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            🎉 Beneficios de ser miembro
          </h3>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}>
            {globalBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <Check className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''}
              ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
            `}>
              
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                    🔥 Más Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                    ✅ Plan Actual
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
                      /{plan.duration}
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
                
                {/* ✅ NUEVO: Botón que llama al callback de selección */}
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan}
                  className={`
                    w-full btn text-center font-semibold py-4 transition-all
                    ${isCurrentPlan ? 'btn-secondary opacity-50 cursor-not-allowed' :
                      plan.popular ? 'btn-primary hover:scale-105' : 'btn-secondary hover:scale-105'}
                  `}
                >
                  {isCurrentPlan ? '✅ Plan Actual' :
                   plan.popular ? '🔥 Adquirir Plan Popular' : 'Adquirir Plan'}
                </button>

                {!currentMembership && plan.popular && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    🎁 ¡Oferta especial para nuevos miembros!
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional - COMPLETAMENTE DINÁMICO */}
      {plans && plans.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-500 mr-2" />
            <span className="font-semibold text-gray-900">
              {/* Buscar garantía en la descripción de algún plan */}
              {plans.find(p => p.description?.toLowerCase().includes('garantía'))?.description?.match(/\d+\s*días?/)?.[0] 
                ? `Garantía de satisfacción ${plans.find(p => p.description?.toLowerCase().includes('garantía'))?.description?.match(/\d+\s*días?/)?.[0]}`
                : 'Garantía de satisfacción'
              }
            </span>
          </div>
          {/* Buscar política de reembolso en algún plan */}
          {plans.find(p => p.description?.toLowerCase().includes('reembolso') || p.description?.toLowerCase().includes('devolu'))?.description && (
            <p className="text-center text-gray-600 text-sm">
              {plans.find(p => p.description?.toLowerCase().includes('reembolso') || p.description?.toLowerCase().includes('devolu'))?.description}
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default ClientDashboard;