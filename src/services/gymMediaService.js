// src/services/gymMediaService.js
// Autor: Alexander Echeverria
// ✅ VERSIÓN CORREGIDA: Límites aumentados y mejor manejo de respuestas

import { api } from './apiConfig';
import toast from 'react-hot-toast';

class GymMediaService {
  constructor() {
    this.baseUrl = '/api/gym-media';
    
    // ✅ LÍMITES AUMENTADOS
    this.validations = {
      logo: {
        maxSize: 10 * 1024 * 1024, // ✅ 10MB (aumentado de 5MB)
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.svg', '.webp']
      },
      heroVideo: {
        maxSize: 500 * 1024 * 1024, // ✅ 500MB (aumentado de 100MB)
        allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        allowedExtensions: ['.mp4', '.webm', '.mov', '.avi']
      },
      heroImage: {
        maxSize: 50 * 1024 * 1024, // ✅ 50MB (aumentado de 25MB)
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      }
    };
  }

  // ================================
  // 🎬 SUBIR VIDEO HERO - MEJORADO
  // ================================
  async uploadHeroVideo(file, options = {}) {
    console.log('🎬 SUBIENDO VIDEO HERO...');
    console.log('📁 Archivo:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // Validar archivo
      this.validateFile(file, 'heroVideo');

      // Crear FormData
      const formData = new FormData();
      formData.append('video', file, file.name);

      // ✅ TIMEOUTS AUMENTADOS PARA VIDEOS GRANDES
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // ✅ 10 minutos (aumentado de 2 minutos)
        maxContentLength: Infinity, // ✅ Sin límite de contenido
        maxBodyLength: Infinity, // ✅ Sin límite de body
        onUploadProgress: options.onProgress || null
      };

      console.log('📤 Enviando video al backend...');
      console.log('⏱️ Timeout configurado: 10 minutos');
      
      const response = await api.post(`${this.baseUrl}/upload-hero-video`, formData, config);

      console.log('📦 RESPUESTA DEL BACKEND:', response.data);

      // ✅ MANEJO MEJORADO DE RESPUESTAS
      if (response.data && (response.data.success || response.data.videoUrl)) {
        const data = response.data.data || response.data;
        
        console.log('✅ VIDEO HERO SUBIDO EXITOSAMENTE');
        console.log('🔗 Video URL:', data.videoUrl);
        console.log('🖼️ Poster URL:', data.posterUrl);

        toast.success('Video subido exitosamente');

        return {
          success: true,
          data: {
            videoUrl: data.videoUrl,
            posterUrl: data.posterUrl || data.imageUrl, // ✅ Fallback a imageUrl
            videoInfo: data.videoInfo || {},
            multimedia: data.multimedia || {},
            message: data.message || response.data.message || 'Video subido'
          }
        };
      }

      throw new Error('Respuesta inválida del servidor');

    } catch (error) {
      console.error('❌ ERROR SUBIENDO VIDEO HERO:', error);
      
      // ✅ MEJOR MANEJO DE ERRORES
      const errorMessage = this.getErrorMessage(error, 'video');
      
      // ⚠️ IMPORTANTE: Verificar si es error de timeout pero el video se subió
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn('⚠️ TIMEOUT: El video puede haberse subido correctamente');
        toast.error('La subida tardó mucho. Refresca para verificar si se guardó.');
      } else {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        possibleTimeout: error.code === 'ECONNABORTED'
      };
    }
  }

  // ================================
  // 🏢 SUBIR LOGO - MEJORADO
  // ================================
  async uploadLogo(file, options = {}) {
    console.log('🏢 SUBIENDO LOGO...');
    console.log('📁 Archivo:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

    try {
      this.validateFile(file, 'logo');

      const formData = new FormData();
      formData.append('logo', file, file.name);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // ✅ 1 minuto (aumentado de 30 segundos)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: options.onProgress || null
      };

      console.log('📤 Enviando logo al backend...');
      
      const response = await api.post(`${this.baseUrl}/upload-logo`, formData, config);

      console.log('📦 RESPUESTA DEL BACKEND:', response.data);

      // ✅ MANEJO MEJORADO DE RESPUESTAS
      if (response.data && (response.data.success || response.data.logoUrl)) {
        const data = response.data.data || response.data;
        
        console.log('✅ LOGO SUBIDO EXITOSAMENTE');
        console.log('🔗 Logo URL:', data.logoUrl);

        toast.success('Logo subido exitosamente');

        return {
          success: true,
          data: {
            logoUrl: data.logoUrl,
            logoInfo: data.logoInfo || data.logo || {},
            multimedia: data.multimedia || {},
            message: data.message || response.data.message || 'Logo subido'
          }
        };
      }

      throw new Error('Respuesta inválida del servidor');

    } catch (error) {
      console.error('❌ ERROR SUBIENDO LOGO:', error);
      
      const errorMessage = this.getErrorMessage(error, 'logo');
      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ================================
  // 🖼️ SUBIR IMAGEN HERO - MEJORADO
  // ================================
  async uploadHeroImage(file, options = {}) {
    console.log('🖼️ SUBIENDO IMAGEN HERO CUSTOM...');
    console.log('📁 Archivo:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

    try {
      this.validateFile(file, 'heroImage');

      const formData = new FormData();
      formData.append('image', file, file.name);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // ✅ 1 minuto (aumentado de 30 segundos)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: options.onProgress || null
      };

      console.log('📤 Enviando imagen hero al backend...');
      
      const response = await api.post(`${this.baseUrl}/upload-hero-image`, formData, config);

      console.log('📦 RESPUESTA DEL BACKEND:', response.data);

      // ✅ MANEJO MEJORADO DE RESPUESTAS
      if (response.data && (response.data.success || response.data.imageUrl)) {
        const data = response.data.data || response.data;
        
        console.log('✅ IMAGEN HERO SUBIDA EXITOSAMENTE');
        console.log('🔗 Image URL:', data.imageUrl);

        toast.success('Imagen hero subida exitosamente');

        return {
          success: true,
          data: {
            imageUrl: data.imageUrl,
            imageInfo: data.imageInfo || {},
            multimedia: data.multimedia || {},
            message: data.message || response.data.message || 'Imagen subida'
          }
        };
      }

      throw new Error('Respuesta inválida del servidor');

    } catch (error) {
      console.error('❌ ERROR SUBIENDO IMAGEN HERO:', error);
      
      const errorMessage = this.getErrorMessage(error, 'imagen');
      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ================================
  // 🔍 OBTENER ESTADO DEL SERVICIO
  // ================================
  async getStatus() {
    try {
      const response = await api.get(`${this.baseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estado del servicio:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // ✅ VALIDACIÓN DE ARCHIVOS
  // ================================
  validateFile(file, type) {
    const validation = this.validations[type];
    
    if (!validation) {
      throw new Error(`Tipo de archivo no soportado: ${type}`);
    }

    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar tamaño
    if (file.size > validation.maxSize) {
      const maxSizeMB = (validation.maxSize / 1024 / 1024).toFixed(0);
      throw new Error(`El archivo es muy grande. Máximo: ${maxSizeMB}MB`);
    }

    // Validar tipo MIME
    if (!validation.allowedTypes.includes(file.type)) {
      const allowedStr = validation.allowedExtensions.join(', ');
      throw new Error(`Tipo de archivo no válido. Permitidos: ${allowedStr}`);
    }

    // Validar extensión
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!validation.allowedExtensions.includes(extension)) {
      const allowedStr = validation.allowedExtensions.join(', ');
      throw new Error(`Extensión no válida. Permitidas: ${allowedStr}`);
    }

    console.log('✅ Validación de archivo exitosa');
    return true;
  }

  // ================================
  // 📝 UTILIDADES
  // ================================

  getErrorMessage(error, fileType) {
    // Errores de validación del backend
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors;
      if (errors && Array.isArray(errors) && errors.length > 0) {
        return errors[0].message || `Error de validación en ${fileType}`;
      }
      return `Datos inválidos para ${fileType}`;
    }

    // Error de permisos
    if (error.response?.status === 403) {
      return `Sin permisos para subir ${fileType}`;
    }

    // Error de tamaño de archivo
    if (error.response?.status === 413) {
      return `Archivo muy grande. Verifica el límite del servidor`;
    }

    // Error de timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return `Tiempo de espera agotado. El archivo es muy grande o la conexión es lenta. Verifica si se guardó`;
    }

    // Error de conexión
    if (error.code === 'ERR_NETWORK') {
      return 'Error de conexión. Verifica tu internet';
    }

    // Error genérico del servidor
    if (error.response?.status >= 500) {
      return 'Error del servidor. Intenta nuevamente';
    }

    return error.response?.data?.message || error.message || `Error al subir ${fileType}`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isValidFile(file, type) {
    try {
      this.validateFile(file, type);
      return true;
    } catch (error) {
      return false;
    }
  }

  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      extension: '.' + file.name.split('.').pop().toLowerCase()
    };
  }
}

export const gymMediaService = new GymMediaService();
export default gymMediaService;

/*
=============================================================================
✅ CORRECCIONES APLICADAS:
=============================================================================

1. LÍMITES AUMENTADOS:
   - Logo: 5MB → 10MB
   - Video: 100MB → 500MB
   - Imagen: 25MB → 50MB

2. TIMEOUTS AUMENTADOS:
   - Logo: 30s → 60s (1 minuto)
   - Video: 2min → 10min
   - Imagen: 30s → 60s

3. CONFIGURACIÓN AXIOS MEJORADA:
   - maxContentLength: Infinity
   - maxBodyLength: Infinity
   - Permite archivos grandes sin límite artificial

4. MANEJO DE RESPUESTAS MEJORADO:
   - Acepta response.data.success O response.data.videoUrl
   - Fallback a response.data si response.data.data no existe
   - Fallback a imageUrl si posterUrl no existe

5. MANEJO DE TIMEOUTS:
   - Detecta timeout y avisa al usuario que verifique
   - No marca como error completo si hubo timeout
   - Permite recargar para verificar si se guardó

6. LOGS MEJORADOS:
   - Muestra respuesta completa del backend
   - Indica timeout configurado
   - Mejor tracking de errores
=============================================================================
*/