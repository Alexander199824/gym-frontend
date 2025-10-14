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
            onTouchStart={interactive ? () => setHoverRating(star) : undefined}
            onTouchEnd={interactive ? () => setHoverRating(0) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 active:scale-125' : 'cursor-default'} transition-all touch-manipulation`}
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
    <div className={`space-y-4 ${isMobile ? 'pb-6' : 'space-y-6'}`}>
      
      {/* ENCABEZADO - SIN BOTÓN */}
      <div>
        <h3 className={`font-semibold text-gray-900 flex items-center ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <MessageSquare className={`mr-2 text-blue-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          Mis Reseñas
          {userTestimonials.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              {userTestimonials.length}
            </span>
          )}
        </h3>
        <p className={`text-gray-600 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {userTestimonials.length === 0 ? 
            "Comparte tu experiencia en el gimnasio o sobre la página web" :
            `Has compartido ${userTestimonials.length} reseña${userTestimonials.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>
      
      {/* MENSAJE DE AGRADECIMIENTO */}
      {userTestimonials.length > 0 && (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-start">
            <ThumbsUp className={`text-blue-600 mt-0.5 mr-2 flex-shrink-0 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <div>
              <h4 className={`font-medium text-blue-900 ${isMobile ? 'text-xs mb-0.5' : 'text-sm mb-1'}`}>
                ¡Gracias por tu opinion!
              </h4>
              <p className={`text-blue-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Tu opinión nos ayuda a mejorar constantemente nuestros servicios.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* LISTA DE Reseñas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {testimonialsLoading ? (
          <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <Loader className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Cargando...</span>
          </div>
        ) : userTestimonials.length === 0 ? (
          <div className={`text-center ${isMobile ? 'py-8 px-4' : 'py-12'}`}>
            <MessageSquare className={`text-gray-400 mx-auto mb-3 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`} />
            <h3 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
              No tienes reseñas aún
            </h3>
            <p className={`text-gray-600 mb-4 ${isMobile ? 'text-xs px-4' : 'text-sm'}`}>
              Comparte tu experiencia en el gimnasio o tu opinión sobre la página web
            </p>
            {/* ✅ ÚNICO BOTÓN - CENTRADO Y COMPACTO */}
            <button 
              onClick={() => setShowCreateForm(true)}
              className={`btn-primary inline-flex items-center ${isMobile ? 'text-sm px-4' : 'px-6'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Escribir Reseña
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userTestimonials.map((testimonial, index) => {
              return (
                <div key={testimonial.id} className={isMobile ? 'p-3' : 'p-6'}>
                  
                  {/* Indicador de más reciente */}
                  {index === 0 && userTestimonials.length > 1 && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        Reciente
                      </span>
                    </div>
                  )}
                  
                  {/* Header del Reseña */}
                  <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className={`bg-blue-100 rounded-full flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                          <MessageSquare className={`text-blue-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        </div>
                      </div>
                      
                      <div>
                        <div className={`flex items-center space-x-2 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                          <span className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            Reseña #{testimonial.id}
                          </span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <Calendar className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                          <span>{formatDate(testimonial.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido del Reseña */}
                  <div className={isMobile ? 'mb-2' : 'mb-4'}>
                    <p className={`text-gray-800 leading-relaxed mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      "{testimonial.text}"
                    </p>
                    
                    <div className={`flex flex-col gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {/* Calificación */}
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Calificación:</span>
                        {renderStars(testimonial.rating, false, isMobile ? 'w-4 h-4' : 'w-5 h-5')}
                        <span className="font-medium text-gray-900">
                          ({testimonial.rating}/5)
                        </span>
                      </div>
                      
                      {/* Rol */}
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Como:</span>
                        <span className="font-medium text-gray-900">
                          {testimonial.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mensaje de agradecimiento individual */}
                  <div className={`bg-green-50 border border-green-200 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`flex items-center text-green-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <CheckCircle className={`mr-2 flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>¡Gracias por compartir tu experiencia!</span>
                    </div>
                  </div>
                  
                </div>
              );
            })}
            
            {/* ✅ BOTÓN SUTIL AL FINAL - MÁS PEQUEÑO Y DISCRETO */}
            <div className={`bg-gray-50 text-center ${isMobile ? 'p-3' : 'p-4'}`}>
              <button
                onClick={() => setShowCreateForm(true)}
                className={`text-primary-600 hover:text-primary-700 font-medium inline-flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                <Plus className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                Agregar otra reseña
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* MODAL PARA CREAR Reseña */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
          <div className={`bg-white rounded-lg shadow-xl w-full ${isMobile ? 'max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            
            {/* Header del modal */}
            <div className={`border-b border-gray-200 sticky top-0 bg-white z-10 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-medium text-gray-900 flex items-center ${isMobile ? 'text-base' : 'text-lg'}`}>
                  <MessageSquare className={`text-blue-600 mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  {userTestimonials.length === 0 ? 'Escribir Reseña' : 'Agregar Reseña'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <form onSubmit={handleSubmit} className={isMobile ? 'px-4 py-3' : 'px-6 py-4'}>
              
              {/* Mensaje introductorio */}
              <div className={`bg-blue-50 border border-blue-200 rounded-lg mb-4 ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className="flex items-start">
                  <Info className={`text-blue-600 mt-0.5 mr-2 flex-shrink-0 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <div>
                    <h4 className={`font-medium text-blue-900 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Comparte tu experiencia
                    </h4>
                    <p className={`text-blue-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Tu opinión ayuda a otros miembros y nos ayuda a mejorar.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
                
                {/* Reseña */}
                <div>
                  <label className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Tu Reseña *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => handleFormChange('text', e.target.value)}
                    rows={isMobile ? 3 : 4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      fieldErrors.text ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${isMobile ? 'text-sm' : ''}`}
                    placeholder="Comparte tu experiencia..."
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {fieldErrors.text && (
                        <p className={`text-red-600 flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <AlertCircle className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          {fieldErrors.text}
                        </p>
                      )}
                    </div>
                    <span className={`${
                      formData.text.length > 450 ? 'text-red-600' : 'text-gray-500'
                    } ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {formData.text.length}/500
                    </span>
                  </div>
                </div>
                
                {/* Calificación */}
                <div>
                  <label className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Calificación *
                  </label>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                    {renderStars(formData.rating, true, isMobile ? 'w-7 h-7' : 'w-8 h-8')}
                    <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {formData.rating > 0 && (
                        <>
                          {formData.rating}/5 - {
                            formData.rating === 5 ? 'Excelente' :
                            formData.rating === 4 ? 'Muy Bueno' :
                            formData.rating === 3 ? 'Bueno' :
                            formData.rating === 2 ? 'Regular' : 'Mejorar'
                          }
                        </>
                      )}
                    </span>
                  </div>
                  {fieldErrors.rating && (
                    <p className={`text-red-600 flex items-center mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <AlertCircle className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      {fieldErrors.rating}
                    </p>
                  )}
                </div>
                
                {/* PROFESIÓN CON BÚSQUEDA */}
                <div className="relative">
                  <label className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Tu Profesión *
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className={`text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </div>
                    <input
                      ref={roleInputRef}
                      type="text"
                      value={roleSearchTerm}
                      onChange={(e) => handleRoleSearch(e.target.value)}
                      onFocus={() => setShowRoleDropdown(true)}
                      placeholder="Ej: Chef, Estudiante..."
                      className={`w-full pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${isMobile ? 'pl-8 text-sm' : 'pl-10'}`}
                      maxLength={50}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className={`text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </div>
                  </div>
                  
                  {fieldErrors.role && (
                    <p className={`text-red-600 flex items-center mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <AlertCircle className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      {fieldErrors.role}
                    </p>
                  )}
                  
                  {/* Dropdown de profesiones */}
                  {showRoleDropdown && (
                    <div 
                      ref={roleDropdownRef}
                      className={`absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-y-auto w-full ${
                        isMobile ? 'max-h-40' : 'max-h-60'
                      }`}
                    >
                      {filteredRoles.length > 0 ? (
                        <ul className="py-1">
                          {filteredRoles.map((role) => {
                            const RoleIcon = role.icon;
                            return (
                              <li
                                key={role.value}
                                onClick={() => handleSelectRole(role.value)}
                                className={`hover:bg-blue-50 cursor-pointer flex items-center space-x-2 transition-colors ${
                                  isMobile ? 'px-3 py-2' : 'px-4 py-2'
                                }`}
                              >
                                <RoleIcon className={`text-gray-500 flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    {role.value}
                                  </div>
                                  {!isMobile && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {role.description}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className={`text-center ${isMobile ? 'px-3 py-4' : 'px-4 py-6'}`}>
                          <User className={`text-gray-400 mx-auto mb-2 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                          <p className={`text-gray-600 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            No encontrado
                          </p>
                          <p className={`text-blue-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            Escribe tu profesión
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    Busca o escribe tu profesión
                  </p>
                </div>
                
                {/* OPCIÓN DE RESEÑA PRIVADA */}
                <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => handleFormChange('isPrivate', e.target.checked)}
                      className="mt-1 mr-2"
                    />
                    <div>
                      <div className={`flex items-center font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Lock className={`mr-2 text-gray-600 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        Reseña privado
                      </div>
                      <p className={`text-gray-600 mt-0.5 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        No será publicado, solo para análisis interno.
                      </p>
                    </div>
                  </label>
                </div>
                
              </div>
            </form>
            
            {/* Footer del modal */}
            <div className={`border-t border-gray-200 flex gap-2 sticky bottom-0 bg-white ${isMobile ? 'px-4 py-3' : 'px-6 py-4 justify-end space-x-3'}`}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className={`btn-secondary ${isMobile ? 'flex-1 text-sm' : ''}`}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`btn-primary flex items-center justify-center ${isMobile ? 'flex-1 text-sm' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* INFORMACIÓN ADICIONAL */}
      {userTestimonials.length === 0 && (
        <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-start">
            <Info className={`text-gray-400 mt-0.5 mr-2 flex-shrink-0 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <div>
              <h4 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                ¿Por qué compartir?
              </h4>
              <div className={`text-gray-600 space-y-0.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p>• Ayuda a otros miembros</p>
                <p>• Motiva a la comunidad</p>
                <p>• Mejora nuestros servicios</p>
                {!isMobile && (
                  <>
                    <p>• Opina sobre la página web</p>
                    <p>• Múltiples reseñas permitidas</p>
                    <p>• Opción de reseña privada</p>
                  </>
                )}
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