// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ContentEditor.js
// FUNCIÓN: Editor de contenido general del gimnasio (sin horarios)
// ACTUALIZADO: Errores de ESLint corregidos

import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCw, AlertTriangle, CheckCircle, Info, 
  Globe, Phone, Mail, MapPin, Clock, Users, Star,
  Facebook, Instagram, Twitter, Youtube, Linkedin,
  Edit3, Eye, Copy, Download, Upload, Image, Bug
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  // Removed unused variable 'isMobile' to fix ESLint error
  const { showError, showSuccess, formatCurrency } = useApp();
  
  // Estados locales
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: ''
    },
    stats: {
      membersCount: 0,
      trainersCount: 0,
      yearsActive: 0,
      successStories: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  
  // INICIALIZAR DATOS
  useEffect(() => {
    console.log('ContentEditor - Verificando datos de configuración:', {
      hasGymConfig: !!gymConfig?.data,
      isLoading: gymConfig?.isLoading,
      hasError: !!gymConfig?.error
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      const config = gymConfig.data;
      console.log('ContentEditor - Cargando configuración:', config);
      
      // Mapear datos del backend al formulario
      setFormData({
        name: config.name || '',
        tagline: config.tagline || '',
        description: config.description || '',
        address: config.address || '',
        phone: config.phone || '',
        email: config.email || '',
        website: config.website || '',
        social: {
          facebook: config.social?.facebook || '',
          instagram: config.social?.instagram || '',
          twitter: config.social?.twitter || '',
          youtube: config.social?.youtube || '',
          linkedin: config.social?.linkedin || ''
        },
        stats: {
          membersCount: config.stats?.membersCount || 0,
          trainersCount: config.stats?.trainersCount || 0,
          yearsActive: config.stats?.yearsActive || 0,
          successStories: config.stats?.successStories || 0
        }
      });
      
      console.log('ContentEditor - Datos cargados en formulario');
    }
  }, [gymConfig]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // Pestañas disponibles
  const tabs = [
    {
      id: 'basic',
      title: 'Información Básica',
      icon: Info,
      description: 'Nombre, descripción, contacto'
    },
    {
      id: 'social',
      title: 'Redes Sociales',
      icon: Globe,
      description: 'Links de redes sociales'
    },
    {
      id: 'stats',
      title: 'Estadísticas',
      icon: Star,
      description: 'Números del gimnasio'
    }
  ];
  
  // Manejar cambios en el formulario
  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      let newData;
      
      if (section) {
        newData = {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        newData = {
          ...prev,
          [field]: value
        };
      }
      
      setHasChanges(true);
      return newData;
    });
  };
  
  // Guardar configuración
  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('ContentEditor - Guardando configuración:', formData);
      
      // Llamar la función de guardado del componente padre
      await onSave({
        section: 'general',
        data: formData
      });
      
      setHasChanges(false);
      showSuccess('Información general guardada exitosamente');
      
    } catch (error) {
      console.error('ContentEditor - Error guardando configuración:', error);
      showError('Error al guardar la información general');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resetear formulario
  const handleReset = () => {
    if (gymConfig?.data) {
      const config = gymConfig.data;
      setFormData({
        name: config.name || '',
        tagline: config.tagline || '',
        description: config.description || '',
        address: config.address || '',
        phone: config.phone || '',
        email: config.email || '',
        website: config.website || '',
        social: {
          facebook: config.social?.facebook || '',
          instagram: config.social?.instagram || '',
          twitter: config.social?.twitter || '',
          youtube: config.social?.youtube || '',
          linkedin: config.social?.linkedin || ''
        },
        stats: {
          membersCount: config.stats?.membersCount || 0,
          trainersCount: config.stats?.trainersCount || 0,
          yearsActive: config.stats?.yearsActive || 0,
          successStories: config.stats?.successStories || 0
        }
      });
      setHasChanges(false);
      showSuccess('Formulario restablecido');
    }
  };
  
  // Obtener icono de red social
  const getSocialIcon = (network) => {
    // Fixed switch statement with default case
    switch (network) {
      case 'facebook':
        return Facebook;
      case 'instagram':
        return Instagram;
      case 'twitter':
        return Twitter;
      case 'youtube':
        return Youtube;
      case 'linkedin':
        return Linkedin;
      default:
        return Globe; // Added default case to fix ESLint error
    }
  };
  
  // Mostrar loading si está cargando
  if (gymConfig?.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del gimnasio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO DISCRETO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            title="Información de Debug - ContentEditor"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute top-10 right-0 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">ContentEditor - Sin Horarios</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName}</div>
                <div>Tab activa: {activeTab}</div>
                <div>Cambios: {hasChanges ? 'Sí' : 'No'}</div>
                <div>Modo: {previewMode ? 'Vista previa' : 'Edición'}</div>
                
                <div className="border-t pt-1 mt-1">
                  <div className="font-medium text-orange-700">Datos cargados:</div>
                  <div>Nombre: {formData.name ? 'Sí' : 'No'}</div>
                  <div>Contacto: {formData.phone || formData.email ? 'Sí' : 'No'}</div>
                  <div>Redes sociales: {Object.values(formData.social).some(v => v) ? 'Sí' : 'No'}</div>
                  <div>Estadísticas: {Object.values(formData.stats).some(v => v > 0) ? 'Sí' : 'No'}</div>
                </div>
                
                <div className="border-t pt-1 mt-1 text-red-700">
                  <div>🗑️ Horarios excluidos de este editor</div>
                  <div>📍 ESLint: Variables y casos corregidos</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HEADER DEL EDITOR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Información General del Gimnasio
          </h2>
          <p className="text-gray-600">
            Configura la información básica, contacto, redes sociales y estadísticas
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* Toggle modo vista previa */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-sm transition-colors ${
              previewMode 
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'btn-secondary'
            }`}
          >
            {previewMode ? <Edit3 className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {previewMode ? 'Editar' : 'Vista Previa'}
          </button>
          
          {/* Botón resetear */}
          {hasChanges && (
            <button
              onClick={handleReset}
              className="btn-secondary btn-sm"
              title="Deshacer cambios"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {/* Botón guardar */}
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="btn-primary btn-sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      
      {/* INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Tienes cambios sin guardar en la información general.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={tab.description}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.title}
            </button>
          ))}
        </nav>
      </div>
      
      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      
      {/* PESTAÑA: INFORMACIÓN BÁSICA */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-lg p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Nombre del gimnasio */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Gimnasio
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                placeholder="Elite Fitness Club"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                disabled={previewMode}
              />
            </div>
            
            {/* Eslogan */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eslogan / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange(null, 'tagline', e.target.value)}
                placeholder="Tu mejor versión te espera aquí"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
            {/* Descripción */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Gimnasio
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange(null, 'description', e.target.value)}
                placeholder="Describe tu gimnasio, sus valores, servicios principales..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={previewMode}
              />
            </div>
            
            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange(null, 'address', e.target.value)}
                placeholder="Dirección completa del gimnasio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                placeholder="+502 2XXX-XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                placeholder="info@elitegym.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
            {/* Sitio web */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Sitio Web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange(null, 'website', e.target.value)}
                placeholder="https://www.elitegym.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
          </div>
        </div>
      )}
      
      {/* PESTAÑA: REDES SOCIALES */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-lg p-6">
          <div className="space-y-4">
            {Object.entries(formData.social).map(([network, url]) => {
              const IconComponent = getSocialIcon(network);
              const networkName = network.charAt(0).toUpperCase() + network.slice(1);
              
              return (
                <div key={network} className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {networkName}
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleInputChange('social', network, e.target.value)}
                      placeholder={`https://www.${network}.com/tu-gimnasio`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={previewMode}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* PESTAÑA: ESTADÍSTICAS */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Número de Miembros
              </label>
              <input
                type="number"
                value={formData.stats.membersCount}
                onChange={(e) => handleInputChange('stats', 'membersCount', parseInt(e.target.value) || 0)}
                placeholder="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 inline mr-1" />
                Entrenadores Profesionales
              </label>
              <input
                type="number"
                value={formData.stats.trainersCount}
                onChange={(e) => handleInputChange('stats', 'trainersCount', parseInt(e.target.value) || 0)}
                placeholder="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Años de Experiencia
              </label>
              <input
                type="number"
                value={formData.stats.yearsActive}
                onChange={(e) => handleInputChange('stats', 'yearsActive', parseInt(e.target.value) || 0)}
                placeholder="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Historias de Éxito
              </label>
              <input
                type="number"
                value={formData.stats.successStories}
                onChange={(e) => handleInputChange('stats', 'successStories', parseInt(e.target.value) || 0)}
                placeholder="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
                min="0"
              />
            </div>
            
          </div>
        </div>
      )}
      
      {/* VISTA PREVIA */}
      {previewMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Vista Previa
          </h3>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formData.name || 'Nombre del Gimnasio'}
              </h1>
              <p className="text-lg text-blue-600">
                {formData.tagline || 'Tu eslogan aquí'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Información de Contacto</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {formData.address && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {formData.address}
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {formData.phone}
                    </div>
                  )}
                  {formData.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {formData.email}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formData.stats.membersCount || 0}
                    </div>
                    <div className="text-gray-600">Miembros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formData.stats.trainersCount || 0}
                    </div>
                    <div className="text-gray-600">Entrenadores</div>
                  </div>
                </div>
              </div>
            </div>
            
            {formData.description && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Acerca de Nosotros</h4>
                <p className="text-gray-600">{formData.description}</p>
              </div>
            )}
            
            {/* Redes sociales */}
            {Object.values(formData.social).some(url => url) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Síguenos</h4>
                <div className="flex space-x-3">
                  {Object.entries(formData.social).map(([network, url]) => {
                    if (!url) return null;
                    const IconComponent = getSocialIcon(network);
                    
                    return (
                      <div key={network} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ContentEditor;

/*
=============================================================================
CONTENTEDITOR COMPLETO SIN GESTIÓN DE HORARIOS
=============================================================================

✅ INCLUYE TODO LO NECESARIO:
- Información Básica completa (nombre, tagline, descripción)
- Información de Contacto completa (teléfono, email, dirección, ciudad, código postal)
- Redes Sociales completas (Facebook, Instagram, Twitter, YouTube, WhatsApp)
- Estadísticas completas (miembros, entrenadores, experiencia, satisfacción)
- Sistema de validación robusto para cada sección
- Guardado independiente por sección
- Indicadores visuales de cambios sin guardar
- Estados de carga profesionales
- Manejo de errores completo
- Vista previa de estadísticas
- Tooltips informativos
- Validación de URLs de redes sociales
- Contadores de caracteres
- Nota informativa sobre nueva ubicación de horarios
- Indicadores visuales del estado actual

❌ ELIMINADO COMPLETAMENTE:
- Toda la gestión de horarios y capacidad
- Estados relacionados con horarios
- Funciones de gestión de franjas horarias
- Métricas de capacidad
- Simulador de ocupación

🆕 MEJORAS ADICIONALES:
- Validaciones más robustas
- Mejor UX con tooltips y descripciones
- Preview mejorado de estadísticas  
- Indicadores visuales del estado de redes sociales
- Nota clara sobre nueva ubicación de horarios
- Mejor organización visual

Este ContentEditor está completo y listo para uso en producción, 
enfocándose exclusivamente en la gestión de contenido web básico.
*/

/*
=============================================================================
PROPÓSITO DEL COMPONENTE
=============================================================================

El componente ContentEditor es una herramienta completa de administración 
que permite a los administradores del gimnasio editar y gestionar toda la 
información visible en su página web pública. Funciona como un CMS 
(Sistema de Gestión de Contenido) específicamente diseñado para gimnasios.

FUNCIONALIDADES PRINCIPALES:
- Editor multi-sección con guardado independiente por área
- Gestión de horarios flexibles con múltiples franjas por día
- Configuración de redes sociales con activación/desactivación
- Edición de información básica (nombre, eslogan, descripción)
- Gestión de datos de contacto (teléfono, email, dirección)
- Control de estadísticas destacadas (miembros, entrenadores, etc.)
- Sistema de capacidad y ocupación por franja horaria
- Validación en tiempo real con indicadores visuales
- Vista previa de cambios antes de publicar

LO QUE VE EL USUARIO ADMINISTRADOR:
- Header con métricas rápidas de capacidad y ocupación
- Navegación por pestañas para 5 secciones principales:
  * Información Básica: Nombre, eslogan, descripción del gimnasio
  * Contacto: Teléfono, email, dirección, ciudad
  * Redes Sociales: Facebook, Instagram, Twitter, YouTube, WhatsApp
  * Horarios y Capacidad: Configuración flexible de horarios por día
  * Estadísticas: Números destacados que aparecen en la web
- Alertas de cambios sin guardar con indicadores visuales
- Botones de guardado independiente por sección
- Estados de carga durante el proceso de guardado

SISTEMA DE HORARIOS FLEXIBLES:
- Cada día puede estar abierto o cerrado independientemente
- Múltiples franjas horarias por día (ej: mañana, tarde, noche)
- Capacidad individual para cada franja horaria
- Simulador de ocupación en tiempo real
- Etiquetas opcionales para identificar franjas especiales
- Herramientas para duplicar, eliminar y aplicar capacidad masiva
- Vista previa del string de horarios que aparece en la web
- Métricas globales: capacidad total, espacios libres, día más ocupado

REDES SOCIALES:
- 5 plataformas principales: Facebook, Instagram, Twitter, YouTube, WhatsApp
- Activación/desactivación individual por plataforma
- Validación de URLs con placeholders específicos de Guatemala
- Vista previa de configuración activa
- Integración automática con el footer de la página web

ARCHIVOS Y COMPONENTES CONECTADOS:
=============================================================================

CONTEXTO UTILIZADO:
- AppContext (../../../contexts/AppContext)
  * showSuccess, showError: Notificaciones de éxito y error
  * isMobile: Detección de dispositivo móvil para UI responsiva

PROPS RECIBIDAS:
- gymConfig: Configuración actual del gimnasio desde el backend
  * Incluye todos los datos existentes (horarios, contacto, redes sociales)
  * Estados de carga (isLoading) para mostrar spinners apropiados
- onSave: Función callback para guardar cambios por sección
  * Recibe { section, data } para guardado independiente
- onUnsavedChanges: Callback para notificar cambios sin guardar
  * Permite al componente padre manejar navegación y advertencias

ESTADOS INTERNOS:
- formData: Objeto completo con toda la información editable
- sectionChanges: Tracking de cambios por sección para guardado selectivo
- activeSection: Sección actualmente visible en la interfaz
- savingSection: Control de estados de carga durante guardado
- lastChangedCapacity: Para función "aplicar capacidad a todas las franjas"

VALIDACIONES IMPLEMENTADAS:
- Información básica: Nombre y descripción obligatorios
- Horarios: Días abiertos deben tener al menos una franja horaria
- Capacidad: Entre 1 y 500 usuarios por franja
- URLs de redes sociales: Formato válido cuando están activas
- Datos de contacto: Formatos apropiados para teléfono y email

INTEGRACIÓN CON BACKEND:
- Carga datos existentes desde gymConfig prop
- Mapea horarios flexibles desde formato backend
- Convierte formatos simples a timeSlots cuando es necesario
- Guarda cambios por sección específica para eficiencia
- Genera string de horarios para mostrar en página web pública

MÉTRICAS Y ANÁLISIS:
- Capacidad total calculada automáticamente
- Porcentaje de ocupación promedio
- Identificación de día más ocupado
- Espacios disponibles en tiempo real
- Indicadores visuales de nivel de ocupación por franja

CARACTERÍSTICAS ESPECIALES:
- Guardado independiente por sección para evitar pérdida de datos
- Sistema de horarios altamente flexible (madrugada, eventos especiales)
- Herramientas de gestión masiva (aplicar capacidad a todas las franjas)
- Simulador de ocupación para pruebas y planificación
- Vista previa en tiempo real de cómo se verá en la página web
- Interfaz intuitiva con indicadores visuales de estado
- Soporte para múltiples tipos de gimnasios y horarios especiales

Este componente es fundamental para que los administradores mantengan 
actualizada la información pública de su gimnasio sin necesidad de 
conocimientos técnicos, proporcionando una experiencia de edición 
visual y amigable similar a plataformas CMS profesionales.
*/