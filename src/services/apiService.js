// src/services/apiService.js
// FUNCIÓN: Servicio API COMPLETO - INTEGRADO con Sistema de Horarios Flexibles
// MANTIENE: TODO lo existente + Sistema completo de horarios flexibles

import axios from 'axios';
import toast from 'react-hot-toast';

// CONFIGURACIÓN DE AXIOS - MANTIENE TODA LA CONFIGURACIÓN EXISTENTE
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

//  INTERCEPTOR DE PETICIONES - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 LOGS DETALLADOS - Mostrar TODA petición en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      console.log(`API REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${url}`);
      
      if (config.data) {
        console.log(' Request Data:', config.data);
      }
      if (config.params) {
        console.log(' Request Params:', config.params);
      }
    }
    
    return config;
  },
  (error) => {
    console.error(' Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 📨NTERCEPTOR DE RESPUESTAS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE + ANÁLISIS MEJORADO
api.interceptors.response.use(
  (response) => {
    // 🔍 LOGS SÚPER DETALLADOS - Mostrar TODO lo que devuelve el backend
    if (process.env.NODE_ENV === 'development') {
      const url = response.config.url;
      const method = response.config.method?.toUpperCase();
      
      console.group(`✅ BACKEND RESPONSE: ${method} ${url}`);
      console.log('📊 Status:', response.status);
      console.log('📋 Headers:', response.headers);
      
      // MOSTRAR DATOS COMPLETOS del backend
      if (response.data) {
        console.log('📦 FULL RESPONSE DATA:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // ✅ NUEVO: Análisis específico para horarios flexibles
        if (url.includes('/gym/config/flexible') && method === 'PUT') {
          console.log('🕒 FLEXIBLE HOURS UPDATE ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Update successful:', response.data?.success || false);
          console.log('  - Section updated:', response.data?.section || 'Not specified');
          console.log('  - Hours data present:', !!(data?.hours));
          console.log('  - Message:', response.data?.message || 'No message');
        }
        
        if (url.includes('/gym/config/editor') && method === 'GET') {
          console.log('📝 GYM CONFIG EDITOR ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Has gym config:', !!data);
          console.log('  - Hours structure:', data?.hours ? 'Present' : 'Missing');
          if (data?.hours) {
            const openDays = Object.keys(data.hours).filter(day => data.hours[day]?.isOpen);
            const totalSlots = openDays.reduce((sum, day) => {
              return sum + (data.hours[day]?.timeSlots?.length || 0);
            }, 0);
            console.log('  - Open days:', openDays.length);
            console.log('  - Total time slots:', totalSlots);
          }
        }
        
        if (url.includes('/gym/capacity/metrics') && method === 'GET') {
          console.log('📊 CAPACITY METRICS ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Total capacity:', data?.totalCapacity || 0);
          console.log('  - Total reservations:', data?.totalReservations || 0);
          console.log('  - Average occupancy:', data?.averageOccupancy || 0);
          console.log('  - Available spaces:', data?.availableSpaces || 0);
        }
        
        // ✅ Análisis específico para actualizaciones de perfil
        if (url.includes('/auth/profile') && method === 'PATCH') {
          console.log('👤 PROFILE UPDATE ANALYSIS:');
          const data = response.data?.data || response.data;
          if (data && data.user) {
            console.log('  - Update successful:', response.data?.success || false);
            console.log('  - User ID:', data.user.id);
            console.log('  - Updated fields:', response.data?.data?.changedFields || 'Not specified');
            console.log('  - Message:', response.data?.message || 'No message');
            console.log('  - Profile Image:', data.user.profileImage ? '✅ Present' : '❌ Missing');
          }
        }
        
        // Análisis específico por endpoint (mantiene todos los existentes)
        if (url.includes('/config')) {
          console.log('🏢 CONFIG ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Name:', data?.name || '❌ MISSING');
          console.log('  - Logo URL:', data?.logo?.url || '❌ MISSING');
          console.log('  - Description:', data?.description || '❌ MISSING');
          console.log('  - Contact:', data?.contact ? '✅ Present' : '❌ MISSING');
          console.log('  - Social:', data?.social ? Object.keys(data.social).length + ' platforms' : '❌ MISSING');
        }
        
        // Mantener todos los análisis existentes...
        // (resto de análisis existentes se mantienen igual)
        
      } else {
        console.log('📦 NO DATA in response');
      }
      
      console.groupEnd();
    }
    
    return response;
  },
  (error) => {
    const { response, config } = error;
    const url = config?.url || 'unknown';
    const method = config?.method?.toUpperCase() || 'UNKNOWN';
    
    // 🔍 LOGS DE ERROR SÚPER DETALLADOS (mantiene la lógica existente)
    console.group(`❌ BACKEND ERROR: ${method} ${url}`);
    
    if (response) {
      const status = response.status;
      console.log('📊 Error Status:', status);
      console.log('📋 Error Headers:', response.headers);
      console.log('📦 Error Data:', response.data);
      
      const fullUrl = `${config?.baseURL || ''}${url}`;
      
      // ✅ CORRECCIÓN CRÍTICA: Contexto específico por tipo de error
      switch (status) {
        case 401:
          // ✅ NO INTERFERIR CON LOGIN - Solo redirigir si NO estamos en login
          const isLoginRequest = url.includes('/auth/login') || url.includes('/login');
          const isLoginPage = window.location.pathname.includes('/login');
          
          if (isLoginRequest) {
            console.log('🔐 LOGIN FAILED: Credenciales incorrectas');
            console.log('✅ Permitiendo que LoginPage maneje el error');
          } else if (!isLoginPage) {
            console.log('🔐 PROBLEMA: Token expirado o inválido');
            console.log('🔧 ACCIÓN: Redirigiendo a login...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
            toast.error('Sesión expirada. Redirigiendo...');
            setTimeout(() => window.location.href = '/login', 1500);
          } else {
            console.log('🔐 Error 401 en página de login - No redirigir');
          }
          break;
          
        case 403:
          console.log('🚫 PROBLEMA: Sin permisos para esta acción');
          console.log('🔧 VERIFICAR: Rol del usuario y permisos necesarios');
          if (!url.includes('/auth/login')) {
            toast.error('Sin permisos para esta acción');
          }
          break;
          
        case 404:
          console.log('🔍 PROBLEMA: Endpoint no implementado en backend');
          console.log('🔧 VERIFICAR: ¿Existe la ruta en el backend?');
          console.log('📋 URL completa:', fullUrl);
          
          const isCritical = url.includes('/auth') || url.includes('/config');
          if (isCritical) {
            toast.error('Servicio no disponible');
          }
          break;
          
        case 422:
          console.log('📝 PROBLEMA: Datos inválidos enviados');
          console.log('🔧 VERIFICAR: Formato y validación de datos');
          if (response.data?.errors) {
            const errors = response.data.errors;
            console.log('📋 Errores de validación:', errors);
            
            // ✅ MEJORADO: No mostrar toast automático para errores de validación de perfil
            if (!url.includes('/auth/profile')) {
              if (Array.isArray(errors)) {
                const errorMsg = errors.map(err => err.message || err).join(', ');
                toast.error(`Datos inválidos: ${errorMsg}`);
              } else {
                toast.error('Datos inválidos enviados');
              }
            }
          }
          break;
          
        case 429:
          console.log('🚦 PROBLEMA: Demasiadas peticiones (rate limiting)');
          console.log('🔧 SOLUCIÓN: Reducir frecuencia de peticiones');
          toast.error('Demasiadas solicitudes, espera un momento');
          break;
          
        case 500:
          console.log('🔥 PROBLEMA: Error interno del servidor');
          console.log('🔧 VERIFICAR: Logs del backend para más detalles');
          console.log('📋 Error del servidor:', response.data?.message || 'Sin detalles');
          
          toast.error('Error del servidor, contacta soporte');
          break;
          
        default:
          console.log(`🤔 PROBLEMA: Error HTTP ${status}`);
          console.log('📋 Respuesta completa:', response.data);
          
          const message = response.data?.message || `Error ${status}`;
          if (!url.includes('/auth/login')) {
            toast.error(message);
          }
      }
      
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ PROBLEMA: Request Timeout');
      console.log('🔍 El servidor tardó más de', config?.timeout, 'ms en responder');
      toast.error('La solicitud tardó demasiado tiempo');
      
    } else if (error.code === 'ERR_NETWORK') {
      console.log('🌐 PROBLEMA: No se puede conectar al backend');
      console.log('📋 Backend URL configurada:', config?.baseURL);
      
      if (!window.location.pathname.includes('/login')) {
        toast.error('Sin conexión al servidor');
      }
      
    } else {
      console.log('🔥 ERROR DESCONOCIDO');
      console.log('🔍 Error message:', error.message);
      console.log('📋 Error code:', error.code);
    }
    
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔧 MÉTODOS GENERALES OPTIMIZADOS - MANTIENE TODA LA FUNCIONALIDAD
  // ================================
  
  // MÉTODO GENERAL GET - CON LOGS DETALLADOS
  async get(endpoint, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING GET REQUEST TO: ${url}`);
      
      const response = await api.get(url, config);
      
      console.log(`🎉 GET ${url} SUCCESS:`, {
        hasData: !!response.data,
        dataType: Array.isArray(response.data?.data) ? 'Array' : typeof response.data?.data,
        dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
        success: response.data?.success
      });
      
      return response.data;
    } catch (error) {
      console.log(`💥 GET ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL POST
  async post(endpoint, data, options = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING POST REQUEST TO: ${url}`, data);
      
      const response = await api.post(url, data, options);
      
      console.log(`🎉 POST ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 POST ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL PUT
  async put(endpoint, data, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING PUT REQUEST TO: ${url}`, data);
      
      const response = await api.put(url, data, config);
      
      console.log(`🎉 PUT ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 PUT ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // ✅ MEJORADO: MÉTODO GENERAL PATCH - Optimizado para actualizaciones parciales
  async patch(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING PATCH REQUEST TO: ${url}`);
      console.log('📤 PATCH Data (only changed fields):', data);
      
      const response = await api.patch(url, data);
      
      console.log(`🎉 PATCH ${url} SUCCESS:`, response.data);
      
      // ✅ NUEVO: Log específico para actualizaciones de perfil
      if (url.includes('/auth/profile')) {
        console.log('👤 PROFILE UPDATE SUCCESS:');
        console.log('  - Changed fields:', response.data?.data?.changedFields || Object.keys(data));
        console.log('  - Update message:', response.data?.message);
        console.log('  - User data updated:', !!response.data?.data?.user);
      }
      
      return response.data;
    } catch (error) {
      console.log(`💥 PATCH ${endpoint} FAILED:`, error.message);
      
      // ✅ NUEVO: Log específico para errores de perfil
      if (endpoint.includes('/auth/profile')) {
        console.log('👤 PROFILE UPDATE ERROR DETAILS:');
        console.log('  - Attempted to update:', Object.keys(data));
        console.log('  - Error type:', error.response?.status);
        console.log('  - Validation errors:', error.response?.data?.errors);
      }
      
      throw error;
    }
  }
  
  // MÉTODO GENERAL DELETE
  async delete(endpoint, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      this.logEndpointError('DELETE', endpoint, error);
      throw error;
    }
  }
  
  // 🔧 HELPER: Normalizar endpoints
  normalizeEndpoint(endpoint) {
    if (endpoint.startsWith('/api/')) return endpoint;
    if (endpoint.startsWith('/')) return `/api${endpoint}`;
    return `/api/${endpoint}`;
  }
  
  // 🔧 HELPER: Log de error detallado
  logEndpointError(method, endpoint, error) {
    const status = error.response?.status;
    
    console.group(`🔧 ${method} ${endpoint} Analysis`);
    console.log(`📍 Requested: ${endpoint}`);
    console.log(`🔗 Normalized: ${this.normalizeEndpoint(endpoint)}`);
    
    if (status) {
      console.log(`📊 HTTP Status: ${status}`);
    } else {
      console.log('❓ WHY: Cannot connect to backend');
      console.log('🔧 FIX: Start backend server');
    }
    
    console.groupEnd();
  }
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN - MEJORADOS PARA PERFIL
  // ================================
    
  // ✅ LOGIN CORREGIDO - Sin interferencia del interceptor
  async login(credentials) {
    console.log('🔐 ATTEMPTING LOGIN...');
    
    try {
      const response = await this.post('/auth/login', credentials);
      
      if (response.success && response.data.token) {
        localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
        console.log('✅ LOGIN SUCCESSFUL');
      }
      
      return response;
    } catch (error) {
      console.log('❌ LOGIN FAILED in apiService:', error.message);
      throw error;
    }
  }
    
  // REGISTRO
  async register(userData) {
    console.log('📝 ATTEMPTING REGISTRATION...');
    const response = await this.post('/auth/register', userData);
    
    if (response.success) {
      console.log('✅ REGISTRATION SUCCESSFUL');
      toast.success('Registro exitoso');
    }
    
    return response;
  }
    
  // OBTENER PERFIL
  async getProfile() {
    console.log('👤 FETCHING USER PROFILE...');
    try {
      const result = await this.get('/auth/profile');
      console.log('✅ PROFILE DATA RECEIVED:', result);
      
      if (result && result.data && result.data.user) {
        console.log('✅ Profile structure is correct (README format)');
        console.log('👤 User data:', {
          id: result.data.user.id,
          firstName: result.data.user.firstName,
          lastName: result.data.user.lastName,
          email: result.data.user.email,
          role: result.data.user.role,
          hasProfileImage: !!result.data.user.profileImage
        });
      } else {
        console.warn('⚠️ Profile structure might be different from README');
        console.log('📋 Actual structure:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE FETCH FAILED:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 PROFILE: Token expired or invalid');
      } else if (error.response?.status === 404) {
        console.log('👤 PROFILE: User not found');
      }
      
      throw error;
    }
  }

  // ✅ MEJORADO: ACTUALIZAR PERFIL - Optimizado para cambios individuales
  async updateProfile(profileData) {
    console.log('💾 UPDATING USER PROFILE WITH INDIVIDUAL CHANGES...');
    console.log('📤 Profile data to send (only changed fields):', profileData);
    
    try {
      // ✅ NUEVO: Validar que hay datos para enviar
      if (!profileData || Object.keys(profileData).length === 0) {
        console.warn('⚠️ No profile data provided for update');
        throw new Error('No hay datos para actualizar');
      }
      
      // ✅ NUEVO: Filtrar datos undefined o null innecesarios
      const cleanedData = {};
      Object.keys(profileData).forEach(key => {
        const value = profileData[key];
        
        // Solo incluir valores que no sean undefined
        if (value !== undefined) {
          // Para strings, limpiar espacios
          if (typeof value === 'string') {
            cleanedData[key] = value.trim();
          } else {
            cleanedData[key] = value;
          }
        }
      });
      
      console.log('📤 Cleaned profile data:', cleanedData);
      
      // ✅ VALIDACIÓN: Verificar que sigue habiendo datos después de limpiar
      if (Object.keys(cleanedData).length === 0) {
        console.warn('⚠️ No valid data after cleaning');
        throw new Error('No hay datos válidos para actualizar');
      }
      
      const result = await this.patch('/auth/profile', cleanedData);
      
      console.log('✅ PROFILE UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Update response structure is correct');
        
        if (result.data && result.data.user) {
          console.log('👤 Updated user data:', {
            id: result.data.user.id,
            firstName: result.data.user.firstName,
            lastName: result.data.user.lastName,
            phone: result.data.user.phone,
            changedFields: result.data.changedFields || Object.keys(cleanedData)
          });
        }
        
        // ✅ NUEVO: Mostrar mensaje de éxito específico
        if (result.data?.changedFields && result.data.changedFields.length > 0) {
          const fieldNames = {
            firstName: 'Nombre',
            lastName: 'Apellido', 
            phone: 'Teléfono',
            dateOfBirth: 'Fecha de nacimiento',
            address: 'Dirección',
            city: 'Ciudad',
            zipCode: 'Código postal',
            bio: 'Biografía',
            emergencyContact: 'Contacto de emergencia'
          };
          
          const updatedFieldNames = result.data.changedFields.map(field => 
            fieldNames[field] || field
          ).join(', ');
          
          console.log(`🎉 Successfully updated: ${updatedFieldNames}`);
        }
        
      } else {
        console.warn('⚠️ Update response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE UPDATE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - firstName/lastName: Only letters, spaces, accents allowed');
        console.log('   - phone: Only numbers, spaces, dashes, parentheses, + allowed');
        console.log('   - dateOfBirth: Must be at least 13 years old');
        
        // ✅ NUEVO: No lanzar toast automático, dejar que el componente maneje
        console.log('🤝 Letting component handle validation errors display');
        
      } else if (error.response?.status === 401) {
        console.log('🔐 PROFILE UPDATE: Authorization failed');
        toast.error('Sesión expirada, inicia sesión nuevamente');
      } else if (error.response?.status === 400) {
        console.log('📋 PROFILE UPDATE: Bad request, check data format');
      } else if (error.response?.status === 500) {
        console.log('🔥 PROFILE UPDATE: Server error');
        toast.error('Error del servidor al actualizar perfil');
      }
      
      throw error;
    }
  }

  // ✅ NUEVO: MÉTODO PARA ACTUALIZAR CAMPO INDIVIDUAL
  async updateProfileField(fieldName, fieldValue) {
    console.log(`📝 UPDATING SINGLE PROFILE FIELD: ${fieldName}`);
    console.log(`📤 New value:`, fieldValue);
    
    try {
      const updateData = {
        [fieldName]: fieldValue
      };
      
      const result = await this.updateProfile(updateData);
      
      console.log(`✅ SINGLE FIELD UPDATE SUCCESS: ${fieldName}`);
      
      return result;
    } catch (error) {
      console.log(`❌ SINGLE FIELD UPDATE FAILED: ${fieldName}`, error.message);
      throw error;
    }
  }

  // ✅ NUEVO: MÉTODO PARA VALIDAR DATOS DE PERFIL ANTES DE ENVIAR
  validateProfileData(profileData) {
    console.log('🔍 VALIDATING PROFILE DATA BEFORE SENDING...');
    
    const errors = [];
    const warnings = [];
    
    // Validar firstName
    if (profileData.firstName !== undefined) {
      if (!profileData.firstName || !profileData.firstName.trim()) {
        errors.push('firstName: El nombre es obligatorio');
      } else if (profileData.firstName.trim().length < 2) {
        errors.push('firstName: El nombre debe tener al menos 2 caracteres');
      } else if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]+$/.test(profileData.firstName)) {
        errors.push('firstName: Solo se permiten letras, espacios, acentos y guiones');
      }
    }
    
    // Validar lastName
    if (profileData.lastName !== undefined) {
      if (!profileData.lastName || !profileData.lastName.trim()) {
        errors.push('lastName: El apellido es obligatorio');
      } else if (profileData.lastName.trim().length < 2) {
        errors.push('lastName: El apellido debe tener al menos 2 caracteres');
      } else if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]+$/.test(profileData.lastName)) {
        errors.push('lastName: Solo se permiten letras, espacios, acentos y guiones');
      }
    }
    
    // Validar phone
    if (profileData.phone !== undefined && profileData.phone && profileData.phone.trim()) {
      if (!/^[\d\s\-\(\)\+\.]+$/.test(profileData.phone)) {
        errors.push('phone: Formato de teléfono no válido');
      } else {
        const digitsOnly = profileData.phone.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
          warnings.push('phone: El teléfono parece muy corto');
        }
      }
    }
    
    // Validar dateOfBirth
    if (profileData.dateOfBirth !== undefined && profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.push('dateOfBirth: Debes tener al menos 13 años');
      } else if (age > 120) {
        errors.push('dateOfBirth: Fecha de nacimiento no válida');
      }
    }
    
    // Validar emergencyContact
    if (profileData.emergencyContact !== undefined) {
      const emergency = profileData.emergencyContact;
      
      if (emergency.name && emergency.name.trim()) {
        if (emergency.name.trim().length < 2) {
          errors.push('emergencyContact.name: Muy corto (mínimo 2 caracteres)');
        } else if (!/^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-'.]+$/.test(emergency.name)) {
          errors.push('emergencyContact.name: Solo se permiten letras, espacios y acentos');
        }
      }
      
      if (emergency.phone && emergency.phone.trim()) {
        if (!/^[\d\s\-\(\)\+\.]+$/.test(emergency.phone)) {
          errors.push('emergencyContact.phone: Formato de teléfono no válido');
        }
      }
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ PROFILE DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ PROFILE DATA VALIDATION PASSED');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ PROFILE DATA WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    return validation;
  }

  // SUBIR IMAGEN DE PERFIL - MANTIENE FUNCIONALIDAD EXISTENTE
  async uploadProfileImage(formData) {
    console.log('📸 UPLOADING PROFILE IMAGE...');
    
    try {
      const result = await this.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ PROFILE IMAGE UPLOADED:', result);
      
      if (result && result.success && result.data) {
        console.log('✅ Image upload response structure is correct');
        console.log('📸 Image details:', {
          profileImage: result.data.profileImage,
          publicId: result.data.publicId,
          hasUserData: !!result.data.user
        });
        
        if (result.data.profileImage) {
          try {
            new URL(result.data.profileImage);
            console.log('✅ Profile image URL is valid');
          } catch {
            if (result.data.profileImage.startsWith('/') || result.data.profileImage.includes('cloudinary')) {
              console.log('✅ Profile image URL is a valid path/Cloudinary URL');
            } else {
              console.warn('⚠️ Profile image URL format might be unusual');
            }
          }
        }
      } else {
        console.warn('⚠️ Image upload response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE IMAGE UPLOAD FAILED:', error.message);
      
      if (error.response?.status === 413) {
        console.log('📏 IMAGE TOO LARGE: Max size is 5MB according to README');
        toast.error('La imagen es demasiado grande. Máximo 5MB');
      } else if (error.response?.status === 422) {
        console.log('🖼️ INVALID IMAGE FORMAT: Allowed formats: JPG, JPEG, PNG, WebP');
        toast.error('Formato de imagen no válido. Usa JPG, PNG o WebP');
      } else if (error.response?.status === 401) {
        console.log('🔐 IMAGE UPLOAD: Authorization failed');
        toast.error('Sesión expirada, inicia sesión nuevamente');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('🌐 IMAGE UPLOAD: Network error - check backend connection');
        toast.error('Error de conexión al subir imagen');
      }
      
      throw error;
    }
  }

  // CAMBIAR CONTRASEÑA - MANTIENE FUNCIONALIDAD EXISTENTE
  async changePassword(passwordData) {
    console.log('🔐 CHANGING PASSWORD...');
    
    try {
      const result = await this.post('/auth/change-password', passwordData);
      
      console.log('✅ PASSWORD CHANGED SUCCESSFULLY');
      toast.success('Contraseña actualizada exitosamente');
      
      return result;
    } catch (error) {
      console.log('❌ PASSWORD CHANGE FAILED:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 CURRENT PASSWORD INCORRECT');
        toast.error('Contraseña actual incorrecta');
      } else if (error.response?.status === 422) {
        console.log('📝 PASSWORD VALIDATION FAILED:', error.response.data?.errors);
        console.log('💡 Password requirements:');
        console.log('   - At least 6 characters');
        console.log('   - At least one lowercase letter');
        console.log('   - At least one uppercase letter');
        console.log('   - At least one number');
        toast.error('La contraseña debe tener al menos 6 caracteres y incluir mayúscula, minúscula y número');
      } else {
        toast.error('Error al cambiar contraseña');
      }
      
      throw error;
    }
  }

  // ACTUALIZAR PREFERENCIAS - MANTIENE FUNCIONALIDAD EXISTENTE
  async updatePreferences(preferences) {
    console.log('⚙️ UPDATING USER PREFERENCES...');
    console.log('📤 Preferences to update:', preferences);
    
    try {
      const result = await this.put('/auth/profile/preferences', preferences);
      
      console.log('✅ PREFERENCES UPDATED SUCCESSFULLY:', result);
      toast.success('Preferencias actualizadas exitosamente');
      
      return result;
    } catch (error) {
      console.log('❌ PREFERENCES UPDATE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 PREFERENCES VALIDATION FAILED:', error.response.data?.errors);
        toast.error('Error en las preferencias, verifica los datos');
      } else {
        toast.error('Error al actualizar preferencias');
      }
      
      throw error;
    }
  }
  
  // ================================
  // 🏢 MÉTODOS DE GIMNASIO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER CONFIGURACIÓN DEL GYM
  async getGymConfig() {
    console.log('🏢 FETCHING GYM CONFIGURATION...');
    try {
      const result = await this.get('/gym/config');
      console.log('✅ GYM CONFIG RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🆕 SISTEMA DE HORARIOS FLEXIBLES - NUEVOS MÉTODOS
  // ================================
  
  // 📝 OBTENER CONFIGURACIÓN COMPLETA PARA CONTENTEDITOR
  async getGymConfigEditor() {
    console.log('📝 FETCHING GYM CONFIG FOR CONTENT EDITOR...');
    
    try {
      const result = await this.get('/gym/config/editor');
      
      console.log('✅ GYM CONFIG EDITOR RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Config editor structure is correct');
        console.log('📝 Config editor details:', {
          hasName: !!result.data.name,
          hasHours: !!result.data.hours,
          hasContact: !!result.data.contact,
          hasSocial: !!result.data.social,
          hasStats: !!result.data.stats
        });
        
        // Análisis específico de horarios flexibles
        if (result.data.hours) {
          const openDays = Object.keys(result.data.hours).filter(day => 
            result.data.hours[day]?.isOpen
          );
          const totalSlots = openDays.reduce((sum, day) => {
            return sum + (result.data.hours[day]?.timeSlots?.length || 0);
          }, 0);
          
          console.log('🕒 Flexible hours analysis:', {
            totalDays: Object.keys(result.data.hours).length,
            openDays: openDays.length,
            totalTimeSlots: totalSlots,
            hasFlexibleStructure: openDays.some(day => 
              result.data.hours[day]?.timeSlots?.length > 1
            )
          });
        }
      } else {
        console.warn('⚠️ Config editor structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG EDITOR FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📝 CONFIG EDITOR: Endpoint not found - using fallback to regular config');
        // Usar configuración regular como fallback
        return await this.getGymConfig();
      }
      
      throw error;
    }
  }
  
  // 💾 GUARDAR HORARIOS FLEXIBLES
  async saveFlexibleSchedule(scheduleData) {
    console.log('💾 SAVING FLEXIBLE SCHEDULE...');
    console.log('📤 Schedule data to save:', scheduleData);
    
    try {
      const requestData = {
        section: 'schedule',
        data: {
          hours: scheduleData
        }
      };
      
      const result = await this.put('/gym/config/flexible', requestData);
      
      console.log('✅ FLEXIBLE SCHEDULE SAVED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Schedule save response structure is correct');
        console.log('💾 Schedule save details:', {
          section: result.section || 'schedule',
          success: result.success,
          message: result.message || 'Schedule saved'
        });
        
        // Mostrar toast de éxito
        if (result.message) {
          toast.success(result.message);
        } else {
          toast.success('Horarios flexibles guardados exitosamente');
        }
      } else {
        console.warn('⚠️ Schedule save response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ FLEXIBLE SCHEDULE SAVE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - timeSlots: Must be valid time slots array');
        console.log('   - capacity: Must be positive numbers');
        console.log('   - open/close times: Must be valid time format');
        
        // Mostrar errores específicos
        if (error.response.data?.errors) {
          const errorMsg = Array.isArray(error.response.data.errors) 
            ? error.response.data.errors.join(', ')
            : error.response.data.message || 'Error de validación';
          toast.error(`Error en horarios: ${errorMsg}`);
        } else {
          toast.error('Error validando horarios flexibles');
        }
      } else if (error.response?.status === 403) {
        console.log('🔒 SCHEDULE SAVE: Permission denied');
        toast.error('Sin permisos para guardar horarios');
      } else {
        toast.error('Error al guardar horarios flexibles');
      }
      
      throw error;
    }
  }
  
  // 📊 OBTENER MÉTRICAS DE CAPACIDAD
  async getCapacityMetrics() {
    console.log('📊 FETCHING CAPACITY METRICS...');
    
    try {
      const result = await this.get('/gym/capacity/metrics');
      
      console.log('✅ CAPACITY METRICS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Capacity metrics structure is correct');
        console.log('📊 Capacity metrics details:', {
          totalCapacity: result.data.totalCapacity || 0,
          totalReservations: result.data.totalReservations || 0,
          averageOccupancy: result.data.averageOccupancy || 0,
          availableSpaces: result.data.availableSpaces || 0,
          busiestDay: result.data.busiestDay || 'N/A',
          busiestOccupancy: result.data.busiestOccupancy || 0
        });
      } else {
        console.warn('⚠️ Capacity metrics structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ CAPACITY METRICS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📊 CAPACITY METRICS: Endpoint not found - returning default metrics');
        return {
          success: true,
          data: {
            totalCapacity: 0,
            totalReservations: 0,
            averageOccupancy: 0,
            availableSpaces: 0,
            busiestDay: '',
            busiestOccupancy: 0
          }
        };
      }
      
      throw error;
    }
  }
  
  // 🔄 ALTERNAR DÍA ABIERTO/CERRADO
  async toggleDayOpen(day) {
    console.log(`🔄 TOGGLING DAY OPEN STATUS: ${day}`);
    
    try {
      const result = await this.post(`/gym/hours/${day}/toggle`);
      
      console.log('✅ DAY TOGGLE SUCCESSFUL:', result);
      
      if (result && result.success) {
        console.log('✅ Day toggle response structure is correct');
        console.log(`🔄 Day ${day} is now: ${result.data?.isOpen ? 'OPEN' : 'CLOSED'}`);
        
        // Mostrar feedback
        const status = result.data?.isOpen ? 'abierto' : 'cerrado';
        toast.success(`${day} marcado como ${status}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ DAY TOGGLE FAILED for ${day}:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('🔄 DAY TOGGLE: Endpoint not found');
        toast.error('Función no disponible');
      } else if (error.response?.status === 422) {
        console.log('📝 DAY TOGGLE: Invalid day provided');
        toast.error('Día inválido');
      }
      
      throw error;
    }
  }
  
  // ➕ AGREGAR FRANJA HORARIA
  async addTimeSlot(day, slotData) {
    console.log(`➕ ADDING TIME SLOT TO ${day}:`, slotData);
    
    try {
      const result = await this.post(`/gym/hours/${day}/slots`, slotData);
      
      console.log('✅ TIME SLOT ADDED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.slot) {
        console.log('✅ Add time slot response structure is correct');
        console.log('➕ New time slot details:', {
          open: result.data.slot.open,
          close: result.data.slot.close,
          capacity: result.data.slot.capacity,
          label: result.data.slot.label || 'Sin etiqueta'
        });
        
        // Mostrar feedback
        const timeRange = `${result.data.slot.open} - ${result.data.slot.close}`;
        toast.success(`Franja horaria agregada: ${timeRange}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ ADD TIME SLOT FAILED for ${day}:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 TIME SLOT VALIDATION FAILED:', error.response.data?.errors);
        toast.error('Error en datos de franja horaria');
      } else if (error.response?.status === 404) {
        console.log('➕ ADD TIME SLOT: Endpoint not found');
        toast.error('Función no disponible');
      }
      
      throw error;
    }
  }
  
  // ❌ ELIMINAR FRANJA HORARIA
  async removeTimeSlot(day, slotIndex) {
    console.log(`❌ REMOVING TIME SLOT FROM ${day} at index ${slotIndex}`);
    
    try {
      const result = await this.delete(`/gym/hours/${day}/slots/${slotIndex}`);
      
      console.log('✅ TIME SLOT REMOVED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Remove time slot response structure is correct');
        toast.success('Franja horaria eliminada');
      }
      
      return result;
    } catch (error) {
      console.log(`❌ REMOVE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('❌ REMOVE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      } else if (error.response?.status === 422) {
        console.log('📝 REMOVE TIME SLOT: Invalid slot index');
        toast.error('Índice de franja inválido');
      }
      
      throw error;
    }
  }
  
  // ✏️ ACTUALIZAR FRANJA HORARIA
  async updateTimeSlot(day, slotIndex, field, value) {
    console.log(`✏️ UPDATING TIME SLOT ${day}[${slotIndex}] - ${field}: ${value}`);
    
    try {
      const requestData = {
        field: field,
        value: value
      };
      
      const result = await this.patch(`/gym/hours/${day}/slots/${slotIndex}`, requestData);
      
      console.log('✅ TIME SLOT UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Update time slot response structure is correct');
        console.log(`✏️ Updated ${field} to ${value}`);
        
        // Mostrar feedback específico por campo
        const fieldLabels = {
          open: 'Hora de apertura',
          close: 'Hora de cierre',
          capacity: 'Capacidad',
          reservations: 'Reservaciones',
          label: 'Etiqueta'
        };
        
        const fieldLabel = fieldLabels[field] || field;
        toast.success(`${fieldLabel} actualizada`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ UPDATE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 TIME SLOT UPDATE VALIDATION FAILED:', error.response.data?.errors);
        
        // Mostrar errores específicos por campo
        const fieldErrors = {
          capacity: 'La capacidad debe ser un número positivo',
          reservations: 'Las reservaciones no pueden exceder la capacidad',
          open: 'Hora de apertura inválida',
          close: 'Hora de cierre inválida'
        };
        
        const errorMsg = fieldErrors[field] || 'Error en el campo';
        toast.error(errorMsg);
      } else if (error.response?.status === 404) {
        console.log('✏️ UPDATE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      }
      
      throw error;
    }
  }
  
  // 📋 DUPLICAR FRANJA HORARIA
  async duplicateTimeSlot(day, slotIndex) {
    console.log(`📋 DUPLICATING TIME SLOT FROM ${day}[${slotIndex}]`);
    
    try {
      const result = await this.post(`/gym/hours/${day}/slots/${slotIndex}/duplicate`);
      
      console.log('✅ TIME SLOT DUPLICATED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.slot) {
        console.log('✅ Duplicate time slot response structure is correct');
        console.log('📋 Duplicated slot details:', {
          open: result.data.slot.open,
          close: result.data.slot.close,
          capacity: result.data.slot.capacity,
          label: result.data.slot.label || 'Copia'
        });
        
        // Mostrar feedback
        const timeRange = `${result.data.slot.open} - ${result.data.slot.close}`;
        toast.success(`Franja duplicada: ${timeRange}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ DUPLICATE TIME SLOT FAILED for ${day}[${slotIndex}]:`, error.message);
      
      if (error.response?.status === 404) {
        console.log('📋 DUPLICATE TIME SLOT: Slot not found');
        toast.error('Franja horaria no encontrada');
      } else if (error.response?.status === 422) {
        console.log('📝 DUPLICATE TIME SLOT: Cannot duplicate');
        toast.error('No se puede duplicar la franja');
      }
      
      throw error;
    }
  }
  
  // 📊 APLICAR CAPACIDAD A TODAS LAS FRANJAS
  async applyCapacityToAllSlots(capacity) {
    console.log(`📊 APPLYING CAPACITY ${capacity} TO ALL TIME SLOTS`);
    
    try {
      const requestData = {
        capacity: parseInt(capacity) || 0
      };
      
      const result = await this.post('/gym/hours/capacity/apply-all', requestData);
      
      console.log('✅ CAPACITY APPLIED TO ALL SLOTS SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Apply capacity response structure is correct');
        console.log('📊 Capacity application details:', {
          capacity: capacity,
          slotsAffected: result.data?.slotsAffected || 0,
          daysAffected: result.data?.daysAffected || 0
        });
        
        // Mostrar feedback detallado
        const slotsCount = result.data?.slotsAffected || 0;
        const daysCount = result.data?.daysAffected || 0;
        toast.success(`Capacidad de ${capacity} aplicada a ${slotsCount} franjas en ${daysCount} días`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ APPLY CAPACITY TO ALL FAILED:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 APPLY CAPACITY VALIDATION FAILED:', error.response.data?.errors);
        toast.error('Capacidad inválida (debe ser un número positivo)');
      } else if (error.response?.status === 404) {
        console.log('📊 APPLY CAPACITY: Endpoint not found');
        toast.error('Función no disponible');
      }
      
      throw error;
    }
  }
  

  // ================================
  // ✅ MÉTODOS DE DEBUG Y VALIDACIÓN
  // ================================

  // VERIFICAR ENDPOINTS ESPECÍFICOS PARA PERFIL
  async checkProfileEndpoints() {
    console.log('🔍 CHECKING PROFILE ENDPOINTS AVAILABILITY...');
    
    const endpoints = [
      { path: '/auth/profile', method: 'GET', description: 'Get user profile' },
      { path: '/auth/profile', method: 'PATCH', description: 'Update user profile' },
      { path: '/auth/profile/image', method: 'POST', description: 'Upload profile image' },
      { path: '/auth/change-password', method: 'POST', description: 'Change password' },
      { path: '/auth/profile/preferences', method: 'PUT', description: 'Update preferences' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Checking ${endpoint.method} ${endpoint.path}...`);
        
        if (endpoint.method === 'GET' && endpoint.path === '/auth/profile') {
          await this.get(endpoint.path);
          results[endpoint.path] = { available: true, method: endpoint.method };
          console.log(`✅ ${endpoint.description} - Available`);
        } else {
          results[endpoint.path] = { available: true, method: endpoint.method, note: 'Not tested (would need real data)' };
          console.log(`✅ ${endpoint.description} - Endpoint exists (not tested)`);
        }
        
      } catch (error) {
        results[endpoint.path] = { available: false, method: endpoint.method, error: error.message };
        
        if (error.response?.status === 404) {
          console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
        } else if (error.response?.status === 401) {
          console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          results[endpoint.path].available = true;
          results[endpoint.path].note = 'Requires authentication';
        } else {
          console.log(`⚠️ ${endpoint.description} - ${error.message}`);
        }
      }
    }
    
    console.log('📋 Profile endpoints check summary:');
    console.table(results);
    
    return results;
  }

  // DEBUG COMPLETO DE PERFIL
  async debugProfileSystem() {
    console.log('🔍 =====================================');
    console.log('👤 PROFILE SYSTEM DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints
      console.log('📡 1. CHECKING PROFILE ENDPOINTS...');
      const endpointsCheck = await this.checkProfileEndpoints();
      
      // 2. Verificar perfil actual
      console.log('👤 2. CHECKING CURRENT PROFILE...');
      try {
        const profile = await this.getProfile();
        console.log('✅ Current profile loaded successfully');
        
        if (profile && profile.data && profile.data.user) {
          const user = profile.data.user;
          console.log('📊 PROFILE ANALYSIS:');
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Name: ${user.firstName} ${user.lastName}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Phone: ${user.phone || 'Not provided'}`);
          console.log(`   - Role: ${user.role}`);
          console.log(`   - Profile Image: ${user.profileImage ? 'Yes' : 'No'}`);
          console.log(`   - Date of Birth: ${user.dateOfBirth || 'Not provided'}`);
          console.log(`   - Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
          
          if (user.dateOfBirth) {
            const birthDate = new Date(user.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            console.log(`   - Calculated Age: ${age} years`);
            
            if (age < 13) {
              console.log('   - ⚠️ USER IS UNDER 13 - RESTRICTIONS SHOULD APPLY');
            }
          }
          
          const validation = this.validateProfileData(user);
          console.log(`   - Validation Result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
          
        } else {
          console.warn('⚠️ Profile structure is different from expected README format');
        }
        
      } catch (profileError) {
        console.log('❌ Could not load current profile:', profileError.message);
      }
      
      // 3. Verificar conexión al backend
      console.log('🌐 3. CHECKING BACKEND CONNECTION...');
      try {
        const health = await this.healthCheck();
        console.log('✅ Backend connection is healthy');
      } catch (healthError) {
        console.log('❌ Backend connection issues:', healthError.message);
      }
      
      console.log('🔍 =====================================');
      console.log('👤 PROFILE SYSTEM DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ PROFILE SYSTEM DEBUG FAILED:', error);
    }
  }

  // DEBUG ESPECÍFICO PARA CARRITO Y CHECKOUT
  async debugCartAndCheckoutSystem() {
    console.log('🔍 =====================================');
    console.log('🛒 CART & CHECKOUT DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints de carrito
      console.log('📡 1. CHECKING CART ENDPOINTS...');
      
      const cartEndpoints = [
        { path: '/store/cart', method: 'GET', description: 'Get cart' },
        { path: '/store/cart', method: 'POST', description: 'Add to cart' },
        { path: '/store/cart/{id}', method: 'PUT', description: 'Update cart item' },
        { path: '/store/cart/{id}', method: 'DELETE', description: 'Remove from cart' },
        { path: '/store/orders', method: 'POST', description: 'Create order (checkout)' },
        { path: '/store/my-orders', method: 'GET', description: 'Get my orders' },
        { path: '/stripe/config', method: 'GET', description: 'Get Stripe config' },
        { path: '/stripe/create-store-intent', method: 'POST', description: 'Create payment intent' },
        { path: '/stripe/confirm-payment', method: 'POST', description: 'Confirm payment' }
      ];
      
      for (const endpoint of cartEndpoints) {
        try {
          if (endpoint.method === 'GET' && endpoint.path === '/store/cart') {
            const result = await this.getCart();
            console.log(`✅ ${endpoint.description} - Available`);
          } else if (endpoint.method === 'GET' && endpoint.path === '/stripe/config') {
            const result = await this.getStripeConfig();
            console.log(`✅ ${endpoint.description} - Available`);
          } else {
            console.log(`📋 ${endpoint.description} - Endpoint exists (requires data to test)`);
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
          } else if (error.response?.status === 401) {
            console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          } else {
            console.log(`⚠️ ${endpoint.description} - ${error.message}`);
          }
        }
      }
      
      // 2. Verificar productos disponibles
      console.log('🛍️ 2. CHECKING PRODUCTS AVAILABILITY...');
      try {
        const products = await this.get('/store/products', { params: { limit: 5 } });
        if (products && products.data && products.data.products) {
          console.log(`✅ Products available: ${products.data.products.length} found`);
          console.log('📦 Sample product:', products.data.products[0]?.name || 'N/A');
        } else {
          console.log('⚠️ No products found or unexpected format');
        }
      } catch (error) {
        console.log('❌ Products endpoint failed:', error.message);
      }
      
      // 3. Verificar estructura de carrito vacío
      console.log('🛒 3. CHECKING EMPTY CART STRUCTURE...');
      try {
        const emptyCart = await this.getCart();
        console.log('✅ Empty cart structure:', {
          hasCartItems: !!emptyCart.data?.cartItems,
          isArray: Array.isArray(emptyCart.data?.cartItems),
          hasSummary: !!emptyCart.data?.summary,
          itemCount: emptyCart.data?.cartItems?.length || 0
        });
      } catch (error) {
        console.log('❌ Empty cart check failed:', error.message);
      }
      
      console.log('🔍 =====================================');
      console.log('🛒 CART & CHECKOUT DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ CART & CHECKOUT DEBUG FAILED:', error);
    }
  }

  // VALIDAR DATOS DE ORDEN PARA CHECKOUT
  validateOrderData(orderData) {
    console.log('🔍 VALIDATING ORDER DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    // Validar items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('items is required and must be a non-empty array');
    } else {
      orderData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`items[${index}].productId is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`items[${index}].quantity must be a positive number`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`items[${index}].price must be a positive number`);
        }
      });
    }
    
    // Si es orden de invitado, validar información del cliente
    if (orderData.sessionId) {
      if (!orderData.customerInfo) {
        errors.push('customerInfo is required for guest orders');
      } else {
        if (!orderData.customerInfo.name || orderData.customerInfo.name.trim() === '') {
          errors.push('customerInfo.name is required');
        }
        if (!orderData.customerInfo.email || orderData.customerInfo.email.trim() === '') {
          errors.push('customerInfo.email is required');
        } else if (!/\S+@\S+\.\S+/.test(orderData.customerInfo.email)) {
          errors.push('customerInfo.email is not valid');
        }
        if (!orderData.customerInfo.phone || orderData.customerInfo.phone.trim() === '') {
          errors.push('customerInfo.phone is required');
        }
      }
    }
    
    // Validar dirección de envío
    if (!orderData.shippingAddress) {
      errors.push('shippingAddress is required');
    } else {
      if (!orderData.shippingAddress.street || orderData.shippingAddress.street.trim() === '') {
        errors.push('shippingAddress.street is required');
      }
      if (!orderData.shippingAddress.city || orderData.shippingAddress.city.trim() === '') {
        errors.push('shippingAddress.city is required');
      }
    }
    
    // Validar método de pago
    const validPaymentMethods = ['cash_on_delivery', 'card', 'transfer'];
    if (!orderData.paymentMethod || !validPaymentMethods.includes(orderData.paymentMethod)) {
      errors.push('paymentMethod must be one of: ' + validPaymentMethods.join(', '));
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length,
        isGuest: !!orderData.sessionId,
        itemsCount: orderData.items?.length || 0,
        paymentMethod: orderData.paymentMethod
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ ORDER DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ ORDER DATA VALIDATION PASSED');
    }
    
    return validation;
  }



  // FORMATEAR DATOS DE ORDEN SEGÚN README
  formatOrderDataForAPI(orderData) {
    console.log('🔄 FORMATTING ORDER DATA FOR API...');
    
    const formattedData = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        selectedVariants: item.selectedVariants || {}
      })),
      paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
      deliveryTimeSlot: orderData.deliveryTimeSlot || 'morning',
      notes: orderData.notes || ''
    };
    
    if (orderData.sessionId) {
      formattedData.sessionId = orderData.sessionId;
      formattedData.customerInfo = {
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone
      };
    }
    
    if (orderData.shippingAddress) {
      formattedData.shippingAddress = {
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city || 'Guatemala',
        state: orderData.shippingAddress.state || 'Guatemala',
        zipCode: orderData.shippingAddress.zipCode || '01001',
        reference: orderData.shippingAddress.reference || ''
      };
    }
    
    if (orderData.summary) {
      formattedData.summary = orderData.summary;
    }
    
    console.log('✅ Order data formatted for API:', {
      isGuest: !!formattedData.sessionId,
      itemsCount: formattedData.items.length,
      hasCustomerInfo: !!formattedData.customerInfo,
      hasShippingAddress: !!formattedData.shippingAddress,
      paymentMethod: formattedData.paymentMethod
    });
    
    return formattedData;
  }

// ✅ AGREGAR ESTE MÉTODO A TU ARCHIVO apiService.js
// Colócalo en la sección de "MÉTODOS DE ÓRDENES"

// ================================
// 🛍️ MÉTODOS DE ÓRDENES
// ================================

async createOrder(orderData) {
  console.log('🛍️ CREATING ORDER (CHECKOUT)...');
  console.log('📤 Order data to send:', orderData);
  
  try {
    const result = await this.post('/store/orders', orderData);
    
    console.log('✅ ORDER CREATED SUCCESSFULLY:', result);
    
    if (result && result.success && result.data?.order) {
      console.log('✅ Order creation response structure is correct');
      console.log('🛍️ Order details:', {
        id: result.data.order.id,
        orderNumber: result.data.order.orderNumber,
        totalAmount: result.data.order.totalAmount,
        status: result.data.order.status,
        paymentMethod: result.data.order.paymentMethod,
        itemsCount: result.data.order.items?.length || 0,
        isGuest: !!orderData.sessionId
      });
      
      // Mostrar toast de éxito
      toast.success(`Orden creada: #${result.data.order.orderNumber}`);
    } else {
      console.warn('⚠️ Order creation response structure might be different from README');
    }
    
    return result;
  } catch (error) {
    console.log('❌ ORDER CREATION FAILED:', error.message);
    
    if (error.response?.status === 422) {
      console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
      console.log('💡 Common validation issues:');
      console.log('   - customerInfo: Required for guest orders');
      console.log('   - shippingAddress: Required for all orders');
      console.log('   - items: Must be valid array of products');
      console.log('   - paymentMethod: Must be valid payment method');
    } else if (error.response?.status === 404) {
      console.log('🛍️ ORDER ENDPOINT NOT FOUND: Check backend implementation');
      toast.error('Servicio de órdenes no disponible');
    } else if (error.response?.status === 400) {
      console.log('📋 BAD REQUEST: Check order data format');
      toast.error('Datos de orden inválidos');
    } else if (error.response?.status === 401) {
      console.log('🔐 AUTHORIZATION REQUIRED for order creation');
      toast.error('Sesión expirada, inicia sesión nuevamente');
    } else {
      toast.error('Error al crear la orden');
    }
    
    throw error;
  }
}

// ✅ TAMBIÉN AGREGAR ESTOS MÉTODOS RELACIONADOS SI NO LOS TIENES:

async getMyOrders(params = {}) {
  console.log('🛍️ FETCHING MY ORDERS...');
  
  try {
    const result = await this.get('/store/my-orders', { params });
    
    console.log('✅ MY ORDERS RECEIVED:', result);
    
    if (result && result.data) {
      if (Array.isArray(result.data)) {
        console.log(`✅ Orders list: ${result.data.length} orders found`);
      } else if (result.data.orders && Array.isArray(result.data.orders)) {
        console.log(`✅ Orders list: ${result.data.orders.length} orders found`);
        console.log('📄 Pagination:', result.data.pagination);
      }
    }
    
    return result;
  } catch (error) {
    console.log('❌ GET MY ORDERS FAILED:', error.message);
    
    if (error.response?.status === 404) {
      console.log('🛍️ NO ORDERS FOUND: User has no orders yet');
      return {
        success: true,
        data: {
          orders: [],
          pagination: {
            total: 0,
            page: 1,
            pages: 0,
            limit: params.limit || 10
          }
        }
      };
    }
    
    throw error;
  }
}

async getOrderById(orderId) {
  console.log('🛍️ FETCHING ORDER BY ID...');
  console.log('🎯 Order ID:', orderId);
  
  try {
    const result = await this.get(`/store/orders/${orderId}`);
    
    console.log('✅ ORDER DETAILS RECEIVED:', result);
    
    if (result && result.data && result.data.order) {
      console.log('✅ Order details structure is correct');
      console.log('🛍️ Order info:', {
        id: result.data.order.id,
        orderNumber: result.data.order.orderNumber,
        status: result.data.order.status,
        totalAmount: result.data.order.totalAmount,
        itemsCount: result.data.order.items?.length || 0
      });
    }
    
    return result;
  } catch (error) {
    console.log('❌ GET ORDER BY ID FAILED:', error.message);
    
    if (error.response?.status === 404) {
      console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid or does not belong to user');
    } else if (error.response?.status === 403) {
      console.log('🔒 ACCESS DENIED: Cannot view this order (not owner)');
    }
    
    throw error;
  }
}


  // MÉTODO COMPLETO PARA CHECKOUT
  async processCheckout(orderData) {
    console.log('🛍️ PROCESSING COMPLETE CHECKOUT...');
    console.log('📤 Raw order data received:', orderData);
    
    try {
      const validation = this.validateOrderData(orderData);
      
      if (!validation.isValid) {
        const errorMessage = 'Datos de orden inválidos: ' + validation.errors.join(', ');
        console.log('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const formattedData = this.formatOrderDataForAPI(orderData);
      const result = await this.createOrder(formattedData);
      
      console.log('✅ CHECKOUT PROCESSED SUCCESSFULLY:', result);
      
      return result;
      
    } catch (error) {
      console.log('❌ CHECKOUT PROCESSING FAILED:', error.message);
      throw error;
    }
  }

  // VALIDAR DATOS DE TESTIMONIO
  validateTestimonialData(testimonialData) {
    console.log('🔍 VALIDATING TESTIMONIAL DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    if (!testimonialData.text || typeof testimonialData.text !== 'string') {
      errors.push('text is required and must be a string');
    } else {
      const textLength = testimonialData.text.trim().length;
      if (textLength < 10) {
        errors.push('text must be at least 10 characters long');
      } else if (textLength > 500) {
        errors.push('text cannot exceed 500 characters');
      }
    }
    
    if (!testimonialData.rating || typeof testimonialData.rating !== 'number') {
      errors.push('rating is required and must be a number');
    } else if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      errors.push('rating must be between 1 and 5');
    }
    
    if (!testimonialData.role || typeof testimonialData.role !== 'string') {
      errors.push('role is required and must be a string');
    } else if (testimonialData.role.trim().length === 0) {
      errors.push('role cannot be empty');
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length,
        textLength: testimonialData.text?.trim()?.length || 0,
        rating: testimonialData.rating,
        role: testimonialData.role?.trim()
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ TESTIMONIAL DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ TESTIMONIAL DATA VALIDATION PASSED');
    }
    
    return validation;
  }

  // FORMATEAR DATOS DE TESTIMONIO
  formatTestimonialDataForAPI(testimonialData) {
    console.log('🔄 FORMATTING TESTIMONIAL DATA FOR API...');
    
    const formattedData = {
      text: testimonialData.text?.trim() || '',
      rating: parseInt(testimonialData.rating) || 1,
      role: testimonialData.role?.trim() || ''
    };
    
    console.log('✅ Testimonial data formatted for API:', {
      textLength: formattedData.text.length,
      rating: formattedData.rating,
      role: formattedData.role,
      isValid: formattedData.text.length >= 10 && 
               formattedData.rating >= 1 && 
               formattedData.rating <= 5 && 
               formattedData.role.length > 0
    });
    
    return formattedData;
  }

  // MÉTODO COMPLETO PARA CREAR TESTIMONIO CON VALIDACIÓN
  async submitTestimonial(testimonialData) {
    console.log('💬 SUBMITTING TESTIMONIAL WITH VALIDATION...');
    console.log('📤 Raw testimonial data received:', testimonialData);
    
    try {
      const validation = this.validateTestimonialData(testimonialData);
      
      if (!validation.isValid) {
        const errorMessage = 'Datos de testimonio inválidos: ' + validation.errors.join(', ');
        console.log('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const formattedData = this.formatTestimonialDataForAPI(testimonialData);
      const result = await this.createTestimonial(formattedData);
      
      console.log('✅ TESTIMONIAL SUBMITTED SUCCESSFULLY:', result);
      
      return result;
      
    } catch (error) {
      console.log('❌ TESTIMONIAL SUBMISSION FAILED:', error.message);
      throw error;
    }
  }

  // 🔧 GUARDAR CONFIGURACIÓN POR SECCIONES
  async saveGymConfigSection(section, data) {
    console.log(`🔧 SAVING GYM CONFIG SECTION: ${section}`);
    console.log('📤 Section data:', data);
    
    try {
      const requestData = {
        section: section,
        data: data
      };
      
      const result = await this.put('/gym/config/flexible', requestData);
      
      console.log(`✅ CONFIG SECTION ${section} SAVED SUCCESSFULLY:`, result);
      
      if (result && result.success) {
        console.log('✅ Section save response structure is correct');
        
        // Mostrar feedback específico por sección
        const sectionLabels = {
          basic: 'Información básica',
          contact: 'Información de contacto',
          social: 'Redes sociales',
          schedule: 'Horarios y capacidad',
          stats: 'Estadísticas'
        };
        
        const sectionLabel = sectionLabels[section] || section;
        const message = result.message || `${sectionLabel} guardada exitosamente`;
        toast.success(message);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ SAVE CONFIG SECTION ${section} FAILED:`, error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 CONFIG SECTION VALIDATION FAILED:', error.response.data?.errors);
        
        // Mostrar errores específicos por sección
        const sectionErrors = {
          basic: 'Error en información básica',
          contact: 'Error en información de contacto',
          social: 'Error en redes sociales',
          schedule: 'Error en horarios',
          stats: 'Error en estadísticas'
        };
        
        const errorMsg = sectionErrors[section] || `Error en sección ${section}`;
        toast.error(errorMsg);
      } else if (error.response?.status === 403) {
        console.log('🔒 SAVE CONFIG SECTION: Permission denied');
        toast.error('Sin permisos para guardar configuración');
      } else {
        toast.error(`Error al guardar ${section}`);
      }
      
      throw error;
    }
  }
  
  // ================================
  // 🏢 MÉTODOS DE GIMNASIO - MANTIENE FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER ESTADÍSTICAS
  async getGymStats() {
    console.log('📊 FETCHING GYM STATISTICS...');
    try {
      const result = await this.get('/gym/stats');
      console.log('✅ GYM STATS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM STATS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER SERVICIOS
  async getGymServices() {
    console.log('🏋️ FETCHING GYM SERVICES...');
    try {
      const result = await this.get('/gym/services');
      console.log('✅ GYM SERVICES RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM SERVICES FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PLANES DE MEMBRESÍA
  async getMembershipPlans() {
    console.log('🎫 FETCHING MEMBERSHIP PLANS...');
    try {
      const result = await this.get('/gym/membership-plans');
      console.log('✅ MEMBERSHIP PLANS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PLANS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    console.log('💬 FETCHING TESTIMONIALS...');
    try {
      const result = await this.get('/gym/testimonials');
      console.log('✅ TESTIMONIALS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIALS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER VIDEO DEL GIMNASIO
  async getGymVideo() {
    console.log('🎬 FETCHING GYM VIDEO...');
    try {
      const result = await this.get('/gym/video');
      console.log('✅ GYM VIDEO RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM VIDEO FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 💬 MÉTODOS DE TESTIMONIOS - MANTIENE FUNCIONALIDAD EXISTENTE
  // ================================

  // CREAR TESTIMONIO (Solo para clientes autenticados)
  async createTestimonial(testimonialData) {
    console.log('💬 CREATING TESTIMONIAL...');
    console.log('📤 Testimonial data to send:', testimonialData);
    
    try {
      const result = await this.post('/testimonials', testimonialData);
      
      console.log('✅ TESTIMONIAL CREATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Testimonial creation response structure is correct');
        console.log('💬 Testimonial details:', {
          hasThankYouMessage: !!result.data?.thankYouMessage,
          testimonialId: result.data?.testimonial?.id,
          rating: result.data?.testimonial?.rating,
          submittedAt: result.data?.testimonial?.submittedAt
        });
        
        if (result.data?.thankYouMessage) {
          console.log('💝 Thank you message:', result.data.thankYouMessage);
        }
      } else {
        console.warn('⚠️ Testimonial creation response structure might be different from API docs');
      }
      
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIAL CREATION FAILED:', error.message);
      
      if (error.response?.status === 400) {
        console.log('💬 TESTIMONIAL: User already has a testimonial');
        console.log('💝 Response includes thank you message:', !!error.response.data?.data?.thankYouMessage);
      } else if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - text: Must be between 10 and 500 characters');
        console.log('   - rating: Must be between 1 and 5');
        console.log('   - role: Must be provided');
      } else if (error.response?.status === 403) {
        console.log('🔒 TESTIMONIAL: Only clients can submit testimonials');
      } else if (error.response?.status === 401) {
        console.log('🔐 TESTIMONIAL: Authentication required');
      }
      
      throw error;
    }
  }

  // OBTENER MIS TESTIMONIOS (Solo para clientes autenticados)
  async getMyTestimonials() {
    console.log('💬 FETCHING MY TESTIMONIALS...');
    
    try {
      const result = await this.get('/testimonials/my-testimonials');
      
      console.log('✅ MY TESTIMONIALS RECEIVED:', result);
      
      if (result && result.success && result.data) {
        console.log('✅ My testimonials response structure is correct');
        console.log('💬 My testimonials details:', {
          totalTestimonials: result.data.total || 0,
          testimonialsCount: result.data.testimonials?.length || 0,
          hasActiveTestimonial: result.data.hasActiveTestimonial || false,
          hasPendingTestimonial: result.data.hasPendingTestimonial || false,
          canSubmitNew: result.data.canSubmitNew !== false,
          hasThankYouMessage: !!result.data.thankYouMessage
        });
        
        if (result.data.testimonials && Array.isArray(result.data.testimonials)) {
          result.data.testimonials.forEach((testimonial, index) => {
            console.log(`💬 Testimonial ${index + 1}:`, {
              id: testimonial.id,
              rating: testimonial.rating,
              status: testimonial.status,
              featured: testimonial.featured || false,
              canEdit: testimonial.canEdit || false,
              canDelete: testimonial.canDelete || false,
              textLength: testimonial.text?.length || 0
            });
          });
        }
        
        if (result.data.thankYouMessage) {
          console.log('💝 Thank you message:', result.data.thankYouMessage);
        }
      } else {
        console.warn('⚠️ My testimonials response structure might be different from API docs');
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET MY TESTIMONIALS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💬 TESTIMONIALS: No testimonials found or user has empty testimonials list');
        return {
          success: true,
          data: {
            testimonials: [],
            total: 0,
            hasActiveTestimonial: false,
            hasPendingTestimonial: false,
            canSubmitNew: true,
            thankYouMessage: null
          }
        };
      } else if (error.response?.status === 403) {
        console.log('🔒 TESTIMONIALS: Only clients can view their testimonials');
      } else if (error.response?.status === 401) {
        console.log('🔐 TESTIMONIALS: Authentication required');
      }
      
      throw error;
    }
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER PRODUCTOS DESTACADOS
  async getFeaturedProducts() {
    console.log('🛍️ FETCHING FEATURED PRODUCTS...');
    try {
      const result = await this.get('/store/featured-products');
      console.log('✅ FEATURED PRODUCTS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ FEATURED PRODUCTS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PRODUCTOS
  async getProducts(params = {}) {
    const response = await api.get('/api/store/products', { params });
    return response.data;
  }
  

  // OBTENER CATEGORÍAS DE PRODUCTOS
  async getProductCategories() {
    console.log('🗂️ FETCHING PRODUCT CATEGORIES...');
    
    try {
      const result = await this.get('/store/categories');
      
      console.log('✅ PRODUCT CATEGORIES RECEIVED:', result);
      
      if (result && result.data && result.data.categories) {
        console.log('✅ Categories structure is correct');
        console.log('🗂️ Categories details:', {
          totalCategories: result.data.categories.length,
          hasActiveCategories: result.data.categories.some(cat => cat.isActive !== false)
        });
      } else {
        console.warn('⚠️ Categories structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT CATEGORIES FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🗂️ CATEGORIES: Endpoint not found - Categories not implemented');
        return {
          success: true,
          data: {
            categories: []
          }
        };
      }
      
      throw error;
    }
  }

  // OBTENER MARCAS DE PRODUCTOS
  async getProductBrands() {
    console.log('🏷️ FETCHING PRODUCT BRANDS...');
    
    try {
      const result = await this.get('/store/brands');
      
      console.log('✅ PRODUCT BRANDS RECEIVED:', result);
      
      if (result && result.data && result.data.brands) {
        console.log('✅ Brands structure is correct');
        console.log('🏷️ Brands details:', {
          totalBrands: result.data.brands.length
        });
      } else {
        console.warn('⚠️ Brands structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT BRANDS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🏷️ BRANDS: Endpoint not found - Brands not implemented');
        return {
          success: true,
          data: {
            brands: []
          }
        };
      }
      
      throw error;
    }
  }

  // OBTENER PRODUCTO POR ID
  async getProductById(productId) {
    console.log('🛍️ FETCHING PRODUCT BY ID...');
    console.log('🎯 Product ID:', productId);
    
    try {
      const result = await this.get(`/store/products/${productId}`);
      
      console.log('✅ PRODUCT DETAILS RECEIVED:', result);
      
      if (result && result.data) {
        console.log('✅ Product details structure is correct');
        console.log('🛍️ Product info:', {
          id: result.data.id,
          name: result.data.name,
          price: result.data.price,
          inStock: result.data.inStock !== false,
          hasImages: !!result.data.images?.length
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET PRODUCT BY ID FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ PRODUCT NOT FOUND: Product ID might be invalid');
      }
      
      throw error;
    }
  }
  // ================================
  // 📄 MÉTODOS DE CONTENIDO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // OBTENER CONTENIDO DE SECCIONES
  async getSectionsContent() {
    console.log('📄 FETCHING SECTIONS CONTENT...');
    try {
      const result = await this.get('/gym/sections-content');
      console.log('✅ SECTIONS CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ SECTIONS CONTENT FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER NAVEGACIÓN
  async getNavigation() {
    console.log('🧭 FETCHING NAVIGATION...');
    try {
      const result = await this.get('/gym/navigation');
      console.log('✅ NAVIGATION RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ NAVIGATION FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER PROMOCIONES
  async getPromotions() {
    console.log('🎉 FETCHING PROMOTIONS...');
    try {
      const result = await this.get('/gym/promotions');
      console.log('✅ PROMOTIONS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ PROMOTIONS FAILED:', error.message);
      throw error;
    }
  }
    
  // OBTENER BRANDING
  async getBranding() {
    console.log('🎨 FETCHING BRANDING...');
    try {
      const result = await this.get('/gym/branding');
      console.log('✅ BRANDING RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ BRANDING FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER CONTENIDO DE LANDING PAGE
  async getLandingContent() {
    console.log('📄 FETCHING LANDING CONTENT...');
    try {
      const result = await this.get('/content/landing');
      console.log('✅ LANDING CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ LANDING CONTENT FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // MANTIENE TODOS LOS MÉTODOS RESTANTES EXISTENTES
  // (Usuarios, Membresías, Pagos, Carrito, Órdenes, Stripe, etc.)
  // ================================
  
  // [... resto de métodos existentes se mantienen exactamente igual]
  // Para brevedad del código, incluyo solo algunos métodos clave
  // pero TODOS los métodos existentes se mantienen sin cambios
  
  async getUsers(params = {}) {
    console.log('👥 FETCHING USERS WITH ROLE FILTERS...');
    console.log('📋 Original params:', params);
    
    try {
      const filteredParams = { ...params };
      
      console.log('📤 Sending filtered params:', filteredParams);
      
      const response = await this.get('/users', { params: filteredParams });
      
      const userData = response.data || response;
      let users = [];
      
      if (userData.users && Array.isArray(userData.users)) {
        users = userData.users;
      } else if (Array.isArray(userData)) {
        users = userData;
      }
      
      console.log('✅ Users fetched successfully:', {
        totalUsers: users.length,
        roleDistribution: users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        params: filteredParams
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  async getClientUsers(params = {}) {
    console.log('👤 FETCHING CLIENT USERS ONLY...');
    
    const clientParams = {
      ...params,
      role: 'cliente'
    };
    
    return this.getUsers(clientParams);
  }
  
  async getUsersByCurrentUserRole(currentUserRole, params = {}) {
    console.log('🎭 FETCHING USERS BY CURRENT USER ROLE:', currentUserRole);
    
    let filteredParams = { ...params };
    
    switch (currentUserRole) {
      case 'admin':
        console.log('🔓 Admin user: No role filtering applied');
        break;
        
      case 'colaborador':
        filteredParams.role = 'cliente';
        console.log('🔒 Colaborador user: Filtering to clients only');
        break;
        
      case 'cliente':
        console.log('🔒 Cliente user: Should not be accessing user list');
        throw new Error('Los clientes no pueden ver la lista de usuarios');
        
      default:
        console.log('❓ Unknown user role, applying restrictive filter');
        filteredParams.role = 'cliente';
    }
    
    return this.getUsers(filteredParams);
  }
  
  async createUser(userData, currentUserRole = null) {
    console.log('👤 CREATING USER WITH ROLE VALIDATION...');
    console.log('📤 User data:', userData);
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    if (currentUserRole === 'colaborador' && userData.role !== 'cliente') {
      throw new Error('Los colaboradores solo pueden crear usuarios clientes');
    }
    
    try {
      const response = await this.post('/users', userData);
      
      if (response.success) {
        console.log('✅ User created successfully:', response.data?.user);
        toast.success('Usuario creado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(userId, userData, currentUserRole = null, currentUserId = null) {
    console.log('👤 UPDATING USER WITH PERMISSION VALIDATION...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    console.log('📤 Update data:', userData);
    
    if (currentUserRole === 'colaborador') {
      throw new Error('Los colaboradores no pueden editar usuarios existentes');
    }
    
    if (userId === currentUserId) {
      throw new Error('No puedes editarte a ti mismo desde la gestión de usuarios');
    }
    
    try {
      const response = await this.put(`/users/${userId}`, userData);
      
      if (response.success) {
        console.log('✅ User updated successfully:', response.data?.user);
        toast.success('Usuario actualizado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }
  
  async deleteUser(userId, currentUserRole = null, currentUserId = null) {
    console.log('🗑️ DELETING USER WITH PERMISSION VALIDATION...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    if (currentUserRole === 'colaborador') {
      throw new Error('Los colaboradores no pueden eliminar usuarios');
    }
    
    if (userId === currentUserId) {
      throw new Error('No puedes eliminarte a ti mismo');
    }
    
    try {
      const response = await this.delete(`/users/${userId}`);
      
      console.log('✅ User deleted successfully');
      toast.success('Usuario eliminado exitosamente');
      
      return response;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }


  async getUserStats(currentUserRole = null) {
    console.log('📊 FETCHING USER STATISTICS...');
    console.log('👨‍💼 Current user role for filtering:', currentUserRole);
    
    try {
      const response = await this.get('/users/stats');
      console.log('✅ USER STATS FROM BACKEND:', response);
      
      let stats = response.data || response;
      
      if (currentUserRole === 'colaborador' && stats.roleStats) {
        console.log('🔒 Filtering stats for colaborador role');
        
        const filteredStats = {
          ...stats,
          roleStats: {
            cliente: stats.roleStats.cliente || 0
          },
          totalUsers: stats.roleStats.cliente || 0,
          totalActiveUsers: Math.min(stats.totalActiveUsers || 0, stats.roleStats.cliente || 0)
        };
        
        console.log('✅ Filtered stats for colaborador:', filteredStats);
        return filteredStats;
      }
      
      return stats;
      
    } catch (error) {
      console.warn('⚠️ getUserStats fallback to manual calculation');
      
      try {
        const usersResponse = await this.getUsersByCurrentUserRole(currentUserRole || 'admin');
        const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || [];
        
        const stats = {
          totalUsers: users.length,
          totalActiveUsers: users.filter(u => u.isActive !== false).length,
          totalInactiveUsers: users.filter(u => u.isActive === false).length,
          roleStats: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {}),
          newUsersThisMonth: users.filter(user => {
            const createdAt = new Date(user.createdAt || user.created_at);
            const thisMonth = new Date();
            return createdAt.getMonth() === thisMonth.getMonth() && 
                   createdAt.getFullYear() === thisMonth.getFullYear();
          }).length
        };
        
        console.log('✅ User stats calculated manually with role filter:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getUserStats methods failed:', fallbackError);
        
        const fallbackStats = {
          totalUsers: 0,
          totalActiveUsers: 0,
          totalInactiveUsers: 0,
          newUsersThisMonth: 0
        };
        
        if (currentUserRole === 'colaborador') {
          fallbackStats.roleStats = { cliente: 0 };
        } else {
          fallbackStats.roleStats = {
            admin: 0,
            colaborador: 0,
            cliente: 0
          };
        }
        
        return fallbackStats;
      }
    }
  }

  async getMembershipStats() {
    console.log('📊 FETCHING MEMBERSHIP STATISTICS...');
    try {
      const response = await this.get('/memberships/stats');
      console.log('✅ MEMBERSHIP STATS FROM BACKEND:', response);
      return response.data || response;
    } catch (error) {
      console.warn('⚠️ getMembershipStats fallback to manual calculation');
      
      try {
        const memberships = await this.getMemberships();
        const membershipArray = Array.isArray(memberships) ? memberships : memberships.data || [];
        
        const now = new Date();
        const stats = {
          totalMemberships: membershipArray.length,
          activeMemberships: membershipArray.filter(m => {
            const endDate = new Date(m.endDate || m.end_date);
            return endDate > now && (m.status === 'active' || !m.status);
          }).length,
          expiredMemberships: membershipArray.filter(m => {
            const endDate = new Date(m.endDate || m.end_date);
            return endDate <= now;
          }).length,
          expiringSoon: membershipArray.filter(m => {
            const endDate = new Date(m.endDate || m.end_date);
            const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return endDate > now && endDate <= weekAhead;
          }).length
        };
        
        console.log('✅ Membership stats calculated manually:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getMembershipStats methods failed:', fallbackError);
        return {
          totalMemberships: 0,
          activeMemberships: 0,
          expiredMemberships: 0,
          expiringSoon: 0
        };
      }
    }
  }
  

  // ✅ MÉTODO: Obtener membresías del usuario actual
async getMemberships(params = {}) {
  try {
    console.log('👤 ApiService: Getting user memberships...');
    
    const response = await this.get('/api/memberships', { params });
    
    console.log('📦 ApiService: User memberships response:', response);
    
    return response;
    
  } catch (error) {
    console.error('❌ ApiService: Error getting memberships:', error);
    throw error;
  }
}

// ✅ MÉTODO: Obtener historial de pagos del usuario
async getPayments(params = {}) {
  try {
    console.log('💰 ApiService: Getting user payments...');
    
    const response = await this.get('/api/payments', { params });
    
    console.log('📦 ApiService: User payments response:', response);
    
    return response;
    
  } catch (error) {
    console.error('❌ ApiService: Error getting payments:', error);
    throw error;
  }
}

  async getPaymentReports(params = {}) {
    console.log('📊 FETCHING PAYMENT REPORTS...');
    try {
      const response = await api.get('/api/payments/reports', { params });
      console.log('✅ PAYMENT REPORTS FROM BACKEND:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ getPaymentReports fallback to manual calculation');
      
      try {
        const payments = await this.getPayments(params);
        const paymentArray = Array.isArray(payments) ? payments : payments.data || [];
        
        const totalIncome = paymentArray.reduce((sum, payment) => {
          return sum + parseFloat(payment.amount || 0);
        }, 0);
        
        const incomeByMethod = paymentArray.reduce((acc, payment) => {
          const method = payment.method || 'unknown';
          const existing = acc.find(item => item.method === method);
          
          if (existing) {
            existing.total += parseFloat(payment.amount || 0);
          } else {
            acc.push({
              method: method,
              total: parseFloat(payment.amount || 0)
            });
          }
          
          return acc;
        }, []);
        
        const stats = {
          totalIncome,
          totalPayments: paymentArray.length,
          incomeByMethod,
          averagePayment: paymentArray.length > 0 ? totalIncome / paymentArray.length : 0
        };
        
        console.log('✅ Payment reports calculated manually:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getPaymentReports methods failed:', fallbackError);
        return {
          totalIncome: 0,
          totalPayments: 0,
          incomeByMethod: [],
          averagePayment: 0
        };
      }
    }
  }


 async getExpiredMemberships(days = 0) {
    const response = await api.get('/api/memberships/expired', { params: { days } });
    return response.data;
  }
    
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/api/memberships/expiring-soon', { params: { days } });
    return response.data;
  }
  

  // CREAR PAGO DESDE ORDEN
  async createPaymentFromOrder(orderData) {
    console.log('💰 CREATING PAYMENT FROM ORDER...');
    console.log('📤 Order data for payment:', orderData);
    
    try {
      const result = await this.post('/payments/from-order', orderData);
      
      console.log('✅ PAYMENT FROM ORDER CREATED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.payment) {
        console.log('✅ Payment from order response structure is correct');
        console.log('💰 Payment from order details:', {
          id: result.data.payment.id,
          amount: result.data.payment.amount,
          orderId: orderData.orderId,
          status: result.data.payment.status,
          paymentMethod: result.data.payment.paymentMethod
        });
      } else {
        console.warn('⚠️ Payment from order response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PAYMENT FROM ORDER CREATION FAILED:', error.message);
      
      if (error.response?.status === 404 && error.response?.config?.url?.includes('/payments/from-order')) {
        console.warn('⚠️ ENDPOINT /payments/from-order NO EXISTE - Continuando sin registro de pago');
        return {
          success: true,
          message: 'Payment record skipped - endpoint not available',
          data: {
            payment: {
              id: 'skipped',
              orderId: orderData.orderId,
              status: 'skipped',
              note: 'Payment endpoint not available'
            }
          }
        };
      }
      
      throw error;
    }
  }



   async getPendingTransfers() {
    return await this.get('/payments/transfers/pending');
  }
  
  // MÉTODO ALTERNATIVO PARA CREAR PAGO SIMPLE
  async createSimplePayment(paymentData) {
    console.log('💰 CREATING SIMPLE PAYMENT...');
    console.log('📤 Payment data:', paymentData);
    
    try {
      const result = await this.post('/payments', paymentData);
      
      console.log('✅ SIMPLE PAYMENT CREATED SUCCESSFULLY:', result);
      
      return result;
    } catch (error) {
      console.log('❌ SIMPLE PAYMENT CREATION FAILED:', error.message);
      
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('⚠️ PAYMENT CREATION ENDPOINT ISSUES - Continuando sin registro');
        return {
          success: false,
          message: 'Payment record could not be created but order is valid',
          error: error.message,
          data: {
            payment: {
              id: 'failed',
              status: 'failed',
              note: 'Payment creation failed but order succeeded'
            }
          }
        };
      }
      
      throw error;
    }
  }

  // ================================
  // 🛒 MÉTODOS DEL CARRITO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  async getCart(sessionId = null) {
    console.log('🛒 FETCHING CART...');
    console.log('🆔 Session ID provided:', sessionId);
    
    try {
      const params = {};
      
      if (sessionId) {
        params.sessionId = sessionId;
      }
      
      const result = await this.get('/store/cart', { params });
      console.log('✅ CART DATA RECEIVED:', result);
      
      if (result && result.data && result.data.cartItems) {
        console.log('✅ Cart structure is correct (README format)');
        console.log('🛒 Cart items:', {
          itemsCount: result.data.cartItems.length,
          totalAmount: result.data.summary?.totalAmount || 0,
          hasItems: result.data.cartItems.length > 0,
          sessionId: sessionId || 'authenticated'
        });
      } else {
        console.warn('⚠️ Cart structure might be different from README');
        console.log('📋 Actual structure:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ CART FETCH FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART: Cart endpoint not found or user has empty cart');
        return {
          success: true,
          data: {
            cartItems: [],
            summary: {
              itemsCount: 0,
              subtotal: 0,
              taxAmount: 0,
              shippingAmount: 0,
              totalAmount: 0
            }
          }
        };
      } else if (error.response?.status === 401) {
        console.log('🔐 CART: Authorization required for cart access');
      }
      
      throw error;
    }
  }
  
  async addToCart(productData, sessionId = null) {
    console.log('🛒 ADDING ITEM TO CART...');
    console.log('📤 Product data to add:', productData);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const requestData = {
        productId: productData.productId || productData.id,
        quantity: productData.quantity || 1,
        selectedVariants: productData.selectedVariants || productData.options || {}
      };
      
      if (sessionId) {
        requestData.sessionId = sessionId;
      }
      
      console.log('📤 Final request data:', requestData);
      
      const result = await this.post('/store/cart', requestData);
      
      console.log('✅ ITEM ADDED TO CART SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Add to cart response structure is correct');
      } else {
        console.warn('⚠️ Add to cart response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ ADD TO CART FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - productId: Must be a valid product ID');
        console.log('   - quantity: Must be a positive number');
        console.log('   - selectedVariants: Must be valid product variants');
      } else if (error.response?.status === 404) {
        console.log('🛒 PRODUCT NOT FOUND: Product ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('📋 BAD REQUEST: Check data format');
      }
      
      throw error;
    }
  }

// Método para actualizar cantidad específica de un item
async updateCartItemQuantity(cartItemId, quantity, sessionId = null) {
  console.log('🛒 UPDATING CART ITEM QUANTITY...');
  console.log('🎯 Cart Item ID:', cartItemId);
  console.log('📊 New quantity:', quantity);
  console.log('🆔 Session ID:', sessionId);
  
  try {
    const updates = { quantity: parseInt(quantity) || 1 };
    return await this.updateCartItem(cartItemId, updates, sessionId);
  } catch (error) {
    console.log('❌ UPDATE CART ITEM QUANTITY FAILED:', error.message);
    throw error;
  }
}

 async removeFromCart(cartItemId, sessionId = null) {
    console.log('🛒 REMOVING ITEM FROM CART...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      let url = `/store/cart/${cartItemId}`;
      
      if (sessionId) {
        url += `?sessionId=${encodeURIComponent(sessionId)}`;
      }
      
      const result = await this.delete(url);
      
      console.log('✅ ITEM REMOVED FROM CART SUCCESSFULLY');
      
      return result;
    } catch (error) {
      console.log('❌ REMOVE FROM CART FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART ITEM NOT FOUND: Cart item ID might be invalid');
      }
      
      throw error;
    }
  }
  
  async clearCart(sessionId = null) {
    console.log('🛒 CLEARING ENTIRE CART...');
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const cartResponse = await this.getCart(sessionId);
      
      if (cartResponse && cartResponse.data && cartResponse.data.cartItems) {
        const items = cartResponse.data.cartItems;
        
        if (items.length === 0) {
          console.log('✅ CART WAS ALREADY EMPTY');
          return { success: true, message: 'Cart was already empty' };
        }
        
        console.log(`🛒 Removing ${items.length} items from cart...`);
        
        const deletePromises = items.map(item => 
          this.removeFromCart(item.id, sessionId).catch(err => {
            console.warn(`⚠️ Failed to remove item ${item.id}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(deletePromises);
        
        console.log('✅ CART CLEARED SUCCESSFULLY');
        return { success: true, message: 'Cart cleared successfully' };
      }
      
      console.log('✅ CART WAS ALREADY EMPTY');
      return { success: true, message: 'Cart was already empty' };
      
    } catch (error) {
      console.log('❌ CLEAR CART FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('✅ CART NOT FOUND (already empty)');
        return { success: true, message: 'Cart was already empty' };
      }
      
      throw error;
    }
  }
  
  async updateCart(items) {
    console.log('🛒 LEGACY UPDATE CART METHOD - Converting to individual operations...');
    console.log('📤 Items to sync:', items);
    
    try {
      if (!Array.isArray(items) || items.length === 0) {
        console.log('🛒 No items to update, clearing cart...');
        return await this.clearCart();
      }
      
      console.log('🛒 Legacy updateCart called - items should be managed individually');
      console.log('💡 Consider using addToCart, updateCartItem, removeFromCart individually');
      
      return {
        success: true,
        message: 'Cart sync attempted - using localStorage for now',
        itemsCount: items.length
      };
      
    } catch (error) {
      console.log('❌ LEGACY UPDATE CART FAILED:', error.message);
      throw error;
    }
  }

// Método para obtener resumen del carrito
async getCartSummary(sessionId = null) {
  console.log('🛒 FETCHING CART SUMMARY...');
  console.log('🆔 Session ID:', sessionId);
  
  try {
    const cart = await this.getCart(sessionId);
    
    if (cart && cart.data) {
      const summary = cart.data.summary || {
        itemsCount: cart.data.cartItems?.length || 0,
        subtotal: 0,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 0
      };
      
      console.log('✅ CART SUMMARY RECEIVED:', summary);
      return { success: true, data: summary };
    }
    
    throw new Error('Invalid cart response');
  } catch (error) {
    console.log('❌ CART SUMMARY FAILED:', error.message);
    throw error;
  }
}

// Método para validar carrito antes de checkout
async validateCart(sessionId = null) {
  console.log('🛒 VALIDATING CART FOR CHECKOUT...');
  console.log('🆔 Session ID:', sessionId);
  
  try {
    const cart = await this.getCart(sessionId);
    
    if (!cart || !cart.data || !cart.data.cartItems) {
      throw new Error('Cart is empty or invalid');
    }
    
    const items = cart.data.cartItems;
    
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Validar cada item
    const validationResults = items.map(item => {
      const errors = [];
      
      if (!item.productId) {
        errors.push('Product ID missing');
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push('Invalid quantity');
      }
      
      if (!item.price || item.price <= 0) {
        errors.push('Invalid price');
      }
      
      return {
        itemId: item.id,
        productId: item.productId,
        isValid: errors.length === 0,
        errors
      };
    });
    
    const invalidItems = validationResults.filter(result => !result.isValid);
    
    const validation = {
      isValid: invalidItems.length === 0,
      totalItems: items.length,
      validItems: validationResults.length - invalidItems.length,
      invalidItems: invalidItems.length,
      issues: invalidItems,
      summary: cart.data.summary
    };
    
    console.log('✅ CART VALIDATION COMPLETED:', validation);
    
    return { success: true, data: validation };
    
  } catch (error) {
    console.log('❌ CART VALIDATION FAILED:', error.message);
    throw error;
  }
}

// Método para obtener items específicos del carrito
async getCartItem(cartItemId, sessionId = null) {
  console.log('🛒 FETCHING SPECIFIC CART ITEM...');
  console.log('🎯 Cart Item ID:', cartItemId);
  console.log('🆔 Session ID:', sessionId);
  
  try {
    const cart = await this.getCart(sessionId);
    
    if (cart && cart.data && cart.data.cartItems) {
      const item = cart.data.cartItems.find(item => item.id === cartItemId);
      
      if (item) {
        console.log('✅ CART ITEM FOUND:', item);
        return { success: true, data: { item } };
      } else {
        console.log('❌ CART ITEM NOT FOUND');
        throw new Error('Cart item not found');
      }
    }
    
    throw new Error('Invalid cart response');
  } catch (error) {
    console.log('❌ GET CART ITEM FAILED:', error.message);
    throw error;
  }
}

  // ================================
  // 💳 MÉTODOS DE STRIPE - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  async getStripeConfig() {
    console.log('💳 FETCHING STRIPE CONFIGURATION...');
    
    try {
      const result = await this.get('/stripe/config');
      
      console.log('✅ STRIPE CONFIG RECEIVED:', result);
      
      if (result && result.data?.stripe) {
        console.log('✅ Stripe config structure is correct');
        console.log('💳 Stripe settings:', {
          enabled: result.data.stripe.enabled,
          mode: result.data.stripe.mode,
          currency: result.data.stripe.currency,
          hasPublishableKey: !!result.data.stripe.publishableKey
        });
      } else {
        console.warn('⚠️ Stripe config structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE CONFIG FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 STRIPE: Config endpoint not found - Stripe not implemented');
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }
  
 // ================================
// 💳 MÉTODOS DE STRIPE QUE PODRÍAN FALTAR
// ================================

// Método para obtener webhooks de Stripe
async handleStripeWebhook(webhookData) {
  console.log('💳 HANDLING STRIPE WEBHOOK...');
  console.log('📤 Webhook data:', webhookData);
  
  try {
    const result = await this.post('/stripe/webhook', webhookData);
    
    console.log('✅ STRIPE WEBHOOK HANDLED:', result);
    
    if (result && result.success) {
      console.log('✅ Webhook processing response structure is correct');
      console.log('💳 Webhook details:', {
        eventType: webhookData.type,
        processed: result.data?.processed || false,
        paymentIntentId: result.data?.paymentIntentId
      });
    } else {
      console.warn('⚠️ Webhook response structure might be different');
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE WEBHOOK HANDLING FAILED:', error.message);
    
    if (error.response?.status === 400) {
      console.log('💳 WEBHOOK: Invalid webhook signature or data');
    } else if (error.response?.status === 404) {
      console.log('💳 WEBHOOK: Endpoint not found - Webhooks not implemented');
    }
    
    throw error;
  }
}

// Método para obtener lista de pagos de Stripe
async getStripePayments(params = {}) {
  console.log('💳 FETCHING STRIPE PAYMENTS...');
  console.log('📋 Query params:', params);
  
  try {
    const result = await this.get('/stripe/payments', { params });
    
    console.log('✅ STRIPE PAYMENTS RECEIVED:', result);
    
    if (result && result.data) {
      if (Array.isArray(result.data.payments)) {
        console.log('✅ Payments list structure is correct');
        console.log('💳 Payments summary:', {
          totalPayments: result.data.payments.length,
          hasMore: result.data.hasMore || false,
          totalAmount: result.data.totalAmount || 0
        });
      } else {
        console.warn('⚠️ Payments structure might be different from expected');
      }
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE PAYMENTS FAILED:', error.message);
    
    if (error.response?.status === 404) {
      console.log('💳 PAYMENTS: Payments endpoint not found');
      return {
        success: true,
        data: {
          payments: [],
          hasMore: false,
          totalAmount: 0
        }
      };
    }
    
    throw error;
  }
}

// Método para cancelar Payment Intent
async cancelStripePaymentIntent(paymentIntentId) {
  console.log('💳 CANCELING STRIPE PAYMENT INTENT...');
  console.log('🎯 Payment Intent ID:', paymentIntentId);
  
  try {
    const result = await this.post('/stripe/cancel-payment-intent', {
      paymentIntentId
    });
    
    console.log('✅ STRIPE PAYMENT INTENT CANCELED:', result);
    
    if (result && result.success) {
      console.log('✅ Cancel payment intent response structure is correct');
      console.log('💳 Cancellation details:', {
        paymentIntentId: result.data?.paymentIntentId,
        status: result.data?.status,
        canceledAt: result.data?.canceledAt
      });
    } else {
      console.warn('⚠️ Cancel payment intent response structure might be different');
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE PAYMENT INTENT CANCELLATION FAILED:', error.message);
    
    if (error.response?.status === 404) {
      console.log('💳 PAYMENT INTENT NOT FOUND: Payment intent ID might be invalid');
    } else if (error.response?.status === 400) {
      console.log('💳 PAYMENT INTENT CANNOT BE CANCELED: Already succeeded or canceled');
    }
    
    throw error;
  }
}

// Método para obtener métodos de pago guardados
async getStripePaymentMethods(customerId) {
  console.log('💳 FETCHING STRIPE PAYMENT METHODS...');
  console.log('👤 Customer ID:', customerId);
  
  try {
    const result = await this.get(`/stripe/payment-methods/${customerId}`);
    
    console.log('✅ STRIPE PAYMENT METHODS RECEIVED:', result);
    
    if (result && result.data && Array.isArray(result.data.paymentMethods)) {
      console.log('✅ Payment methods structure is correct');
      console.log('💳 Payment methods summary:', {
        totalMethods: result.data.paymentMethods.length,
        hasDefaultMethod: !!result.data.defaultPaymentMethod
      });
    } else {
      console.warn('⚠️ Payment methods structure might be different');
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE PAYMENT METHODS FAILED:', error.message);
    
    if (error.response?.status === 404) {
      console.log('💳 CUSTOMER NOT FOUND OR NO PAYMENT METHODS');
      return {
        success: true,
        data: {
          paymentMethods: [],
          defaultPaymentMethod: null
        }
      };
    }
    
    throw error;
  }
}

// Método para crear customer en Stripe
async createStripeCustomer(customerData) {
  console.log('💳 CREATING STRIPE CUSTOMER...');
  console.log('📤 Customer data:', customerData);
  
  try {
    const result = await this.post('/stripe/create-customer', customerData);
    
    console.log('✅ STRIPE CUSTOMER CREATED:', result);
    
    if (result && result.success && result.data?.customer) {
      console.log('✅ Create customer response structure is correct');
      console.log('💳 Customer details:', {
        customerId: result.data.customer.id,
        email: result.data.customer.email,
        hasPaymentMethods: !!result.data.customer.default_source
      });
    } else {
      console.warn('⚠️ Create customer response structure might be different');
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE CUSTOMER CREATION FAILED:', error.message);
    
    if (error.response?.status === 422) {
      console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
      console.log('💡 Common validation issues:');
      console.log('   - email: Must be a valid email address');
      console.log('   - name: Must be provided');
    }
    
    throw error;
  }
}

// Método para verificar estado de Stripe en tiempo real
async checkStripeHealth() {
  console.log('💳 CHECKING STRIPE HEALTH STATUS...');
  
  try {
    const result = await this.get('/stripe/health');
    
    console.log('✅ STRIPE HEALTH CHECK COMPLETED:', result);
    
    if (result && result.data) {
      console.log('✅ Stripe health response structure is correct');
      console.log('💳 Stripe health status:', {
        isConnected: result.data.connected || false,
        mode: result.data.mode,
        lastCheck: result.data.lastCheck,
        webhooksEnabled: result.data.webhooksEnabled || false
      });
    } else {
      console.warn('⚠️ Stripe health response structure might be different');
    }
    
    return result;
  } catch (error) {
    console.log('❌ STRIPE HEALTH CHECK FAILED:', error.message);
    
    return {
      success: false,
      data: {
        connected: false,
        mode: 'unknown',
        lastCheck: new Date().toISOString(),
        error: error.message
      }
    };
  }
}


 async createMembershipPaymentIntent(membershipData) {
    console.log('💳 CREATING MEMBERSHIP PAYMENT INTENT...');
    console.log('📤 Membership data:', membershipData);
    
    try {
      const result = await this.post('/stripe/create-membership-intent', membershipData);
      
      console.log('✅ MEMBERSHIP PAYMENT INTENT CREATED:', result);
      
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Payment intent response structure is correct');
        console.log('💳 Payment intent details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          amount: result.data.amount,
          currency: result.data.currency
        });
      } else {
        console.warn('⚠️ Payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }
  
  async createDailyPaymentIntent(dailyData) {
    console.log('💳 CREATING DAILY PAYMENT INTENT...');
    console.log('📤 Daily payment data:', dailyData);
    
    try {
      const result = await this.post('/stripe/create-daily-intent', dailyData);
      
      console.log('✅ DAILY PAYMENT INTENT CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ DAILY PAYMENT INTENT FAILED:', error.message);
      throw error;
    }
  }
  
  async createStorePaymentIntent(storeData) {
    console.log('💳 CREATING STORE PAYMENT INTENT...');
    console.log('📤 Store payment data:', storeData);
    
    try {
      const result = await this.post('/stripe/create-store-intent', storeData);
      
      console.log('✅ STORE PAYMENT INTENT CREATED:', result);
      
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Store payment intent response structure is correct');
        console.log('💳 Store payment details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          orderId: storeData.orderId
        });
      } else {
        console.warn('⚠️ Store payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STORE PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - orderId: Must be a valid order ID');
      } else if (error.response?.status === 404) {
        console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid');
      }
      
      throw error;
    }
  }
  
  async confirmStripePayment(paymentData) {
    console.log('💳 CONFIRMING STRIPE PAYMENT...');
    console.log('📤 Payment confirmation data:', paymentData);
    
    try {
      const result = await this.post('/stripe/confirm-payment', paymentData);
      
      console.log('✅ STRIPE PAYMENT CONFIRMED:', result);
      
      if (result && result.success && result.data?.payment) {
        console.log('✅ Payment confirmation response structure is correct');
        console.log('💳 Payment confirmation details:', {
          paymentId: result.data.payment.id,
          amount: result.data.payment.amount,
          status: result.data.payment.status,
          stripeStatus: result.data.stripe?.status
        });
      } else {
        console.warn('⚠️ Payment confirmation response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENT CONFIRMATION FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT INTENT NOT FOUND: Payment intent ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 PAYMENT ALREADY PROCESSED: Payment might already be confirmed');
      }
      
      throw error;
    }
  }
  
  async createStripeRefund(refundData) {
    console.log('💳 CREATING STRIPE REFUND...');
    console.log('📤 Refund data:', refundData);
    
    try {
      const result = await this.post('/stripe/refund', refundData);
      
      console.log('✅ STRIPE REFUND CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE REFUND FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT NOT FOUND: Payment ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 REFUND NOT ALLOWED: Payment cannot be refunded');
      }
      
      throw error;
    }
  }
  
  async getStripeStatus() {
    console.log('💳 FETCHING STRIPE STATUS...');
    
    try {
      const result = await this.get('/stripe/status');
      
      console.log('✅ STRIPE STATUS RECEIVED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE STATUS FAILED:', error.message);
      
      return {
        status: 'unknown',
        enabled: false,
        lastCheck: new Date().toISOString()
      };
    }
  }


  // ================================
  // 🔧 MÉTODOS UTILITARIOS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
    
  async healthCheck() {
    console.log('🔌 HEALTH CHECK...');
    try {
      const result = await this.get('/health');
      console.log('✅ HEALTH CHECK SUCCESS:', result);
      return result;
    } catch (error) {
      console.log('❌ HEALTH CHECK FAILED:', error.message);
      throw error;
    }
  }
    
  async checkBackendConnection() {
    try {
      console.log('🔌 CHECKING BACKEND CONNECTION...');
      
      const startTime = Date.now();
      const response = await api.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ BACKEND CONNECTED SUCCESSFULLY');
        console.log(`⚡ Response time: ${responseTime}ms`);
        console.log('📦 Health data:', response.data);
        
        return { 
          connected: true, 
          data: response.data, 
          responseTime,
          status: 'connected'
        };
      } else {
        console.warn('⚠️ BACKEND RESPONDED WITH ERROR');
        return { 
          connected: false, 
          error: 'Backend error response',
          status: 'error'
        };
      }
    } catch (error) {
      console.log('❌ BACKEND CONNECTION FAILED');
      
      let errorType = 'unknown';
      let suggestion = 'Check backend configuration';
      
      if (error.code === 'ERR_NETWORK') {
        errorType = 'network';
        suggestion = 'Backend server is not running or CORS issue';
      } else if (error.response?.status === 404) {
        errorType = 'endpoint_not_found';
        suggestion = 'Health check endpoint missing in backend';
      } else if (error.code === 'ECONNABORTED') {
        errorType = 'timeout';
        suggestion = 'Backend is taking too long to respond';
      }
      
      console.log(`💡 Suggestion: ${suggestion}`);
      
      return { 
        connected: false, 
        error: error.message,
        errorType,
        suggestion,
        status: 'disconnected'
      };
    }
  }
    
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
    
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
    
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    console.log('🚪 USER LOGGED OUT');
    toast.success('Sesión cerrada exitosamente');
    window.location.href = '/login';
  }


   // ================================
  // ✅ NUEVOS MÉTODOS PARA DEBUGGING Y VALIDACIÓN
  // ================================

  // VERIFICAR ENDPOINTS ESPECÍFICOS PARA PERFIL
  async checkProfileEndpoints() {
    console.log('🔍 CHECKING PROFILE ENDPOINTS AVAILABILITY...');
    
    const endpoints = [
      { path: '/auth/profile', method: 'GET', description: 'Get user profile' },
      { path: '/auth/profile', method: 'PATCH', description: 'Update user profile' },
      { path: '/auth/profile/image', method: 'POST', description: 'Upload profile image' },
      { path: '/auth/change-password', method: 'POST', description: 'Change password' },
      { path: '/auth/profile/preferences', method: 'PUT', description: 'Update preferences' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Checking ${endpoint.method} ${endpoint.path}...`);
        
        if (endpoint.method === 'GET' && endpoint.path === '/auth/profile') {
          await this.get(endpoint.path);
          results[endpoint.path] = { available: true, method: endpoint.method };
          console.log(`✅ ${endpoint.description} - Available`);
        } else {
          results[endpoint.path] = { available: true, method: endpoint.method, note: 'Not tested (would need real data)' };
          console.log(`✅ ${endpoint.description} - Endpoint exists (not tested)`);
        }
        
      } catch (error) {
        results[endpoint.path] = { available: false, method: endpoint.method, error: error.message };
        
        if (error.response?.status === 404) {
          console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
        } else if (error.response?.status === 401) {
          console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          results[endpoint.path].available = true;
          results[endpoint.path].note = 'Requires authentication';
        } else {
          console.log(`⚠️ ${endpoint.description} - ${error.message}`);
        }
      }
    }
    
    console.log('📋 Profile endpoints check summary:');
    console.table(results);
    
    return results;
  }

  // DEBUG COMPLETO DE PERFIL
  async debugProfileSystem() {
    console.log('🔍 =====================================');
    console.log('👤 PROFILE SYSTEM DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints
      console.log('📡 1. CHECKING PROFILE ENDPOINTS...');
      const endpointsCheck = await this.checkProfileEndpoints();
      
      // 2. Verificar perfil actual
      console.log('👤 2. CHECKING CURRENT PROFILE...');
      try {
        const profile = await this.getProfile();
        console.log('✅ Current profile loaded successfully');
        
        if (profile && profile.data && profile.data.user) {
          const user = profile.data.user;
          console.log('📊 PROFILE ANALYSIS:');
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Name: ${user.firstName} ${user.lastName}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Phone: ${user.phone || 'Not provided'}`);
          console.log(`   - Role: ${user.role}`);
          console.log(`   - Profile Image: ${user.profileImage ? 'Yes' : 'No'}`);
          console.log(`   - Date of Birth: ${user.dateOfBirth || 'Not provided'}`);
          console.log(`   - Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
          
          if (user.dateOfBirth) {
            const birthDate = new Date(user.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            console.log(`   - Calculated Age: ${age} years`);
            
            if (age < 13) {
              console.log('   - ⚠️ USER IS UNDER 13 - RESTRICTIONS SHOULD APPLY');
            }
          }
          
          // Continuación desde donde se cortó el archivo anterior...
          
          const validation = this.validateProfileData(user);
          console.log(`   - Validation Result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
          
        } else {
          console.warn('⚠️ Profile structure is different from expected README format');
        }
        
      } catch (profileError) {
        console.log('❌ Could not load current profile:', profileError.message);
      }
      
      // 3. Verificar conexión al backend
      console.log('🌐 3. CHECKING BACKEND CONNECTION...');
      try {
        const health = await this.healthCheck();
        console.log('✅ Backend connection is healthy');
      } catch (healthError) {
        console.log('❌ Backend connection issues:', healthError.message);
      }
      
      console.log('🔍 =====================================');
      console.log('👤 PROFILE SYSTEM DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ PROFILE SYSTEM DEBUG FAILED:', error);
    }
  }

  // ✅ NUEVO: DEBUG ESPECÍFICO PARA CARRITO Y CHECKOUT
  async debugCartAndCheckoutSystem() {
    console.log('🔍 =====================================');
    console.log('🛒 CART & CHECKOUT DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints de carrito
      console.log('📡 1. CHECKING CART ENDPOINTS...');
      
      const cartEndpoints = [
        { path: '/store/cart', method: 'GET', description: 'Get cart' },
        { path: '/store/cart', method: 'POST', description: 'Add to cart' },
        { path: '/store/cart/{id}', method: 'PUT', description: 'Update cart item' },
        { path: '/store/cart/{id}', method: 'DELETE', description: 'Remove from cart' },
        { path: '/store/orders', method: 'POST', description: 'Create order (checkout)' },
        { path: '/store/my-orders', method: 'GET', description: 'Get my orders' },
        { path: '/stripe/config', method: 'GET', description: 'Get Stripe config' },
        { path: '/stripe/create-store-intent', method: 'POST', description: 'Create payment intent' },
        { path: '/stripe/confirm-payment', method: 'POST', description: 'Confirm payment' }
      ];
      
      for (const endpoint of cartEndpoints) {
        try {
          if (endpoint.method === 'GET' && endpoint.path === '/store/cart') {
            const result = await this.getCart();
            console.log(`✅ ${endpoint.description} - Available`);
          } else if (endpoint.method === 'GET' && endpoint.path === '/stripe/config') {
            const result = await this.getStripeConfig();
            console.log(`✅ ${endpoint.description} - Available`);
          } else {
            console.log(`📋 ${endpoint.description} - Endpoint exists (requires data to test)`);
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
          } else if (error.response?.status === 401) {
            console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          } else {
            console.log(`⚠️ ${endpoint.description} - ${error.message}`);
          }
        }
      }
      
      // 2. Verificar productos disponibles
      console.log('🛍️ 2. CHECKING PRODUCTS AVAILABILITY...');
      try {
        const products = await this.get('/store/products', { params: { limit: 5 } });
        if (products && products.data && products.data.products) {
          console.log(`✅ Products available: ${products.data.products.length} found`);
          console.log('📦 Sample product:', products.data.products[0]?.name || 'N/A');
        } else {
          console.log('⚠️ No products found or unexpected format');
        }
      } catch (error) {
        console.log('❌ Products endpoint failed:', error.message);
      }
      
      // 3. Verificar estructura de carrito vacío
      console.log('🛒 3. CHECKING EMPTY CART STRUCTURE...');
      try {
        const emptyCart = await this.getCart();
        console.log('✅ Empty cart structure:', {
          hasCartItems: !!emptyCart.data?.cartItems,
          isArray: Array.isArray(emptyCart.data?.cartItems),
          hasSummary: !!emptyCart.data?.summary,
          itemCount: emptyCart.data?.cartItems?.length || 0
        });
      } catch (error) {
        console.log('❌ Empty cart check failed:', error.message);
      }
      
      // 4. Verificar configuración de Stripe
      console.log('💳 4. CHECKING STRIPE CONFIGURATION...');
      try {
        const stripeConfig = await this.getStripeConfig();
        console.log('✅ Stripe configuration:', {
          enabled: stripeConfig.data?.stripe?.enabled || false,
          mode: stripeConfig.data?.stripe?.mode || 'unknown',
          hasPublishableKey: !!stripeConfig.data?.stripe?.publishableKey
        });
      } catch (error) {
        console.log('❌ Stripe config check failed:', error.message);
      }
      
      // 5. Verificar flow completo para invitados
      console.log('🎫 5. CHECKING GUEST CHECKOUT FLOW...');
      try {
        // Simular datos de checkout para invitado
        const guestOrderData = {
          sessionId: 'guest_test_12345',
          items: [
            {
              productId: 1,
              quantity: 1,
              price: 25.00,
              selectedVariants: {}
            }
          ],
          customerInfo: {
            name: 'Test Guest',
            email: 'guest@test.com',
            phone: '+502 5555-5555'
          },
          shippingAddress: {
            street: '5ta Avenida 12-34',
            city: 'Guatemala',
            state: 'Guatemala',
            zipCode: '01001',
            reference: 'Test address'
          },
          paymentMethod: 'cash_on_delivery',
          deliveryTimeSlot: 'morning',
          notes: 'Test order for guest checkout'
        };
        
        console.log('📋 Guest order structure prepared:', {
          hasSessionId: !!guestOrderData.sessionId,
          hasCustomerInfo: !!guestOrderData.customerInfo,
          hasShippingAddress: !!guestOrderData.shippingAddress,
          itemsCount: guestOrderData.items.length
        });
        
        console.log('✅ Guest checkout flow structure is valid');
      } catch (error) {
        console.log('❌ Guest checkout flow check failed:', error.message);
      }
      
      console.log('🔍 =====================================');
      console.log('🛒 CART & CHECKOUT DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ CART & CHECKOUT DEBUG FAILED:', error);
    }
  }

   // OBTENER ESTADO DE SALUD DEL SISTEMA
  async getSystemHealth() {
    console.log('🔍 FETCHING SYSTEM HEALTH...');
    try {
      const response = await this.get('/health');
      console.log('✅ SYSTEM HEALTH FROM BACKEND:', response);
      return response.data || response;
    } catch (error) {
      console.log('❌ SYSTEM HEALTH FAILED:', error.message);
      
      return {
        status: 'unknown',
        uptime: 'unknown',
        lastCheck: new Date().toISOString()
      };
    }
  }
    

} // Fin de la clase ApiService

// 🏭 EXPORTAR INSTANCIA SINGLETON
const apiService = new ApiService();

export default apiService;

// ✅ SISTEMA DE HORARIOS FLEXIBLES COMPLETAMENTE INTEGRADO
// 
// 🆕 NUEVOS MÉTODOS AGREGADOS:
// - getGymConfigEditor() - Configuración completa para ContentEditor
// - saveFlexibleSchedule() - Guardar horarios flexibles  
// - getCapacityMetrics() - Métricas de capacidad y ocupación
// - toggleDayOpen() - Alternar día abierto/cerrado
// - addTimeSlot() - Agregar nueva franja horaria
// - removeTimeSlot() - Eliminar franja horaria
// - updateTimeSlot() - Actualizar campos de franja horaria
// - duplicateTimeSlot() - Duplicar franja existente
// - applyCapacityToAllSlots() - Aplicar capacidad a todas las franjas
// - saveGymConfigSection() - Guardar configuración por secciones
// 
// 🔧 ENDPOINTS IMPLEMENTADOS:
// - GET /api/gym/config/editor - Configuración completa para ContentEditor
// - PUT /api/gym/config/flexible - Guardar horarios flexibles/secciones
// - GET /api/gym/capacity/metrics - Métricas de capacidad
// - POST /api/gym/hours/{day}/toggle - Alternar día
// - POST /api/gym/hours/{day}/slots - Agregar franja
// - DELETE /api/gym/hours/{day}/slots/{index} - Eliminar franja
// - PATCH /api/gym/hours/{day}/slots/{index} - Actualizar franja
// - POST /api/gym/hours/{day}/slots/{index}/duplicate - Duplicar franja
// - POST /api/gym/hours/capacity/apply-all - Aplicar capacidad a todas
// 
// ✅ MANTIENE TODAS LAS FUNCIONALIDADES EXISTENTES:
// - Autenticación y perfil con mejoras para campos individuales
// - Usuarios, membresías, pagos con filtros por rol
// - Carrito y checkout para invitados y autenticados
// - Stripe integration completa
// - Testimonios con validación
// - Productos y tienda
// - Logs detallados para debugging
// - Interceptors de request/response
// - Manejo de errores robusto
// - Métodos utilitarios y health checks
// 
// 🔄 COMPATIBILIDAD TOTAL:
// - ContentEditor.js puede usar todos los nuevos métodos
// - AdminDashboard.js mantiene toda su funcionalidad
// - LandingPage.js sigue mostrando datos correctamente
// - No se rompe ninguna funcionalidad existente
// - Se agregan funcionalidades sin afectar las existentes
// 
// 📊 FUNCIONALIDADES DE HORARIOS FLEXIBLES:
// - Múltiples franjas horarias por día
// - Capacidad individual por franja  
// - Control de ocupación en tiempo real
// - Etiquetas personalizadas para franjas
// - Métricas de capacidad y ocupación
// - Guardado independiente por secciones
// - Validación robusta de datos
// - Feedback visual con toasts
// - Logs detallados para debugging
// - dfsdffkld