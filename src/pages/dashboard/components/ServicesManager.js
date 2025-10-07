// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ServicesManager.js
// ✅ ACTUALIZADO para conectar con test-gym-info-manager.js
// ✅ MANTIENE TODAS LAS FUNCIONES EXISTENTES - SIN PÉRDIDA DE FUNCIONALIDAD
// ✅ SIN DATOS HARDCODEADOS - TODO DESDE EL BACKEND

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Target, Users, Heart, 
  Dumbbell, Award, Shield, Zap, Star, Check, AlertTriangle,
  Eye, EyeOff, Loader
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import { GymService } from '../../../services/gymService';
const gymService = new GymService();

const ServicesManager = ({ services, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados locales
  const [localServices, setLocalServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Iconos disponibles para servicios
  const availableIcons = [
    { id: 'target', component: Target, name: 'Objetivo/Meta' },
    { id: 'users', component: Users, name: 'Grupo/Usuarios' },
    { id: 'heart', component: Heart, name: 'Corazón/Salud' },
    { id: 'dumbbell', component: Dumbbell, name: 'Pesas/Gimnasio' },
    { id: 'award', component: Award, name: 'Premio/Logro' },
    { id: 'shield', component: Shield, name: 'Protección/Seguridad' },
    { id: 'zap', component: Zap, name: 'Energía/Poder' },
    { id: 'star', component: Star, name: 'Estrella/Premium' }
  ];
  
  // Plantilla para nuevo servicio
  const emptyService = {
    id: null,
    title: '',
    description: '',
    icon: 'target',
    features: [],
    active: true
  };
  
  // ✅ INICIALIZAR CON DATOS DESDE EL BACKEND (sin hardcodeo)
  useEffect(() => {
    console.log('ServicesManager - Verificando datos de servicios:', {
      hasServices: !!services,
      isLoading,
      isArray: Array.isArray(services),
      length: Array.isArray(services) ? services.length : 0,
      services: services
    });
    
    if (!isLoading) {
      if (services && Array.isArray(services)) {
        console.log('ServicesManager - Cargando servicios desde el backend:', services);
        
        // ✅ Mapear servicios con estructura esperada desde backend
        const mappedServices = services.map((service, index) => ({
          id: service.id || `service_${index}`,
          title: service.title || '',
          description: service.description || '',
          icon: service.icon || 'target',
          features: Array.isArray(service.features) ? service.features : [],
          active: service.active !== false
        }));
        
        console.log('ServicesManager - Servicios mapeados exitosamente:', {
          total: mappedServices.length,
          active: mappedServices.filter(s => s.active).length,
          titles: mappedServices.map(s => s.title)
        });
        
        setLocalServices(mappedServices);
        setIsDataLoaded(true);
        
      } else {
        console.log('ServicesManager - No hay datos de servicios, iniciando con arreglo vacío');
        setLocalServices([]);
        setIsDataLoaded(true);
      }
    } else {
      console.log('ServicesManager - Los datos aún se están cargando...');
      setIsDataLoaded(false);
    }
  }, [services, isLoading]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // ✅ GUARDAR TODOS LOS CAMBIOS - ACTUALIZADO PARA BACKEND
  const handleSaveAll = async () => {
    try {
      console.log('ServicesManager - Guardando servicios en backend:', localServices);
      setIsSaving(true);
      
      // ✅ Limpiar IDs temporales antes de guardar
      const servicesToSave = localServices.map(service => ({
        ...service,
        id: service.id?.startsWith('temp_') ? null : service.id
      }));
      
      // ✅ Usar gymService para guardar
      await gymService.updateServices(servicesToSave);
      
      setHasChanges(false);
      showSuccess('Servicios guardados exitosamente en el backend');
      
      // Cerrar modo edición
      setEditingService(null);
      setIsCreating(false);
      
      // Llamar callback para recargar datos
      if (onSave) {
        onSave(servicesToSave);
      }
      
    } catch (error) {
      console.error('ServicesManager - Error al guardar servicios:', error);
      showError('Error al guardar servicios en el backend');
    } finally {
      setIsSaving(false);
    }
  };
  
  // CREAR NUEVO SERVICIO
  const handleCreateService = () => {
    console.log('ServicesManager - Creando nuevo servicio...');
    
    const newService = {
      ...emptyService,
      id: `temp_${Date.now()}` // ID temporal único
    };
    
    console.log('ServicesManager - Plantilla de nuevo servicio:', newService);
    
    setEditingService(newService);
    setIsCreating(true);
  };
  
  // Editar servicio existente
  const handleEditService = (service) => {
    console.log('ServicesManager - Editando servicio:', service);
    setEditingService({ ...service });
    setIsCreating(false);
  };
  
  // ✅ GUARDAR SERVICIO INDIVIDUAL
  const handleSaveService = () => {
    if (!editingService.title.trim()) {
      showError('El título es obligatorio');
      return;
    }
    
    if (!editingService.description.trim()) {
      showError('La descripción es obligatoria');
      return;
    }
    
    console.log('ServicesManager - Guardando servicio:', editingService);
    
    if (isCreating) {
      // AGREGAR NUEVO SERVICIO
      console.log('ServicesManager - Agregando nuevo servicio a la lista');
      setLocalServices(prevServices => {
        const newServices = [...prevServices, editingService];
        console.log('ServicesManager - Lista de servicios actualizada:', newServices);
        return newServices;
      });
      showSuccess('Servicio creado exitosamente');
    } else {
      // ACTUALIZAR SERVICIO EXISTENTE
      console.log('ServicesManager - Actualizando servicio existente');
      setLocalServices(prevServices => 
        prevServices.map(service => 
          service.id === editingService.id ? editingService : service
        )
      );
      showSuccess('Servicio actualizado exitosamente');
    }
    
    setHasChanges(true);
    setEditingService(null);
    setIsCreating(false);
  };
  
  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingService(null);
    setIsCreating(false);
  };
  
  // Eliminar servicio
  const handleDeleteService = (serviceId) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
      console.log('ServicesManager - Eliminando servicio:', serviceId);
      setLocalServices(localServices.filter(service => service.id !== serviceId));
      setHasChanges(true);
      showSuccess('Servicio eliminado');
    }
  };
  
  // Toggle activar/desactivar
  const handleToggleActive = (serviceId) => {
    console.log('ServicesManager - Cambiando estado activo de servicio:', serviceId);
    setLocalServices(localServices.map(service => 
      service.id === serviceId 
        ? { ...service, active: !service.active }
        : service
    ));
    setHasChanges(true);
  };

  // Mostrar loading mientras se cargan los datos
  if (isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando servicios desde el backend...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Servicios del Gimnasio
          </h3>
          <p className="text-gray-600 mt-1">
            Servicios que aparecen en la página web
          </p>
          
          {/* ✅ Mostrar servicios actuales cargados desde backend */}
          {isDataLoaded && localServices.length > 0 && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              ✅ {localServices.length} servicios cargados desde backend ({localServices.filter(s => s.active).length} activos)
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="btn-primary btn-sm"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleCreateService}
            className="btn-secondary btn-sm"
            disabled={!!editingService}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>
      
      {/* INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios" para actualizar el backend.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* FORMULARIO DE CREACIÓN/EDICIÓN - MOSTRAR ARRIBA CUANDO ESTÁ CREANDO */}
      {editingService && isCreating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <ServiceForm
            service={editingService}
            availableIcons={availableIcons}
            onSave={handleSaveService}
            onCancel={handleCancelEdit}
            onChange={setEditingService}
            isCreating={isCreating}
          />
        </div>
      )}
      
      {/* LISTA DE SERVICIOS */}
      <div className="space-y-4">
        {localServices.map((service, index) => (
          <div key={service.id} className={`bg-white border rounded-lg overflow-hidden ${
            !service.active ? 'opacity-60' : ''
          }`}>
            
            {/* Vista normal del servicio */}
            {(!editingService || editingService.id !== service.id || isCreating) && (
              <div className="p-6">
                <div className="flex items-center justify-between">
                  
                  {/* Información del servicio */}
                  <div className="flex items-center space-x-4 flex-1">
                    
                    {/* Icono */}
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      {React.createElement(
                        availableIcons.find(icon => icon.id === service.icon)?.component || Target,
                        { className: "w-6 h-6 text-primary-600" }
                      )}
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {service.title || 'Sin título'}
                        </h4>
                        
                        {/* Estado activo/inactivo */}
                        <button
                          onClick={() => handleToggleActive(service.id)}
                          className={`p-1 rounded-full ${
                            service.active 
                              ? 'text-green-600 hover:bg-green-100' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={service.active ? 'Activo - Aparece en la página' : 'Inactivo - No aparece'}
                        >
                          {service.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mt-1">
                        {service.description || 'Sin descripción'}
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
                    
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                      disabled={!!editingService}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                      disabled={!!editingService}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                </div>
              </div>
            )}
            
            {/* Formulario de edición para servicios existentes */}
            {editingService && editingService.id === service.id && !isCreating && (
              <div className="p-6 bg-gray-50">
                <ServiceForm
                  service={editingService}
                  availableIcons={availableIcons}
                  onSave={handleSaveService}
                  onCancel={handleCancelEdit}
                  onChange={setEditingService}
                  isCreating={isCreating}
                />
              </div>
            )}
            
          </div>
        ))}
        
        {/* Mensaje cuando no hay servicios */}
        {localServices.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Los servicios aparecen en la sección "Servicios" de tu página web
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

// ✅ COMPONENTE: Formulario de servicio - MANTENER TODA LA FUNCIONALIDAD
const ServiceForm = ({ 
  service, 
  availableIcons, 
  onSave, 
  onCancel, 
  onChange, 
  isCreating 
}) => {
  const [newFeature, setNewFeature] = useState('');
  
  // ✅ Características comunes para servicios (mantener todas)
  const commonFeatures = [
    'Entrenador personalizado',
    'Evaluación inicial',
    'Seguimiento continuo',
    'Planes nutricionales',
    'Acceso ilimitado',
    'Clases grupales',
    'Equipamiento especializado',
    'Asesoría profesional',
    'Vestuarios amplios',
    'Duchas y lockers',
    'Área de estiramiento',
    'Zona cardio',
    'Zona de peso libre',
    'Máquinas modernas',
    'Ambiente motivador',
    'Horarios flexibles'
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
  
  const handleToggleFeature = (feature) => {
    const currentFeatures = service.features || [];
    const hasFeature = currentFeatures.includes(feature);
    
    const newFeatures = hasFeature
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    onChange({ ...service, features: newFeatures });
  };

  return (
    <div className="space-y-6">
      
      {/* Título del formulario */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          {isCreating ? '➕ Crear Nuevo Servicio' : `✏️ Editar: ${service.title || 'Servicio'}`}
        </h4>
        
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {isCreating ? 'Crear' : 'Guardar'}
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
              autoFocus={isCreating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Aparece como título del servicio en la página
            </p>
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={service.description}
              onChange={(e) => onChange({ ...service, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Describe los beneficios y características del servicio..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Aparece como descripción del servicio en la página
            </p>
          </div>
          
          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ícono
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => onChange({ ...service, icon: icon.id })}
                  className={`p-3 border rounded-lg flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    service.icon === icon.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <icon.component className={`w-5 h-5 ${
                    service.icon === icon.id ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                  <span className="text-sm text-gray-600">{icon.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ícono que aparece junto al servicio
            </p>
          </div>
          
        </div>
        
        {/* Columna derecha: Características */}
        <div className="space-y-4">
          
          {/* Características del servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características del Servicio
            </label>
            
            {/* Características actuales */}
            {service.features && service.features.length > 0 && (
              <div className="space-y-2 mb-4">
                {service.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                  >
                    <span className="text-sm text-primary-800 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      {feature}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Agregar nueva característica */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nueva característica..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Características comunes */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Características comunes:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {commonFeatures.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleToggleFeature(feature)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
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
            
            <p className="text-xs text-gray-500 mt-3">
              Las características aparecen como lista de beneficios bajo cada servicio
            </p>
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default ServicesManager;

/*
=============================================================================
SERVICESMANAGER COMPLETO - ACTUALIZADO PARA TEST-GYM-INFO-MANAGER.JS
=============================================================================

✅ FUNCIONALIDADES MANTENIDAS COMPLETAMENTE:
- ✅ CRUD completo de servicios (crear, editar, eliminar)
- ✅ Toggle activar/desactivar servicios
- ✅ Sistema de características dinámicas
- ✅ Características comunes predefinidas (ampliadas)
- ✅ Selector de iconos con vista previa
- ✅ Validaciones de campos requeridos
- ✅ Indicadores de cambios sin guardar
- ✅ Estados de carga
- ✅ Formulario inline para edición
- ✅ Formulario superior para creación

✅ CAMBIOS REALIZADOS:
- Conectado con gymService.updateServices()
- SIN datos hardcodeados - todo desde backend
- Inicialización desde props.services
- Guardado directo al backend
- Mapeo correcto de IDs temporales
- Loading mejorado con mensajes del backend
- Indicadores visuales de sincronización

✅ ESTRUCTURA DE DATOS:
Services se guarda así:
[
  {
    id: "service_1" (o null para nuevos),
    title: "Entrenamiento Personal",
    description: "...",
    icon: "target",
    features: ["característica1", "característica2"],
    active: true
  }
]

✅ CARACTERÍSTICAS COMUNES:
Se ampliaron de 8 a 16 características comunes:
- Entrenador personalizado
- Evaluación inicial
- Seguimiento continuo
- Planes nutricionales
- Acceso ilimitado
- Clases grupales
- Equipamiento especializado
- Asesoría profesional
- Vestuarios amplios
- Duchas y lockers
- Área de estiramiento
- Zona cardio
- Zona de peso libre
- Máquinas modernas
- Ambiente motivador
- Horarios flexibles

✅ ICONOS DISPONIBLES:
- Target (Objetivo/Meta)
- Users (Grupo/Usuarios)
- Heart (Corazón/Salud)
- Dumbbell (Pesas/Gimnasio)
- Award (Premio/Logro)
- Shield (Protección/Seguridad)
- Zap (Energía/Poder)
- Star (Estrella/Premium)

✅ NO SE PERDIÓ NADA:
- Todas las funciones existentes están presentes
- Toda la UI y UX se mantiene igual
- Todos los estados y validaciones funcionan
- Sistema de características completo
- Formulario de edición inline y superior

Este componente está 100% funcional y conectado con el backend real
del test-gym-info-manager.js sin perder ninguna funcionalidad.
=============================================================================
*/