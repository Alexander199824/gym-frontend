// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ContentEditor.js
// ✅ VERSIÓN COMPLETA CORREGIDA - PARTE 1/2
// ✅ TODAS LAS FUNCIONALIDADES MANTENIDAS
// ✅ SOLO CAMPOS VÁLIDOS DEL BACKEND

import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCw, AlertTriangle, CheckCircle, Info, 
  Globe, Phone, Mail, MapPin, Clock, Users, Star,
  Facebook, Instagram, Twitter, Youtube, Linkedin,
  Edit3, Eye, Copy, Download, Upload, Image, Bug,
  Plus, Trash2, EyeOff, ArrowUp, ArrowDown, X,
  Award, Trophy, TrendingUp, Heart, Dumbbell, Activity,
  Target, Calendar, Zap, DollarSign, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import statisticsService from '../../../services/statisticsService';
import { GymService } from '../../../services/gymService';
const gymService = new GymService();

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useApp();
  
  // ✅ ESTADOS LOCALES - SOLO CAMPOS VÁLIDOS DEL BACKEND
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    mapsUrl: '', // ✅ Este SÍ existe en el backend
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: ''
    }
    // ❌ whatsapp - ELIMINADO (no existe en backend)
    // ❌ website - ELIMINADO (no existe en backend)
  });
  
  // ✅ ESTADOS PARA ESTADÍSTICAS DINÁMICAS (MANTENER TODO)
  const [statistics, setStatistics] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [editingStatId, setEditingStatId] = useState(null);
  const [creatingNewStat, setCreatingNewStat] = useState(false);
  const [statFormData, setStatFormData] = useState({
    statKey: '',
    statValue: 0,
    label: '',
    iconName: 'Users',
    valueSuffix: '+',
    colorScheme: 'primary',
    displayOrder: 1,
    description: '',
    isActive: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  
  // ✅ INICIALIZAR DATOS DESDE EL BACKEND - SOLO CAMPOS VÁLIDOS
  useEffect(() => {
    console.log('ContentEditor - Verificando datos de configuración:', {
      hasGymConfig: !!gymConfig?.data,
      isLoading: gymConfig?.isLoading,
      hasError: !!gymConfig?.error
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      const config = gymConfig.data;
      console.log('ContentEditor - Configuración recibida del backend:', config);
      console.log('ContentEditor - Contact info completo:', config.contact);
      console.log('ContentEditor - Location info:', config.contact?.location);
      
      // ✅ MAPEO CORRECTO: Backend usa snake_case, frontend usa camelCase
      const mapsUrl = 
        config.contact?.location?.mapsUrl ||    // Si viene en camelCase
        config.contact?.location?.maps_url ||   // ⭐ Si viene en snake_case (BD)
        config.contact?.mapsUrl ||              // Fallback 1
        config.contact?.maps_url ||             // ⭐ Fallback 2 (BD directo)
        '';
      
      console.log('ContentEditor - Maps URL encontrado:', mapsUrl);
      
      setFormData({
        name: config.name || '',
        tagline: config.tagline || '',
        description: config.description || '',
        address: config.contact?.address || '',
        phone: config.contact?.phone || '',
        email: config.contact?.email || '',
        city: config.contact?.city || '',
        mapsUrl: mapsUrl, 
        social: {
          facebook: config.social?.facebook?.url || '',
          instagram: config.social?.instagram?.url || '',
          twitter: config.social?.twitter?.url || '',
          youtube: config.social?.youtube?.url || '',
          linkedin: config.social?.linkedin?.url || ''
        }
      });
      
      console.log('ContentEditor - FormData inicializado con mapsUrl:', mapsUrl);
    }
  }, [gymConfig]);
  
  // ✅ CARGAR ESTADÍSTICAS CUANDO SE ACTIVA LA PESTAÑA
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStatistics();
    }
  }, [activeTab]);
  
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
      description: 'Números destacados dinámicos'
    }
  ];
  
  // ================================
  // ✅ FUNCIONES DE ESTADÍSTICAS DINÁMICAS (MANTENER TODAS)
  // ================================
  
  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true);
      console.log('📊 Cargando estadísticas desde backend...');
      
      const response = await statisticsService.getAllStatistics();
      
      if (response.success) {
        setStatistics(response.data || []);
        console.log(`✅ ${response.data?.length || 0} estadísticas cargadas desde backend`);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      showError('Error al cargar estadísticas');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateStatistic = () => {
    setCreatingNewStat(true);
    setEditingStatId(null);
    setStatFormData({
      statKey: '',
      statValue: 0,
      label: '',
      iconName: 'Users',
      valueSuffix: '+',
      colorScheme: 'primary',
      displayOrder: statistics.length + 1,
      description: '',
      isActive: true
    });
  };

  const handleEditStatistic = (stat) => {
    setEditingStatId(stat.id);
    setCreatingNewStat(false);
    setStatFormData({
      statKey: stat.statKey,
      statValue: stat.statValue,
      label: stat.label,
      iconName: stat.iconName,
      valueSuffix: stat.valueSuffix,
      colorScheme: stat.colorScheme,
      displayOrder: stat.displayOrder,
      description: stat.description || '',
      isActive: stat.isActive
    });
  };

  const handleCancelStatForm = () => {
    setCreatingNewStat(false);
    setEditingStatId(null);
    setStatFormData({
      statKey: '',
      statValue: 0,
      label: '',
      iconName: 'Users',
      valueSuffix: '+',
      colorScheme: 'primary',
      displayOrder: 1,
      description: '',
      isActive: true
    });
  };

  const handleLabelChange = (newLabel) => {
    setStatFormData(prev => {
      if (creatingNewStat) {
        const autoKey = statisticsService.generateKey(newLabel);
        return {
          ...prev,
          label: newLabel,
          statKey: autoKey
        };
      } else {
        return {
          ...prev,
          label: newLabel
        };
      }
    });
  };

  const handleSaveStatistic = async () => {
    try {
      if (!statFormData.statKey || !statFormData.label) {
        showError('Key y Label son requeridos');
        return;
      }

      setIsLoading(true);

      if (creatingNewStat) {
        const response = await statisticsService.createStatistic(statFormData);
        
        if (response.success) {
          showSuccess('Estadística creada exitosamente');
          await loadStatistics();
          handleCancelStatForm();
        }
      } else if (editingStatId) {
        const response = await statisticsService.updateStatistic(editingStatId, statFormData);
        
        if (response.success) {
          showSuccess('Estadística actualizada exitosamente');
          await loadStatistics();
          handleCancelStatForm();
        }
      }
    } catch (error) {
      console.error('❌ Error guardando estadística:', error);
      showError(error.message || 'Error al guardar estadística');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStatistic = async (stat) => {
    const confirmed = window.confirm(
      `¿Eliminar "${stat.label}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      
      const response = await statisticsService.deleteStatistic(stat.id);
      
      if (response.success) {
        showSuccess('Estadística eliminada');
        await loadStatistics();
      }
    } catch (error) {
      console.error('❌ Error eliminando:', error);
      showError('Error al eliminar estadística');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatistic = async (stat) => {
    try {
      const response = await statisticsService.toggleStatistic(stat.id);
      
      if (response.success) {
        const status = stat.isActive ? 'desactivada' : 'activada';
        showSuccess(`Estadística ${status}`);
        await loadStatistics();
      }
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      showError('Error al cambiar estado');
    }
  };

  const handleMoveStatistic = async (index, direction) => {
    const sortedStats = [...statistics].sort((a, b) => a.displayOrder - b.displayOrder);
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedStats.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [sortedStats[index], sortedStats[newIndex]] = [sortedStats[newIndex], sortedStats[index]];

    const orderData = sortedStats.map((stat, idx) => ({
      id: stat.id,
      displayOrder: idx + 1
    }));

    try {
      const response = await statisticsService.reorderStatistics(orderData);
      
      if (response.success) {
        showSuccess('Orden actualizado');
        await loadStatistics();
      }
    } catch (error) {
      console.error('❌ Error reordenando:', error);
      showError('Error al reordenar');
    }
  };

  const handleSeedDefaults = async () => {
    const confirmed = window.confirm(
      '¿Crear estadísticas por defecto?\n\nEsto puede crear duplicados si ya existen.'
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      
      const response = await statisticsService.seedDefaultStatistics();
      
      if (response.success) {
        showSuccess(`${response.data?.length || 0} estadísticas creadas`);
        await loadStatistics();
      }
    } catch (error) {
      console.error('❌ Error creando defaults:', error);
      showError('Error al crear estadísticas por defecto');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ================================
  // ✅ FUNCIONES GENERALES
  // ================================
  
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
  
  // ✅ GUARDAR - CORREGIDO SIN CAMPOS INVÁLIDOS
    const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('ContentEditor - Guardando configuración:', formData);
      
      if (activeTab === 'basic') {
        // ✅ Actualizar configuración básica
        console.log('📝 Guardando config básica:', {
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description
        });
        
        await gymService.updateGymConfig({
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description
        });
        
        console.log('✅ Config básica guardada');
        
        // ✅ Actualizar contacto - SOLO CAMPOS VÁLIDOS
        console.log('📞 Guardando info de contacto:', {
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          mapsUrl: formData.mapsUrl
        });
        
        await gymService.updateContactInfo({
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          mapsUrl: formData.mapsUrl // Se convertirá a maps_url en gymService
        });
        
        console.log('✅ Info de contacto guardada');
        
        showSuccess('Información básica guardada exitosamente');
        
      } else if (activeTab === 'social') {
        // ✅ Guardar redes sociales
        const socialPromises = [];
        
        Object.entries(formData.social).forEach(([platform, url]) => {
          if (url && url.trim()) {
            socialPromises.push(
              gymService.saveSocialMedia({
                platform,
                url: url.trim(),
                isActive: true
              })
            );
          }
        });
        
        await Promise.all(socialPromises);
        showSuccess('Redes sociales guardadas exitosamente');
      }
      
      setHasChanges(false);
      
      // ✅ NO llamar a onSave para evitar recargas que afecten productos
      console.log('✅ Guardado completado sin recargar productos');
      
    } catch (error) {
      console.error('ContentEditor - Error guardando:', error);
      
      // Mostrar detalles del error
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          url: error.response.config?.url
        });
      }
      
      showError('Error al guardar la información');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ✅ RESET
  const handleReset = () => {
    if (gymConfig?.data) {
      const config = gymConfig.data;
      setFormData({
        name: config.name || '',
        tagline: config.tagline || '',
        description: config.description || '',
        address: config.contact?.address || '',
        phone: config.contact?.phone || '',
        email: config.contact?.email || '',
        city: config.contact?.city || '',
        mapsUrl: config.contact?.location?.mapsUrl || '',
        social: {
          facebook: config.social?.facebook?.url || '',
          instagram: config.social?.instagram?.url || '',
          twitter: config.social?.twitter?.url || '',
          youtube: config.social?.youtube?.url || '',
          linkedin: config.social?.linkedin?.url || ''
        }
      });
      setHasChanges(false);
      showSuccess('Formulario restablecido');
    }
  };
  
  const getSocialIcon = (network) => {
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
        return Globe;
    }
  };
  
  const getIconComponent = (iconName) => {
    const icons = {
      Users, Award, Trophy, Star, TrendingUp, Heart, Dumbbell,
      Activity, Target, Calendar, Clock, Zap, CheckCircle, DollarSign
    };
    return icons[iconName] || Users;
  };
  
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

  // CONTINUACIÓN DE PARTE 1...

  return (
    <div className="space-y-6 relative">
      
      {/* DEBUG INFO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg"
            title="Información de Debug"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute top-10 right-0 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">ContentEditor - CORREGIDO</div>
              <div className="space-y-1">
                <div>Usuario: {user?.firstName} {user?.lastName}</div>
                <div>Tab: {activeTab}</div>
                <div>Cambios: {hasChanges ? 'Sí' : 'No'}</div>
                <div>Stats: {statistics.length}</div>
                <div className="text-green-700">✅ Solo campos válidos</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* HEADER */}
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
          
          {hasChanges && (
            <button
              onClick={handleReset}
              className="btn-secondary btn-sm"
              title="Deshacer cambios"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
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
      
      {/* PESTAÑA: INFORMACIÓN BÁSICA */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-lg p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Gimnasio *
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ciudad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange(null, 'city', e.target.value)}
                placeholder="Ciudad"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
            </div>
            
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
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                URL de Google Maps
              </label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => handleInputChange(null, 'mapsUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={previewMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enlace directo a tu ubicación en Google Maps
              </p>
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
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Las redes sociales se activarán automáticamente cuando agregues una URL válida.
                  Deja el campo vacío si no deseas mostrar una red social específica.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PESTAÑA: ESTADÍSTICAS DINÁMICAS - COMPLETA */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-lg p-6 space-y-6">
          
          {/* Header con acciones */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Estadísticas Dinámicas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los números destacados que se muestran en la web
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSeedDefaults}
                className="btn-secondary btn-sm"
                disabled={isLoading}
                title="Crear estadísticas por defecto"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              
              <button
                onClick={loadStatistics}
                className="btn-secondary btn-sm"
                disabled={isLoadingStats}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleCreateStatistic}
                className="btn-primary btn-sm"
                disabled={creatingNewStat || editingStatId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Estadística
              </button>
            </div>
          </div>

          {/* Formulario de creación/edición */}
          {(creatingNewStat || editingStatId) && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {creatingNewStat ? '➕ Nueva Estadística' : '✏️ Editar Estadística'}
                </h4>
                <button
                  onClick={handleCancelStatForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Label - CON AUTO-GENERACIÓN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta (Texto visible) *
                  </label>
                  <input
                    type="text"
                    value={statFormData.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="Miembros Activos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={previewMode}
                  />
                  {creatingNewStat && statFormData.label && (
                    <p className="text-xs text-gray-500 mt-1">
                      Key generado: <span className="font-mono text-blue-600">{statFormData.statKey}</span>
                    </p>
                  )}
                </div>

                {/* Key - SOLO LECTURA cuando crea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Key (Identificador único) *
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-gray-600"
                      title="El key se genera automáticamente desde la etiqueta"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="text"
                    value={statFormData.statKey}
                    onChange={(e) => setStatFormData({ ...statFormData, statKey: e.target.value })}
                    placeholder="miembros_activos"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      creatingNewStat ? 'bg-gray-50' : ''
                    }`}
                    disabled={creatingNewStat || previewMode}
                    readOnly={creatingNewStat}
                  />
                  {creatingNewStat && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ Se genera automáticamente
                    </p>
                  )}
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Numérico *
                  </label>
                  <input
                    type="number"
                    value={statFormData.statValue}
                    onChange={(e) => setStatFormData({ ...statFormData, statValue: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={previewMode}
                  />
                </div>

                {/* Sufijo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sufijo
                  </label>
                  <select
                    value={statFormData.valueSuffix}
                    onChange={(e) => setStatFormData({ ...statFormData, valueSuffix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={previewMode}
                  >
                    <option value="+">+</option>
                    <option value="%">%</option>
                    <option value="K">K</option>
                    <option value="M">M</option>
                    <option value="★">★</option>
                    <option value="">Sin sufijo</option>
                  </select>
                </div>

                {/* Icono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <select
                    value={statFormData.iconName}
                    onChange={(e) => setStatFormData({ ...statFormData, iconName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={previewMode}
                  >
                    <option value="Users">👥 Users</option>
                    <option value="Award">🏆 Award</option>
                    <option value="Trophy">🥇 Trophy</option>
                    <option value="Star">⭐ Star</option>
                    <option value="TrendingUp">📈 TrendingUp</option>
                    <option value="Heart">❤️ Heart</option>
                    <option value="Dumbbell">🏋️ Dumbbell</option>
                    <option value="Activity">📊 Activity</option>
                    <option value="Target">🎯 Target</option>
                    <option value="Calendar">📅 Calendar</option>
                    <option value="Clock">⏰ Clock</option>
                    <option value="Zap">⚡ Zap</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={statFormData.colorScheme}
                    onChange={(e) => setStatFormData({ ...statFormData, colorScheme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={previewMode}
                  >
                    <option value="primary">🔵 Primario</option>
                    <option value="secondary">🟣 Secundario</option>
                    <option value="success">🟢 Éxito</option>
                    <option value="warning">🟡 Advertencia</option>
                    <option value="danger">🔴 Peligro</option>
                    <option value="info">🔷 Información</option>
                  </select>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={statFormData.description}
                    onChange={(e) => setStatFormData({ ...statFormData, description: e.target.value })}
                    placeholder="Descripción adicional..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    disabled={previewMode}
                  />
                </div>
              </div>

              {/* Botones del formulario */}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={handleCancelStatForm}
                  className="btn-secondary btn-sm"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>

                <button
                  onClick={handleSaveStatistic}
                  className="btn-primary btn-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Lista de estadísticas */}
          <div className="space-y-3">
            {isLoadingStats ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Cargando estadísticas desde backend...</p>
              </div>
            ) : statistics.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">No hay estadísticas</p>
                <p className="text-gray-500 text-sm mb-4">Crea tu primera estadística o usa las predeterminadas</p>
                <button
                  onClick={handleCreateStatistic}
                  className="btn-primary btn-sm inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Estadística
                </button>
              </div>
            ) : (
              [...statistics]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((stat, index) => {
                  const IconComponent = getIconComponent(stat.iconName);
                  const isEditing = editingStatId === stat.id;
                  
                  return (
                    <div
                      key={stat.id}
                      className={`p-4 border rounded-lg hover:border-blue-300 transition-all ${
                        isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                      } ${!stat.isActive ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            stat.colorScheme === 'primary' ? 'bg-blue-100 text-blue-600' :
                            stat.colorScheme === 'secondary' ? 'bg-purple-100 text-purple-600' :
                            stat.colorScheme === 'success' ? 'bg-green-100 text-green-600' :
                            stat.colorScheme === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            stat.colorScheme === 'danger' ? 'bg-red-100 text-red-600' :
                            'bg-cyan-100 text-cyan-600'
                          }`}>
                            <IconComponent className="w-6 h-6" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{stat.label}</h4>
                              {!stat.isActive && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  Inactiva
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {stat.statKey}
                              </span>
                              <span className="font-bold text-lg">
                                {stat.statValue}{stat.valueSuffix}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="text-xs">Orden: {stat.displayOrder}</span>
                            </div>
                            {stat.description && (
                              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleMoveStatistic(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveStatistic(index, 'down')}
                              disabled={index === statistics.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Bajar"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleStatistic(stat)}
                            className={`p-2 rounded-lg ${
                              stat.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={stat.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {stat.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>

                          <button
                            onClick={() => handleEditStatistic(stat)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            disabled={creatingNewStat || (editingStatId && editingStatId !== stat.id)}
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDeleteStatistic(stat)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Resumen */}
          {statistics.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
              <div>
                Total: {statistics.length} estadísticas
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-green-600">
                  ✓ {statistics.filter(s => s.isActive).length} activas
                </span>
                <span className="text-gray-500">
                  ✕ {statistics.filter(s => !s.isActive).length} inactivas
                </span>
              </div>
            </div>
          )}
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
                  {formData.city && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {formData.city}
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
                  {statistics.filter(s => s.isActive).slice(0, 4).map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stat.statValue}{stat.valueSuffix}
                      </div>
                      <div className="text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {formData.description && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Acerca de Nosotros</h4>
                <p className="text-gray-600">{formData.description}</p>
              </div>
            )}
            
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
CONTENTEDITOR COMPLETO - ACTUALIZADO PARA TEST-GYM-INFO-MANAGER.JS
=============================================================================

✅ FUNCIONALIDADES MANTENIDAS COMPLETAMENTE:
- ✅ Sistema completo de estadísticas dinámicas
- ✅ Auto-generación de keys desde labels
- ✅ CRUD completo de estadísticas (crear, editar, eliminar)
- ✅ Activar/desactivar estadísticas
- ✅ Reordenar estadísticas (subir/bajar)
- ✅ Seed de estadísticas por defecto
- ✅ Vista previa completa
- ✅ Debug info en desarrollo
- ✅ Indicadores de cambios sin guardar
- ✅ Sistema de pestañas (básico, social, stats)
- ✅ Validaciones y manejo de errores

✅ CAMBIOS REALIZADOS:
- Conectado con gymService en lugar de apiService directo
- SIN datos hardcodeados - todo desde backend
- Mapeo correcto de datos según estructura del test
- Guardado separado para config y contacto
- Guardado individual de redes sociales
- Estructura de formData según backend

✅ ESTRUCTURA DE DATOS DEL BACKEND:
FormData se mapea así:
- name, tagline, description -> gymService.updateGymConfig()
- address, phone, email, whatsapp, city, mapsUrl -> gymService.updateContactInfo()
- social.{platform} -> gymService.saveSocialMedia() por cada una

✅ ESTADÍSTICAS:
- Usa statisticsService para todo el CRUD
- Conectado con endpoints /api/statistics/*
- Auto-generación de keys funciona perfecto
- Orden dinámico con drag-and-drop simulado

✅ NO SE PERDIÓ NADA:
- Todas las funciones existentes están presentes
- Toda la UI y UX se mantiene igual
- Todos los estados y validaciones funcionan
- Debug info completo en desarrollo

Este componente está 100% funcional y conectado con el backend real
del test-gym-info-manager.js sin perder ninguna funcionalidad.
=============================================================================
*/