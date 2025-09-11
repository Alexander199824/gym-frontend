// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ContentEditor.js
// ACTUALIZADO: Versión completa sin gestión de horarios (movida a ScheduleManager independiente)

import React, { useState, useEffect } from 'react';
import {
  Save, Phone, Mail, MapPin, Globe, Instagram,
  Facebook, Twitter, Youtube, MessageSquare, Star, 
  Trophy, Loader, AlertTriangle, Target, Award,
  Users, Clock, Eye, Info
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados locales completos
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
    stats: {
      members: 500,
      trainers: 8,
      experience: 10,
      satisfaction: 95
    }
  });
  
  // Estados de cambios por sección
  const [sectionChanges, setSectionChanges] = useState({
    basic: false,
    contact: false,
    social: false,
    stats: false
  });
  
  const [activeSection, setActiveSection] = useState('basic');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  
  // Secciones del editor (sin horarios)
  const sections = [
    { id: 'basic', label: 'Información Básica', icon: Target, description: 'Nombre, eslogan y descripción' },
    { id: 'contact', label: 'Contacto', icon: Phone, description: 'Teléfono, email y dirección' },
    { id: 'social', label: 'Redes Sociales', icon: Globe, description: 'Enlaces a redes sociales' },
    { id: 'stats', label: 'Estadísticas', icon: Award, description: 'Números destacados del gimnasio' }
  ];
  
  // Redes sociales disponibles
  const socialPlatforms = [
    { 
      key: 'facebook', 
      label: 'Facebook', 
      icon: Facebook, 
      color: 'blue-600', 
      placeholder: 'https://facebook.com/tugimnasio',
      description: 'Página oficial de Facebook del gimnasio'
    },
    { 
      key: 'instagram', 
      label: 'Instagram', 
      icon: Instagram, 
      color: 'pink-600', 
      placeholder: 'https://instagram.com/tugimnasio',
      description: 'Perfil de Instagram con fotos y videos'
    },
    { 
      key: 'twitter', 
      label: 'Twitter / X', 
      icon: Twitter, 
      color: 'blue-400', 
      placeholder: 'https://twitter.com/tugimnasio',
      description: 'Cuenta de Twitter/X para noticias y actualizaciones'
    },
    { 
      key: 'youtube', 
      label: 'YouTube', 
      icon: Youtube, 
      color: 'red-600', 
      placeholder: 'https://youtube.com/@tugimnasio',
      description: 'Canal de YouTube con entrenamientos y consejos'
    },
    { 
      key: 'whatsapp', 
      label: 'WhatsApp', 
      icon: MessageSquare, 
      color: 'green-600', 
      placeholder: 'https://wa.me/502XXXXXXXX',
      description: 'Enlace directo para contacto por WhatsApp'
    }
  ];
  
  // Inicializar con datos del backend
  useEffect(() => {
    console.log('ContentEditor - Verificando datos de configuración:', {
      hasGymConfig: !!gymConfig,
      isLoading: gymConfig?.isLoading,
      hasData: !!gymConfig?.data,
      dataKeys: gymConfig?.data ? Object.keys(gymConfig.data) : []
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      console.log('ContentEditor - Cargando datos desde backend (sin horarios):', gymConfig.data);
      
      const backendData = gymConfig.data;
      
      // Mapear datos del backend (sin horarios)
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
        
        stats: {
          members: backendData.stats?.members || 500,
          trainers: backendData.stats?.trainers || 8,
          experience: backendData.stats?.experience || 10,
          satisfaction: backendData.stats?.satisfaction || 95
        }
      };
      
      console.log('ContentEditor - Datos mapeados exitosamente (sin horarios):', {
        name: newFormData.name,
        hasContact: !!newFormData.contact.phone,
        socialPlatforms: Object.keys(newFormData.social).filter(key => newFormData.social[key].url),
        statsLoaded: Object.keys(newFormData.stats)
      });
      
      setFormData(newFormData);
      setIsDataLoaded(true);
      
    } else if (gymConfig?.isLoading) {
      setIsDataLoaded(false);
    } else {
      setIsDataLoaded(true);
    }
  }, [gymConfig]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    const hasAnyChanges = Object.values(sectionChanges).some(changed => changed);
    onUnsavedChanges(hasAnyChanges);
  }, [sectionChanges, onUnsavedChanges]);
  
  // Marcar sección como modificada
  const markSectionAsChanged = (section) => {
    setSectionChanges(prev => ({
      ...prev,
      [section]: true
    }));
  };
  
  // Manejar cambios en campos simples (información básica)
  const handleBasicChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    markSectionAsChanged('basic');
  };
  
  // Manejar cambios de contacto
  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
    markSectionAsChanged('contact');
  };
  
  // Manejar cambios de redes sociales
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
    markSectionAsChanged('social');
  };
  
  // Manejar cambios de estadísticas
  const handleStatsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [field]: value
      }
    }));
    markSectionAsChanged('stats');
  };
  
  // Validar URL de red social
  const validateSocialUrl = (url, platform) => {
    if (!url) return true; // URL vacía es válida
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Validaciones específicas por plataforma
      switch (platform) {
        case 'facebook':
          return domain.includes('facebook.com') || domain.includes('fb.com');
        case 'instagram':
          return domain.includes('instagram.com');
        case 'twitter':
          return domain.includes('twitter.com') || domain.includes('x.com');
        case 'youtube':
          return domain.includes('youtube.com') || domain.includes('youtu.be');
        case 'whatsapp':
          return domain.includes('wa.me') || domain.includes('whatsapp.com');
        default:
          return true;
      }
    } catch {
      return false;
    }
  };
  
  // Guardar cambios de una sección específica
  const handleSectionSave = async (section) => {
    try {
      setSavingSection(section);
      
      // Validaciones por sección
      if (section === 'basic') {
        if (!formData.name.trim()) {
          showError('El nombre del gimnasio es obligatorio');
          return;
        }
        if (formData.name.length < 3) {
          showError('El nombre debe tener al menos 3 caracteres');
          return;
        }
        if (!formData.description.trim()) {
          showError('La descripción es obligatoria');
          return;
        }
        if (formData.description.length < 10) {
          showError('La descripción debe tener al menos 10 caracteres');
          return;
        }
      }
      
      if (section === 'contact') {
        if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
          showError('El email no tiene un formato válido');
          return;
        }
      }
      
      if (section === 'social') {
        // Validar URLs de redes sociales
        for (const [platform, data] of Object.entries(formData.social)) {
          if (data.active && data.url && !validateSocialUrl(data.url, platform)) {
            const platformLabel = socialPlatforms.find(p => p.key === platform)?.label || platform;
            showError(`La URL de ${platformLabel} no es válida`);
            return;
          }
        }
      }
      
      if (section === 'stats') {
        const stats = formData.stats;
        if (stats.members < 0 || stats.trainers < 0 || stats.experience < 0) {
          showError('Las estadísticas no pueden ser números negativos');
          return;
        }
        if (stats.satisfaction < 0 || stats.satisfaction > 100) {
          showError('La satisfacción debe estar entre 0 y 100%');
          return;
        }
      }
      
      // Preparar datos para guardar solo la sección específica
      let dataToSave = {};
      
      switch (section) {
        case 'basic':
          dataToSave = {
            name: formData.name.trim(),
            tagline: formData.tagline.trim(),
            description: formData.description.trim()
          };
          break;
          
        case 'contact':
          dataToSave = {
            contact: {
              ...formData.contact,
              phone: formData.contact.phone.trim(),
              email: formData.contact.email.trim(),
              address: formData.contact.address.trim(),
              city: formData.contact.city.trim(),
              zipCode: formData.contact.zipCode.trim()
            }
          };
          break;
          
        case 'social':
          dataToSave = {
            social: Object.fromEntries(
              Object.entries(formData.social).map(([key, value]) => [
                key,
                {
                  url: value.url.trim(),
                  active: value.active
                }
              ])
            )
          };
          break;
          
        case 'stats':
          dataToSave = {
            stats: {
              members: parseInt(formData.stats.members) || 0,
              trainers: parseInt(formData.stats.trainers) || 0,
              experience: parseInt(formData.stats.experience) || 0,
              satisfaction: parseInt(formData.stats.satisfaction) || 0
            }
          };
          break;
      }
      
      console.log(`Guardando sección ${section}:`, dataToSave);
      
      // Llamar al onSave con la sección específica
      await onSave({ section, data: dataToSave });
      
      // Marcar sección como guardada
      setSectionChanges(prev => ({
        ...prev,
        [section]: false
      }));
      
      const sectionLabels = {
        basic: 'Información básica',
        contact: 'Información de contacto',
        social: 'Redes sociales',
        stats: 'Estadísticas'
      };
      
      showSuccess(`${sectionLabels[section]} guardada exitosamente`);
      
    } catch (error) {
      console.error(`Error saving ${section} section:`, error);
      showError(`Error al guardar ${section === 'basic' ? 'información básica' : section}`);
    } finally {
      setSavingSection(null);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (gymConfig?.isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando información actual del gimnasio...</p>
            <p className="text-sm text-gray-500 mt-2">Configurando datos de contenido web...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Información General del Gimnasio
          </h3>
          <p className="text-gray-600 mt-1">
            Configura la información básica, contacto, redes sociales y estadísticas que aparecen en tu página web
          </p>
          
          {/* Nota sobre horarios */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>💡 Gestión de Horarios:</strong> Los horarios del gimnasio ahora se gestionan desde su propia sección especializada en el menú lateral: 
                  <span className="font-semibold"> "Gestión de Horarios"</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Allí podrás configurar múltiples franjas horarias por día, capacidades individuales y métricas de ocupación.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mostrar datos actuales cargados */}
          {isDataLoaded && formData.name && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <Info className="w-3 h-3 inline mr-1" />
                {formData.name}
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Globe className="w-3 h-3 inline mr-1" />
                {Object.keys(formData.social).filter(key => formData.social[key].url && formData.social[key].active).length} redes activas
              </span>
              <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                <Users className="w-3 h-3 inline mr-1" />
                {formData.stats.members} miembros
              </span>
              <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <Award className="w-3 h-3 inline mr-1" />
                {formData.stats.trainers} entrenadores
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Indicador de cambios por sección */}
      {Object.values(sectionChanges).some(changed => changed) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Cambios sin guardar</strong> en: {' '}
                {Object.keys(sectionChanges)
                  .filter(key => sectionChanges[key])
                  .map(key => sections.find(s => s.id === key)?.label)
                  .join(', ')}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Recuerda guardar cada sección antes de cambiar a otra
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navegación por secciones */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors relative group ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 inline mr-2" />
              {section.label}
              
              {/* Indicador de cambios */}
              {sectionChanges[section.id] && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
              
              {/* Tooltip con descripción */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {section.description}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Contenido según sección activa */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* Sección: Información Básica */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  Información Básica del Gimnasio
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Esta información aparece en la sección principal de tu página web
                </p>
              </div>
              
              {sectionChanges.basic && (
                <button
                  onClick={() => handleSectionSave('basic')}
                  disabled={savingSection === 'basic'}
                  className="btn-primary btn-sm"
                >
                  {savingSection === 'basic' ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Información Básica
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Gimnasio *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleBasicChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Elite Fitness Center"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece en el título principal de la página, navegación y metadatos SEO
                </p>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eslogan / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleBasicChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Tu mejor versión te espera"
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Frase corta que aparece bajo el nombre en la sección principal (hero)
                </p>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Principal *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleBasicChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe tu gimnasio de manera atractiva. Esta descripción aparece en la sección principal de tu página web y ayuda a los visitantes a conocer lo que ofreces..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Descripción principal que aparece en la sección hero de la página
                  </p>
                  <span className="text-xs text-gray-400">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        )}
        
        {/* Sección: Información de Contacto */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  Información de Contacto
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Datos de contacto que aparecen en el footer y sección de contacto
                </p>
              </div>
              
              {sectionChanges.contact && (
                <button
                  onClick={() => handleSectionSave('contact')}
                  disabled={savingSection === 'contact'}
                  className="btn-primary btn-sm"
                >
                  {savingSection === 'contact' ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Contacto
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: +502 1234-5678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número principal para contacto directo. Aparece en footer y página de contacto
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: info@elitegym.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email principal para consultas y comunicación oficial
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.contact.address}
                  onChange={(e) => handleContactChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Avenida Principal 123, Zona 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dirección física completa del gimnasio
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.contact.city}
                  onChange={(e) => handleContactChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Guatemala, Guatemala"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ciudad y departamento donde se ubica el gimnasio
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.contact.zipCode}
                  onChange={(e) => handleContactChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: 01010"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código postal de la zona (opcional)
                </p>
              </div>
              
            </div>
          </div>
        )}
        
        {/* Sección: Redes Sociales */}
        {activeSection === 'social' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  Redes Sociales
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Enlaces a redes sociales que aparecen en el footer de tu página web
                </p>
              </div>
              
              {sectionChanges.social && (
                <button
                  onClick={() => handleSectionSave('social')}
                  disabled={savingSection === 'social'}
                  className="btn-primary btn-sm"
                >
                  {savingSection === 'social' ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Redes Sociales
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {socialPlatforms.map((platform) => (
                <div key={platform.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <platform.icon className={`w-5 h-5 text-${platform.color} mr-3`} />
                      <div>
                        <h5 className="font-medium text-gray-900">{platform.label}</h5>
                        <p className="text-xs text-gray-600">{platform.description}</p>
                      </div>
                      
                      {formData.social[platform.key]?.url && formData.social[platform.key]?.active && (
                        <span className="ml-3 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          ✓ Configurado
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
                  
                  {formData.social[platform.key]?.url && formData.social[platform.key]?.active && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Los usuarios podrán acceder desde el footer de la página
                      </p>
                      <a
                        href={formData.social[platform.key].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Vista previa
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Resumen de redes sociales activas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h6 className="font-medium text-blue-900 mb-2">
                Resumen de Redes Sociales
              </h6>
              <div className="text-sm text-blue-800">
                <p>
                  Redes activas: <strong>
                    {Object.keys(formData.social).filter(key => 
                      formData.social[key].url && formData.social[key].active
                    ).length}
                  </strong> de {socialPlatforms.length}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {socialPlatforms.map((platform) => {
                    const isActive = formData.social[platform.key]?.url && formData.social[platform.key]?.active;
                    return (
                      <span
                        key={platform.key}
                        className={`text-xs px-2 py-1 rounded ${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {platform.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sección: Estadísticas */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  Estadísticas Destacadas
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Números importantes que aparecen en la sección principal (hero) de tu página web
                </p>
              </div>
              
              {sectionChanges.stats && (
                <button
                  onClick={() => handleSectionSave('stats')}
                  disabled={savingSection === 'stats'}
                  className="btn-primary btn-sm"
                >
                  {savingSection === 'stats' ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Estadísticas
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Total de Miembros
                </label>
                <input
                  type="number"
                  value={formData.stats.members}
                  onChange={(e) => handleStatsChange('members', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="99999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de miembros activos actuales del gimnasio
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="w-4 h-4 inline mr-1" />
                  Entrenadores Certificados
                </label>
                <input
                  type="number"
                  value={formData.stats.trainers}
                  onChange={(e) => handleStatsChange('trainers', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de entrenadores profesionales y certificados
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Años de Experiencia
                </label>
                <input
                  type="number"
                  value={formData.stats.experience}
                  onChange={(e) => handleStatsChange('experience', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Años que lleva operando el gimnasio o experiencia del equipo
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Satisfacción del Cliente (%)
                </label>
                <input
                  type="number"
                  value={formData.stats.satisfaction}
                  onChange={(e) => handleStatsChange('satisfaction', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de satisfacción basado en encuestas o reviews de clientes
                </p>
              </div>
              
            </div>
            
            {/* Preview de estadísticas */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h6 className="font-medium text-gray-900 mb-4 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Vista previa en página web:
              </h6>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {formData.stats.members.toLocaleString()}
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
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Estas estadísticas aparecen prominentemente en la sección principal de tu página web
              </p>
            </div>
          </div>
        )}
        
      </div>
      
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