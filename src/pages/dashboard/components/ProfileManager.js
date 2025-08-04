// src/pages/dashboard/components/ProfileManager.js
// FUNCIÓN: Gestión completa del perfil con VALIDACIONES y estructura correcta del README
// CORREGIDO: Compatible con LoadingSpinner existente, rutas correctas del backend, validaciones completas

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

// ✅ IMPORTACIÓN CORRECTA: Usar ProfileLoader del LoadingSpinner existente
import { ProfileLoader, ButtonSpinner } from '../../../components/common/LoadingSpinner';

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
  
  // 👤 Estados de información personal - ESTRUCTURA CORRECTA DEL README
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
    profileImage: '',
    isActive: true,
    role: ''
  });
  
  // ⚠️ Estados de validación
  const [validationErrors, setValidationErrors] = useState({});
  const [isUnderAge, setIsUnderAge] = useState(false);
  
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
  
  // 🔍 FUNCIONES DE VALIDACIÓN
  
  // Validar nombres (solo letras, espacios, acentos, guiones)
  const validateName = (name) => {
    const nameRegex = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-']+$/;
    if (!name.trim()) {
      return 'Este campo es obligatorio';
    }
    if (name.trim().length < 2) {
      return 'Debe tener al menos 2 caracteres';
    }
    if (!nameRegex.test(name)) {
      return 'Solo se permiten letras, espacios, acentos y guiones';
    }
    if (name.length > 50) {
      return 'Máximo 50 caracteres';
    }
    return null;
  };
  
  // Validar teléfono (solo números, espacios, guiones, paréntesis, signo +)
  const validatePhone = (phone) => {
    if (!phone.trim()) return null; // Opcional
    
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(phone)) {
      return 'Solo se permiten números, espacios, guiones, paréntesis y signo +';
    }
    if (phone.replace(/\s/g, '').length < 8) {
      return 'Debe tener al menos 8 dígitos';
    }
    return null;
  };
  
  // Validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email es obligatorio';
    }
    if (!emailRegex.test(email)) {
      return 'Formato de email inválido';
    }
    return null;
  };
  
  // Calcular edad y validar restricción de 13 años
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Validar fecha de nacimiento
  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return null; // Opcional
    
    const age = calculateAge(dateOfBirth);
    if (age === null) return 'Fecha inválida';
    
    if (age < 13) {
      return 'Debes tener al menos 13 años para usar esta plataforma';
    }
    
    if (age > 120) {
      return 'Fecha de nacimiento inválida';
    }
    
    return null;
  };
  
  // Validar todos los campos
  const validateAllFields = () => {
    const errors = {};
    
    // Validar nombres
    const firstNameError = validateName(personalInfo.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateName(personalInfo.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    // Validar email
    const emailError = validateEmail(personalInfo.email);
    if (emailError) errors.email = emailError;
    
    // Validar teléfono
    const phoneError = validatePhone(personalInfo.phone);
    if (phoneError) errors.phone = phoneError;
    
    // Validar fecha de nacimiento
    const dateError = validateDateOfBirth(personalInfo.dateOfBirth);
    if (dateError) errors.dateOfBirth = dateError;
    
    // Validar contacto de emergencia
    if (personalInfo.emergencyContact.name) {
      const emergencyNameError = validateName(personalInfo.emergencyContact.name);
      if (emergencyNameError) errors.emergencyName = emergencyNameError;
    }
    
    if (personalInfo.emergencyContact.phone) {
      const emergencyPhoneError = validatePhone(personalInfo.emergencyContact.phone);
      if (emergencyPhoneError) errors.emergencyPhone = emergencyPhoneError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 🔄 CARGAR DATOS DEL PERFIL - ESTRUCTURA CORRECTA DEL README
  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading profile data from backend...');
      
      const response = await apiService.getProfile();
      console.log('✅ Profile data received:', response);
      
      // Estructura según README: response.data.user
      const userData = response.data?.user || response.user || response.data || response;
      
      if (userData) {
        console.log('👤 User data structure:', userData);
        
        // Mapear datos personales según estructura del README
        const mappedPersonalInfo = {
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
          profileImage: userData.profileImage || '',
          isActive: userData.isActive !== false,
          role: userData.role || 'cliente'
        };
        
        setPersonalInfo(mappedPersonalInfo);
        
        // Verificar si es menor de edad
        const age = calculateAge(mappedPersonalInfo.dateOfBirth);
        setIsUnderAge(age !== null && age < 13);
        
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
        
        console.log('✅ Profile data mapped successfully');
        
        // Actualizar el contexto de usuario si es necesario
        if (updateUser) {
          updateUser({
            ...currentUser,
            ...userData
          });
        }
        
      } else {
        console.warn('⚠️ No user data found in response');
        showError('No se pudo cargar la información del perfil');
      }
      
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      
      if (error.response?.status === 401) {
        showError('Sesión expirada. Redirigiendo...');
        // El interceptor manejará la redirección
      } else if (error.response?.status === 404) {
        showError('Perfil no encontrado');
      } else {
        showError('Error al cargar datos del perfil: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 💾 GUARDAR INFORMACIÓN PERSONAL - USANDO PATCH COMO DICE EL README
  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      
      // Validar todos los campos antes de enviar
      if (!validateAllFields()) {
        showError('Por favor corrige los errores antes de guardar');
        return;
      }
      
      console.log('💾 Saving personal info...');
      
      // Preparar datos según estructura del README
      const dataToSend = {
        firstName: personalInfo.firstName.trim(),
        lastName: personalInfo.lastName.trim(),
        phone: personalInfo.phone.trim(),
        dateOfBirth: personalInfo.dateOfBirth || undefined,
        address: personalInfo.address.trim() || undefined,
        city: personalInfo.city.trim() || undefined,
        zipCode: personalInfo.zipCode.trim() || undefined,
        bio: personalInfo.bio.trim() || undefined
      };
      
      // Agregar contacto de emergencia solo si tiene datos
      if (personalInfo.emergencyContact.name.trim() || personalInfo.emergencyContact.phone.trim()) {
        dataToSend.emergencyContact = {
          name: personalInfo.emergencyContact.name.trim(),
          phone: personalInfo.emergencyContact.phone.trim(),
          relationship: personalInfo.emergencyContact.relationship || 'otro'
        };
      }
      
      console.log('📤 Data to send:', dataToSend);
      
      // Usar updateProfile que usa PATCH como dice el README
      const response = await apiService.updateProfile(dataToSend);
      
      console.log('✅ Profile updated successfully:', response);
      
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
      
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors || {};
        setValidationErrors(errors);
        showError('Por favor corrige los errores marcados');
      } else {
        const errorMsg = error.response?.data?.message || 'Error al actualizar información personal';
        showError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };
  
  // 🔐 CAMBIAR CONTRASEÑA
  const changePassword = async () => {
    try {
      setSaving(true);
      
      // Validaciones de contraseña
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
      
      // Validación de seguridad de contraseña
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(securityInfo.newPassword)) {
        showError('La contraseña debe contener al menos una minúscula, una mayúscula y un número');
        return;
      }
      
      console.log('🔐 Changing password...');
      
      await apiService.changePassword({
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
      
      if (error.response?.status === 401) {
        showError('Contraseña actual incorrecta');
      } else {
        const errorMsg = error.response?.data?.message || 'Error al cambiar contraseña';
        showError(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };
  
  // 📸 SUBIR IMAGEN DE PERFIL - RUTA CORRECTA DEL README
  const uploadProfileImage = async (file) => {
    try {
      setUploadingImage(true);
      console.log('📸 Uploading profile image...');
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Usar uploadProfileImage que usa la ruta exacta del README
      const response = await apiService.uploadProfileImage(formData);
      
      console.log('✅ Image uploaded successfully:', response);
      
      // Estructura según README: response.data.profileImage
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
      } else {
        console.warn('⚠️ No image URL received from server');
        showError('No se recibió la URL de la imagen');
      }
      
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      
      if (error.response?.status === 413) {
        showError('La imagen es demasiado grande. Máximo 5MB');
      } else if (error.response?.status === 422) {
        showError('Formato de imagen no válido. Usa JPG, PNG o WebP');
      } else {
        showError('Error al subir imagen de perfil: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setUploadingImage(false);
    }
  };
  
  // 📸 Manejar selección de imagen
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Formato no válido. Usa JPG, PNG o WebP');
      return;
    }
    
    // Validar tamaño (5MB max según README)
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
      console.log('💾 Saving preferences...');
      
      await apiService.updatePreferences(preferences);
      
      showSuccess('Preferencias actualizadas exitosamente');
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave({ type: 'profile', section: 'preferences' });
      }
      
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      showError('Error al guardar preferencias: ' + (error.response?.data?.message || error.message));
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
  
  // 📝 Manejar cambio de información personal con FILTRADO PREVENTIVO
  const handlePersonalInfoChange = (field, value) => {
    let filteredValue = value;
    
    // 🚫 FILTRADO PREVENTIVO: Bloquear caracteres no permitidos
    if (field === 'firstName' || field === 'lastName') {
      // Solo permitir letras, espacios, acentos y guiones - FILTRAR TODO LO DEMÁS
      filteredValue = value.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s\-']/g, '');
    } else if (field === 'phone') {
      // Solo permitir números, espacios, guiones, paréntesis y signo +
      filteredValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
    }
    
    setPersonalInfo(prev => ({
      ...prev,
      [field]: filteredValue
    }));
    setHasUnsavedChanges(true);
    
    // Validación en tiempo real solo para errores estructurales
    let error = null;
    if (field === 'firstName' || field === 'lastName') {
      if (!filteredValue.trim()) {
        error = 'Este campo es obligatorio';
      } else if (filteredValue.trim().length < 2) {
        error = 'Debe tener al menos 2 caracteres';
      } else if (filteredValue.length > 50) {
        error = 'Máximo 50 caracteres';
      }
    } else if (field === 'phone') {
      if (filteredValue.trim() && filteredValue.replace(/\s/g, '').length < 8) {
        error = 'Debe tener al menos 8 dígitos';
      }
    } else if (field === 'dateOfBirth') {
      error = validateDateOfBirth(filteredValue);
      const age = calculateAge(filteredValue);
      setIsUnderAge(age !== null && age < 13);
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };
  
  // 📝 Manejar cambio de contacto de emergencia con FILTRADO PREVENTIVO
  const handleEmergencyContactChange = (field, value) => {
    let filteredValue = value;
    
    // 🚫 FILTRADO PREVENTIVO: Bloquear caracteres no permitidos
    if (field === 'name') {
      // Solo permitir letras, espacios, acentos y guiones - FILTRAR TODO LO DEMÁS
      filteredValue = value.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s\-']/g, '');
    } else if (field === 'phone') {
      // Solo permitir números, espacios, guiones, paréntesis y signo +
      filteredValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
    }
    
    setPersonalInfo(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: filteredValue
      }
    }));
    setHasUnsavedChanges(true);
    
    // Validación en tiempo real solo para errores estructurales
    let error = null;
    if (field === 'name') {
      if (filteredValue.trim() && filteredValue.trim().length < 2) {
        error = 'Debe tener al menos 2 caracteres';
      } else if (filteredValue.length > 50) {
        error = 'Máximo 50 caracteres';
      }
    } else if (field === 'phone') {
      if (filteredValue.trim() && filteredValue.replace(/\s/g, '').length < 8) {
        error = 'Debe tener al menos 8 dígitos';
      }
    }
    
    if (error) {
      setValidationErrors(prev => ({
        ...prev,
        [`emergency${field.charAt(0).toUpperCase() + field.slice(1)}`]: error
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`emergency${field.charAt(0).toUpperCase() + field.slice(1)}`];
        return newErrors;
      });
    }
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

  // ✅ MOSTRAR LOADING USANDO ProfileLoader
  if (loading) {
    return <ProfileLoader message="Cargando información del perfil..." />;
  }

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
          
          {isUnderAge && (
            <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              <XCircle className="w-4 h-4 mr-1" />
              Menor de edad - Restricciones aplicadas
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
                <ButtonSpinner size="sm" color="primary" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
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
                {personalInfo.role === 'admin' ? 'Administrador' : 
                 personalInfo.role === 'colaborador' ? 'Personal' : 'Cliente'}
              </span>
            </div>
            
            {isUnderAge && (
              <div className="mt-2 bg-red-500/20 text-red-100 px-3 py-1 rounded-full text-xs inline-block">
                ⚠️ Cuenta con restricciones por edad
              </div>
            )}
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
                  disabled={saving || Object.keys(validationErrors).length > 0}
                  className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <ButtonSpinner size="sm" className="mr-2" />
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Solo letras y espacios"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Solo letras y espacios"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                  )}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Solo números: +502 1234-5678"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                    {isUnderAge && <span className="text-red-500 ml-1">⚠️</span>}
                  </label>
                  <input
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    } ${isUnderAge ? 'bg-red-50' : ''}`}
                    disabled={isUnderAge}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                  {isUnderAge && (
                    <p className="text-red-500 text-xs mt-1">
                      No puedes cambiar tu fecha de nacimiento si eres menor de 13 años
                    </p>
                  )}
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
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {personalInfo.bio.length}/500 caracteres
                  </p>
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        validationErrors.emergencyName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Solo letras y espacios"
                    />
                    {validationErrors.emergencyName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.emergencyContact.phone}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        validationErrors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Solo números: +502 1234-5678"
                    />
                    {validationErrors.emergencyPhone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyPhone}</p>
                    )}
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
                    className="btn-primary btn-sm flex items-center"
                  >
                    {saving ? (
                      <ButtonSpinner size="sm" className="mr-2" />
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
                    <li>Debe incluir al menos una minúscula, una mayúscula y un número</li>
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
                  className="btn-primary btn-sm flex items-center"
                >
                  {saving ? (
                    <ButtonSpinner size="sm" className="mr-2" />
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Edad:</span>
                      <span className="font-medium">
                        {personalInfo.dateOfBirth ? `${calculateAge(personalInfo.dateOfBirth)} años` : '—'}
                      </span>
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