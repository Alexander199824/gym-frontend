// src/pages/dashboard/components/ContentEditor.js
// FUNCIÓN: Editor MEJORADO - Guardado independiente por secciones + Horarios flexibles
// CAMBIOS: Horarios vienen del backend, múltiples franjas por día, guardado por sección

import React, { useState, useEffect } from 'react';
import {
  Save, Phone, Mail, MapPin, Globe, Instagram,
  Facebook, Twitter, Youtube, Clock, Users, Award, Target,
  AlertTriangle, MessageSquare, Star, Trophy, Loader, Plus,
  Minus, Calendar, UserCheck, UserX, Eye, BarChart3, Settings,
  Copy, Trash2, Edit3
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
    // 🆕 HORARIOS FLEXIBLES - Vienen del backend tal como están
    hours: {
      monday: {
        isOpen: false,
        timeSlots: [] // Array de { open, close, capacity, reservations, label? }
      },
      tuesday: {
        isOpen: false,
        timeSlots: []
      },
      wednesday: {
        isOpen: false,
        timeSlots: []
      },
      thursday: {
        isOpen: false,
        timeSlots: []
      },
      friday: {
        isOpen: false,
        timeSlots: []
      },
      saturday: {
        isOpen: false,
        timeSlots: []
      },
      sunday: {
        isOpen: false,
        timeSlots: []
      }
    },
    stats: {
      members: 500,
      trainers: 8,
      experience: 10,
      satisfaction: 95
    }
  });
  
  // 🆕 Estados de cambios por sección
  const [sectionChanges, setSectionChanges] = useState({
    basic: false,
    contact: false,
    social: false,
    schedule: false,
    stats: false
  });
  
  const [activeSection, setActiveSection] = useState('basic');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showCapacityDetails, setShowCapacityDetails] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [lastChangedCapacity, setLastChangedCapacity] = useState(null); // Para botón "aplicar a todos"
  
  // 📅 Días de la semana
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', shortLabel: 'Mié' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
    { key: 'sunday', label: 'Domingo', shortLabel: 'Dom' }
  ];
  
  // 🔗 Secciones del editor
  const sections = [
    { id: 'basic', label: 'Información Básica', icon: Target },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'social', label: 'Redes Sociales', icon: Globe },
    { id: 'schedule', label: 'Horarios y Capacidad', icon: Clock },
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
  
  // 🔄 INICIALIZAR CON DATOS DEL BACKEND
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
      
      // 🆕 MAPEAR HORARIOS FLEXIBLES - CONVERTIR DATOS EXISTENTES
      const mapFlexibleHours = (backendHours) => {
        const mappedHours = {};
        
        daysOfWeek.forEach(day => {
          const backendDay = backendHours?.[day.key];
          
          if (backendDay) {
            // Si ya viene con timeSlots, usar tal como está
            if (backendDay.timeSlots && Array.isArray(backendDay.timeSlots)) {
              mappedHours[day.key] = {
                isOpen: backendDay.isOpen || false,
                timeSlots: backendDay.timeSlots
              };
            }
            // Si viene en formato simple (open/close directo), convertir a timeSlots
            else if (backendDay.open && backendDay.close) {
              mappedHours[day.key] = {
                isOpen: backendDay.isOpen || false,
                timeSlots: backendDay.isOpen ? [{
                  open: backendDay.open,
                  close: backendDay.close,
                  capacity: backendDay.capacity || 30,
                  reservations: backendDay.reservations || 0,
                  label: '' // Sin etiqueta por defecto
                }] : []
              };
            }
            // Si solo tiene el flag isOpen
            else {
              mappedHours[day.key] = {
                isOpen: backendDay.isOpen || false,
                timeSlots: []
              };
            }
          } else {
            // Si no hay datos del backend, inicializar vacío
            mappedHours[day.key] = {
              isOpen: false,
              timeSlots: []
            };
          }
        });
        
        console.log('🔄 Mapped hours from backend:', {
          original: backendHours,
          mapped: mappedHours
        });
        
        return mappedHours;
      };
      
      // Mapear datos del backend
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
        
        // 🆕 HORARIOS FLEXIBLES DEL BACKEND
        hours: mapFlexibleHours(backendData.hours),
        
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
        hoursLoaded: Object.keys(newFormData.hours).map(day => {
          const dayData = newFormData.hours[day];
          return {
            day,
            isOpen: dayData.isOpen,
            totalSlots: dayData.timeSlots.length,
            slots: dayData.timeSlots.map(slot => ({
              time: `${slot.open}-${slot.close}`,
              capacity: slot.capacity,
              label: slot.label || 'Sin etiqueta'
            }))
          };
        }).filter(day => day.isOpen) // Solo mostrar días abiertos
      });
      
      setFormData(newFormData);
      setIsDataLoaded(true);
      
    } else if (gymConfig?.isLoading) {
      setIsDataLoaded(false);
    } else {
      setIsDataLoaded(true);
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    const hasAnyChanges = Object.values(sectionChanges).some(changed => changed);
    onUnsavedChanges(hasAnyChanges);
  }, [sectionChanges, onUnsavedChanges]);
  
  // 📊 CALCULAR MÉTRICAS DE CAPACIDAD
  const capacityMetrics = React.useMemo(() => {
    const openDays = daysOfWeek.filter(day => formData.hours[day.key]?.isOpen);
    
    let totalCapacity = 0;
    let totalReservations = 0;
    
    openDays.forEach(day => {
      const dayData = formData.hours[day.key];
      dayData.timeSlots.forEach(slot => {
        totalCapacity += slot.capacity || 0;
        totalReservations += slot.reservations || 0;
      });
    });
    
    const averageOccupancy = totalCapacity > 0 ? 
      Math.round((totalReservations / totalCapacity) * 100) : 0;
    
    const availableSpaces = totalCapacity - totalReservations;
    
    // Día con mayor ocupación
    let busiestDay = { day: '', occupancy: 0 };
    openDays.forEach(day => {
      const dayData = formData.hours[day.key];
      let dayCapacity = 0;
      let dayReservations = 0;
      
      dayData.timeSlots.forEach(slot => {
        dayCapacity += slot.capacity || 0;
        dayReservations += slot.reservations || 0;
      });
      
      const dayOccupancy = dayCapacity > 0 ? (dayReservations / dayCapacity) * 100 : 0;
      
      if (dayOccupancy > busiestDay.occupancy) {
        busiestDay = { day: day.label, occupancy: dayOccupancy };
      }
    });
    
    return {
      totalCapacity,
      totalReservations,
      averageOccupancy,
      availableSpaces,
      busiestDay: busiestDay.day,
      busiestOccupancy: Math.round(busiestDay.occupancy)
    };
  }, [formData.hours]);
  
  // 🆕 Marcar sección como modificada
  const markSectionAsChanged = (section) => {
    setSectionChanges(prev => ({
      ...prev,
      [section]: true
    }));
  };
  
  // 📝 Manejar cambios en campos simples (información básica)
  const handleBasicChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    markSectionAsChanged('basic');
  };
  
  // 📝 Manejar cambios de contacto
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
  
  // 📝 Manejar cambios de redes sociales
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
  
  // 📝 Manejar cambios de estadísticas
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
  
  // 🆕 FUNCIONES PARA HORARIOS FLEXIBLES
  
  // Toggle día abierto/cerrado
  const toggleDayOpen = (day) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          isOpen: !prev.hours[day].isOpen,
          // Si se cierra el día, limpiar slots
          timeSlots: !prev.hours[day].isOpen ? [] : prev.hours[day].timeSlots
        }
      }
    }));
    markSectionAsChanged('schedule');
  };
  
  // Agregar nueva franja horaria
  const addTimeSlot = (day) => {
    const newSlot = {
      open: '09:00',
      close: '18:00',
      capacity: 30,
      reservations: 0,
      label: '' // Opcional: ej "Horario Mañana", "Evento Especial"
    };
    
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: [...prev.hours[day].timeSlots, newSlot]
        }
      }
    }));
    markSectionAsChanged('schedule');
  };
  
  // Eliminar franja horaria
  const removeTimeSlot = (day, slotIndex) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: prev.hours[day].timeSlots.filter((_, index) => index !== slotIndex)
        }
      }
    }));
    markSectionAsChanged('schedule');
  };
  
  // Cambiar datos de franja horaria
  const updateTimeSlot = (day, slotIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: prev.hours[day].timeSlots.map((slot, index) => 
            index === slotIndex ? { ...slot, [field]: value } : slot
          )
        }
      }
    }));
    markSectionAsChanged('schedule');
    
    // Si cambió capacidad, guardar para botón "aplicar a todos"
    if (field === 'capacity') {
      setLastChangedCapacity(value);
    }
  };
  
  // Duplicar franja horaria
  const duplicateTimeSlot = (day, slotIndex) => {
    const slotToDuplicate = formData.hours[day].timeSlots[slotIndex];
    const duplicatedSlot = {
      ...slotToDuplicate,
      reservations: 0, // Reset reservaciones
      label: slotToDuplicate.label ? `${slotToDuplicate.label} (copia)` : ''
    };
    
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          timeSlots: [...prev.hours[day].timeSlots, duplicatedSlot]
        }
      }
    }));
    markSectionAsChanged('schedule');
  };
  
  // 🆕 Aplicar capacidad a todas las franjas activas
  const applyCapacityToAllSlots = (capacity) => {
    if (!capacity || capacity <= 0) return;
    
    const updatedHours = { ...formData.hours };
    let appliedCount = 0;
    
    Object.keys(updatedHours).forEach(day => {
      if (updatedHours[day].isOpen) {
        updatedHours[day].timeSlots.forEach(slot => {
          slot.capacity = capacity;
          appliedCount++;
        });
      }
    });
    
    setFormData(prev => ({
      ...prev,
      hours: updatedHours
    }));
    markSectionAsChanged('schedule');
    showSuccess(`Capacidad de ${capacity} aplicada a ${appliedCount} franjas horarias`);
    setLastChangedCapacity(null); // Limpiar después de aplicar
  };
  
  // 💾 Guardar cambios de una sección específica
  const handleSectionSave = async (section) => {
    try {
      setSavingSection(section);
      
      // Validaciones por sección
      if (section === 'basic') {
        if (!formData.name.trim()) {
          showError('El nombre del gimnasio es obligatorio');
          return;
        }
        if (!formData.description.trim()) {
          showError('La descripción es obligatoria');
          return;
        }
      }
      
      if (section === 'schedule') {
        // Validar que si un día está abierto, tenga al menos una franja
        const openDaysWithoutSlots = daysOfWeek.filter(day => 
          formData.hours[day.key].isOpen && formData.hours[day.key].timeSlots.length === 0
        );
        
        if (openDaysWithoutSlots.length > 0) {
          showError(`Los días marcados como abiertos deben tener al menos una franja horaria: ${openDaysWithoutSlots.map(d => d.label).join(', ')}`);
          return;
        }
        
        // Validar capacidades
        const hasInvalidCapacity = Object.values(formData.hours).some(day => 
          day.isOpen && day.timeSlots.some(slot => slot.capacity < 1 || slot.capacity > 500)
        );
        
        if (hasInvalidCapacity) {
          showError('La capacidad debe estar entre 1 y 500 usuarios por franja horaria');
          return;
        }
      }
      
      // Preparar datos para guardar solo la sección específica
      let dataToSave = {};
      
      switch (section) {
        case 'basic':
          dataToSave = {
            name: formData.name,
            tagline: formData.tagline,
            description: formData.description
          };
          break;
          
        case 'contact':
          dataToSave = {
            contact: formData.contact
          };
          break;
          
        case 'social':
          dataToSave = {
            social: formData.social
          };
          break;
          
        case 'schedule':
          dataToSave = {
            hours: {
              ...formData.hours,
              full: generateFullScheduleString(formData.hours)
            }
          };
          break;
          
        case 'stats':
          dataToSave = {
            stats: formData.stats
          };
          break;
      }
      
      console.log(`💾 Saving ${section} section:`, dataToSave);
      
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
        schedule: 'Horarios y capacidad',
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
  
  // 📅 Generar string completo de horarios
  const generateFullScheduleString = (hours) => {
    const openDays = daysOfWeek.filter(day => hours[day.key]?.isOpen);
    
    if (openDays.length === 0) {
      return 'Consultar horarios';
    }
    
    const scheduleStrings = [];
    
    openDays.forEach(day => {
      const dayData = hours[day.key];
      if (dayData.timeSlots.length === 0) return;
      
      const slotsString = dayData.timeSlots.map(slot => {
        const baseTime = `${slot.open}-${slot.close}`;
        return slot.label ? `${baseTime} (${slot.label})` : baseTime;
      }).join(', ');
      
      scheduleStrings.push(`${day.shortLabel}: ${slotsString}`);
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
            Configura información básica, horarios flexibles y capacidad por franjas
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
              {Object.values(formData.hours).some(day => day.isOpen) && (
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  🕒 {Object.values(formData.hours).filter(day => day.isOpen).length} días configurados
                </span>
              )}
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
        </div>
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS POR SECCIÓN */}
      {Object.values(sectionChanges).some(changed => changed) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar en: {' '}
                {Object.keys(sectionChanges)
                  .filter(key => sectionChanges[key])
                  .map(key => sections.find(s => s.id === key)?.label)
                  .join(', ')}
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
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors relative ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 inline mr-2" />
              {section.label}
              
              {/* Indicador de cambios */}
              {sectionChanges[section.id] && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></span>
              )}
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
              <h4 className="text-lg font-medium text-gray-900">
                Información Básica del Gimnasio
              </h4>
              
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
                  onChange={(e) => handleBasicChange('tagline', e.target.value)}
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
                  onChange={(e) => handleBasicChange('description', e.target.value)}
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
              <h4 className="text-lg font-medium text-gray-900">
                Información de Contacto
              </h4>
              
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
                  onChange={(e) => handleContactChange('email', e.target.value)}
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
                  onChange={(e) => handleContactChange('address', e.target.value)}
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
                  onChange={(e) => handleContactChange('city', e.target.value)}
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
              <h4 className="text-lg font-medium text-gray-900">
                Redes Sociales
              </h4>
              
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
        
        {/* 🆕 SECCIÓN: Horarios Flexibles y Capacidad */}
        {activeSection === 'schedule' && (
          <div className="space-y-8">
            
            {/* Header con métricas y acciones */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Horarios Flexibles y Capacidad
                </h4>
                <p className="text-gray-600">
                  Configura múltiples franjas horarias por día con capacidad individual
                </p>
                
                {/* Mostrar info de horarios cargados */}
                {(() => {
                  const openDays = daysOfWeek.filter(day => formData.hours[day.key]?.isOpen);
                  const totalSlots = openDays.reduce((sum, day) => sum + formData.hours[day.key].timeSlots.length, 0);
                  
                  if (openDays.length > 0) {
                    return (
                      <div className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full inline-block">
                        📅 Cargados: {openDays.length} días con {totalSlots} franjas horarias
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
                        🆕 Sin horarios configurados - Empezar desde cero
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Acciones */}
              <div className="flex items-center space-x-2">
                {/* Botón aplicar capacidad a todos */}
                {lastChangedCapacity && (
                  <button
                    onClick={() => applyCapacityToAllSlots(lastChangedCapacity)}
                    className="btn-secondary btn-sm bg-blue-50 text-blue-700 border-blue-200"
                    title={`Aplicar capacidad de ${lastChangedCapacity} a todas las franjas`}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {lastChangedCapacity} a todas
                  </button>
                )}
                
                {sectionChanges.schedule && (
                  <button
                    onClick={() => handleSectionSave('schedule')}
                    disabled={savingSection === 'schedule'}
                    className="btn-primary btn-sm"
                  >
                    {savingSection === 'schedule' ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Horarios
                  </button>
                )}
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
            <div className="space-y-6">
              {daysOfWeek.map((day) => {
                const dayData = formData.hours[day.key];
                
                return (
                  <div key={day.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    
                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="font-medium text-gray-900">{day.label}</span>
                        </div>
                        
                        {/* Toggle abierto/cerrado */}
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={dayData.isOpen}
                            onChange={() => toggleDayOpen(day.key)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Abierto</span>
                        </label>
                        
                        {dayData.isOpen && (
                          <span className="text-sm text-gray-600">
                            {dayData.timeSlots.length} franja{dayData.timeSlots.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Agregar franja */}
                      {dayData.isOpen && (
                        <button
                          onClick={() => addTimeSlot(day.key)}
                          className="btn-secondary btn-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar Franja
                        </button>
                      )}
                    </div>
                    
                    {/* Franjas horarias */}
                    {dayData.isOpen && (
                      <div className="space-y-4">
                        {dayData.timeSlots.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No hay franjas horarias configuradas</p>
                            <p className="text-sm">Haz clic en "Agregar Franja" para empezar</p>
                          </div>
                        ) : (
                          dayData.timeSlots.map((slot, slotIndex) => {
                            const occupancyPercentage = slot.capacity > 0 ? 
                              Math.round((slot.reservations / slot.capacity) * 100) : 0;
                            const occupancyColor = getOccupancyColor(slot.reservations, slot.capacity);
                            
                            return (
                              <div key={slotIndex} className="bg-gray-50 rounded-lg p-4 relative">
                                
                                {/* Botones de acción de la franja */}
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <button
                                    onClick={() => duplicateTimeSlot(day.key, slotIndex)}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Duplicar franja"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => removeTimeSlot(day.key, slotIndex)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Eliminar franja"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  
                                  {/* Etiqueta opcional */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Etiqueta (opcional)
                                    </label>
                                    <input
                                      type="text"
                                      value={slot.label || ''}
                                      onChange={(e) => updateTimeSlot(day.key, slotIndex, 'label', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                                      placeholder="ej: Mañana, Tarde, Evento"
                                    />
                                  </div>
                                  
                                  {/* Horarios */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Horario</label>
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="time"
                                        value={slot.open}
                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'open', e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                                      />
                                      <span className="text-xs text-gray-500">a</span>
                                      <input
                                        type="time"
                                        value={slot.close}
                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'close', e.target.value)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Capacidad */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Capacidad</label>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => updateTimeSlot(day.key, slotIndex, 'capacity', Math.max(1, slot.capacity - 5))}
                                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      
                                      <input
                                        type="number"
                                        value={slot.capacity || 0}
                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'capacity', parseInt(e.target.value) || 0)}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-primary-500"
                                        min="1"
                                        max="500"
                                      />
                                      
                                      <button
                                        type="button"
                                        onClick={() => updateTimeSlot(day.key, slotIndex, 'capacity', Math.min(500, slot.capacity + 5))}
                                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Ocupación */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Ocupación</label>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span>{slot.reservations}/{slot.capacity}</span>
                                        <span className={`font-medium ${
                                          occupancyColor === 'red' ? 'text-red-600' :
                                          occupancyColor === 'yellow' ? 'text-yellow-600' :
                                          occupancyColor === 'blue' ? 'text-blue-600' : 'text-green-600'
                                        }`}>
                                          {occupancyPercentage}%
                                        </span>
                                      </div>
                                      
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all ${
                                            occupancyColor === 'red' ? 'bg-red-500' :
                                            occupancyColor === 'yellow' ? 'bg-yellow-500' :
                                            occupancyColor === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                                        />
                                      </div>
                                      
                                      {/* Simulador de reservaciones */}
                                      <div className="flex items-center justify-center space-x-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => updateTimeSlot(day.key, slotIndex, 'reservations', Math.max(0, slot.reservations - 1))}
                                          className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                          disabled={slot.reservations <= 0}
                                          title="Quitar usuario"
                                        >
                                          <UserX className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                          type="button"
                                          onClick={() => updateTimeSlot(day.key, slotIndex, 'reservations', Math.min(slot.capacity, slot.reservations + 1))}
                                          className="p-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                          disabled={slot.reservations >= slot.capacity}
                                          title="Agregar usuario"
                                        >
                                          <UserCheck className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>
                            );
                          })
                        )}
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
              <p className="text-blue-800 text-sm">
                "{generateFullScheduleString(formData.hours)}"
              </p>
            </div>
            
            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-gray-800">
                    ¿Cómo funcionan las franjas horarias?
                  </h6>
                  <div className="text-sm text-gray-700 mt-1 space-y-1">
                    <p>• <strong>Días flexibles:</strong> Cada día puede tener múltiples franjas horarias independientes</p>
                    <p>• <strong>Horarios especiales:</strong> Puedes configurar horarios de madrugada, eventos especiales, etc.</p>
                    <p>• <strong>Capacidad individual:</strong> Cada franja tiene su propia capacidad y ocupación</p>
                    <p>• <strong>Etiquetas:</strong> Opcional para identificar franjas (ej: "Mañana", "Evento Especial")</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
        
        {/* SECCIÓN: Estadísticas */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Estadísticas Destacadas
              </h4>
              
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
                  onChange={(e) => handleStatsChange('members', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleStatsChange('trainers', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleStatsChange('experience', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleStatsChange('satisfaction', parseInt(e.target.value) || 0)}
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