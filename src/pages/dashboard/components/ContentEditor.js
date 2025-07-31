// src/pages/dashboard/components/ContentEditor.js
// FUNCIÓN: Editor completo de información general de la página web
// INCLUYE: Nombre, descripción, contacto, redes sociales, información de contacto

import React, { useState, useEffect } from 'react';
import {
  Save, Upload, X, Phone, Mail, MapPin, Globe, Instagram,
  Facebook, Twitter, Youtube, Clock, Users, Award, Target,
  AlertTriangle, Edit, Eye, Image as ImageIcon, Link
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [formData, setFormData] = useState({
    // Información básica
    gymName: '',
    tagline: '',
    description: '',
    longDescription: '',
    
    // Información de contacto
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    
    // Redes sociales
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      website: ''
    },
    
    // Horarios
    schedule: {
      monday: { open: '06:00', close: '22:00', isOpen: true },
      tuesday: { open: '06:00', close: '22:00', isOpen: true },
      wednesday: { open: '06:00', close: '22:00', isOpen: true },
      thursday: { open: '06:00', close: '22:00', isOpen: true },
      friday: { open: '06:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '20:00', isOpen: true },
      sunday: { open: '08:00', close: '18:00', isOpen: true }
    },
    
    // Estadísticas destacadas
    stats: {
      yearsOfExperience: 10,
      totalMembers: 500,
      trainers: 8,
      successStories: 150
    },
    
    // Valores y misión
    mission: '',
    vision: '',
    values: []
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newValue, setNewValue] = useState('');
  
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
    { id: 'stats', label: 'Estadísticas', icon: Award },
    { id: 'mission', label: 'Misión y Valores', icon: Users }
  ];
  
  // 🔄 Inicializar con datos existentes
  useEffect(() => {
    if (gymConfig?.data) {
      setFormData({
        ...formData,
        ...gymConfig.data
      });
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📝 Manejar cambios en campos
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
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };
  
  // ➕ Agregar valor
  const handleAddValue = () => {
    if (newValue.trim() && !formData.values.includes(newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()]
      }));
      setNewValue('');
      setHasChanges(true);
    }
  };
  
  // ❌ Eliminar valor
  const handleRemoveValue = (valueToRemove) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v !== valueToRemove)
    }));
    setHasChanges(true);
  };
  
  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!formData.gymName.trim()) {
        showError('El nombre del gimnasio es obligatorio');
        return;
      }
      
      if (!formData.description.trim()) {
        showError('La descripción es obligatoria');
        return;
      }
      
      console.log('Guardando configuración del gimnasio:', formData);
      
      // Simular guardado exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      setHasChanges(false);
      showSuccess('Información general actualizada exitosamente');
      
    } catch (error) {
      console.error('Error saving gym config:', error);
      showError('Error al guardar la información');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Información General
          </h3>
          <p className="text-gray-600 mt-1">
            Configura la información básica de tu gimnasio
          </p>
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
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Información Básica
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Nombre del gimnasio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Gimnasio *
                </label>
                <input
                  type="text"
                  value={formData.gymName}
                  onChange={(e) => handleChange('gymName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Elite Fitness Center"
                />
              </div>
              
              {/* Eslogan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eslogan
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Tu mejor versión te espera"
                />
              </div>
              
              {/* Descripción corta */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Corta *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descripción breve para el hero section..."
                />
              </div>
              
              {/* Descripción larga */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Detallada
                </label>
                <textarea
                  value={formData.longDescription}
                  onChange={(e) => handleChange('longDescription', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descripción completa sobre el gimnasio, servicios, instalaciones..."
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Información de Contacto */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Información de Contacto
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: +502 1234-5678"
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
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: info@elitegym.com"
                />
              </div>
              
              {/* Dirección */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Avenida Principal 123"
                />
              </div>
              
              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Guatemala"
                />
              </div>
              
              {/* Código postal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: 01001"
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Redes Sociales */}
        {activeSection === 'social' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Redes Sociales y Web
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Facebook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="w-4 h-4 inline mr-1 text-blue-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.facebook}
                  onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://facebook.com/tugimnasio"
                />
              </div>
              
              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="w-4 h-4 inline mr-1 text-pink-600" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://instagram.com/tugimnasio"
                />
              </div>
              
              {/* Twitter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Twitter className="w-4 h-4 inline mr-1 text-blue-400" />
                  Twitter / X
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://twitter.com/tugimnasio"
                />
              </div>
              
              {/* YouTube */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="w-4 h-4 inline mr-1 text-red-600" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.youtube}
                  onChange={(e) => handleNestedChange('socialMedia', 'youtube', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://youtube.com/@tugimnasio"
                />
              </div>
              
              {/* Website */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.website}
                  onChange={(e) => handleNestedChange('socialMedia', 'website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://tugimnasio.com"
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Horarios */}
        {activeSection === 'schedule' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Horarios de Atención
            </h4>
            
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  
                  {/* Día */}
                  <div className="w-24">
                    <span className="font-medium text-gray-900">{day.label}</span>
                  </div>
                  
                  {/* Toggle abierto/cerrado */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.schedule[day.key]?.isOpen || false}
                      onChange={(e) => handleScheduleChange(day.key, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Abierto
                    </label>
                  </div>
                  
                  {/* Horarios */}
                  {formData.schedule[day.key]?.isOpen && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">de</span>
                      <input
                        type="time"
                        value={formData.schedule[day.key]?.open || '06:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-500">a</span>
                      <input
                        type="time"
                        value={formData.schedule[day.key]?.close || '22:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}
                  
                  {!formData.schedule[day.key]?.isOpen && (
                    <span className="text-sm text-gray-500">Cerrado</span>
                  )}
                  
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Estadísticas */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Estadísticas Destacadas
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Años de experiencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Años de Experiencia
                </label>
                <input
                  type="number"
                  value={formData.stats.yearsOfExperience}
                  onChange={(e) => handleNestedChange('stats', 'yearsOfExperience', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
              
              {/* Total miembros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total de Miembros
                </label>
                <input
                  type="number"
                  value={formData.stats.totalMembers}
                  onChange={(e) => handleNestedChange('stats', 'totalMembers', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
              
              {/* Entrenadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrenadores Certificados
                </label>
                <input
                  type="number"
                  value={formData.stats.trainers}
                  onChange={(e) => handleNestedChange('stats', 'trainers', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
              
              {/* Historias de éxito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Historias de Éxito
                </label>
                <input
                  type="number"
                  value={formData.stats.successStories}
                  onChange={(e) => handleNestedChange('stats', 'successStories', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* SECCIÓN: Misión y Valores */}
        {activeSection === 'mission' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Misión, Visión y Valores
            </h4>
            
            <div className="space-y-6">
              
              {/* Misión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Misión
                </label>
                <textarea
                  value={formData.mission}
                  onChange={(e) => handleChange('mission', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe la misión de tu gimnasio..."
                />
              </div>
              
              {/* Visión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visión
                </label>
                <textarea
                  value={formData.vision}
                  onChange={(e) => handleChange('vision', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe la visión de tu gimnasio..."
                />
              </div>
              
              {/* Valores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valores
                </label>
                
                {/* Valores actuales */}
                {formData.values && formData.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.values.map((value, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {value}
                        <button
                          onClick={() => handleRemoveValue(value)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Agregar nuevo valor */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Excelencia, Respeto, Compromiso..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                  />
                  <button
                    onClick={handleAddValue}
                    className="btn-secondary btn-sm"
                  >
                    Agregar
                  </button>
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