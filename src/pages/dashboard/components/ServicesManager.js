// src/pages/dashboard/components/ServicesManager.js
// FUNCIÓN: Gestión completa de servicios del gimnasio
// INCLUYE: Crear, editar, eliminar, reordenar servicios

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Target, Users, Heart, 
  Dumbbell, Award, Shield, Zap, Star, Check, AlertTriangle,
  GripVertical, Eye, EyeOff, Upload, Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const ServicesManager = ({ services, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localServices, setLocalServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  
  // 🎯 Iconos disponibles para servicios
  const availableIcons = [
    { id: 'target', component: Target, name: 'Objetivo' },
    { id: 'users', component: Users, name: 'Grupo' },
    { id: 'heart', component: Heart, name: 'Corazón' },
    { id: 'dumbbell', component: Dumbbell, name: 'Pesas' },
    { id: 'award', component: Award, name: 'Premio' },
    { id: 'shield', component: Shield, name: 'Protección' },
    { id: 'zap', component: Zap, name: 'Energía' },
    { id: 'star', component: Star, name: 'Estrella' }
  ];
  
  // 📊 Plantilla para nuevo servicio
  const emptyService = {
    id: null,
    title: '',
    description: '',
    icon: 'target',
    imageUrl: '',
    features: [],
    isActive: true,
    displayOrder: 0
  };
  
  // 🔄 Inicializar servicios locales
  useEffect(() => {
    if (services && Array.isArray(services)) {
      setLocalServices(services.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    }
  }, [services]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      // Actualizar orden de servicios
      const servicesWithOrder = localServices.map((service, index) => ({
        ...service,
        displayOrder: index + 1
      }));
      
      // Aquí harías la llamada al API para guardar todos los servicios
      console.log('Guardando servicios:', servicesWithOrder);
      
      // Simular guardado exitoso
      showSuccess('Servicios guardados exitosamente');
      setHasChanges(false);
      onSave(servicesWithOrder);
      
      // Cerrar modo edición
      setEditingService(null);
      setIsCreating(false);
      
    } catch (error) {
      console.error('Error saving services:', error);
      showError('Error al guardar servicios');
    }
  };
  
  // ➕ Crear nuevo servicio
  const handleCreateService = () => {
    setIsCreating(true);
    setEditingService({
      ...emptyService,
      id: `temp_${Date.now()}`,
      displayOrder: localServices.length + 1
    });
  };
  
  // ✏️ Editar servicio existente
  const handleEditService = (service) => {
    setEditingService({ ...service });
    setIsCreating(false);
  };
  
  // 💾 Guardar servicio individual
  const handleSaveService = () => {
    if (!editingService.title.trim()) {
      showError('El título es obligatorio');
      return;
    }
    
    if (!editingService.description.trim()) {
      showError('La descripción es obligatoria');
      return;
    }
    
    if (isCreating) {
      // Agregar nuevo servicio
      const newService = {
        ...editingService,
        id: `new_${Date.now()}`,
        displayOrder: localServices.length + 1
      };
      setLocalServices([...localServices, newService]);
    } else {
      // Actualizar servicio existente
      setLocalServices(localServices.map(service => 
        service.id === editingService.id ? editingService : service
      ));
    }
    
    setHasChanges(true);
    setEditingService(null);
    setIsCreating(false);
    showSuccess(isCreating ? 'Servicio creado' : 'Servicio actualizado');
  };
  
  // ❌ Cancelar edición
  const handleCancelEdit = () => {
    setEditingService(null);
    setIsCreating(false);
  };
  
  // 🗑️ Eliminar servicio
  const handleDeleteService = (serviceId) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
      setLocalServices(localServices.filter(service => service.id !== serviceId));
      setHasChanges(true);
      showSuccess('Servicio eliminado');
    }
  };
  
  // 👁️ Toggle activar/desactivar
  const handleToggleActive = (serviceId) => {
    setLocalServices(localServices.map(service => 
      service.id === serviceId 
        ? { ...service, isActive: !service.isActive }
        : service
    ));
    setHasChanges(true);
  };
  
  // 🔄 Reordenar servicios
  const handleReorderService = (serviceId, direction) => {
    const currentIndex = localServices.findIndex(s => s.id === serviceId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localServices.length) return;
    
    const newServices = [...localServices];
    [newServices[currentIndex], newServices[newIndex]] = [newServices[newIndex], newServices[currentIndex]];
    
    setLocalServices(newServices);
    setHasChanges(true);
  };
  
  // 📷 Subir imagen para servicio
  const handleImageUpload = async (serviceId, file) => {
    if (!file) return;
    
    try {
      setUploadingImage(serviceId);
      
      // Crear FormData para subir imagen
      const formData = new FormData();
      formData.append('image', file);
      
      // Simular subida de imagen - aquí harías la llamada real al API
      console.log('Uploading image for service:', serviceId);
      
      // URL simulada de imagen subida
      const imageUrl = URL.createObjectURL(file);
      
      // Actualizar servicio con nueva imagen
      if (editingService && editingService.id === serviceId) {
        setEditingService({ ...editingService, imageUrl });
      } else {
        setLocalServices(localServices.map(service => 
          service.id === serviceId 
            ? { ...service, imageUrl }
            : service
        ));
        setHasChanges(true);
      }
      
      showSuccess('Imagen subida exitosamente');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error al subir imagen');
    } finally {
      setUploadingImage(null);
    }
  };
  
  // 🏷️ Agregar/quitar característica
  const handleToggleFeature = (feature) => {
    if (!editingService) return;
    
    const currentFeatures = editingService.features || [];
    const hasFeature = currentFeatures.includes(feature);
    
    const newFeatures = hasFeature
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    setEditingService({ ...editingService, features: newFeatures });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando servicios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Gestión de Servicios
          </h3>
          <p className="text-gray-600 mt-1">
            Administra los servicios que ofrece tu gimnasio
          </p>
        </div>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          )}
          
          <button
            onClick={handleCreateService}
            className="btn-secondary btn-sm"
            disabled={isCreating || editingService}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios".
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 📋 LISTA DE SERVICIOS */}
      <div className="space-y-4">
        {localServices.map((service, index) => (
          <div key={service.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            
            {/* Vista normal del servicio */}
            {(!editingService || editingService.id !== service.id) && (
              <div className="p-6">
                <div className="flex items-center justify-between">
                  
                  {/* Información del servicio */}
                  <div className="flex items-center space-x-4 flex-1">
                    
                    {/* Icono y orden */}
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleReorderService(service.id, 'up')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={index === 0}
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorderService(service.id, 'down')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={index === localServices.length - 1}
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        {React.createElement(
                          availableIcons.find(icon => icon.id === service.icon)?.component || Target,
                          { className: "w-6 h-6 text-primary-600" }
                        )}
                      </div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {service.title}
                        </h4>
                        
                        {/* Estado activo/inactivo */}
                        <button
                          onClick={() => handleToggleActive(service.id)}
                          className={`p-1 rounded-full ${
                            service.isActive 
                              ? 'text-green-600 hover:bg-green-100' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={service.isActive ? 'Activo' : 'Inactivo'}
                        >
                          {service.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mt-1">
                        {service.description}
                      </p>
                      
                      {/* Características */}
                      {service.features && service.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {service.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Imagen del servicio */}
                    {service.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                </div>
              </div>
            )}
            
            {/* Formulario de edición */}
            {editingService && editingService.id === service.id && (
              <div className="p-6 bg-gray-50">
                <ServiceForm
                  service={editingService}
                  availableIcons={availableIcons}
                  onSave={handleSaveService}
                  onCancel={handleCancelEdit}
                  onChange={setEditingService}
                  onImageUpload={handleImageUpload}
                  onToggleFeature={handleToggleFeature}
                  uploadingImage={uploadingImage}
                  isCreating={isCreating}
                />
              </div>
            )}
            
          </div>
        ))}
        
        {/* Mensaje cuando no hay servicios */}
        {localServices.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando los servicios que ofrece tu gimnasio
            </p>
            <button
              onClick={handleCreateService}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Servicio
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};

// 📝 COMPONENTE: Formulario de servicio
const ServiceForm = ({ 
  service, 
  availableIcons, 
  onSave, 
  onCancel, 
  onChange, 
  onImageUpload, 
  onToggleFeature,
  uploadingImage,
  isCreating 
}) => {
  const [newFeature, setNewFeature] = useState('');
  
  // 🏷️ Características comunes para servicios
  const commonFeatures = [
    'Entrenador personalizado',
    'Evaluación inicial',
    'Seguimiento continuo',
    'Planes nutricionales',
    'Acceso ilimitado',
    'Clases grupales',
    'Equipamiento especializado',
    'Asesoría profesional'
  ];
  
  const handleAddFeature = () => {
    if (newFeature.trim() && !service.features.includes(newFeature.trim())) {
      onChange({
        ...service,
        features: [...(service.features || []), newFeature.trim()]
      });
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (featureToRemove) => {
    onChange({
      ...service,
      features: service.features.filter(f => f !== featureToRemove)
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Título del formulario */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          {isCreating ? 'Crear Nuevo Servicio' : 'Editar Servicio'}
        </h4>
        
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </button>
          
          <button
            onClick={onCancel}
            className="btn-secondary btn-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna izquierda: Información básica */}
        <div className="space-y-4">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Servicio *
            </label>
            <input
              type="text"
              value={service.title}
              onChange={(e) => onChange({ ...service, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: Entrenamiento Personal"
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={service.description}
              onChange={(e) => onChange({ ...service, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe los beneficios y características del servicio..."
            />
          </div>
          
          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => onChange({ ...service, icon: icon.id })}
                  className={`p-3 border rounded-lg flex flex-col items-center space-y-1 hover:bg-gray-50 ${
                    service.icon === icon.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <icon.component className={`w-5 h-5 ${
                    service.icon === icon.id ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                  <span className="text-xs text-gray-600">{icon.name}</span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
        
        {/* Columna derecha: Imagen y características */}
        <div className="space-y-4">
          
          {/* Imagen del servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del Servicio
            </label>
            
            {service.imageUrl ? (
              <div className="relative">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => onChange({ ...service, imageUrl: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingImage === service.id ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clic para subir imagen</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) onImageUpload(service.id, file);
                  }}
                  disabled={uploadingImage === service.id}
                />
              </label>
            )}
          </div>
          
          {/* Características del servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características del Servicio
            </label>
            
            {/* Características actuales */}
            {service.features && service.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {service.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {feature}
                    <button
                      onClick={() => handleRemoveFeature(feature)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Agregar nueva característica */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nueva característica..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                onClick={handleAddFeature}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Características comunes */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Características comunes:</p>
              <div className="grid grid-cols-1 gap-1">
                {commonFeatures.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => onToggleFeature(feature)}
                    className={`text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                      service.features?.includes(feature)
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {service.features?.includes(feature) ? (
                        <Check className="w-4 h-4 mr-2 text-primary-600" />
                      ) : (
                        <div className="w-4 h-4 mr-2 border border-gray-300 rounded"></div>
                      )}
                      {feature}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default ServicesManager;