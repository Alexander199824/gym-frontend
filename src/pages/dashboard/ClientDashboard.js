// src/pages/dashboard/ClientDashboard.js
// FUNCIÓN: Dashboard personal para clientes con su información y membresías
// NUEVAS FUNCIONALIDADES: ✅ Testimonios múltiples integrados + navegación + métricas

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
  Bell,
  ShoppingBag,
  MessageSquare, // ✅ Para testimonios
  Star, // ✅ Para testimonios
  Plus, // ✅ Para testimonios
  ArrowLeft // ✅ Para navegación
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

// ✅ NUEVO: Componente de testimonios
import TestimonialManager from './components/TestimonialManager';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, showError } = useApp();
  
  // ✅ NUEVO: Estado para navegación entre secciones
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // 📊 QUERIES EXISTENTES PARA DATOS DEL CLIENTE
  
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
  
  // ✅ NUEVO: Testimonios del usuario - ACTUALIZADO
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['myTestimonials', user?.id],
    queryFn: () => apiService.getMyTestimonials(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      // Solo mostrar error si no es 404 (sin testimonios)
      if (error.response?.status !== 404) {
        console.warn('Error loading testimonials:', error.message);
      }
    }
  });
  
  // 📊 Procesar datos existentes
  const activeMembership = memberships?.data?.memberships?.find(m => m.status === 'active');
  const recentPayments = payments?.data?.payments || [];
  const totalPaid = recentPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  
  // ✅ NUEVO: Procesar datos de testimonios - ACTUALIZADO
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitTestimonial = testimonialData.canSubmitNew !== false; // ✅ Siempre true
  const publishedCount = testimonialData.publishedCount || 0;
  const pendingCount = testimonialData.pendingCount || 0;
  const thankYouMessage = testimonialData.thankYouMessage;
  
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
    if (!activeMembership) return { status: 'none', message: 'Sin membresía activa', color: 'gray' };
    
    if (daysUntilExpiry === null) return { status: 'active', message: 'Activa', color: 'green' };
    
    if (daysUntilExpiry < 0) return { status: 'expired', message: 'Vencida', color: 'red' };
    if (daysUntilExpiry <= 3) return { status: 'expiring', message: 'Por vencer', color: 'yellow' };
    if (daysUntilExpiry <= 7) return { status: 'warning', message: 'Vence pronto', color: 'orange' };
    
    return { status: 'active', message: 'Activa', color: 'green' };
  };
  
  const membershipStatus = getMembershipStatus();

  // ✅ NUEVO: Si está en la sección de testimonios, mostrar el componente
  if (activeSection === 'testimonials') {
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
          <h2 className="text-xl font-semibold text-gray-900">Mis Testimonios</h2>
        </div>
        
        {/* Componente de gestión de testimonios */}
        <TestimonialManager />
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
      
      {/* 📊 MÉTRICAS PERSONALES - ✅ CON TESTIMONIOS MEJORADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 🎫 Estado de membresía (existente) */}
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
        
        {/* ✅ NUEVO: Estado de testimonios - MEJORADO */}
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
      
      {/* 🚨 ALERTAS IMPORTANTES (existentes + nueva para testimonios) */}
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
      
      {/* ✅ NUEVA: Alerta para testimonios - ACTUALIZADA */}
      {canSubmitTestimonial && (
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
      
      {/* 📋 CONTENIDO PRINCIPAL - ✅ CON TESTIMONIOS MEJORADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🎫 MI MEMBRESÍA (existente) */}
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
        
        {/* ✅ NUEVA: MI TESTIMONIO - Resumen MEJORADO */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Mis Testimonios
              {/* ✅ NUEVO: Contador */}
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
              
              {/* ✅ NUEVO: Estadísticas rápidas */}
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
              
              {/* ✅ MOSTRAR LOS 2 TESTIMONIOS MÁS RECIENTES */}
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
                      {/* ✅ NUEVO: Indicador de más reciente */}
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
              
              {/* ✅ NUEVO: Indicador de más testimonios */}
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
              >
                <Plus className="w-4 h-4 mr-2" />
                Escribir testimonio
              </button>
            </div>
          )}
        </div>
        
      </div>
      
      {/* 📅 HORARIOS (existente) */}
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
      
      {/* 💰 HISTORIAL DE PAGOS (existente) */}
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
      
      {/* 🎯 ACCIONES RÁPIDAS - ✅ CON TESTIMONIOS MEJORADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 🔄 Renovar membresía (existente) */}
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
        
        {/* 🛒 Ir a la tienda (existente) */}
        <Link
          to="/store"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Tienda
              </h4>
              <p className="text-xs text-gray-600">
                Productos y suplementos
              </p>
            </div>
          </div>
        </Link>
        
        {/* ✅ NUEVO: Mis testimonios - ACTUALIZADA */}
        <button
          onClick={() => setActiveSection('testimonials')}
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow text-left"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Mis testimonios
                {/* ✅ NUEVO: Mostrar contador */}
                {userTestimonials.length > 0 && (
                  <span className="ml-1 text-xs text-gray-500">({userTestimonials.length})</span>
                )}
              </h4>
              <p className="text-xs text-gray-600">
                {publishedCount > 0 && pendingCount > 0 ? 
                  `${publishedCount} publicados, ${pendingCount} en revisión` :
                publishedCount > 0 ? 
                  `${publishedCount} publicado${publishedCount !== 1 ? 's' : ''}` :
                pendingCount > 0 ? 
                  `${pendingCount} en revisión` :
                'Escribir experiencia'}
              </p>
            </div>
          </div>
        </button>
        
        {/* 📤 Subir comprobante (existente) */}
        <Link
          to="/dashboard/payments/upload-proof"
          className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-600" />
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
        
        {/* 👤 Editar perfil (existente) */}
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
        
      </div>
      
      {/* 💡 CONSEJOS Y MOTIVACIÓN (existente) */}
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