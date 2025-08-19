// src/pages/dashboard/components/TestimonialManager.js
// FUNCIÓN: Gestión completa de testimonios para CLIENTES
// CONECTA CON: API de testimonios según documento de especificaciones

import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Star, Send, Eye, CheckCircle, Clock, AlertCircle,
  User, Briefcase, Heart, Trophy, Target, Users, Coffee, Book,
  Loader, X, Plus, Info, Calendar, ThumbsUp, Edit3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const TestimonialManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  const queryClient = useQueryClient();
  
  // 📊 Estados principales
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 📝 Estados del formulario
  const [formData, setFormData] = useState({
    text: '',
    rating: 0,
    role: ''
  });
  
  // ⚠️ Estados de validación
  const [fieldErrors, setFieldErrors] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  
  // 🎯 Roles profesionales disponibles
  const professionalRoles = [
    { value: 'Estudiante', icon: Book, description: 'Estudiante universitario o escolar' },
    { value: 'Profesional', icon: Briefcase, description: 'Profesional en activo' },
    { value: 'Empresario', icon: Target, description: 'Dueño de negocio o emprendedor' },
    { value: 'Médico', icon: Heart, description: 'Profesional de la salud' },
    { value: 'Ingeniero', icon: Users, description: 'Ingeniero o técnico' },
    { value: 'Profesor', icon: Book, description: 'Educador o académico' },
    { value: 'Deportista', icon: Trophy, description: 'Atleta o deportista' },
    { value: 'Freelancer', icon: Coffee, description: 'Trabajador independiente' },
    { value: 'Ejecutivo', icon: Briefcase, description: 'Ejecutivo o gerente' },
    { value: 'Artista', icon: Star, description: 'Artista o creativo' },
    { value: 'Ama de Casa', icon: Heart, description: 'Dedicada al hogar' },
    { value: 'Jubilado', icon: User, description: 'Persona jubilada' },
    { value: 'Otro', icon: User, description: 'Otra profesión' }
  ];
  
  // 🔄 QUERY: Obtener mis testimonios
  const { 
    data: testimonials, 
    isLoading: testimonialsLoading,
    error: testimonialsError,
    refetch: refetchTestimonials
  } = useQuery({
    queryKey: ['myTestimonials', user?.id],
    queryFn: () => apiService.getMyTestimonials(),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('❌ Error loading testimonials:', error);
      if (error.response?.status !== 404) {
        showError('Error al cargar tus testimonios');
      }
    }
  });
  
  // 🆕 MUTATION: Crear testimonio
  const createTestimonialMutation = useMutation({
    mutationFn: (testimonialData) => apiService.createTestimonial(testimonialData),
    onSuccess: (response) => {
      console.log('✅ Testimonio creado exitosamente:', response);
      
      // Mostrar mensaje personalizado del backend
      if (response.data?.thankYouMessage) {
        showSuccess(response.data.thankYouMessage);
      } else {
        showSuccess(response.message || '¡Testimonio enviado exitosamente!');
      }
      
      // Limpiar formulario y cerrar modal
      resetForm();
      setShowCreateForm(false);
      
      // Refrescar datos
      refetchTestimonials();
      queryClient.invalidateQueries(['myTestimonials']);
      
      if (onSave) {
        onSave({ type: 'testimonial', action: 'created' });
      }
    },
    onError: (error) => {
      console.error('❌ Error creando testimonio:', error);
      
      if (error.response?.status === 400) {
        // Usuario ya tiene testimonio
        const message = error.response.data?.message || 'Ya has compartido tu experiencia con nosotros';
        showError(message);
        
        // Mostrar mensaje de agradecimiento si está disponible
        if (error.response.data?.data?.thankYouMessage) {
          setTimeout(() => {
            showSuccess(error.response.data.data.thankYouMessage);
          }, 2000);
        }
        
        // Cerrar formulario y refrescar datos
        setShowCreateForm(false);
        refetchTestimonials();
      } else if (error.response?.status === 422) {
        // Errores de validación
        const errors = error.response.data?.errors || {};
        setFieldErrors(errors);
        showError('Por favor corrige los errores en el formulario');
      } else {
        const errorMsg = error.response?.data?.message || 'Error al enviar testimonio';
        showError(errorMsg);
      }
    }
  });
  
  // 📊 Procesar datos de testimonios
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitNew = testimonialData.canSubmitNew !== false;
  const hasActiveTestimonial = testimonialData.hasActiveTestimonial || false;
  const hasPendingTestimonial = testimonialData.hasPendingTestimonial || false;
  const thankYouMessage = testimonialData.thankYouMessage;
  
  // 🔧 FUNCIONES HELPER
  
  // Validar testimonio
  const validateTestimonial = () => {
    const errors = {};
    
    if (!formData.text.trim()) {
      errors.text = 'El testimonio es obligatorio';
    } else if (formData.text.trim().length < 10) {
      errors.text = 'El testimonio debe tener al menos 10 caracteres';
    } else if (formData.text.length > 500) {
      errors.text = 'El testimonio no puede superar los 500 caracteres';
    }
    
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Debes seleccionar una calificación del 1 al 5';
    }
    
    if (!formData.role.trim()) {
      errors.role = 'Por favor selecciona tu profesión';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      text: '',
      rating: 0,
      role: ''
    });
    setFieldErrors({});
    setHoverRating(0);
    if (onUnsavedChanges) {
      onUnsavedChanges(false);
    }
  };
  
  // Manejar cambio en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (onUnsavedChanges) {
      onUnsavedChanges(true);
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTestimonial()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createTestimonialMutation.mutateAsync({
        text: formData.text.trim(),
        rating: parseInt(formData.rating),
        role: formData.role.trim()
      });
    } catch (error) {
      // El error ya se maneja en la mutation
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'Publicado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendiente de aprobación':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'No público - Guardado para análisis':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Obtener icono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Publicado':
        return CheckCircle;
      case 'Pendiente de aprobación':
        return Clock;
      case 'No público - Guardado para análisis':
        return Eye;
      default:
        return AlertCircle;
    }
  };
  
  // Renderizar estrellas
  const renderStars = (rating, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => handleFormChange('rating', star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all`}
            disabled={!interactive}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || formData.rating) : rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
            Mis Testimonios
          </h3>
          <p className="text-gray-600 mt-1">
            Comparte tu experiencia en el gimnasio para ayudar a otros miembros
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* Mostrar estado general */}
          {hasActiveTestimonial && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Testimonio Publicado
            </span>
          )}
          
          {hasPendingTestimonial && !hasActiveTestimonial && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              En Revisión
            </span>
          )}
          
          {canSubmitNew && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Escribir Testimonio
            </button>
          )}
        </div>
      </div>
      
      {/* 💬 MENSAJE DE AGRADECIMIENTO */}
      {thankYouMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ThumbsUp className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                ¡Gracias por tu participación!
              </h4>
              <p className="text-sm text-blue-800">
                {thankYouMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 📋 LISTA DE TESTIMONIOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {testimonialsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando tus testimonios...</span>
          </div>
        ) : userTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes testimonios aún
            </h3>
            <p className="text-gray-600 mb-4">
              Comparte tu experiencia en el gimnasio para ayudar a otros miembros
            </p>
            {canSubmitNew && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Escribir mi Primer Testimonio
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userTestimonials.map((testimonial) => {
              const StatusIcon = getStatusIcon(testimonial.status);
              
              return (
                <div key={testimonial.id} className="p-6">
                  
                  {/* Header del testimonio */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            Testimonio #{testimonial.id}
                          </span>
                          {testimonial.featured && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Destacado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Enviado el {formatDate(testimonial.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Estado */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(testimonial.status)}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {testimonial.status}
                    </span>
                  </div>
                  
                  {/* Contenido del testimonio */}
                  <div className="mb-4">
                    <p className="text-gray-800 text-base leading-relaxed mb-3">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Calificación */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Calificación:</span>
                          {renderStars(testimonial.rating)}
                          <span className="text-sm font-medium text-gray-900">
                            ({testimonial.rating}/5)
                          </span>
                        </div>
                        
                        {/* Rol */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Como:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {testimonial.role}
                          </span>
                        </div>
                      </div>
                      
                      {/* Fecha de publicación */}
                      {testimonial.publishedAt && (
                        <div className="text-sm text-gray-500">
                          Publicado el {formatDate(testimonial.publishedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Información adicional según estado */}
                  {testimonial.status === 'Publicado' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Tu testimonio está publicado y visible para otros usuarios
                      </div>
                    </div>
                  )}
                  
                  {testimonial.status === 'Pendiente de aprobación' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center text-sm text-yellow-800">
                        <Clock className="w-4 h-4 mr-2" />
                        Tu testimonio está siendo revisado por nuestro equipo
                      </div>
                    </div>
                  )}
                  
                  {testimonial.status === 'No público - Guardado para análisis' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center text-sm text-blue-800">
                        <Eye className="w-4 h-4 mr-2" />
                        Tu opinión es muy valiosa y la usamos para mejorar nuestros servicios
                      </div>
                    </div>
                  )}
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* 🆕 MODAL PARA CREAR TESTIMONIO */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Escribir Testimonio
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <form onSubmit={handleSubmit} className="px-6 py-4">
              
              {/* Mensaje introductorio */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Comparte tu experiencia
                    </h4>
                    <p className="text-sm text-blue-800">
                      Tu testimonio ayudará a otros miembros a conocer los beneficios de nuestro gimnasio. 
                      Será revisado por nuestro equipo antes de ser publicado.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                
                {/* Testimonio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Testimonio *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => handleFormChange('text', e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      fieldErrors.text ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Comparte tu experiencia en el gimnasio... ¿Cómo te ha ayudado? ¿Qué es lo que más te gusta?"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {fieldErrors.text && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {fieldErrors.text}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs ${
                      formData.text.length > 450 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {formData.text.length}/500
                    </span>
                  </div>
                </div>
                
                {/* Calificación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación General *
                  </label>
                  <div className="flex items-center space-x-4">
                    {renderStars(formData.rating, true, 'w-8 h-8')}
                    <span className="text-sm text-gray-600">
                      {formData.rating > 0 && (
                        <>
                          {formData.rating}/5 - {
                            formData.rating === 5 ? 'Excelente' :
                            formData.rating === 4 ? 'Muy Bueno' :
                            formData.rating === 3 ? 'Bueno' :
                            formData.rating === 2 ? 'Regular' : 'Necesita Mejorar'
                          }
                        </>
                      )}
                    </span>
                  </div>
                  {fieldErrors.rating && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.rating}
                    </p>
                  )}
                </div>
                
                {/* Profesión/Rol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Profesión *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona tu profesión</option>
                    {professionalRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.value} - {role.description}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.role && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.role}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Esto ayuda a otros usuarios a identificarse con tu experiencia
                  </p>
                </div>
                
              </div>
            </form>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Testimonio
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* 💡 INFORMACIÓN ADICIONAL */}
      {!hasActiveTestimonial && !hasPendingTestimonial && canSubmitNew && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                ¿Por qué compartir tu testimonio?
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Ayuda a otros miembros a conocer los beneficios del gimnasio</p>
                <p>• Tu experiencia puede motivar a otros a alcanzar sus objetivos</p>
                <p>• Contribuyes a mejorar la comunidad del gimnasio</p>
                <p>• Todos los testimonios son revisados antes de ser publicados</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TestimonialManager;