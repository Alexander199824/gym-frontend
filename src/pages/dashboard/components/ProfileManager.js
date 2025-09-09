// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ProfileManager.js
// FUNCIÓN: Gestión completa del perfil con VALIDACIONES MEJORADAS y cambios individuales permitidos

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

// IMPORTACIÓN CORRECTA: Usar ProfileLoader del LoadingSpinner existente
import { ProfileLoader, ButtonSpinner } from '../../../components/common/LoadingSpinner';

const ProfileManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, updateUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, isMobile } = useApp();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estados para imagen de perfil
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estados de información personal - ESTRUCTURA CORRECTA DEL README
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
  
  // Estados originales para comparar cambios
  const [originalPersonalInfo, setOriginalPersonalInfo] = useState({});
  
  // Estados de validación - MEJORADOS PARA SER MENOS RESTRICTIVOS
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [isUnderAge, setIsUnderAge] = useState(false);
  
  // Estados de seguridad
  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginNotifications: true,
    securityQuestions: []
  });
  
  // Estados de preferencias
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
  
  // Estados de estadísticas del usuario
  const [userStats, setUserStats] = useState({
    memberSince: null,
    totalVisits: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteTime: '',
    totalWorkouts: 0,
    achievements: []
  });
  
  // Pestañas del perfil
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
  
  // MEJORADAS: FUNCIONES DE VALIDACIÓN MENOS RESTRICTIVAS
  
  // Validar nombres - SOLO errores críticos
  const validateName = (name, fieldName = 'campo') => {
    if (!name || !name.trim()) {
      return `${fieldName} es obligatorio`;
    }
    
    if (name.trim().length < 2) {
      return `${fieldName} debe tener al menos 2 caracteres`;
    }
    
    if (name.length > 50) {
      return `${fieldName} no puede exceder 50 caracteres`;
    }
    
    // MEJORADO: Solo caracteres completamente inválidos generan error
    const nameRegex = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]+$/;
    if (!nameRegex.test(name)) {
      return `${fieldName} contiene caracteres no válidos`;
    }
    
    return null;
  };
  
  // Validar teléfono - MÁS PERMISIVO
  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return null; // Opcional
    
    // MEJORADO: Más formatos permitidos
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    if (!phoneRegex.test(phone)) {
      return 'Formato de teléfono no válido';
    }
    
    // MEJORADO: Menos restrictivo en longitud
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return 'Teléfono debe tener al menos 7 dígitos';
    }
    
    return null;
  };
  
  // Validar email - SOLO formato básico
  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return 'Email es obligatorio';
    }
    
    // MEJORADO: Validación básica más permisiva
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Formato de email no válido';
    }
    
    return null;
  };
  
  // Calcular edad
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
  
  // Validar fecha de nacimiento - MENOS RESTRICTIVO
  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return null; // Opcional
    
    const age = calculateAge(dateOfBirth);
    if (age === null) return 'Fecha no válida';
    
    if (age < 13) {
      return 'Debes tener al menos 13 años';
    }
    
    if (age > 120) {
      return 'Fecha no válida';
    }
    
    return null;
  };
  
  // NUEVA FUNCIÓN: Validar solo campos críticos para guardar
  const validateCriticalFieldsOnly = () => {
    const errors = {};
    
    // Solo validar campos que tienen valor y son críticos
    if (personalInfo.firstName) {
      const firstNameError = validateName(personalInfo.firstName, 'Nombre');
      if (firstNameError) errors.firstName = firstNameError;
    }
    
    if (personalInfo.lastName) {
      const lastNameError = validateName(personalInfo.lastName, 'Apellido');
      if (lastNameError) errors.lastName = lastNameError;
    }
    
    if (personalInfo.email) {
      const emailError = validateEmail(personalInfo.email);
      if (emailError) errors.email = emailError;
    }
    
    if (personalInfo.phone && personalInfo.phone.trim()) {
      const phoneError = validatePhone(personalInfo.phone);
      if (phoneError) errors.phone = phoneError;
    }
    
    if (personalInfo.dateOfBirth) {
      const dateError = validateDateOfBirth(personalInfo.dateOfBirth);
      if (dateError) errors.dateOfBirth = dateError;
    }
    
    // Validar contacto de emergencia solo si tiene datos
    if (personalInfo.emergencyContact.name && personalInfo.emergencyContact.name.trim()) {
      const emergencyNameError = validateName(personalInfo.emergencyContact.name, 'Contacto de emergencia');
      if (emergencyNameError) errors.emergencyName = emergencyNameError;
    }
    
    if (personalInfo.emergencyContact.phone && personalInfo.emergencyContact.phone.trim()) {
      const emergencyPhoneError = validatePhone(personalInfo.emergencyContact.phone);
      if (emergencyPhoneError) errors.emergencyPhone = emergencyPhoneError;
    }
    
    return errors;
  };
  
  // NUEVA FUNCIÓN: Verificar si hay cambios reales
  const hasRealChanges = () => {
    if (!originalPersonalInfo) return false;
    
    // Comparar campos principales
    const fieldsToCompare = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'address', 'city', 'zipCode', 'bio'];
    
    for (const field of fieldsToCompare) {
      const original = originalPersonalInfo[field] || '';
      const current = personalInfo[field] || '';
      
      if (original.trim() !== current.trim()) {
        console.log(`Campo cambiado: ${field}`, { original, current });
        return true;
      }
    }
    
    // Comparar contacto de emergencia
    const originalEmergency = originalPersonalInfo.emergencyContact || {};
    const currentEmergency = personalInfo.emergencyContact || {};
    
    const emergencyFields = ['name', 'phone', 'relationship'];
    for (const field of emergencyFields) {
      const original = originalEmergency[field] || '';
      const current = currentEmergency[field] || '';
      
      if (original.trim() !== current.trim()) {
        console.log(`Contacto emergencia cambiado: ${field}`, { original, current });
        return true;
      }
    }
    
    return false;
  };
  
  // CARGAR DATOS DEL PERFIL - MANTIENE FUNCIONALIDAD EXISTENTE
  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos del perfil desde backend...');
      
      const response = await apiService.getProfile();
      console.log('Datos del perfil recibidos:', response);
      
      // Estructura según README: response.data.user
      const userData = response.data?.user || response.user || response.data || response;
      
      if (userData) {
        console.log('Estructura de datos del usuario:', userData);
        
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
        setOriginalPersonalInfo(JSON.parse(JSON.stringify(mappedPersonalInfo))); // NUEVO: Guardar estado original
        
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
        
        console.log('Datos del perfil mapeados exitosamente');
        
        // Actualizar el contexto de usuario si es necesario
        if (updateUser) {
          updateUser({
            ...currentUser,
            ...userData
          });
        }
        
        // NUEVO: Limpiar errores y cambios al cargar
        setValidationErrors({});
        setValidationWarnings({});
        setHasUnsavedChanges(false);
        
      } else {
        console.warn('No se encontraron datos de usuario en la respuesta');
        showError('No se pudo cargar la información del perfil');
      }
      
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
      
      if (error.response?.status === 401) {
        showError('Sesión expirada. Redirigiendo...');
      } else if (error.response?.status === 404) {
        showError('Perfil no encontrado');
      } else {
        showError('Error al cargar datos del perfil: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // MEJORADO: GUARDAR INFORMACIÓN PERSONAL - MÁS PERMISIVO
  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      console.log('Guardando información personal...');
      
      // MEJORADO: Solo validar campos críticos
      const criticalErrors = validateCriticalFieldsOnly();
      
      if (Object.keys(criticalErrors).length > 0) {
        setValidationErrors(criticalErrors);
        showError('Por favor corrige los errores antes de guardar');
        return;
      }
      
      // NUEVO: Verificar si hay cambios reales
      if (!hasRealChanges()) {
        showError('No hay cambios para guardar');
        return;
      }
      
      // MEJORADO: Preparar solo campos que cambiaron
      const dataToSend = {};
      
      // Solo enviar campos que cambiaron
      if (originalPersonalInfo.firstName !== personalInfo.firstName) {
        dataToSend.firstName = personalInfo.firstName.trim();
      }
      
      if (originalPersonalInfo.lastName !== personalInfo.lastName) {
        dataToSend.lastName = personalInfo.lastName.trim();
      }
      
      if (originalPersonalInfo.phone !== personalInfo.phone) {
        dataToSend.phone = personalInfo.phone.trim();
      }
      
      if (originalPersonalInfo.dateOfBirth !== personalInfo.dateOfBirth) {
        dataToSend.dateOfBirth = personalInfo.dateOfBirth || undefined;
      }
      
      if (originalPersonalInfo.address !== personalInfo.address) {
        dataToSend.address = personalInfo.address.trim() || undefined;
      }
      
      if (originalPersonalInfo.city !== personalInfo.city) {
        dataToSend.city = personalInfo.city.trim() || undefined;
      }
      
      if (originalPersonalInfo.zipCode !== personalInfo.zipCode) {
        dataToSend.zipCode = personalInfo.zipCode.trim() || undefined;
      }
      
      if (originalPersonalInfo.bio !== personalInfo.bio) {
        dataToSend.bio = personalInfo.bio.trim() || undefined;
      }
      
      // Verificar cambios en contacto de emergencia
      const originalEmergency = originalPersonalInfo.emergencyContact || {};
      const currentEmergency = personalInfo.emergencyContact || {};
      
      let emergencyChanged = false;
      ['name', 'phone', 'relationship'].forEach(field => {
        if ((originalEmergency[field] || '') !== (currentEmergency[field] || '')) {
          emergencyChanged = true;
        }
      });
      
      if (emergencyChanged) {
        dataToSend.emergencyContact = {
          name: currentEmergency.name?.trim() || '',
          phone: currentEmergency.phone?.trim() || '',
          relationship: currentEmergency.relationship || ''
        };
      }
      
      console.log('Datos a enviar (solo campos cambiados):', dataToSend);
      
      // NUEVO: Verificar que hay datos para enviar
      if (Object.keys(dataToSend).length === 0) {
        showError('No hay cambios para guardar');
        return;
      }
      
      // Usar updateProfile que usa PATCH como dice el README
      const response = await apiService.updateProfile(dataToSend);
      
      console.log('Perfil actualizado exitosamente:', response);
      
      showSuccess(`Información actualizada: ${Object.keys(dataToSend).join(', ')}`);
      
      // NUEVO: Actualizar estado original con los nuevos datos
      const updatedInfo = { ...personalInfo };
      setOriginalPersonalInfo(JSON.parse(JSON.stringify(updatedInfo)));
      
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
      setValidationErrors({});
      setValidationWarnings({});
      
      if (onSave) {
        onSave({ type: 'profile', section: 'personal' });
      }
      
    } catch (error) {
      console.error('Error al guardar información personal:', error);
      
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
  
  // CAMBIAR CONTRASEÑA - MANTIENE FUNCIONALIDAD EXISTENTE
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
      
      console.log('Cambiando contraseña...');
      
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
      console.error('Error al cambiar contraseña:', error);
      
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
  
  // SUBIR IMAGEN DE PERFIL - MANTIENE FUNCIONALIDAD EXISTENTE
  const uploadProfileImage = async (file) => {
    try {
      setUploadingImage(true);
      console.log('Subiendo imagen de perfil...');
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Usar uploadProfileImage que usa la ruta exacta del README
      const response = await apiService.uploadProfileImage(formData);
      
      console.log('Imagen subida exitosamente:', response);
      
      // Estructura según README: response.data.profileImage
      const imageUrl = response.data?.profileImage || response.profileImage;
      
      if (imageUrl) {
        setPersonalInfo(prev => ({
          ...prev,
          profileImage: imageUrl
        }));
        
        // NUEVO: Actualizar también el estado original
        setOriginalPersonalInfo(prev => ({
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
        console.warn('No se recibió la URL de la imagen del servidor');
        showError('No se recibió la URL de la imagen');
      }
      
    } catch (error) {
      console.error('Error al subir imagen de perfil:', error);
      
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
  
  // Manejar selección de imagen - MANTIENE FUNCIONALIDAD EXISTENTE
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
  
  // GUARDAR PREFERENCIAS - MANTIENE FUNCIONALIDAD EXISTENTE
  const savePreferences = async () => {
    try {
      setSaving(true);
      console.log('Guardando preferencias...');
      
      await apiService.updatePreferences(preferences);
      
      showSuccess('Preferencias actualizadas exitosamente');
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave({ type: 'profile', section: 'preferences' });
      }
      
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      showError('Error al guardar preferencias: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };
  
  // Cargar datos al montar - MANTIENE FUNCIONALIDAD EXISTENTE
  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser]);
  
  // Notificar cambios sin guardar - MANTIENE FUNCIONALIDAD EXISTENTE
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // MEJORADO: Manejar cambio de información personal CON VALIDACIÓN MENOS RESTRICTIVA
  const handlePersonalInfoChange = (field, value) => {
    let filteredValue = value;
    
    // FILTRADO PREVENTIVO: Bloquear caracteres no permitidos solo casos extremos
    if (field === 'firstName' || field === 'lastName') {
      // Solo permitir letras, espacios, acentos, guiones y apostrofes
      filteredValue = value.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]/g, '');
    } else if (field === 'phone') {
      // Solo permitir números, espacios, guiones, paréntesis, signo + y puntos
      filteredValue = value.replace(/[^\d\s\-\(\)\+\.]/g, '');
    }
    
    setPersonalInfo(prev => ({
      ...prev,
      [field]: filteredValue
    }));
    
    // NUEVO: Verificar cambios reales para habilitar botón
    const tempInfo = { ...personalInfo, [field]: filteredValue };
    const hasChanges = Object.keys(tempInfo).some(key => {
      if (key === 'emergencyContact') return false; // Se maneja por separado
      return (originalPersonalInfo[key] || '') !== (tempInfo[key] || '');
    });
    
    setHasUnsavedChanges(hasChanges);
    
    // MEJORADO: Validación en tiempo real SOLO para errores críticos
    let error = null;
    let warning = null;
    
    if (field === 'firstName' || field === 'lastName') {
      if (filteredValue.trim() && filteredValue.trim().length < 2) {
        warning = 'Muy corto (mínimo 2 caracteres)';
      } else if (filteredValue.length > 50) {
        error = 'Demasiado largo (máximo 50 caracteres)';
      }
    } else if (field === 'phone') {
      if (filteredValue.trim()) {
        const digitsOnly = filteredValue.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
          warning = 'Puede ser muy corto (mínimo 7 dígitos)';
        }
      }
    } else if (field === 'dateOfBirth') {
      const dateError = validateDateOfBirth(filteredValue);
      if (dateError) {
        error = dateError;
      }
      const age = calculateAge(filteredValue);
      setIsUnderAge(age !== null && age < 13);
    }
    
    // MEJORADO: Solo mostrar errores críticos, warnings como información
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
    
    setValidationWarnings(prev => {
      const newWarnings = { ...prev };
      if (warning) {
        newWarnings[field] = warning;
      } else {
        delete newWarnings[field];
      }
      return newWarnings;
    });
  };
  
  // MEJORADO: Manejar cambio de contacto de emergencia
  const handleEmergencyContactChange = (field, value) => {
    let filteredValue = value;
    
    // FILTRADO PREVENTIVO: Bloquear caracteres no permitidos
    if (field === 'name') {
      // Solo permitir letras, espacios, acentos y guiones
      filteredValue = value.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]/g, '');
    } else if (field === 'phone') {
      // Solo permitir números, espacios, guiones, paréntesis, signo + y puntos
      filteredValue = value.replace(/[^\d\s\-\(\)\+\.]/g, '');
    }
    
    setPersonalInfo(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: filteredValue
      }
    }));
    
    // NUEVO: Verificar cambios en contacto de emergencia
    const originalEmergency = originalPersonalInfo.emergencyContact || {};
    const newEmergency = { ...personalInfo.emergencyContact, [field]: filteredValue };
    
    const emergencyChanged = Object.keys(newEmergency).some(key => 
      (originalEmergency[key] || '') !== (newEmergency[key] || '')
    );
    
    const hasOtherChanges = Object.keys(personalInfo).some(key => {
      if (key === 'emergencyContact') return false;
      return (originalPersonalInfo[key] || '') !== (personalInfo[key] || '');
    });
    
    setHasUnsavedChanges(emergencyChanged || hasOtherChanges);
    
    // MEJORADO: Validación menos restrictiva
    let error = null;
    let warning = null;
    
    if (field === 'name') {
      if (filteredValue.trim() && filteredValue.trim().length < 2) {
        warning = 'Muy corto (mínimo 2 caracteres)';
      } else if (filteredValue.length > 50) {
        error = 'Demasiado largo (máximo 50 caracteres)';
      }
    } else if (field === 'phone') {
      if (filteredValue.trim()) {
        const digitsOnly = filteredValue.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
          warning = 'Puede ser muy corto (mínimo 7 dígitos)';
        }
      }
    }
    
    const errorKey = `emergency${field.charAt(0).toUpperCase() + field.slice(1)}`;
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[errorKey] = error;
      } else {
        delete newErrors[errorKey];
      }
      return newErrors;
    });
    
    setValidationWarnings(prev => {
      const newWarnings = { ...prev };
      if (warning) {
        newWarnings[errorKey] = warning;
      } else {
        delete newWarnings[errorKey];
      }
      return newWarnings;
    });
  };
  
  // Manejar cambio de preferencias - MANTIENE FUNCIONALIDAD EXISTENTE
  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // Manejar cambio de privacidad - MANTIENE FUNCIONALIDAD EXISTENTE
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

  // MOSTRAR LOADING USANDO ProfileLoader
  if (loading) {
    return <ProfileLoader message="Cargando información del perfil..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
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
      
      {/* HEADER DE PERFIL CON IMAGEN */}
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
                Cuenta con restricciones por edad
              </div>
            )}
          </div>
          
        </div>
      </div>
      
      {/* NAVEGACIÓN DE TABS */}
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
        
        {/* CONTENIDO SEGÚN TAB ACTIVO */}
        <div className="p-6">
          
          {/* TAB: INFORMACIÓN PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Información Personal</h4>
                <button
                  onClick={savePersonalInfo}
                  disabled={saving || Object.keys(validateCriticalFieldsOnly()).length > 0 || !hasRealChanges()}
                  className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  title={!hasRealChanges() ? 'No hay cambios para guardar' : Object.keys(validateCriticalFieldsOnly()).length > 0 ? 'Corrige los errores antes de guardar' : 'Guardar cambios'}
                >
                  {saving ? (
                    <ButtonSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </button>
              </div>
              
              {/* NUEVO: Indicador de cambios */}
              {hasRealChanges() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
                    </span>
                  </div>
                </div>
              )}
              
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
                      validationErrors.firstName ? 'border-red-500' : 
                      validationWarnings.firstName ? 'border-yellow-400' : 'border-gray-300'
                    }`}
                    placeholder="Solo letras y espacios"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                  )}
                  {!validationErrors.firstName && validationWarnings.firstName && (
                    <p className="text-yellow-600 text-xs mt-1">{validationWarnings.firstName}</p>
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
                      validationErrors.lastName ? 'border-red-500' : 
                      validationWarnings.lastName ? 'border-yellow-400' : 'border-gray-300'
                    }`}
                    placeholder="Solo letras y espacios"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                  )}
                  {!validationErrors.lastName && validationWarnings.lastName && (
                    <p className="text-yellow-600 text-xs mt-1">{validationWarnings.lastName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
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
                      validationErrors.phone ? 'border-red-500' : 
                      validationWarnings.phone ? 'border-yellow-400' : 'border-gray-300'
                    }`}
                    placeholder="Ejemplo: +502 1234-5678"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                  {!validationErrors.phone && validationWarnings.phone && (
                    <p className="text-yellow-600 text-xs mt-1">{validationWarnings.phone}</p>
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
                        validationErrors.emergencyName ? 'border-red-500' : 
                        validationWarnings.emergencyName ? 'border-yellow-400' : 'border-gray-300'
                      }`}
                      placeholder="Solo letras y espacios"
                    />
                    {validationErrors.emergencyName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyName}</p>
                    )}
                    {!validationErrors.emergencyName && validationWarnings.emergencyName && (
                      <p className="text-yellow-600 text-xs mt-1">{validationWarnings.emergencyName}</p>
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
                        validationErrors.emergencyPhone ? 'border-red-500' : 
                        validationWarnings.emergencyPhone ? 'border-yellow-400' : 'border-gray-300'
                      }`}
                      placeholder="Ejemplo: +502 1234-5678"
                    />
                    {validationErrors.emergencyPhone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyPhone}</p>
                    )}
                    {!validationErrors.emergencyPhone && validationWarnings.emergencyPhone && (
                      <p className="text-yellow-600 text-xs mt-1">{validationWarnings.emergencyPhone}</p>
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
          
          {/* TAB: SEGURIDAD - MANTIENE FUNCIONALIDAD EXISTENTE */}
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
          
          {/* TAB: PREFERENCIAS - MANTIENE FUNCIONALIDAD EXISTENTE */}
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
          
          {/* TAB: ESTADÍSTICAS - MANTIENE FUNCIONALIDAD EXISTENTE */}
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

/**
 * COMENTARIOS FINALES DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Este componente maneja la gestión completa del perfil de usuario en el sistema del gimnasio.
 * Permite a los usuarios actualizar su información personal, configurar la seguridad de su cuenta,
 * establecer preferencias y visualizar sus estadísticas de uso del gimnasio.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gestión completa de información personal (nombre, teléfono, dirección, biografía)
 * - Subida y actualización de imagen de perfil con validación de formato y tamaño
 * - Gestión de contacto de emergencia con validaciones de campos
 * - Cambio de contraseña con validaciones de seguridad robustas
 * - Configuración de preferencias de notificaciones (email, SMS, push)
 * - Configuración de idioma y zona horaria
 * - Configuración de privacidad para visibilidad de datos
 * - Visualización de estadísticas de uso y logros del gimnasio
 * - Sistema de validación mejorado y menos restrictivo
 * - Detección inteligente de cambios para evitar guardados innecesarios
 * - Interfaz por pestañas responsive para escritorio y móvil
 * 
 * CONEXIONES CON OTROS ARCHIVOS:
 * - AuthContext: Para obtener información del usuario actual y actualizar contexto
 * - AppContext: Para mostrar notificaciones y manejar formateo de fechas
 * - apiService: Para comunicación con backend (getProfile, updateProfile, changePassword, etc.)
 * - LoadingSpinner: Para componentes de loading (ProfileLoader, ButtonSpinner)
 * - Lucide React: Para iconografía completa del sistema
 * 
 * DATOS QUE MUESTRA AL USUARIO:
 * - Información personal completa con imagen de perfil
 * - Datos de contacto y dirección
 * - Información de contacto de emergencia
 * - Estado de configuraciones de seguridad y privacidad
 * - Preferencias de notificaciones y idioma
 * - Estadísticas de uso del gimnasio (visitas, rachas, entrenamientos)
 * - Fecha de membresía y logros obtenidos
 * - Edad calculada automáticamente desde fecha de nacimiento
 * 
 * VALIDACIONES IMPLEMENTADAS:
 * - Validación de nombres con caracteres permitidos (letras, acentos, espacios, guiones)
 * - Validación de teléfonos con formato flexible pero mínimo 7 dígitos
 * - Validación de email con formato básico
 * - Validación de fecha de nacimiento con límites de edad (13-120 años)
 * - Validación de contraseñas con complejidad mínima requerida
 * - Filtrado preventivo de caracteres no válidos en tiempo real
 * - Sistema de warnings vs errores críticos para mejor UX
 * 
 * CARACTERÍSTICAS ESPECIALES:
 * - Detección automática de menores de 13 años con restricciones aplicadas
 * - Solo envío de campos modificados al backend para optimizar rendimiento
 * - Comparación inteligente entre estado original y actual
 * - Validación de imágenes de perfil (formato, tamaño máximo 5MB)
 * - Interfaz adaptativa según permisos del usuario
 * - Sistema de pestañas con navegación fluida
 * - Indicadores visuales de cambios sin guardar
 * - Feedback inmediato en validaciones de formularios
 * 
 * SEGURIDAD:
 * - Email no editable (solo por administrador)
 * - Validación de contraseña actual antes de cambios
 * - Restricciones especiales para menores de edad
 * - Filtrado preventivo de caracteres maliciosos
 * - Validaciones tanto en frontend como backend
 * - Manejo seguro de subida de archivos
 */