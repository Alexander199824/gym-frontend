// src/pages/dashboard/components/ContentEditor.js
// FUNCIÓN: Editor CORREGIDO - Muestra datos actuales del backend al abrir
// CAMBIOS: Mejor inicialización, logs debug, estados de carga

import React, { useState, useEffect } from 'react';
import {
  Save, Phone, Mail, MapPin, Globe, Instagram,
  Facebook, Twitter, Youtube, Clock, Users, Award, Target,
  AlertTriangle, MessageSquare, Star, Trophy, Loader
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    contact: {
      phone: '',
      email: '',
      address: '',
      city: '',
      zipCode: ''
    },
    social: {
      facebook: { url: '', active: true },
      instagram: { url: '', active: true },
      twitter: { url: '', active: true },
      youtube: { url: '', active: true },
      whatsapp: { url: '', active: true }
    },
    hours: {
      monday: { open: '06:00', close: '22:00', isOpen: true },
      tuesday: { open: '06:00', close: '22:00', isOpen: true },
      wednesday: { open: '06:00', close: '22:00', isOpen: true },
      thursday: { open: '06:00', close: '22:00', isOpen: true },
      friday: { open: '06:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '20:00', isOpen: true },
      sunday: { open: '08:00', close: '18:00', isOpen: true }
    },
    stats: {
      members: 500,
      trainers: 8,
      experience: 10,
      satisfaction: 95
    }
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // 📅 Días de la semana
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];
  
  // 🔗 Secciones del editor
  const sections = [
    { id: 'basic', label: 'Información Básica', icon: Target },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'social', label: 'Redes Sociales', icon: Globe },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'stats', label: 'Estadísticas', icon: Award }
  ];
  
  // 🌐 Redes sociales disponibles
  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'blue-600', placeholder: 'https://facebook.com/tugimnasio' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink-600', placeholder: 'https://instagram.com/tugimnasio' },
    { key: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'blue-400', placeholder: 'https://twitter.com/tugimnasio' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'red-600', placeholder: 'https://youtube.com/@tugimnasio' },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'green-600', placeholder: 'https://wa.me/502XXXXXXXX' }
  ];
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - MEJORADO
  useEffect(() => {
    console.log('🔄 ContentEditor - Checking for gym config data:', {
      hasGymConfig: !!gymConfig,
      isLoading: gymConfig?.isLoading,
      hasData: !!gymConfig?.data,
      dataKeys: gymConfig?.data ? Object.keys(gymConfig.data) : []
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      console.log('📥 ContentEditor - Loading data from backend:', gymConfig.data);
      
      const backendData = gymConfig.data;
      
      // Mapear datos del backend con valores por defecto seguros
      const newFormData = {
        name: backendData.name || '',
        tagline: backendData.tagline || '',
        description: backendData.description || '',
        
        contact: {
          phone: backendData.contact?.phone || '',
          email: backendData.contact?.email || '',
          address: backendData.contact?.address || '',
          city: backendData.contact?.city || '',
          zipCode: backendData.contact?.zipCode || ''
        },
        
        social: {
          facebook: {
            url: backendData.social?.facebook?.url || '',
            active: backendData.social?.facebook?.active !== false
          },
          instagram: {
            url: backendData.social?.instagram?.url || '',
            active: backendData.social?.instagram?.active !== false
          },
          twitter: {
            url: backendData.social?.twitter?.url || '',
            active: backendData.social?.twitter?.active !== false
          },
          youtube: {
            url: backendData.social?.youtube?.url || '',
            active: backendData.social?.youtube?.active !== false
          },
          whatsapp: {
            url: backendData.social?.whatsapp?.url || '',
            active: backendData.social?.whatsapp?.active !== false
          }
        },
        
        hours: backendData.hours || {
          monday: { open: '06:00', close: '22:00', isOpen: true },
          tuesday: { open: '06:00', close: '22:00', isOpen: true },
          wednesday: { open: '06:00', close: '22:00', isOpen: true },
          thursday: { open: '06:00', close: '22:00', isOpen: true },
          friday: { open: '06:00', close: '22:00', isOpen: true },
          saturday: { open: '08:00', close: '20:00', isOpen: true },
          sunday: { open: '08:00', close: '18:00', isOpen: true }
        },
        
        stats: {
          members: backendData.stats?.members || 500,
          trainers: backendData.stats?.trainers || 8,
          experience: backendData.stats?.experience || 10,
          satisfaction: backendData.stats?.satisfaction || 95
        }
      };
      
      console.log('✅ ContentEditor - Data mapped successfully:', {
        name: newFormData.name,
        hasContact: !!newFormData.contact.phone,
        socialPlatforms: Object.keys(newFormData.social).filter(key => newFormData.social[key].url),
        statsLoaded: Object.keys(newFormData.stats)
      });
      
      setFormData(newFormData);
      setIsDataLoaded(true);
      
    } else if (gymConfig?.isLoading) {
      console.log('⏳ ContentEditor - Data is still loading...');
      setIsDataLoaded(false);
    } else {
      console.log('⚠️ ContentEditor - No data available');
      setIsDataLoaded(true); // Permitir mostrar formulario vacío
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📝 Manejar cambios en campos simples
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };
  
  // 📝 Manejar cambios anidados
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };
  
  // 📝 Manejar cambios de horarios
  const handleScheduleChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };
  
  // 🌐 Manejar cambios de redes sociales
  const handleSocialChange = (platform, field, value) => {
    setFormData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [platform]: {
          ...prev.social[platform],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };
  
  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        showError('El nombre del gimnasio es obligatorio');
        return;
      }
      
      if (!formData.description.trim()) {
        showError('La descripción es obligatoria');
        return;
      }
      
      console.log('💾 Saving gym configuration:', formData);
      
      const dataToSave = {
        ...formData,
        hours: {
          ...formData.hours,
          full: generateFullScheduleString(formData.hours)
        }
      };
      
      onSave(dataToSave);
      setHasChanges(false);
      showSuccess('Información general actualizada exitosamente');
      
    } catch (error) {
      console.error('Error saving gym config:', error);
      showError('Error al guardar la información');
    }
  };
  
  // 📅 Generar string completo de horarios
  const generateFullScheduleString = (hours) => {
    const openDays = daysOfWeek.filter(day => hours[day.key]?.isOpen);
    
    if (openDays.length === 0) {
      return 'Consultar horarios';
    }
    
    if (openDays.length === 7) {
      const firstDayHours = hours[openDays[0].key];
      const allSameHours = openDays.every(day => 
        hours[day.key].open === firstDayHours.open && 
        hours[day.key].close === firstDayHours.close
      );
      
      if (allSameHours) {
        return `Todos los días: ${firstDayHours.open} - ${firstDayHours.close}`;
      }
    }
    
    const groupedHours = {};
    openDays.forEach(day => {
      const dayHours = hours[day.key];
      const hourKey = `${dayHours.open}-${dayHours.close}`;
      if (!groupedHours[hourKey]) {
        groupedHours[hourKey] = [];
      }
      groupedHours[hourKey].push(day.label);
    });
    
    const scheduleStrings = Object.entries(groupedHours).map(([hourKey, days]) => {
      const [open, close] = hourKey.split('-');
      if (days.length === 1) {
        return `${days[0]}: ${open} - ${close}`;
      } else {
        return `${days.join(', ')}: ${open} - ${close}`;
      }
    });
    
    return scheduleStrings.join(' | ');
  };

  // 🔄 Mostrar loading mientras se cargan los datos
  if (gymConfig?.isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando información actual del gimnasio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Información General
          </h3>
          <p className="text-gray-600 mt-1">
            Configura la información básica que aparece en tu página web
          </p>
          
          {/* Mostrar datos actuales cargados */}
          {isDataLoaded && formData.name && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              ✅ Datos actuales cargados: {formData.name}
            </div>
          )}
        </div>
        
        {hasChanges && (
          <button
            onClick={handleSave}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        )}
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar en la información general.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔗 NAVEGACIÓN POR SECCIONES */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 inline mr-2" />
              {section.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 📋 CONTENIDO SEGÚN SECCIÓN ACTIVA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* SECCIÓN: Información Básica */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Información Básica del Gimnasio
              </h4>
              
              {/* Mostrar valores actuales */}
              {formData.name && (
                <div className="text-sm text-gray-500">
                  Actual: <span className="font-medium">{formData.name}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Nombre del gimnasio */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Gimnasio *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Elite Fitness Center"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece en el título principal de la página y en la navegación
                </p>
              </div>
              
              {/* Eslogan */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eslogan / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Tu mejor versión te espera"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Frase corta que aparece bajo el nombre en la sección principal
                </p>
              </div>
              
              {/* Descripción */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Principal *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descripción atractiva que aparece en la sección principal de tu página web..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Descripción principal que aparece en la sección hero de la página
                </p>
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Información de Contacto */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Información de Contacto
              </h4>
              
              {/* Mostrar contacto actual */}
              {formData.contact.phone && (
                <div className="text-sm text-gray-500">
                  Tel actual: <span className="font-medium">{formData.contact.phone}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: +502 1234-5678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece en la sección de contacto y footer
                </p>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: info@elitegym.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email de contacto público
                </p>
              </div>
              
              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.contact.address}
                  onChange={(e) => handleNestedChange('contact', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Avenida Principal 123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dirección física del gimnasio
                </p>
              </div>
              
              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.contact.city}
                  onChange={(e) => handleNestedChange('contact', 'city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Guatemala"
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Redes Sociales */}
        {activeSection === 'social' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Redes Sociales
              </h4>
              
              {/* Contador de redes configuradas */}
              <div className="text-sm text-gray-500">
                Configuradas: {Object.values(formData.social).filter(s => s.url && s.active).length}/5
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Las redes sociales aparecen en el footer de tu página web
            </p>
            
            <div className="space-y-6">
              {socialPlatforms.map((platform) => (
                <div key={platform.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <platform.icon className={`w-5 h-5 text-${platform.color} mr-3`} />
                      <h5 className="font-medium text-gray-900">{platform.label}</h5>
                      
                      {/* Mostrar URL actual si existe */}
                      {formData.social[platform.key]?.url && (
                        <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Configurado
                        </span>
                      )}
                    </div>
                    
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.social[platform.key]?.active !== false}
                        onChange={(e) => handleSocialChange(platform.key, 'active', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Activo</span>
                    </label>
                  </div>
                  
                  <input
                    type="url"
                    value={formData.social[platform.key]?.url || ''}
                    onChange={(e) => handleSocialChange(platform.key, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={platform.placeholder}
                    disabled={formData.social[platform.key]?.active === false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Horarios */}
        {activeSection === 'schedule' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Horarios de Atención
            </h4>
            <p className="text-gray-600 mb-6">
              Los horarios aparecen en la sección de contacto de tu página web
            </p>
            
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  
                  {/* Día */}
                  <div className="w-28">
                    <span className="font-medium text-gray-900">{day.label}</span>
                  </div>
                  
                  {/* Toggle abierto/cerrado */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hours[day.key]?.isOpen || false}
                      onChange={(e) => handleScheduleChange(day.key, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Abierto
                    </label>
                  </div>
                  
                  {/* Horarios */}
                  {formData.hours[day.key]?.isOpen ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">de</span>
                      <input
                        type="time"
                        value={formData.hours[day.key]?.open || '06:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-500">a</span>
                      <input
                        type="time"
                        value={formData.hours[day.key]?.close || '22:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Cerrado</span>
                  )}
                  
                </div>
              ))}
            </div>
            
            {/* Preview del string de horarios */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h6 className="font-medium text-blue-900 mb-2">Vista previa en página web:</h6>
              <p className="text-blue-800 text-sm">
                "{generateFullScheduleString(formData.hours)}"
              </p>
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Estadísticas */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Estadísticas Destacadas
            </h4>
            <p className="text-gray-600 mb-6">
              Las estadísticas aparecen en la sección principal (hero) de tu página web
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Miembros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Total de Miembros
                </label>
                <input
                  type="number"
                  value={formData.stats.members}
                  onChange={(e) => handleNestedChange('stats', 'members', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de miembros activos del gimnasio
                </p>
              </div>
              
              {/* Entrenadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="w-4 h-4 inline mr-1" />
                  Entrenadores Certificados
                </label>
                <input
                  type="number"
                  value={formData.stats.trainers}
                  onChange={(e) => handleNestedChange('stats', 'trainers', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de entrenadores profesionales
                </p>
              </div>
              
              {/* Años de experiencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Años de Experiencia
                </label>
                <input
                  type="number"
                  value={formData.stats.experience}
                  onChange={(e) => handleNestedChange('stats', 'experience', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Años que lleva operando el gimnasio
                </p>
              </div>
              
              {/* Satisfacción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Satisfacción (%)
                </label>
                <input
                  type="number"
                  value={formData.stats.satisfaction}
                  onChange={(e) => handleNestedChange('stats', 'satisfaction', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de satisfacción de clientes
                </p>
              </div>
              
            </div>
            
            {/* Preview de estadísticas */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h6 className="font-medium text-gray-900 mb-4">Vista previa en página web:</h6>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formData.stats.members}
                  </div>
                  <div className="text-sm text-gray-600">Miembros</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formData.stats.trainers}
                  </div>
                  <div className="text-sm text-gray-600">Entrenadores</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formData.stats.experience}
                  </div>
                  <div className="text-sm text-gray-600">Años</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formData.stats.satisfaction}%
                  </div>
                  <div className="text-sm text-gray-600">Satisfacción</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
    </div>
  );
};

export default ContentEditor;