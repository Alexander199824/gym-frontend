// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/TestimonialsAdminManager.js
// FUNCIÓN: Gestión administrativa completa de testimonios/sugerencias
// ✅ VERSIÓN CORREGIDA - USA MÉTODOS CORRECTOS DE apiService

import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Star, Eye, EyeOff, Edit, Trash2, Check, X,
  CheckCircle, Clock, AlertCircle, Search, Filter, RefreshCw,
  Plus, Save, Loader, ThumbsUp, User, Calendar, Award,
  TrendingUp, ChevronUp, ChevronDown, Info
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const TestimonialsAdminManager = ({ onSave, onUnsavedChanges }) => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  
  // Estados principales
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados para modales
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
    imageUrl: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  
  // ================================
  // CARGAR DATOS DEL BACKEND
  // ================================
  
  const loadTestimonials = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      };
      
      // Aplicar filtros
      if (searchTerm) params.search = searchTerm;
      if (filterStatus === 'active') params.isActive = true;
      if (filterStatus === 'inactive') params.isActive = false;
      if (filterStatus === 'pending') params.isActive = false;
      if (filterFeatured === 'featured') params.isFeatured = true;
      if (filterRating > 0) params.minRating = filterRating;
      
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      const response = await apiService.getAllTestimonials(params);
      
      if (response.success && response.data) {
        setTestimonials(response.data);
        setTotalItems(response.pagination?.total || response.data.length);
      }
      
    } catch (error) {
      console.error('Error cargando testimonios:', error);
      showError('Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar al montar y cuando cambien filtros
  useEffect(() => {
    loadTestimonials();
  }, [currentPage, sortBy, sortOrder]);
  
  // ================================
  // FUNCIONES CRUD
  // ================================
  
  // Crear testimonio (admin)
  const handleCreateTestimonial = async () => {
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }
    
    try {
      setSaving(true);
      
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.createTestimonialAdmin(formData);
      
      showSuccess('Testimonio creado exitosamente');
      setShowCreateModal(false);
      resetForm();
      loadTestimonials();
      
      if (onSave) {
        onSave({ type: 'testimonial', action: 'created' });
      }
      
    } catch (error) {
      console.error('Error creando testimonio:', error);
      showError(error.response?.data?.message || 'Error al crear testimonio');
    } finally {
      setSaving(false);
    }
  };
  
  // Actualizar testimonio
  const handleUpdateTestimonial = async () => {
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }
    
    try {
      setSaving(true);
      
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.updateTestimonial(selectedTestimonial.id, {
        name: formData.name,
        role: formData.role,
        text: formData.text,
        rating: formData.rating,
        imageUrl: formData.imageUrl
      });
      
      showSuccess('Testimonio actualizado exitosamente');
      setShowEditModal(false);
      setSelectedTestimonial(null);
      resetForm();
      loadTestimonials();
      
      if (onSave) {
        onSave({ type: 'testimonial', action: 'updated' });
      }
      
    } catch (error) {
      console.error('Error actualizando testimonio:', error);
      showError(error.response?.data?.message || 'Error al actualizar testimonio');
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar testimonio
  const handleDeleteTestimonial = async (testimonialId) => {
    if (!window.confirm('¿Estás seguro de eliminar este testimonio? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.deleteTestimonial(testimonialId);
      
      showSuccess('Testimonio eliminado exitosamente');
      loadTestimonials();
      
    } catch (error) {
      console.error('Error eliminando testimonio:', error);
      showError('Error al eliminar testimonio');
    }
  };
  
  // Aprobar testimonio
  const handleApproveTestimonial = async () => {
    if (!selectedTestimonial) return;
    
    try {
      setSaving(true);
      
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.approveTestimonial(selectedTestimonial.id, {
        featured: formData.isFeatured,
        displayOrder: formData.displayOrder
      });
      
      showSuccess('Testimonio aprobado y publicado exitosamente');
      setShowApproveModal(false);
      setSelectedTestimonial(null);
      resetForm();
      loadTestimonials();
      
    } catch (error) {
      console.error('Error aprobando testimonio:', error);
      showError('Error al aprobar testimonio');
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle activo/inactivo
  const handleToggleActive = async (testimonialId) => {
    try {
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.toggleTestimonialActive(testimonialId);
      showSuccess('Estado actualizado');
      loadTestimonials();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showError('Error al cambiar estado');
    }
  };
  
  // Toggle destacado
  const handleToggleFeatured = async (testimonialId) => {
    try {
      // ✅ USAR MÉTODO CORRECTO DEL apiService
      await apiService.toggleTestimonialFeatured(testimonialId);
      showSuccess('Estado de destacado actualizado');
      loadTestimonials();
    } catch (error) {
      console.error('Error cambiando destacado:', error);
      showError('Error al cambiar destacado');
    }
  };
  
  // ================================
  // FUNCIONES HELPER
  // ================================
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    
    if (!formData.role.trim()) {
      errors.role = 'La profesión/rol es obligatoria';
    }
    
    if (!formData.text.trim()) {
      errors.text = 'El texto del testimonio es obligatorio';
    } else if (formData.text.length < 10) {
      errors.text = 'El testimonio debe tener al menos 10 caracteres';
    }
    
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = 'El rating debe estar entre 1 y 5';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      text: '',
      rating: 5,
      isFeatured: false,
      isActive: true,
      displayOrder: 0,
      imageUrl: ''
    });
    setFieldErrors({});
  };
  
  const openEditModal = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      name: testimonial.name || '',
      role: testimonial.role || '',
      text: testimonial.text || '',
      rating: testimonial.rating || 5,
      isFeatured: testimonial.isFeatured || false,
      isActive: testimonial.isActive || false,
      displayOrder: testimonial.displayOrder || 0,
      imageUrl: testimonial.imageUrl || ''
    });
    setShowEditModal(true);
  };
  
  const openApproveModal = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      ...formData,
      isFeatured: false,
      displayOrder: 0
    });
    setShowApproveModal(true);
  };
  
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };
  
  const renderStarsInput = (rating, onChange) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="hover:scale-110 transition-all"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };
  
  const getStatusInfo = (testimonial) => {
    if (testimonial.isActive) {
      return {
        label: 'Publicado',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      };
    } else {
      return {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      };
    }
  };
  
  // Helper para formatear fechas de forma segura
  const safeFormatDate = (date) => {
    if (!date) return 'Sin fecha';
    try {
      return formatDate(date);
    } catch (error) {
      console.warn('Error formateando fecha:', date);
      return 'Fecha inválida';
    }
  };

  // Filtrado local
  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = !searchTerm || 
      (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.text && t.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && t.isActive) ||
      (filterStatus === 'inactive' && !t.isActive) ||
      (filterStatus === 'pending' && !t.isActive);
    
    const matchesFeatured =
      filterFeatured === 'all' ||
      (filterFeatured === 'featured' && t.isFeatured) ||
      (filterFeatured === 'normal' && !t.isFeatured);
    
    const matchesRating = filterRating === 0 || (t.rating && t.rating >= filterRating);
    
    return matchesSearch && matchesStatus && matchesFeatured && matchesRating;
  });
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
            Gestión de Testimonios
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {totalItems}
            </span>
          </h3>
          <p className="text-gray-600 mt-1">
            Administra todos los testimonios y sugerencias de clientes
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => loadTestimonials()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Testimonio
          </button>
        </div>
      </div>
      
      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">✅ Publicados</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="inactive">❌ Inactivos</option>
          </select>
          
          {/* Filtro destacados */}
          <select
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos</option>
            <option value="featured">⭐ Destacados</option>
            <option value="normal">Normal</option>
          </select>
          
          {/* Filtro rating */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">Todos los ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
            <option value="4">⭐⭐⭐⭐ (4+)</option>
            <option value="3">⭐⭐⭐ (3+)</option>
          </select>
          
          {/* Ordenamiento */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt-desc">Más recientes</option>
            <option value="createdAt-asc">Más antiguos</option>
            <option value="rating-desc">Rating mayor</option>
            <option value="rating-asc">Rating menor</option>
            <option value="name-asc">Nombre A-Z</option>
          </select>
          
        </div>
        
        {/* Botón aplicar filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => loadTestimonials()}
            className="btn-primary btn-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </button>
        </div>
      </div>
      
      {/* LISTA DE TESTIMONIOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando testimonios...</span>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay testimonios
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' || filterFeatured !== 'all'
                ? 'No se encontraron testimonios con los filtros aplicados'
                : 'Comienza creando el primer testimonio'
              }
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Crear Testimonio
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Testimonio
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestimonials.map((testimonial) => {
                    const status = getStatusInfo(testimonial);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={testimonial.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {testimonial.name || 'Sin nombre'}
                              {testimonial.isFeatured && (
                                <Award className="w-4 h-4 text-yellow-500 ml-2" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{testimonial.role || 'Sin rol'}</div>
                            <div className="text-xs text-gray-400">
                              {safeFormatDate(testimonial.createdAt)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 max-w-md">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {testimonial.text || 'Sin texto'}
                          </p>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          {renderStars(testimonial.rating || 0)}
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(testimonial.id)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${status.color}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </button>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            
                            {/* Aprobar si está pendiente */}
                            {!testimonial.isActive && (
                              <button
                                onClick={() => openApproveModal(testimonial)}
                                className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                                title="Aprobar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Toggle destacado */}
                            <button
                              onClick={() => handleToggleFeatured(testimonial.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                testimonial.isFeatured
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                              title={testimonial.isFeatured ? 'Quitar destacado' : 'Marcar destacado'}
                            >
                              <Award className="w-4 h-4" />
                            </button>
                            
                            {/* Editar */}
                            <button
                              onClick={() => openEditModal(testimonial)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            {/* Eliminar */}
                            <button
                              onClick={() => handleDeleteTestimonial(testimonial.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredTestimonials.map((testimonial) => {
                const status = getStatusInfo(testimonial);
                const StatusIcon = status.icon;
                
                return (
                  <div key={testimonial.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">
                            {testimonial.name}
                          </h4>
                          {testimonial.isFeatured && (
                            <Award className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {renderStars(testimonial.rating)}
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {testimonial.text}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {safeFormatDate(testimonial.createdAt)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {!testimonial.isActive && (
                          <button
                            onClick={() => openApproveModal(testimonial)}
                            className="bg-green-100 text-green-700 p-2 rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleFeatured(testimonial.id)}
                          className={`p-2 rounded-lg ${
                            testimonial.isFeatured
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => openEditModal(testimonial)}
                          className="bg-blue-100 text-blue-700 p-2 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="bg-red-100 text-red-700 p-2 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages} ({totalItems} total)
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* MODAL: CREAR TESTIMONIO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Crear Testimonio</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre del cliente"
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesión/Rol *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      fieldErrors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Estudiante, Profesional, etc."
                  />
                  {fieldErrors.role && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.role}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testimonio *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg resize-none ${
                      fieldErrors.text ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Escribe el testimonio del cliente..."
                  />
                  {fieldErrors.text && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.text}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación *
                  </label>
                  {renderStarsInput(formData.rating, (rating) => 
                    setFormData({ ...formData, rating })
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm">Marcar como destacado</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm">Publicar inmediatamente</span>
                  </label>
                </div>
                
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleCreateTestimonial}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Testimonio
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* MODAL: EDITAR TESTIMONIO */}
      {showEditModal && selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Editar Testimonio</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTestimonial(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesión/Rol *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      fieldErrors.role ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.role && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.role}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testimonio *
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg resize-none ${
                      fieldErrors.text ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.text && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.text}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calificación *
                  </label>
                  {renderStarsInput(formData.rating, (rating) => 
                    setFormData({ ...formData, rating })
                  )}
                </div>
                
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTestimonial(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleUpdateTestimonial}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
      {/* MODAL: APROBAR TESTIMONIO */}
      {showApproveModal && selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
            
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <ThumbsUp className="w-5 h-5 mr-2 text-green-600" />
                  Aprobar Testimonio
                </h3>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedTestimonial(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {selectedTestimonial.name} - {selectedTestimonial.role}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  "{selectedTestimonial.text}"
                </p>
                {renderStars(selectedTestimonial.rating)}
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm">Marcar como destacado</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedTestimonial(null);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleApproveTestimonial}
                disabled={saving}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Aprobar y Publicar
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TestimonialsAdminManager;

/*
 * COMPONENTE: TestimonialsAdminManager
 * 
 * FUNCIONALIDADES COMPLETAS:
 * 
 * CRUD COMPLETO:
 * ✅ Ver todos los testimonios (publicados, pendientes, inactivos)
 * ✅ Crear nuevos testimonios desde admin
 * ✅ Editar testimonios existentes (nombre, rol, texto, rating)
 * ✅ Eliminar testimonios con confirmación
 * ✅ Aprobar testimonios pendientes arreglado
 * 
 * GESTIÓN DE ESTADOS:
 * ✅ Activar/desactivar testimonios (toggle isActive)
 * ✅ Marcar/desmarcar como destacados (toggle isFeatured)
 * ✅ Cambiar orden de visualización
 * 
 * BÚSQUEDA Y FILTROS:
 * ✅ Búsqueda por nombre y texto
 * ✅ Filtro por estado (todos, publicados, pendientes, inactivos)
 * ✅ Filtro por destacados
 * ✅ Filtro por rating mínimo
 * ✅ Ordenamiento múltiple (fecha, rating, nombre)
 * 
 * INTERFAZ:
 * ✅ Vista de tabla para desktop
 * ✅ Vista de cards para móvil
 * ✅ Paginación completa
 * ✅ Modales para crear, editar y aprobar
 * ✅ Sistema de estrellas interactivo
 * ✅ Indicadores visuales de estado
 * 
 * ENDPOINTS USADOS:
 * - GET /api/testimonials/all
 * - POST /api/testimonials/admin/create
 * - PUT /api/testimonials/:id
 * - DELETE /api/testimonials/:id
 * - POST /api/testimonials/:id/approve
 * - PATCH /api/testimonials/:id/toggle-active
 * - PATCH /api/testimonials/:id/toggle-featured
 */