// src/services/authService.js
// SERVICIO DE AUTENTICACIÓN Y GESTIÓN DE PERFIL

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';

class AuthService extends BaseService {
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
      console.log('❌ LOGIN FAILED in authService:', error.message);
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
}

export { AuthService };