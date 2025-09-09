// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ServicesManager.js

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Target, Users, Heart, 
  Dumbbell, Award, Shield, Zap, Star, Check, AlertTriangle,
  Eye, EyeOff, Loader
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ServicesManager = ({ services, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados locales
  const [localServices, setLocalServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
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
  
  // INICIALIZAR CON DATOS ACTUALES
  useEffect(() => {
    console.log('Verificando datos de servicios:', {
      hasServices: !!services,
      isLoading,
      isArray: Array.isArray(services),
      length: Array.isArray(services) ? services.length : 0,
      services: services
    });
    
    if (!isLoading) {
      if (services && Array.isArray(services)) {
        console.log('Cargando servicios desde el backend:', services);
        
        // Mapear servicios con estructura esperada
        const mappedServices = services.map((service, index) => ({
          id: service.id || `service_${index}`,
          title: service.title || '',
          description: service.description || '',
          icon: service.icon || 'target',
          features: Array.isArray(service.features) ? service.features : [],
          active: service.active !== false
        }));
        
        console.log('Servicios mapeados exitosamente:', {
          total: mappedServices.length,
          active: mappedServices.filter(s => s.active).length,
          titles: mappedServices.map(s => s.title)
        });
        
        setLocalServices(mappedServices);
        setIsDataLoaded(true);
        
      } else {
        console.log('No hay datos de servicios, iniciando con arreglo vacío');
        setLocalServices([]);
        setIsDataLoaded(true);
      }
    } else {
      console.log('Los datos aún se están cargando...');
      setIsDataLoaded(false);
    }
  }, [services, isLoading]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      console.log('Guardando servicios:', localServices);
      
      // Limpiar IDs temporales antes de guardar
      const servicesToSave = localServices.map(service => ({
        ...service,
        id: service.id?.startsWith('temp_') ? null : service.id
      }));
      
      onSave(servicesToSave);
      setHasChanges(false);
      showSuccess('Servicios guardados exitosamente');
      
      // Cerrar modo edición
      setEditingService(null);
      setIsCreating(false);
      
    } catch (error) {
      console.error('Error al guardar servicios:', error);
      showError('Error al guardar servicios');
    }
  };
  
  // CREAR NUEVO SERVICIO
  const handleCreateService = () => {
    console.log('Creando nuevo servicio...');
    
    const newService = {
      ...emptyService,
      id: `temp_${Date.now()}` // ID temporal único
    };
    
    console.log('Plantilla de nuevo servicio:', newService);
    
    setEditingService(newService);
    setIsCreating(true);
  };
  
  // Editar servicio existente
  const handleEditService = (service) => {
    console.log('Editando servicio:', service);
    setEditingService({ ...service });
    setIsCreating(false);
  };
  
  // GUARDAR SERVICIO INDIVIDUAL
  const handleSaveService = () => {
    if (!editingService.title.trim()) {
      showError('El título es obligatorio');
      return;
    }
    
    if (!editingService.description.trim()) {
      showError('La descripción es obligatoria');
      return;
    }
    
    console.log('Guardando servicio:', editingService);
    
    if (isCreating) {
      // AGREGAR NUEVO SERVICIO
      console.log('Agregando nuevo servicio a la lista');
      setLocalServices(prevServices => {
        const newServices = [...prevServices, editingService];
        console.log('Lista de servicios actualizada:', newServices);
        return newServices;
      });
      showSuccess('Servicio creado exitosamente');
    } else {
      // ACTUALIZAR SERVICIO EXISTENTE
      console.log('Actualizando servicio existente');
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
      setLocalServices(localServices.filter(service => service.id !== serviceId));
      setHasChanges(true);
      showSuccess('Servicio eliminado');
    }
  };
  
  // Toggle activar/desactivar
  const handleToggleActive = (serviceId) => {
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
            <p className="text-gray-600">Cargando servicios actuales...</p>
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
          
          {/* Mostrar servicios actuales cargados */}
          {isDataLoaded && localServices.length > 0 && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              {localServices.length} servicios cargados ({localServices.filter(s => s.active).length} activos)
            </div>
          )}
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
            disabled={!!editingService} // Solo deshabilitar si está editando
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
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios".
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

// COMPONENTE: Formulario de servicio
const ServiceForm = ({ 
  service, 
  availableIcons, 
  onSave, 
  onCancel, 
  onChange, 
  isCreating 
}) => {
  const [newFeature, setNewFeature] = useState('');
  
  // Características comunes para servicios
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
          {isCreating ? 'Crear Nuevo Servicio' : `Editar: ${service.title || 'Servicio'}`}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className={`p-3 border rounded-lg flex items-center space-x-3 hover:bg-gray-50 ${
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
 * COMPONENTE: ServicesManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente gestiona la creación, edición y administración completa de servicios del gimnasio.
 * Permite a los administradores configurar los servicios que se mostrarán en la página web pública,
 * incluyendo su información, características y estado de visibilidad.
 * 
 * FUNCIONALIDADES PARA EL USUARIO:
 * 
 * GESTIÓN DE SERVICIOS:
 * - Crear nuevos servicios con título, descripción y características personalizadas
 * - Editar servicios existentes manteniendo la integridad de los datos
 * - Eliminar servicios con confirmación para evitar pérdidas accidentales
 * - Activar/desactivar servicios para controlar su visibilidad en la página web
 * 
 * PERSONALIZACIÓN VISUAL:
 * - Seleccionar íconos representativos para cada servicio de una biblioteca predefinida
 * - Íconos disponibles: Objetivo, Usuarios, Corazón, Pesas, Premio, Escudo, Energía, Estrella
 * - Vista previa inmediata del ícono seleccionado
 * 
 * CARACTERÍSTICAS DE SERVICIOS:
 * - Agregar características personalizadas para describir beneficios específicos
 * - Lista de características comunes predefinidas para selección rápida:
 *   * Entrenador personalizado
 *   * Evaluación inicial
 *   * Seguimiento continuo
 *   * Planes nutricionales
 *   * Acceso ilimitado
 *   * Clases grupales
 *   * Equipamiento especializado
 *   * Asesoría profesional
 * - Eliminar características no deseadas con un clic
 * 
 * INTERFAZ DE USUARIO:
 * - Formulario intuitivo con validación en tiempo real
 * - Indicadores visuales de estado (activo/inactivo) con iconos de ojo
 * - Notificaciones de éxito y error para feedback inmediato
 * - Advertencias de cambios sin guardar para prevenir pérdida de datos
 * - Diseño responsivo que funciona en dispositivos móviles y de escritorio
 * 
 * FLUJO DE TRABAJO:
 * - Vista de lista con todos los servicios y sus estados
 * - Modo de edición inline para servicios existentes
 * - Formulario expandido para creación de nuevos servicios
 * - Sistema de guardado por lotes para eficiencia
 * - Confirmaciones antes de acciones destructivas
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * CONTEXTOS:
 * - AppContext: Proporciona funciones de notificación (showSuccess, showError)
 *   y utilidades como detección de dispositivo móvil (isMobile)
 * 
 * PROPIEDADES RECIBIDAS:
 * - services: Array de servicios existentes desde el componente padre
 * - isLoading: Estado de carga para mostrar indicadores apropiados
 * - onSave: Función callback para guardar cambios en el backend
 * - onUnsavedChanges: Función callback para notificar cambios pendientes
 * 
 * COMUNICACIÓN CON BACKEND:
 * - Recibe datos de servicios existentes a través de la prop 'services'
 * - Envía actualizaciones através de la función 'onSave'
 * - Maneja IDs temporales para nuevos servicios antes del guardado
 * - Estructura de datos compatible con APIs REST estándar
 * 
 * ESTADOS LOCALES:
 * - localServices: Copia local de servicios para edición sin afectar datos originales
 * - editingService: Servicio actualmente en edición
 * - isCreating: Bandera para distinguir entre creación y edición
 * - hasChanges: Indicador de cambios pendientes de guardar
 * - isDataLoaded: Control de carga inicial de datos
 * 
 * VALIDACIONES:
 * - Título obligatorio con validación antes de guardar
 * - Descripción obligatoria con validación antes de guardar
 * - Prevención de características duplicadas
 * - Confirmación antes de eliminar servicios
 * 
 * IMPACTO EN LA PÁGINA WEB:
 * - Los servicios activos aparecen en la sección "Servicios" de la página pública
 * - Cada servicio muestra su ícono, título, descripción y características
 * - Los servicios inactivos no son visibles para los visitantes
 * - El orden de los servicios se mantiene según su posición en la lista
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState, useEffect) para manejo de estado
 * - Lucide React para iconografía moderna y consistente
 * - Tailwind CSS para estilos responsivos y utilities-first
 * - JavaScript ES6+ para lógica de componente
 * - PropTypes implícitos a través de la estructura de props
 */