// src/pages/dashboard/components/ContentEditor.js
// FUNCIÓN: Editor MEJORADO - Horarios con capacidad y ocupación de usuarios
// CAMBIOS: Horarios se cargan automáticamente, gestión de capacidad por horario, seguimiento de ocupación

import React, { useState, useEffect } from 'react';
import {
  Save, Phone, Mail, MapPin, Globe, Instagram,
  Facebook, Twitter, Youtube, Clock, Users, Award, Target,
  AlertTriangle, MessageSquare, Star, Trophy, Loader, Plus,
  Minus, Calendar, UserCheck, UserX, Eye, BarChart3, Settings
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ContentEditor = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales MEJORADOS
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
    // 🆕 HORARIOS MEJORADOS CON CAPACIDAD
    hours: {
      monday: { 
        open: '06:00', 
        close: '22:00', 
        isOpen: true,
        capacity: 50,           // Capacidad máxima de usuarios
        reservations: 23,       // Usuarios actualmente reservados
        timeSlots: []           // Franjas horarias específicas (futuro)
      },
      tuesday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 31 },
      wednesday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 28 },
      thursday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 35 },
      friday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 42 },
      saturday: { open: '08:00', close: '20:00', isOpen: true, capacity: 40, reservations: 38 },
      sunday: { open: '08:00', close: '18:00', isOpen: true, capacity: 35, reservations: 29 }
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
  const [showCapacityDetails, setShowCapacityDetails] = useState(false);
  
  // 📅 Días de la semana con datos adicionales
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', shortLabel: 'Mié' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
    { key: 'sunday', label: 'Domingo', shortLabel: 'Dom' }
  ];
  
  // 🔗 Secciones del editor MEJORADAS
  const sections = [
    { id: 'basic', label: 'Información Básica', icon: Target },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'social', label: 'Redes Sociales', icon: Globe },
    { id: 'schedule', label: 'Horarios y Capacidad', icon: Clock }, // 🆕 Actualizado
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
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - MEJORADO PARA HORARIOS
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
      
      // 🆕 MAPEAR HORARIOS MEJORADOS - CON CAPACIDAD
      const mapHoursWithDefaults = (backendHours) => {
        const defaultHours = {
          monday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 0 },
          tuesday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 0 },
          wednesday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 0 },
          thursday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 0 },
          friday: { open: '06:00', close: '22:00', isOpen: true, capacity: 50, reservations: 0 },
          saturday: { open: '08:00', close: '20:00', isOpen: true, capacity: 40, reservations: 0 },
          sunday: { open: '08:00', close: '18:00', isOpen: true, capacity: 35, reservations: 0 }
        };
        
        // Combinar datos del backend con valores por defecto
        const combinedHours = {};
        daysOfWeek.forEach(day => {
          const backendDay = backendHours?.[day.key];
          const defaultDay = defaultHours[day.key];
          
          combinedHours[day.key] = {
            open: backendDay?.open || defaultDay.open,
            close: backendDay?.close || defaultDay.close,
            isOpen: backendDay?.isOpen !== false, // Default true si no está definido
            capacity: backendDay?.capacity || defaultDay.capacity,
            reservations: backendDay?.reservations || 0, // Simulamos reservaciones
            timeSlots: backendDay?.timeSlots || []
          };
        });
        
        return combinedHours;
      };
      
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
        
        // 🆕 HORARIOS MEJORADOS CON CAPACIDAD
        hours: mapHoursWithDefaults(backendData.hours),
        
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
        statsLoaded: Object.keys(newFormData.stats),
        hoursLoaded: Object.keys(newFormData.hours).map(day => ({
          day,
          isOpen: newFormData.hours[day].isOpen,
          capacity: newFormData.hours[day].capacity,
          reservations: newFormData.hours[day].reservations
        }))
      });
      
      setFormData(newFormData);
      setIsDataLoaded(true);
      
    } else if (gymConfig?.isLoading) {
      console.log('⏳ ContentEditor - Data is still loading...');
      setIsDataLoaded(false);
    } else {
      console.log('⚠️ ContentEditor - No data available, using defaults');
      setIsDataLoaded(true); // Permitir mostrar formulario con valores por defecto
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📊 CALCULAR MÉTRICAS DE CAPACIDAD
  const capacityMetrics = React.useMemo(() => {
    const openDays = daysOfWeek.filter(day => formData.hours[day.key]?.isOpen);
    
    const totalCapacity = openDays.reduce((sum, day) => 
      sum + (formData.hours[day.key]?.capacity || 0), 0
    );
    
    const totalReservations = openDays.reduce((sum, day) => 
      sum + (formData.hours[day.key]?.reservations || 0), 0
    );
    
    const averageOccupancy = totalCapacity > 0 ? 
      Math.round((totalReservations / totalCapacity) * 100) : 0;
    
    const availableSpaces = totalCapacity - totalReservations;
    
    // Día con mayor ocupación
    const busiestDay = openDays.reduce((max, day) => {
      const dayData = formData.hours[day.key];
      const occupancy = dayData.capacity > 0 ? 
        (dayData.reservations / dayData.capacity) * 100 : 0;
      return occupancy > max.occupancy ? 
        { day: day.label, occupancy } : max;
    }, { day: '', occupancy: 0 });
    
    return {
      totalCapacity,
      totalReservations,
      averageOccupancy,
      availableSpaces,
      busiestDay: busiestDay.day,
      busiestOccupancy: Math.round(busiestDay.occupancy)
    };
  }, [formData.hours]);
  
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
  
  // 📝 Manejar cambios de horarios MEJORADO CON CAPACIDAD
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
  
  // 🆕 Ajustar capacidad rápidamente
  const adjustCapacity = (day, delta) => {
    const currentCapacity = formData.hours[day].capacity || 0;
    const newCapacity = Math.max(0, Math.min(200, currentCapacity + delta)); // Límite 0-200
    
    handleScheduleChange(day, 'capacity', newCapacity);
  };
  
  // 🆕 Aplicar capacidad a todos los días
  const applyCapacityToAll = (capacity) => {
    const updatedHours = { ...formData.hours };
    
    Object.keys(updatedHours).forEach(day => {
      if (updatedHours[day].isOpen) {
        updatedHours[day].capacity = capacity;
      }
    });
    
    setFormData(prev => ({
      ...prev,
      hours: updatedHours
    }));
    setHasChanges(true);
    showSuccess(`Capacidad de ${capacity} aplicada a todos los días abiertos`);
  };
  
  // 💾 Guardar cambios MEJORADO
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
      
      // Validar capacidades
      const hasInvalidCapacity = Object.values(formData.hours).some(day => 
        day.isOpen && (day.capacity < 1 || day.capacity > 200)
      );
      
      if (hasInvalidCapacity) {
        showError('La capacidad debe estar entre 1 y 200 usuarios para días abiertos');
        return;
      }
      
      console.log('💾 Saving gym configuration with capacity:', formData);
      
      const dataToSave = {
        ...formData,
        hours: {
          ...formData.hours,
          full: generateFullScheduleString(formData.hours)
        }
      };
      
      onSave(dataToSave);
      setHasChanges(false);
      showSuccess('Información general y horarios actualizados exitosamente');
      
    } catch (error) {
      console.error('Error saving gym config:', error);
      showError('Error al guardar la información');
    }
  };
  
  // 📅 Generar string completo de horarios MEJORADO
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
      groupedHours[hourKey].push(day.shortLabel);
    });
    
    const scheduleStrings = Object.entries(groupedHours).map(([hourKey, days]) => {
      const [open, close] = hourKey.split('-');
      if (days.length === 1) {
        return `${days[0]}: ${open}-${close}`;
      } else {
        return `${days.join(', ')}: ${open}-${close}`;
      }
    });
    
    return scheduleStrings.join(' | ');
  };
  
  // 🆕 Obtener color según ocupación
  const getOccupancyColor = (reservations, capacity) => {
    if (capacity === 0) return 'gray';
    const percentage = (reservations / capacity) * 100;
    
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 50) return 'blue';
    return 'green';
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
      
      {/* 🔝 HEADER MEJORADO */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Información General
          </h3>
          <p className="text-gray-600 mt-1">
            Configura información básica, horarios y capacidad de usuarios
          </p>
          
          {/* Mostrar datos actuales cargados + métricas */}
          {isDataLoaded && formData.name && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                ✅ {formData.name}
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                👥 Capacidad total: {capacityMetrics.totalCapacity}
              </span>
              <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                📊 Ocupación: {capacityMetrics.averageOccupancy}%
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mostrar métricas rápidas */}
          {showCapacityDetails && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mr-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Espacios libres:</span>
                  <span className="font-medium text-green-600">{capacityMetrics.availableSpaces}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Día más ocupado:</span>
                  <span className="font-medium text-red-600">{capacityMetrics.busiestDay}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowCapacityDetails(!showCapacityDetails)}
            className="btn-secondary btn-sm"
          >
            {showCapacityDetails ? <Eye className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
          </button>
          
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
        
        {/* SECCIÓN: Información Básica - SIN CAMBIOS */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Información Básica del Gimnasio
              </h4>
              
              {formData.name && (
                <div className="text-sm text-gray-500">
                  Actual: <span className="font-medium">{formData.name}</span>
                </div>
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
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Elite Fitness Center"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece en el título principal de la página y en la navegación
                </p>
              </div>
              
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
        
        {/* SECCIÓN: Información de Contacto - SIN CAMBIOS */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Información de Contacto
              </h4>
              
              {formData.contact.phone && (
                <div className="text-sm text-gray-500">
                  Tel actual: <span className="font-medium">{formData.contact.phone}</span>
                </div>
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
                  onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: +502 1234-5678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece en la sección de contacto y footer
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
                  onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: info@elitegym.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email de contacto público
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
                  onChange={(e) => handleNestedChange('contact', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Avenida Principal 123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dirección física del gimnasio
                </p>
              </div>
              
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
        
        {/* SECCIÓN: Redes Sociales - SIN CAMBIOS */}
        {activeSection === 'social' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Redes Sociales
              </h4>
              
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
        
        {/* 🆕 SECCIÓN: Horarios y Capacidad - COMPLETAMENTE NUEVA */}
        {activeSection === 'schedule' && (
          <div className="space-y-8">
            
            {/* Header con métricas */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Horarios y Capacidad de Usuarios
                </h4>
                <p className="text-gray-600">
                  Configura horarios de atención y capacidad máxima de usuarios por día
                </p>
              </div>
              
              {/* Botones de acción rápida */}
              <div className="flex space-x-2">
                <button
                  onClick={() => applyCapacityToAll(50)}
                  className="btn-secondary btn-sm"
                  title="Aplicar capacidad 50 a todos los días"
                >
                  <Users className="w-4 h-4 mr-1" />
                  50 a todos
                </button>
                
                <button
                  onClick={() => applyCapacityToAll(30)}
                  className="btn-secondary btn-sm"
                  title="Aplicar capacidad 30 a todos los días"
                >
                  <Users className="w-4 h-4 mr-1" />
                  30 a todos
                </button>
              </div>
            </div>
            
            {/* Resumen de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{capacityMetrics.totalCapacity}</div>
                <div className="text-sm text-gray-600">Capacidad Total</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{capacityMetrics.availableSpaces}</div>
                <div className="text-sm text-gray-600">Espacios Libres</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  capacityMetrics.averageOccupancy >= 90 ? 'text-red-600' :
                  capacityMetrics.averageOccupancy >= 75 ? 'text-yellow-600' :
                  capacityMetrics.averageOccupancy >= 50 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {capacityMetrics.averageOccupancy}%
                </div>
                <div className="text-sm text-gray-600">Ocupación Promedio</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{capacityMetrics.busiestDay}</div>
                <div className="text-sm text-gray-600">Día Más Ocupado</div>
              </div>
            </div>
            
            {/* Configuración por día */}
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const dayData = formData.hours[day.key];
                const occupancyPercentage = dayData.capacity > 0 ? 
                  Math.round((dayData.reservations / dayData.capacity) * 100) : 0;
                const occupancyColor = getOccupancyColor(dayData.reservations, dayData.capacity);
                
                return (
                  <div key={day.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    
                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-20">
                          <span className="font-medium text-gray-900">{day.label}</span>
                        </div>
                        
                        {/* Toggle abierto/cerrado */}
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={dayData.isOpen}
                            onChange={(e) => handleScheduleChange(day.key, 'isOpen', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Abierto</span>
                        </label>
                      </div>
                      
                      {/* Métricas del día */}
                      {dayData.isOpen && (
                        <div className="flex items-center space-x-4 text-sm">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            occupancyColor === 'red' ? 'bg-red-100 text-red-800' :
                            occupancyColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            occupancyColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {occupancyPercentage}% ocupado
                          </div>
                          
                          <div className="text-gray-600">
                            {dayData.reservations}/{dayData.capacity} usuarios
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Configuración del día */}
                    {dayData.isOpen && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Horarios */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Horario</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={dayData.open}
                              onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-500">a</span>
                            <input
                              type="time"
                              value={dayData.close}
                              onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        
                        {/* Capacidad */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Capacidad Máxima</label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => adjustCapacity(day.key, -5)}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                              disabled={dayData.capacity <= 5}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <input
                              type="number"
                              value={dayData.capacity}
                              onChange={(e) => handleScheduleChange(day.key, 'capacity', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-primary-500"
                              min="1"
                              max="200"
                            />
                            
                            <button
                              type="button"
                              onClick={() => adjustCapacity(day.key, 5)}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                              disabled={dayData.capacity >= 200}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Ocupación actual */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Ocupación Actual</label>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  occupancyColor === 'red' ? 'bg-red-500' :
                                  occupancyColor === 'yellow' ? 'bg-yellow-500' :
                                  occupancyColor === 'blue' ? 'bg-blue-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12">
                              {occupancyPercentage}%
                            </span>
                          </div>
                          
                          {/* Simulador de reservaciones (solo para demo) */}
                          <div className="flex items-center space-x-1 mt-1">
                            <button
                              type="button"
                              onClick={() => handleScheduleChange(day.key, 'reservations', Math.max(0, dayData.reservations - 1))}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                              disabled={dayData.reservations <= 0}
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                            
                            <span className="text-xs text-gray-500 w-16 text-center">
                              {dayData.reservations} usuarios
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => handleScheduleChange(day.key, 'reservations', Math.min(dayData.capacity, dayData.reservations + 1))}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                              disabled={dayData.reservations >= dayData.capacity}
                            >
                              <UserCheck className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                      </div>
                    )}
                    
                    {/* Mensaje de cerrado */}
                    {!dayData.isOpen && (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                        Cerrado este día
                      </div>
                    )}
                    
                  </div>
                );
              })}
            </div>
            
            {/* Vista previa del string de horarios */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h6 className="font-medium text-blue-900 mb-2">Vista previa en página web:</h6>
              <p className="text-blue-800">
                "{generateFullScheduleString(formData.hours)}"
              </p>
            </div>
            
            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-gray-800">
                    ¿Cómo funciona la capacidad?
                  </h6>
                  <div className="text-sm text-gray-700 mt-1 space-y-1">
                    <p>• <strong>Capacidad:</strong> Número máximo de usuarios que pueden reservar por día</p>
                    <p>• <strong>Ocupación:</strong> Porcentaje actual de espacios reservados</p>
                    <p>• <strong>Espacios libres:</strong> Cuántos usuarios más pueden reservar</p>
                    <p>• En el futuro podrás crear ofertas limitadas por horario y capacidad</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
        
        {/* SECCIÓN: Estadísticas - SIN CAMBIOS */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Estadísticas Destacadas
            </h4>
            <p className="text-gray-600 mb-6">
              Las estadísticas aparecen en la sección principal (hero) de tu página web
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
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