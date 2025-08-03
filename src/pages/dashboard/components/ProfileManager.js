// src/pages/dashboard/components/ProfileManager.js
// FUNCIÓN: Gestión completa del perfil de usuario - Información personal, seguridad, preferencias
// CONECTA CON: Backend API /api/auth/profile

import React, { useState, useEffect } from 'react';
import {
  User, Edit, Save, Camera, Lock, Key, Bell, Settings, Eye, EyeOff,
  Phone, Mail, MapPin, Calendar, Shield, Upload, RefreshCw, Check,
  AlertTriangle, CheckCircle, XCircle, Info, Clock, Trash2, Plus,
  Heart, Activity, Target, Award, TrendingUp, BarChart3, Loader, X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const ProfileManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, updateUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  
  // 📊 Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 📸 Estados para imagen de perfil
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // 👤 Estados de información personal
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    zipCode: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    bio: '',
    profileImage: ''
  });
  
  // 🔐 Estados de seguridad
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginNotifications: true,
    securityQuestions: []
  });
  
  // 🔔 Estados de preferencias
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    language: 'es',
    timezone: 'America/Guatemala',
    theme: 'light',
    privacy: {
      showEmail: false,
      showPhone: false,
      showProfile: true
    }
  });
  
  // 📊 Estados de estadísticas del usuario
  const [userStats, setUserStats] = useState({
    memberSince: null,
    totalVisits: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteTime: '',
    totalWorkouts: 0,
    achievements: []
  });
  
  // 🔗 Pestañas del perfil
  const profileTabs = [
    {
      id: 'personal',
      title: 'Información Personal',
      icon: User,
      description: 'Datos personales y contacto'
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: Shield,
      description: 'Contraseña y configuración de seguridad'
    },
    {
      id: 'preferences',
      title: 'Preferencias',
      icon: Settings,
      description: 'Notificaciones y configuración'
    },
    {
      id: 'stats',
      title: 'Estadísticas',
      icon: BarChart3,
      description: 'Tu progreso y actividad'
    }
  ];
  
  // 🔄 CARGAR DATOS DEL PERFIL
  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getProfile();
      const userData = response.data || response;
      
      if (userData) {
        // Mapear datos personales
        setPersonalInfo({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
          address: userData.address || '',
          city: userData.city || '',
          zipCode: userData.zipCode || '',
          emergencyContact: userData.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          },
          bio: userData.bio || '',
          profileImage: userData.profileImage || ''
        });
        
        // Mapear preferencias
        setPreferences({
          emailNotifications: userData.preferences?.emailNotifications !== false,
          smsNotifications: userData.preferences?.smsNotifications || false,
          pushNotifications: userData.preferences?.pushNotifications !== false,
          marketingEmails: userData.preferences?.marketingEmails || false,
          language: userData.preferences?.language || 'es',
          timezone: userData.preferences?.timezone || 'America/Guatemala',
          theme: userData.preferences?.theme || 'light',
          privacy: userData.preferences?.privacy || {
            showEmail: false,
            showPhone: false,
            showProfile: true
          }
        });
        
        // Mapear estadísticas
        setUserStats({
          memberSince: userData.createdAt || userData.created_at,
          totalVisits: userData.stats?.totalVisits || 0,
          currentStreak: userData.stats?.currentStreak || 0,
          longestStreak: userData.stats?.longestStreak || 0,
          favoriteTime: userData.stats?.favoriteTime || 'Mañana',
          totalWorkouts: userData.stats?.totalWorkouts || 0,
          achievements: userData.stats?.achievements || []
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      showError('Error al cargar datos del perfil');
    } finally {
      setLoading(false);
    }
  };
  
  // 💾 GUARDAR INFORMACIÓN PERSONAL
  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!personalInfo.firstName.trim() || !personalInfo.lastName.trim()) {
        showError('Nombre y apellido son obligatorios');
        return;
      }
      
      if (!personalInfo.email.trim()) {
        showError('Email es obligatorio');
        return;
      }
      
      const response = await apiService.put('/auth/profile', {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone,
        dateOfBirth: personalInfo.dateOfBirth,
        address: personalInfo.address,
        city: personalInfo.city,
        zipCode: personalInfo.zipCode,
        emergencyContact: personalInfo.emergencyContact.name ? personalInfo.emergencyContact : undefined,
        bio: personalInfo.bio
      });
      
      showSuccess('Información personal actualizada exitosamente');
      
      // Actualizar contexto de usuario
      if (updateUser) {
        updateUser({
          ...currentUser,
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          phone: personalInfo.phone,
          profileImage: personalInfo.profileImage
        });
      }
      
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave({ type: 'profile', section: 'personal' });
      }
      
    } catch (error) {
      console.error('❌ Error saving personal info:', error);
      const errorMsg = error.response?.data?.message || 'Error al actualizar información personal';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // 🔐 CAMBIAR CONTRASEÑA
  const changePassword = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!securityInfo.currentPassword) {
        showError('Contraseña actual es obligatoria');
        return;
      }
      
      if (!securityInfo.newPassword || securityInfo.newPassword.length < 6) {
        showError('Nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      if (securityInfo.newPassword !== securityInfo.confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
      }
      
      await apiService.post('/auth/change-password', {
        currentPassword: securityInfo.currentPassword,
        newPassword: securityInfo.newPassword
      });
      
      showSuccess('Contraseña actualizada exitosamente');
      
      // Limpiar formulario
      setSecurityInfo(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error('❌ Error changing password:', error);
      const errorMsg = error.response?.data?.message || 'Error al cambiar contraseña';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // 📸 SUBIR IMAGEN DE PERFIL
  const uploadProfileImage = async (file) => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiService.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const imageUrl = response.data?.profileImage || response.profileImage;
      
      if (imageUrl) {
        setPersonalInfo(prev => ({
          ...prev,
          profileImage: imageUrl
        }));
        
        // Actualizar contexto de usuario
        if (updateUser) {
          updateUser({
            ...currentUser,
            profileImage: imageUrl
          });
        }
        
        showSuccess('Imagen de perfil actualizada exitosamente');
        setImagePreview(null);
      }
      
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      showError('Error al subir imagen de perfil');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // 📸 Manejar selección de imagen
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona una imagen válida');
      return;
    }
    
    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen no debe superar los 5MB');
      return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Subir imagen
    uploadProfileImage(file);
  };
  
  // 💾 GUARDAR PREFERENCIAS
  const savePreferences = async () => {
    try {
      setSaving(true);
      
      await apiService.put('/auth/profile/preferences', preferences);
      
      showSuccess('Preferencias actualizadas exitosamente');
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave({ type: 'profile', section: 'preferences' });
      }
      
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      showError('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };
  
  // ⏰ Cargar datos al montar
  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // 📝 Manejar cambio de información personal
  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // 📝 Manejar cambio de contacto de emergencia
  const handleEmergencyContactChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // 📝 Manejar cambio de preferencias
  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // 📝 Manejar cambio de privacidad
  const handlePrivacyChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-6 h-6 mr-2 text-indigo-600" />
            Mi Perfil
          </h3>
          <p className="text-gray-600 mt-1">
            Gestiona tu información personal, seguridad y preferencias
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
          
          <button
            onClick={() => loadProfileData()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
      </div>
      
      {/* 📸 HEADER DE PERFIL CON IMAGEN */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          
          {/* Imagen de perfil */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : personalInfo.profileImage ? (
                <img src={personalInfo.profileImage} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white/60" />
              )}
            </div>
            
            {/* Botón para cambiar imagen */}
            <label className="absolute bottom-0 right-0 bg-white text-indigo-600 rounded-full p-2 cursor-pointer hover:bg-gray-100 transition-colors shadow-lg">
              {uploadingImage ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </div>
          
          {/* Información del usuario */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold">
              {personalInfo.firstName} {personalInfo.lastName}
            </h2>
            <p className="text-indigo-100 text-lg">{personalInfo.email}</p>
            <div className="flex items-center justify-center md:justify-start mt-2 space-x-4 text-sm">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Miembro desde {userStats.memberSince ? formatDate(userStats.memberSince, 'MMMM yyyy') : '—'}
              </span>
              <span className="flex items-center">
                <Award className="w-4 h-4 mr-1" />
                {currentUser?.role === 'admin' ? 'Administrador' : 
                 currentUser?.role === 'colaborador' ? 'Personal' : 'Cliente'}
              </span>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* 🔗 NAVEGACIÓN DE TABS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {profileTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <TabIcon className="w-4 h-4 mr-2" />
                    {tab.title}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* 📋 CONTENIDO SEGÚN TAB ACTIVO */}
        <div className="p-6">
          
          {/* TAB: INFORMACIÓN PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Información Personal</h4>
                <button
                  onClick={savePersonalInfo}
                  disabled={saving}
                  className="btn-primary btn-sm"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para cambiar tu email, contacta al administrador
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+502 1234-5678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Guatemala"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Dirección completa"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={personalInfo.bio}
                    onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>
                
              </div>
              
              {/* Contacto de emergencia */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4 border-t border-gray-200 pt-6">
                  Contacto de Emergencia
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={personalInfo.emergencyContact.name}
                      onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.emergencyContact.phone}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+502 1234-5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parentesco
                    </label>
                    <select
                      value={personalInfo.emergencyContact.relationship}
                      onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="padre">Padre</option>
                      <option value="madre">Madre</option>
                      <option value="esposo">Esposo/a</option>
                      <option value="hermano">Hermano/a</option>
                      <option value="hijo">Hijo/a</option>
                      <option value="amigo">Amigo/a</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>
              
            </div>
          )}
          
          {/* TAB: SEGURIDAD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              <h4 className="text-lg font-medium text-gray-900">Configuración de Seguridad</h4>
              
              {/* Cambiar contraseña */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-md font-medium text-gray-900">Cambiar Contraseña</h5>
                  <button
                    onClick={changePassword}
                    disabled={saving}
                    className="btn-primary btn-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Cambiar Contraseña
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={securityInfo.currentPassword}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={securityInfo.newPassword}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      value={securityInfo.confirmPassword}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li>La contraseña debe tener al menos 6 caracteres</li>
                    <li>Incluye números y letras para mayor seguridad</li>
                    <li>Evita usar información personal</li>
                  </ul>
                </div>
              </div>
              
              {/* Configuración adicional de seguridad */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-4">Configuración Adicional</h5>
                
                <div className="space-y-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={securityInfo.twoFactorEnabled}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar autenticación de dos factores</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={securityInfo.loginNotifications}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificar inicios de sesión</span>
                  </label>
                </div>
              </div>
              
            </div>
          )}
          
          {/* TAB: PREFERENCIAS */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Preferencias</h4>
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="btn-primary btn-sm"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Preferencias
                </button>
              </div>
              
              {/* Notificaciones */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-4">Notificaciones</h5>
                
                <div className="space-y-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones por email</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.smsNotifications}
                      onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones por SMS</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notificaciones push</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.marketingEmails}
                      onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Emails promocionales</span>
                  </label>
                </div>
              </div>
              
              {/* Configuración de idioma y región */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-4">Idioma y Región</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="America/Guatemala">Guatemala (GMT-6)</option>
                      <option value="America/Mexico_City">Mexico City (GMT-6)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Privacidad */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-4">Privacidad</h5>
                
                <div className="space-y-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showProfile}
                      onChange={(e) => handlePrivacyChange('showProfile', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mostrar mi perfil a otros usuarios</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showEmail}
                      onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mostrar mi email</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showPhone}
                      onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mostrar mi teléfono</span>
                  </label>
                </div>
              </div>
              
            </div>
          )}
          
          {/* TAB: ESTADÍSTICAS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              <h4 className="text-lg font-medium text-gray-900">Mis Estadísticas</h4>
              
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <div className="text-2xl font-bold text-blue-900">
                        {userStats.totalVisits}
                      </div>
                      <div className="text-sm text-blue-600">Visitas Totales</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <div className="text-2xl font-bold text-green-900">
                        {userStats.currentStreak}
                      </div>
                      <div className="text-sm text-green-600">Racha Actual</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <div className="text-2xl font-bold text-purple-900">
                        {userStats.longestStreak}
                      </div>
                      <div className="text-sm text-purple-600">Mejor Racha</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Heart className="w-8 h-8 text-orange-600" />
                    <div className="ml-3">
                      <div className="text-2xl font-bold text-orange-900">
                        {userStats.totalWorkouts}
                      </div>
                      <div className="text-sm text-orange-600">Entrenamientos</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="text-md font-medium text-gray-900 mb-3">Información General</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miembro desde:</span>
                      <span className="font-medium">
                        {userStats.memberSince ? formatDate(userStats.memberSince, 'dd/MM/yyyy') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horario preferido:</span>
                      <span className="font-medium">{userStats.favoriteTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="text-md font-medium text-gray-900 mb-3">Logros</h5>
                  {userStats.achievements.length > 0 ? (
                    <div className="space-y-2">
                      {userStats.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center">
                          <Award className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      ¡Sigue entrenando para desbloquear logros!
                    </p>
                  )}
                </div>
              </div>
              
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default ProfileManager;