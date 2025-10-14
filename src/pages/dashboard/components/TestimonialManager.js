// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/TestimonialManager.js

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Star, Send, Eye, CheckCircle, Clock, AlertCircle,
  User, Briefcase, Heart, Trophy, Target, Users, Coffee, Book,
  Loader, X, Plus, Info, Calendar, ThumbsUp, Edit3, Lock, Search, ChevronDown, Shield
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const TestimonialManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  const queryClient = useQueryClient();
  
  // Estados principales
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    text: '',
    rating: 0,
    role: '',
    isPrivate: false
  });
  
  // Estados para búsqueda de profesión
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const roleInputRef = useRef(null);
  const roleDropdownRef = useRef(null);
  
  // Estados de validación
  const [fieldErrors, setFieldErrors] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  
  // Roles profesionales disponibles
  const professionalRoles = [
    { value: 'Estudiante', icon: Book, description: 'Estudiante universitario o escolar' },
    { value: 'Profesional', icon: Briefcase, description: 'Profesional en activo' },
    { value: 'Empresario', icon: Target, description: 'Dueño de negocio o emprendedor' },
    { value: 'Médico', icon: Heart, description: 'Profesional de la salud' },
    { value: 'Enfermero/a', icon: Heart, description: 'Profesional de enfermería' },
    { value: 'Ingeniero', icon: Users, description: 'Ingeniero o técnico' },
    { value: 'Arquitecto', icon: Target, description: 'Arquitecto o diseñador' },
    { value: 'Abogado', icon: Briefcase, description: 'Profesional del derecho' },
    { value: 'Contador', icon: Briefcase, description: 'Contador o auditor' },
    { value: 'Profesor', icon: Book, description: 'Educador o académico' },
    { value: 'Deportista', icon: Trophy, description: 'Atleta o deportista' },
    { value: 'Freelancer', icon: Coffee, description: 'Trabajador independiente' },
    { value: 'Ejecutivo', icon: Briefcase, description: 'Ejecutivo o gerente' },
    { value: 'Artista', icon: Star, description: 'Artista o creativo' },
    { value: 'Diseñador', icon: Star, description: 'Diseñador gráfico o web' },
    { value: 'Programador', icon: Coffee, description: 'Desarrollador de software' },
    { value: 'Ama de Casa', icon: Heart, description: 'Dedicada al hogar' },
    { value: 'Agricultor', icon: Target, description: 'Trabajador agrícola' },
    { value: 'Comerciante', icon: Users, description: 'Comerciante o vendedor' },
    { value: 'Chef', icon: Coffee, description: 'Chef o cocinero profesional' },
    { value: 'Mecánico', icon: Target, description: 'Mecánico o técnico automotriz' },
    { value: 'Electricista', icon: Target, description: 'Electricista profesional' },
    { value: 'Plomero', icon: Target, description: 'Plomero o fontanero' },
    { value: 'Carpintero', icon: Target, description: 'Carpintero o ebanista' },
    { value: 'Conductor', icon: Users, description: 'Conductor o chofer profesional' },
    { value: 'Policía', icon: Shield, description: 'Oficial de policía' },
    { value: 'Bombero', icon: Shield, description: 'Bombero profesional' },
    { value: 'Militar', icon: Shield, description: 'Personal militar' },
    { value: 'Psicólogo', icon: Heart, description: 'Psicólogo o terapeuta' },
    { value: 'Fisioterapeuta', icon: Heart, description: 'Fisioterapeuta profesional' },
    { value: 'Nutricionista', icon: Heart, description: 'Nutricionista o dietista' },
    { value: 'Veterinario', icon: Heart, description: 'Médico veterinario' },
    { value: 'Farmacéutico', icon: Heart, description: 'Farmacéutico profesional' },
    { value: 'Periodista', icon: Book, description: 'Periodista o reportero' },
    { value: 'Fotógrafo', icon: Star, description: 'Fotógrafo profesional' },
    { value: 'Músico', icon: Star, description: 'Músico o intérprete' },
    { value: 'Peluquero/a', icon: Star, description: 'Estilista o peluquero' },
    { value: 'Barbero', icon: Star, description: 'Barbero profesional' },
    { value: 'Mesero/a', icon: Coffee, description: 'Mesero o camarero' },
    { value: 'Guardia de Seguridad', icon: Shield, description: 'Guardia o vigilante' },
    { value: 'Secretario/a', icon: Briefcase, description: 'Asistente administrativo' },
    { value: 'Recepcionista', icon: User, description: 'Recepcionista profesional' },
    { value: 'Obrero', icon: Target, description: 'Obrero o trabajador manual' },
    { value: 'Jubilado', icon: User, description: 'Persona jubilada' },
    { value: 'Desempleado', icon: User, description: 'Actualmente sin empleo' },
    { value: 'Otro', icon: User, description: 'Otra profesión' }
  ];
  
  // QUERY: Obtener mis Reseñas
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
      console.error('Error al cargar Reseñas:', error);
      if (error.response?.status !== 404) {
        showError('Error al cargar tus Reseñas');
      }
    }
  });
  
  // MUTATION: Crear Reseña
  const createTestimonialMutation = useMutation({
    mutationFn: (testimonialData) => {
      const dataToSend = { ...testimonialData };
      if (formData.isPrivate) {
        dataToSend.text = `[RESEÑA PRIVADA - NO PUBLICAR] ${testimonialData.text}`;
      }
      return apiService.createTestimonial(dataToSend);
    },
    onSuccess: (response) => {
      console.log('Reseña creado exitosamente:', response);
      
      if (response.data?.thankYouMessage) {
        showSuccess(response.data.thankYouMessage);
      } else {
        showSuccess(response.message || 'Reseña enviado exitosamente!');
      }
      
      resetForm();
      setShowCreateForm(false);
      
      refetchTestimonials();
      queryClient.invalidateQueries(['myTestimonials']);
      
      if (onSave) {
        onSave({ type: 'testimonial', action: 'created' });
      }
    },
    onError: (error) => {
      console.error('Error al crear Reseña:', error);
      
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Error al crear Reseña';
        showError(message);
        
        if (error.response.data?.data?.thankYouMessage) {
          setTimeout(() => {
            showSuccess(error.response.data.data.thankYouMessage);
          }, 2000);
        }
        
        setShowCreateForm(false);
        refetchTestimonials();
      } else if (error.response?.status === 422) {
        const errors = error.response.data?.errors || {};
        setFieldErrors(errors);
        showError('Por favor corrige los errores en el formulario');
      } else {
        const errorMsg = error.response?.data?.message || 'Error al enviar Reseña';
        showError(errorMsg);
      }
    }
  });
  
  // Procesar datos de Reseñas
  const testimonialData = testimonials?.data || {};
  const userTestimonials = testimonialData.testimonials || [];
  const canSubmitNew = testimonialData.canSubmitNew !== false;
  const publishedCount = testimonialData.publishedCount || 0;
  const pendingCount = testimonialData.pendingCount || 0;
  const thankYouMessage = testimonialData.thankYouMessage;
  
  // Efecto para filtrar profesiones
  useEffect(() => {
    if (roleSearchTerm.trim() === '') {
      setFilteredRoles(professionalRoles);
    } else {
      const searchLower = roleSearchTerm.toLowerCase();
      const filtered = professionalRoles.filter(role => 
        role.value.toLowerCase().includes(searchLower) ||
        role.description.toLowerCase().includes(searchLower)
      );
      setFilteredRoles(filtered);
    }
  }, [roleSearchTerm]);
  
  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target) &&
          roleInputRef.current && !roleInputRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // FUNCIONES HELPER
  
  // Validar Reseña
  const validateTestimonial = () => {
    const errors = {};
    
    if (!formData.text.trim()) {
      errors.text = 'El Reseña es obligatorio';
    } else if (formData.text.trim().length < 10) {
      errors.text = 'El Reseña debe tener al menos 10 caracteres';
    } else if (formData.text.length > 500) {
      errors.text = 'El Reseña no puede superar los 500 caracteres';
    }
    
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'Debes seleccionar una calificación del 1 al 5';
    }
    
    if (!formData.role.trim() && !roleSearchTerm.trim()) {
      errors.role = 'Por favor ingresa o selecciona tu profesión';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      text: '',
      rating: 0,
      role: '',
      isPrivate: false
    });
    setRoleSearchTerm('');
    setShowRoleDropdown(false);
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
  
  // Manejar búsqueda de profesión
  const handleRoleSearch = (value) => {
    setRoleSearchTerm(value);
    setShowRoleDropdown(true);
    handleFormChange('role', value);
  };
  
  // Seleccionar profesión del dropdown
  const handleSelectRole = (roleValue) => {
    setRoleSearchTerm(roleValue);
    handleFormChange('role', roleValue);
    setShowRoleDropdown(false);
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
      const finalRole = formData.role.trim() || roleSearchTerm.trim();
      
      await createTestimonialMutation.mutateAsync({
        text: formData.text.trim(),
        rating: parseInt(formData.rating),
        role: finalRole
      });
    } catch (error) {
      // El error ya se maneja en la mutation
    } finally {
      setIsSubmitting(false);
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
      
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
            Mis Reseñas
            {userTestimonials.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {userTestimonials.length}
              </span>
            )}
          </h3>
          <p className="text-gray-600 mt-1">
            {userTestimonials.length === 0 ? 
              "Comparte tu experiencia en el gimnasio, sobre la página web o sugerencias para ayudar a otros miembros" :
              `Tienes ${userTestimonials.length} Reseña${userTestimonials.length !== 1 ? 's' : ''} compartida${userTestimonials.length !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {userTestimonials.length === 0 ? 'Escribir Reseña' : 'Agregar Otro Reseña'}
          </button>
        </div>
      </div>
      
      {/* MENSAJE DE AGRADECIMIENTO */}
      {userTestimonials.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ThumbsUp className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                ¡Gracias por tu valiosa información!
              </h4>
              <p className="text-sm text-blue-800">
                Tu opinión es muy importante para nosotros y nos ayuda a mejorar constantemente nuestros servicios.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Recuerda que puedes agregar más reseñas sobre diferentes aspectos del gimnasio o la página web.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* LISTA DE Reseñas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {testimonialsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando tus Reseñas...</span>
          </div>
        ) : userTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes Reseñas aún
            </h3>
            <p className="text-gray-600 mb-4">
              Comparte tu experiencia en el gimnasio, sobre la página web o sugerencias para ayudar a otros miembros
            </p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Escribir mi Primer Reseña
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userTestimonials.map((testimonial, index) => {
              return (
                <div key={testimonial.id} className="p-6">
                  
                  {/* Indicador de más reciente */}
                  {index === 0 && userTestimonials.length > 1 && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        Más reciente
                      </span>
                    </div>
                  )}
                  
                  {/* Header del Reseña */}
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
                            Reseña #{testimonial.id}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Enviado el {formatDate(testimonial.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido del Reseña */}
                  <div className="mb-4">
                    <p className="text-gray-800 text-base leading-relaxed mb-3">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="flex items-center justify-between flex-wrap gap-3">
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
                    </div>
                  </div>
                  
                  {/* Mensaje de agradecimiento individual */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center text-sm text-green-800">
                      <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>¡Gracias por compartir tu experiencia! Tu opinión es muy valiosa para nosotros.</span>
                    </div>
                  </div>
                  
                </div>
              );
            })}
            
            {/* Botón para agregar más al final */}
            <div className="p-6 bg-gray-50 text-center">
              <p className="text-gray-600 mb-3">
                ¿Tienes más experiencias que compartir sobre el gimnasio o la página web?
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Otro Reseña
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* MODAL PARA CREAR Reseña */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  {userTestimonials.length === 0 ? 'Escribir Reseña' : 'Agregar Otro Reseña'}
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
                      {userTestimonials.length === 0 ? 
                        'Comparte tu experiencia' :
                        'Comparte otra experiencia'
                      }
                    </h4>
                    <p className="text-sm text-blue-800">
                      {userTestimonials.length === 0 ? 
                        'Tu Reseña ayudará a otros miembros a conocer los beneficios de nuestro gimnasio. También puedes compartir tu opinión sobre la página web, si te gusta su diseño o qué le agregarías.' :
                        'Puedes compartir diferentes aspectos de tu experiencia en el gimnasio (entrenamientos, instalaciones, ambiente, etc.) o tu opinión sobre la página web.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                
                {/* Reseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Reseña *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => handleFormChange('text', e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      fieldErrors.text ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={userTestimonials.length === 0 ? 
                      "Comparte tu experiencia en el gimnasio, qué te parece la página web (si está bonita, qué le agregarías), sugerencias... ¿Cómo te ha ayudado? ¿Qué es lo que más te gusta?" :
                      "Comparte otro aspecto de tu experiencia... ¿Qué más te gusta del gimnasio o la página web? ¿Alguna mejora que hayas notado?"
                    }
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
                
                {/* PROFESIÓN CON BÚSQUEDA */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Profesión *
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      ref={roleInputRef}
                      type="text"
                      value={roleSearchTerm}
                      onChange={(e) => handleRoleSearch(e.target.value)}
                      onFocus={() => setShowRoleDropdown(true)}
                      placeholder="Busca o escribe tu profesión (ej: Chef, Mecánico, Estudiante...)"
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      maxLength={50}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {fieldErrors.role && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.role}
                    </p>
                  )}
                  
                  {/* Dropdown de profesiones */}
                  {showRoleDropdown && (
                    <div 
                      ref={roleDropdownRef}
                      className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto w-full"
                    >
                      {filteredRoles.length > 0 ? (
                        <ul className="py-1">
                          {filteredRoles.map((role) => {
                            const RoleIcon = role.icon;
                            return (
                              <li
                                key={role.value}
                                onClick={() => handleSelectRole(role.value)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center space-x-3 transition-colors"
                              >
                                <RoleIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {role.value}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {role.description}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            No se encontró "{roleSearchTerm}" en la lista
                          </p>
                          <p className="text-xs text-blue-600">
                            ✏️ Puedes escribir tu propia profesión o seleccionar "Otro"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Escribe para buscar o seleccionar de la lista. Si no encuentras tu profesión, puedes escribirla directamente
                  </p>
                </div>
                
                {/* OPCIÓN DE RESEÑA PRIVADA */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => handleFormChange('isPrivate', e.target.checked)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Lock className="w-4 h-4 mr-2 text-gray-600" />
                        Marcar como Reseña privado
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Si activas esta opción, tu Reseña será enviado como privado y NO será publicado. 
                        Solo el equipo del gimnasio lo verá para análisis interno y mejoras.
                      </p>
                    </div>
                  </label>
                </div>
                
              </div>
            </form>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
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
                    Enviar Reseña
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* INFORMACIÓN ADICIONAL */}
      {userTestimonials.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                ¿Por qué compartir tu Reseña?
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Ayuda a otros miembros a conocer los beneficios del gimnasio</p>
                <p>• Tu experiencia puede motivar a otros a alcanzar sus objetivos</p>
                <p>• Puedes compartir tu opinión sobre la página web (diseño, funcionalidad, mejoras)</p>
                <p>• Contribuyes a mejorar la comunidad del gimnasio</p>
                <p>• Puedes agregar múltiples Reseñas sobre diferentes aspectos</p>
                <p>• Si prefieres que tu Reseña sea privado, puedes marcarlo como tal</p>
                <p>• Los Reseñas Privados solo se usaran para mejoras de nuestros servicios</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TestimonialManager;
/*
 * COMPONENTE: TestimonialManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente permite a los clientes del gimnasio gestionar sus Reseñas de experiencia.
 * Los usuarios pueden crear múltiples Reseñas, ver su estado de revisión y seguimiento,
 * y contribuir con diferentes aspectos de su experiencia en el gimnasio.
 * 
 * FUNCIONALIDADES PARA EL USUARIO:
 * 
 * GESTIÓN DE Reseñas MÚLTIPLES:
 * - Crear Reseñas ilimitados sobre diferentes aspectos del gimnasio
 * - Ver todos sus Reseñas en una lista organizada
 * - Seguimiento del estado de cada Reseña (publicado, en revisión, pendiente)
 * - Contador visual de Reseñas totales, publicados y en revisión
 * - Indicador del Reseña más reciente
 * 
 * FORMULARIO DE CREACIÓN:
 * - Campo de texto libre para compartir experiencias (máximo 500 caracteres)
 * - Sistema de calificación con estrellas interactivas (1-5 estrellas)
 * - Selección de profesión/rol para contexto de la experiencia
 * - Validación en tiempo real de todos los campos
 * - Contador de caracteres con alertas visuales
 * 
 * PROFESIONES DISPONIBLES:
 * - Estudiante (universitario o escolar)
 * - Profesional en activo
 * - Empresario/Emprendedor
 * - Médico/Profesional de la salud
 * - Ingeniero/Técnico
 * - Profesor/Educador
 * - Deportista/Atleta
 * - Freelancer/Trabajador independiente
 * - Ejecutivo/Gerente
 * - Artista/Creativo
 * - Ama de Casa
 * - Jubilado
 * - Otra profesión
 * 
 * SISTEMA DE ESTADOS:
 * - "Publicado": Reseña visible públicamente, puede ser destacado
 * - "En revisión": Reseña enviado, esperando aprobación del equipo
 * - "Pendiente de aprobación": En cola para revisión
 * - "No público - Guardado para análisis": Guardado internamente pero no público
 * 
 * EXPERIENCIA DE USUARIO:
 * - Interfaz intuitiva con navegación clara
 * - Feedback visual inmediato con colores y estados
 * - Modal elegante para creación de nuevos Reseñas
 * - Mensajes de agradecimiento personalizados
 * - Indicadores de progreso durante el envío
 * - Vista previa completa antes de enviar
 * 
 * VALIDACIONES Y SEGURIDAD:
 * - Texto mínimo de 10 caracteres, máximo 500
 * - Calificación obligatoria del 1 al 5
 * - Selección obligatoria de profesión
 * - Validación en tiempo real con mensajes descriptivos
 * - Prevención de envíos duplicados
 * - Limpieza automática de espacios en blanco
 * 
 * INFORMACIÓN MOSTRADA AL USUARIO:
 * - Lista completa de sus Reseñas con detalles
 * - Fecha de envío y publicación de cada Reseña
 * - Estado actual con iconos descriptivos
 * - Calificación y profesión asociada
 * - Texto completo del Reseña
 * - Indicador si el Reseña está destacado
 * - Estadísticas personales (total, publicados, en revisión)
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * CONTEXTS:
 * - AuthContext: Para obtener información del usuario autenticado
 * - AppContext: Para notificaciones, formateo de fechas y utilidades
 * 
 * SERVICIOS API:
 * - apiService: Servicio principal para comunicación con el backend
 * 
 * ENDPOINTS CONECTADOS:
 * - apiService.getMyTestimonials(): Obtiene todos los Reseñas del usuario
 * - apiService.createTestimonial(data): Crea un nuevo Reseña
 * 
 * QUERIES Y MUTATIONS (React Query):
 * - Query 'myTestimonials': Gestiona la carga y cache de Reseñas del usuario
 * - Mutation para crear Reseñas con manejo de errores y estados
 * - Invalidación automática de cache tras operaciones exitosas
 * - Retry automático en caso de fallos de conexión
 * 
 * PROPIEDADES RECIBIDAS:
 * - onSave: Función callback al completar operaciones exitosas
 * - onUnsavedChanges: Función callback para notificar cambios sin guardar
 * 
 * ESTRUCTURA DE DATOS:
 * - testimonialData: { testimonials[], canSubmitNew, publishedCount, pendingCount, thankYouMessage }
 * - formData: { text, rating, role }
 * - fieldErrors: Objeto con errores de validación por campo
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState, useEffect) para estado local
 * - React Query (useQuery, useMutation) para gestión de datos del servidor
 * - Lucide React para iconografía moderna y consistente
 * - Tailwind CSS para estilos responsivos y utilities-first
 * - JavaScript ES6+ para validaciones y lógica de componente
 * 
 * BENEFICIOS PARA EL NEGOCIO:
 * - Recopila feedback valioso de clientes sobre diferentes aspectos
 * - Genera contenido auténtico para marketing y promoción
 * - Permite identificar fortalezas y áreas de mejora
 * - Facilita la construcción de comunidad entre miembros
 * - Proporciona Reseñas segmentados por profesión/demografía
 * - Crea base de datos de experiencias para análisis de satisfacción
 * 
 * IMPACTO EN LA COMUNIDAD:
 * - Los Reseñas ayudan a nuevos miembros a tomar decisiones
 * - Fomenta el sentido de pertenencia y comunidad
 * - Motiva a otros usuarios a compartir sus experiencias
 * - Crea un ciclo positivo de retroalimentación
 * - Permite a usuarios identificarse con experiencias similares
 * - Construye confianza y credibilidad del gimnasio
 */