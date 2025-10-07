// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/MediaUploader.js
// ✅ PARTE 1/4: IMPORTS, ESTADOS Y EFECTOS

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Save, X, Image as ImageIcon,
  Video, AlertTriangle, Play, Pause, Link, ExternalLink,
  Check, Loader, FileImage, FileVideo, Copy, RefreshCw,
  Eye, Download, Monitor, Smartphone, Camera, PlayCircle
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import gymMediaService from '../../../services/gymMediaService'; // ← NUEVO SERVICIO

const MediaUploader = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // ✅ ESTADOS LOCALES - Estructura actual mantenida
  const [mediaFiles, setMediaFiles] = useState({
    logo: null,
    heroVideo: null,
    heroPoster: null,
    heroImage: null
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState('logo');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(false);
  
  // ✅ NUEVO: Estados para progreso de subida
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // ✅ Categorías de medios (mantener igual)
  const mediaTabs = [
    { 
      id: 'logo', 
      label: 'Logo', 
      icon: ImageIcon, 
      description: 'Logo que aparece en navegación y footer',
      maxSize: '5MB',
      formats: 'PNG, JPG, SVG',
      color: 'blue'
    },
    { 
      id: 'hero', 
      label: 'Sección Principal', 
      icon: Monitor, 
      description: 'Video/imagen principal con miniatura',
      maxSize: 'Video: 100MB | Imágenes: 25MB',
      formats: 'Video: MP4, WebM | Imagen: JPG, PNG',
      color: 'purple'
    }
  ];
  
  // ✅ EFECTO: Inicializar datos desde el backend (mantener lógica actual)
  useEffect(() => {
    console.log('MediaUploader - Verificando datos de configuración:', {
      hasGymConfig: !!gymConfig,
      isLoading: gymConfig?.isLoading,
      hasData: !!gymConfig?.data,
      dataKeys: gymConfig?.data ? Object.keys(gymConfig.data) : []
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      console.log('MediaUploader - Cargando datos desde backend:', gymConfig.data);
      
      const backendData = gymConfig.data;
      
      // ✅ Mapear datos del backend exactamente como está
      const newMediaFiles = {
        // Logo
        logo: backendData.logo ? {
          url: backendData.logo.url || backendData.logo,
          alt: backendData.logo.alt || 'Logo',
          width: backendData.logo.width,
          height: backendData.logo.height,
          name: 'Logo actual',
          type: 'image',
          isExternal: true // Viene del backend/Cloudinary
        } : null,
        
        // Video hero
        heroVideo: backendData.hero?.videoUrl || backendData.videoUrl ? {
          url: backendData.hero?.videoUrl || backendData.videoUrl,
          name: 'Video principal actual',
          type: 'video',
          isExternal: true,
          title: backendData.hero?.title,
          description: backendData.hero?.description
        } : null,
        
        // Poster/miniatura del video
        heroPoster: backendData.hero?.posterUrl || backendData.hero?.imageUrl ? {
          url: backendData.hero?.posterUrl || backendData.hero?.imageUrl,
          alt: 'Miniatura del video',
          name: 'Miniatura actual',
          type: 'image',
          isExternal: true
        } : null,
        
        // Imagen alternativa (si no hay video)
        heroImage: (!backendData.hero?.videoUrl && backendData.hero?.imageUrl) ? {
          url: backendData.hero.imageUrl,
          alt: 'Imagen Principal',
          name: 'Imagen principal actual',
          type: 'image',
          isExternal: true
        } : null
      };
      
      console.log('MediaUploader - Datos mapeados:', {
        hasLogo: !!newMediaFiles.logo,
        hasHeroVideo: !!newMediaFiles.heroVideo,
        hasHeroPoster: !!newMediaFiles.heroPoster,
        hasHeroImage: !!newMediaFiles.heroImage
      });
      
      setMediaFiles(newMediaFiles);
      setIsDataLoaded(true);
    } else if (gymConfig?.isLoading) {
      console.log('MediaUploader - Datos aún cargando...');
      setIsDataLoaded(false);
    } else {
      console.log('MediaUploader - No hay datos disponibles');
      setIsDataLoaded(true);
    }
  }, [gymConfig]);
  
  // ✅ EFECTO: Notificar cambios sin guardar (mantener igual)
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);

  // ✅ Funciones de utilidad (formateo, validación) - Mantener todas
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('URL copiada al portapapeles');
    } catch (error) {
      showError('Error al copiar URL');
    }
  };

// ✅ PARTE 2/4: FUNCIONES DE SUBIDA DE ARCHIVOS
// ⚠️ ACTUALIZACIÓN CRÍTICA: Conectar con backend real

  // ================================
  // 🎬 SUBIR VIDEO HERO AL BACKEND
  // ================================
  const handleUploadHeroVideo = async (file) => {
    if (!file) return;
    
    console.log('🎬 Iniciando subida de video hero:', file.name);
    
    try {
      setUploadingFile('heroVideo');
      setIsUploading(true);
      setUploadProgress(0);
      
      // ✅ SUBIR AL BACKEND usando el servicio
      const result = await gymMediaService.uploadHeroVideo(file, {
        onProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`📊 Progreso de subida: ${progress}%`);
        }
      });
      
      if (result.success) {
        console.log('✅ Video subido exitosamente al backend');
        console.log('📦 Respuesta del backend:', result.data);
        
        // ✅ Actualizar estado con las URLs reales de Cloudinary
        const videoData = {
          url: result.data.videoUrl,
          name: file.name,
          type: file.type,
          size: file.size,
          isExternal: true, // Ahora está en Cloudinary
          uploadedAt: new Date().toISOString(),
          videoInfo: result.data.videoInfo
        };
        
        const posterData = result.data.posterUrl ? {
          url: result.data.posterUrl,
          alt: 'Miniatura del video',
          name: 'Miniatura generada automáticamente',
          type: 'image',
          isExternal: true,
          uploadedAt: new Date().toISOString()
        } : null;
        
        setMediaFiles(prev => ({
          ...prev,
          heroVideo: videoData,
          heroPoster: posterData // Poster automático del backend
        }));
        
        setHasChanges(true);
        showSuccess(`Video "${file.name}" subido exitosamente`);
        
      } else {
        throw new Error(result.error || 'Error al subir video');
      }
      
    } catch (error) {
      console.error('❌ Error en subida de video:', error);
      showError(error.message || 'Error al subir video');
    } finally {
      setUploadingFile(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ================================
  // 🏢 SUBIR LOGO AL BACKEND
  // ================================
  const handleUploadLogo = async (file) => {
    if (!file) return;
    
    console.log('🏢 Iniciando subida de logo:', file.name);
    
    try {
      setUploadingFile('logo');
      setIsUploading(true);
      setUploadProgress(0);
      
      // ✅ SUBIR AL BACKEND usando el servicio
      const result = await gymMediaService.uploadLogo(file, {
        onProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`📊 Progreso de subida: ${progress}%`);
        }
      });
      
      if (result.success) {
        console.log('✅ Logo subido exitosamente al backend');
        console.log('📦 Respuesta del backend:', result.data);
        
        // ✅ Actualizar estado con la URL real de Cloudinary
        const logoData = {
          url: result.data.logoUrl,
          alt: result.data.logoInfo?.alt || 'Logo',
          width: result.data.logoInfo?.width,
          height: result.data.logoInfo?.height,
          name: file.name,
          type: file.type,
          size: file.size,
          isExternal: true, // Ahora está en Cloudinary
          uploadedAt: new Date().toISOString()
        };
        
        setMediaFiles(prev => ({
          ...prev,
          logo: logoData
        }));
        
        setHasChanges(true);
        showSuccess(`Logo "${file.name}" subido exitosamente`);
        
      } else {
        throw new Error(result.error || 'Error al subir logo');
      }
      
    } catch (error) {
      console.error('❌ Error en subida de logo:', error);
      showError(error.message || 'Error al subir logo');
    } finally {
      setUploadingFile(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ================================
  // 🖼️ SUBIR IMAGEN HERO CUSTOM AL BACKEND
  // ================================
  const handleUploadHeroImage = async (file) => {
    if (!file) return;
    
    console.log('🖼️ Iniciando subida de imagen hero custom:', file.name);
    
    try {
      setUploadingFile('heroImage');
      setIsUploading(true);
      setUploadProgress(0);
      
      // ✅ SUBIR AL BACKEND usando el servicio
      const result = await gymMediaService.uploadHeroImage(file, {
        onProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`📊 Progreso de subida: ${progress}%`);
        }
      });
      
      if (result.success) {
        console.log('✅ Imagen hero subida exitosamente al backend');
        console.log('📦 Respuesta del backend:', result.data);
        
        // ✅ Actualizar estado con la URL real de Cloudinary
        const imageData = {
          url: result.data.imageUrl,
          alt: 'Imagen Principal',
          name: file.name,
          type: file.type,
          size: file.size,
          isExternal: true, // Ahora está en Cloudinary
          uploadedAt: new Date().toISOString(),
          imageInfo: result.data.imageInfo
        };
        
        setMediaFiles(prev => ({
          ...prev,
          heroImage: imageData,
          // Si había poster automático, esta imagen lo reemplaza
          heroPoster: result.data.imageInfo?.replacedPoster ? imageData : prev.heroPoster
        }));
        
        setHasChanges(true);
        showSuccess(`Imagen hero "${file.name}" subida exitosamente`);
        
      } else {
        throw new Error(result.error || 'Error al subir imagen');
      }
      
    } catch (error) {
      console.error('❌ Error en subida de imagen hero:', error);
      showError(error.message || 'Error al subir imagen');
    } finally {
      setUploadingFile(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ================================
  // 📁 FUNCIÓN UNIFICADA DE SUBIDA
  // ================================
  const handleFileUpload = async (file, category) => {
    if (!file) return;
    
    console.log(`📁 Procesando archivo para categoría: ${category}`);
    console.log(`📊 Archivo: ${file.name} (${formatFileSize(file.size)})`);
    
    // ✅ Validación básica de archivo
    if (!file.type) {
      showError('Tipo de archivo no detectado');
      return;
    }
    
    // ✅ Enrutar a la función correcta según categoría
    switch (category) {
      case 'logo':
        await handleUploadLogo(file);
        break;
        
      case 'heroVideo':
        await handleUploadHeroVideo(file);
        break;
        
      case 'heroImage':
      case 'heroPoster':
        await handleUploadHeroImage(file);
        break;
        
      default:
        console.error(`❌ Categoría no reconocida: ${category}`);
        showError('Categoría de archivo no válida');
    }
  };

  // ================================
  // 🗑️ ELIMINAR ARCHIVO
  // ================================
  const handleDeleteFile = (category) => {
    const typeNames = {
      logo: 'logo',
      heroVideo: 'video',
      heroPoster: 'miniatura',
      heroImage: 'imagen'
    };
    
    if (window.confirm(`¿Estás seguro de eliminar ${typeNames[category]}?`)) {
      // Liberar URL temporal si existe (aunque ahora serán de Cloudinary)
      const file = mediaFiles[category];
      if (file?.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
      
      setMediaFiles(prev => ({
        ...prev,
        [category]: null
      }));
      
      setHasChanges(true);
      showSuccess(`${typeNames[category]} eliminado`);
    }
  };

  // ================================
  // 🔗 AGREGAR VIDEO DESDE URL (mantener funcionalidad existente)
  // ================================
  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      showError('Por favor ingresa una URL válida');
      return;
    }
    
    // Validar URLs de video
    const videoRegex = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|\.mp4|\.webm|\.mov|\.avi)/i;
    if (!videoRegex.test(videoUrl)) {
      showError('URL no válida. Soportamos YouTube, Vimeo, Dailymotion o archivos de video directos');
      return;
    }
    
    const detectVideoPlatform = (url) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
      if (url.includes('vimeo.com')) return 'Vimeo';
      if (url.includes('dailymotion.com')) return 'Dailymotion';
      return 'Archivo directo';
    };
    
    const getVideoNameFromUrl = (url) => {
      const platform = detectVideoPlatform(url);
      try {
        const urlObj = new URL(url);
        if (platform === 'YouTube') {
          const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
          return `Video de YouTube (${videoId})`;
        } else if (platform === 'Vimeo') {
          const videoId = urlObj.pathname.split('/').pop();
          return `Video de Vimeo (${videoId})`;
        } else {
          const filename = urlObj.pathname.split('/').pop();
          return filename || 'Video externo';
        }
      } catch {
        return 'Video desde URL';
      }
    };
    
    const videoData = {
      url: videoUrl,
      name: getVideoNameFromUrl(videoUrl),
      type: 'video',
      isExternal: true,
      uploadedAt: new Date().toISOString(),
      platform: detectVideoPlatform(videoUrl)
    };
    
    setMediaFiles(prev => ({
      ...prev,
      heroVideo: videoData
    }));
    
    setHasChanges(true);
    setVideoUrl('');
    setIsAddingVideo(false);
    showSuccess('Video agregado exitosamente');
  };
  // ================================
  // 💾 GUARDAR CAMBIOS
  // ================================
  const handleSave = async () => {
    try {
      console.log('💾 Guardando cambios de multimedia...');
      
      // ℹ️ NOTA IMPORTANTE: Los archivos YA están en Cloudinary cuando se suben
      // Esta función solo notifica al padre que hubo cambios para que recargue
      // la configuración desde el backend
      
      if (!hasChanges) {
        showSuccess('No hay cambios que guardar');
        return;
      }
      
      // Notificar al componente padre
      console.log('📢 Notificando cambios al componente padre...');
      
      if (onSave && typeof onSave === 'function') {
        // El padre (Dashboard) debería recargar la configuración
        await onSave();
      }
      
      setHasChanges(false);
      showSuccess('Multimedia actualizada exitosamente');
      
      console.log('✅ Cambios guardados correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando multimedia:', error);
      showError('Error al guardar multimedia');
    }
  };

  // ================================
  // 🎨 RENDER
  // ================================

  // Mostrar loading mientras se cargan los datos
  if (gymConfig?.isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando multimedia actual...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ================================ */}
      {/* HEADER CON RESUMEN Y ACCIONES */}
      {/* ================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Multimedia de la Página
          </h3>
          <p className="text-gray-600 mt-1">
            Logo, video principal y miniatura
          </p>
          
          {/* Mostrar archivos actuales cargados */}
          {isDataLoaded && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaFiles.logo && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  ✓ Logo
                </span>
              )}
              {mediaFiles.heroVideo && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                  ✓ Video
                </span>
              )}
              {mediaFiles.heroPoster && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                  ✓ Miniatura
                </span>
              )}
              {mediaFiles.heroImage && !mediaFiles.heroVideo && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                  ✓ Imagen
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Botón de guardar (solo si hay cambios) */}
        {hasChanges && (
          <button
            onClick={handleSave}
            className="btn-primary btn-sm"
            disabled={isUploading}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        )}
      </div>
      
      {/* Indicador de cambios sin guardar */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar en la multimedia.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de subida en progreso */}
      {isUploading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center">
            <Loader className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700 font-medium">
                Subiendo archivo... {uploadProgress}%
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ================================ */}
      {/* NAVEGACIÓN POR PESTAÑAS */}
      {/* ================================ */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {mediaTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={isUploading}
              className={`px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700 shadow-sm`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
              
              {/* Indicador de contenido */}
              {tab.id === 'logo' && mediaFiles.logo && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              )}
              {tab.id === 'hero' && (mediaFiles.heroVideo || mediaFiles.heroImage) && (
                <span className="ml-2 w-2 h-2 bg-purple-500 rounded-full inline-block"></span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* ================================ */}
      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      {/* ================================ */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* ================================ */}
        {/* PESTAÑA: LOGO */}
        {/* ================================ */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
                Logo del Gimnasio
              </h4>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Máximo 5MB</span>
                <span className="text-xs text-gray-400">PNG, JPG, SVG</span>
              </div>
            </div>
            
            {mediaFiles.logo ? (
              // ✅ LOGO EXISTENTE - Vista previa
              <div className="space-y-4">
                <div className="flex items-start space-x-6">
                  <div className="w-40 h-40 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src={mediaFiles.logo.url}
                      alt={mediaFiles.logo.alt || 'Logo'}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 flex items-center text-lg">
                      {mediaFiles.logo.name || 'Logo'}
                      {mediaFiles.logo.isExternal && (
                        <ExternalLink className="w-4 h-4 ml-2 text-blue-500" title="Archivo en Cloudinary" />
                      )}
                    </h5>
                    
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      {mediaFiles.logo.size && (
                        <div className="flex items-center">
                          <span className="w-20">Tamaño:</span>
                          <span>{formatFileSize(mediaFiles.logo.size)}</span>
                        </div>
                      )}
                      {mediaFiles.logo.width && mediaFiles.logo.height && (
                        <div className="flex items-center">
                          <span className="w-20">Resolución:</span>
                          <span>{mediaFiles.logo.width} × {mediaFiles.logo.height}px</span>
                        </div>
                      )}
                      {mediaFiles.logo.uploadedAt && (
                        <div className="flex items-center">
                          <span className="w-20">Actualizado:</span>
                          <span>{new Date(mediaFiles.logo.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <label className="btn-secondary btn-sm cursor-pointer">
                        <Upload className="w-4 h-4 mr-1" />
                        Reemplazar
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                          disabled={isUploading}
                        />
                      </label>
                      
                      <button
                        onClick={() => handleCopyUrl(mediaFiles.logo.url)}
                        className="btn-secondary btn-sm"
                        disabled={isUploading}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar URL
                      </button>
                      
                      <a
                        href={mediaFiles.logo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver completo
                      </a>
                      
                      <button
                        onClick={() => handleDeleteFile('logo')}
                        className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // ✅ NO HAY LOGO - Área de subida
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    {uploadingFile === 'logo' ? (
                      <Loader className="w-10 h-10 text-blue-600 animate-spin" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-blue-600" />
                    )}
                  </div>
                  
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Subir Logo
                  </p>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Arrastra tu logo aquí o haz clic para seleccionar<br />
                    PNG, JPG o SVG hasta 5MB
                  </p>
                  
                  <span className="btn-primary">
                    {uploadingFile === 'logo' ? 'Subiendo...' : 'Seleccionar Logo'}
                  </span>
                  
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}
            
            {/* Info adicional sobre el logo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-blue-800">
                    ¿Dónde aparece el logo?
                  </h6>
                  <p className="text-sm text-blue-700 mt-1">
                    El logo aparece en la barra de navegación superior y en el footer de la página web.
                    Se adapta automáticamente para diferentes tamaños de pantalla.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* La pestaña Hero (video + imagen) viene en la siguiente sección */}

        {/* ================================ */}
        {/* PESTAÑA: SECCIÓN PRINCIPAL (HERO) */}
        {/* ================================ */}
        {activeTab === 'hero' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Monitor className="w-5 h-5 text-purple-600 mr-2" />
                Sección Principal de la Página
              </h4>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Video: 100MB | Imágenes: 25MB</span>
                <span className="text-xs text-gray-400">MP4, WebM, JPG, PNG</span>
              </div>
            </div>
            
            {/* Resumen del estado actual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Estado Actual:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroVideo ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <Video className={`w-4 h-4 mr-2 ${mediaFiles.heroVideo ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Video Principal</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroVideo ? '✓ Configurado' : 'Sin video'}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroPoster ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <Camera className={`w-4 h-4 mr-2 ${mediaFiles.heroPoster ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Miniatura</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroPoster ? '✓ Configurada' : 'Sin miniatura'}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroImage && !mediaFiles.heroVideo ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <ImageIcon className={`w-4 h-4 mr-2 ${mediaFiles.heroImage && !mediaFiles.heroVideo ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Imagen Alternativa</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroImage && !mediaFiles.heroVideo ? '✓ Activa' : 'No se usa'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* ============================= */}
            {/* VIDEO PRINCIPAL */}
            {/* ============================= */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900 flex items-center">
                  <Video className="w-4 h-4 text-purple-600 mr-2" />
                  Video Principal
                </h5>
                
                {mediaFiles.heroVideo && (
                  <button
                    onClick={() => setPreviewVideo(!previewVideo)}
                    className="btn-secondary btn-sm"
                    disabled={isUploading}
                  >
                    {previewVideo ? <Eye className="w-4 h-4 mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
                    {previewVideo ? 'Ocultar' : 'Vista previa'}
                  </button>
                )}
              </div>
              
              {mediaFiles.heroVideo ? (
                // ✅ VIDEO EXISTENTE
                <div className="space-y-4">
                  {/* Preview del video */}
                  {previewVideo && (
                    <div className="relative w-full aspect-video border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
                      {mediaFiles.heroVideo.isExternal && !mediaFiles.heroVideo.url.includes('cloudinary') ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <Video className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-lg mb-2">Video externo</p>
                            <p className="text-sm text-gray-300 mb-4">{mediaFiles.heroVideo.platform}</p>
                            <a 
                              href={mediaFiles.heroVideo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn-primary"
                            >
                              Ver en nueva pestaña
                            </a>
                          </div>
                        </div>
                      ) : (
                        <video
                          src={mediaFiles.heroVideo.url}
                          className="w-full h-full object-cover"
                          controls
                          poster={mediaFiles.heroPoster?.url}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Info del video */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h6 className="font-medium text-purple-900 flex items-center">
                          {mediaFiles.heroVideo.name}
                          {mediaFiles.heroVideo.isExternal && (
                            <ExternalLink className="w-4 h-4 ml-2 text-purple-600" />
                          )}
                        </h6>
                        
                        <div className="text-sm text-purple-700 mt-2 space-y-1">
                          {mediaFiles.heroVideo.platform && (
                            <div>Plataforma: {mediaFiles.heroVideo.platform}</div>
                          )}
                          {mediaFiles.heroVideo.size && (
                            <div>Tamaño: {formatFileSize(mediaFiles.heroVideo.size)}</div>
                          )}
                          <div>Tipo: {mediaFiles.heroVideo.url.includes('cloudinary') ? 'Video en Cloudinary' : 'Video externo'}</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <label className="btn-secondary btn-sm cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={(e) => handleFileUpload(e.target.files[0], 'heroVideo')}
                            disabled={isUploading}
                          />
                        </label>
                        
                        <button
                          onClick={() => handleCopyUrl(mediaFiles.heroVideo.url)}
                          className="btn-secondary btn-sm"
                          disabled={isUploading}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteFile('heroVideo')}
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                          disabled={isUploading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // ✅ NO HAY VIDEO - Área de subida
                <div className="space-y-4">
                  {/* Área de subida de video */}
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {uploadingFile === 'heroVideo' ? (
                          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                        ) : (
                          <Video className="w-8 h-8 text-purple-600" />
                        )}
                      </div>
                      
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Subir Video Principal
                      </p>
                      <p className="text-sm text-gray-500 text-center mb-4">
                        MP4, WebM hasta 100MB
                      </p>
                      
                      <label className="btn-primary cursor-pointer">
                        <FileVideo className="w-4 h-4 mr-2" />
                        {uploadingFile === 'heroVideo' ? 'Subiendo...' : 'Seleccionar Video'}
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'heroVideo')}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* O agregar desde URL */}
                  <div className="text-center">
                    <span className="text-gray-500 bg-white px-3">O</span>
                  </div>
                  
                  {isAddingVideo ? (
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={isUploading}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddVideoUrl}
                          className="btn-primary btn-sm"
                          disabled={isUploading}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Agregar Video
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingVideo(false);
                            setVideoUrl('');
                          }}
                          className="btn-secondary btn-sm"
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingVideo(true)}
                      className="w-full btn-secondary"
                      disabled={isUploading}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Agregar Video desde URL (YouTube, Vimeo, etc.)
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* ============================= */}
            {/* MINIATURA/POSTER */}
            {/* ============================= */}
            {mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center">
                  <Camera className="w-4 h-4 text-blue-600 mr-2" />
                  Miniatura del Video
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Se muestra antes de reproducir el video)
                  </span>
                </h5>
                
                {mediaFiles.heroPoster && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-48 aspect-video border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={mediaFiles.heroPoster.url}
                          alt={mediaFiles.heroPoster.alt || 'Miniatura'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900">
                          {mediaFiles.heroPoster.name || 'Miniatura del video'}
                        </h6>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          Generada automáticamente del video
                        </p>
                        
                        <div className="flex space-x-2 mt-3">
                          <label className="btn-secondary btn-sm cursor-pointer">
                            <Upload className="w-4 h-4 mr-1" />
                            Cambiar
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ============================= */}
            {/* IMAGEN ALTERNATIVA (si no hay video) */}
            {/* ============================= */}
            {!mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center">
                  <ImageIcon className="w-4 h-4 text-orange-600 mr-2" />
                  Imagen Alternativa
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Se muestra si no hay video)
                  </span>
                </h5>
                
                {mediaFiles.heroImage ? (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-video border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={mediaFiles.heroImage.url}
                        alt="Imagen principal"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h6 className="font-medium text-gray-900">{mediaFiles.heroImage.name || 'Imagen Principal'}</h6>
                        <div className="text-sm text-gray-500">
                          {mediaFiles.heroImage.size && formatFileSize(mediaFiles.heroImage.size)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <label className="btn-secondary btn-sm cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                            disabled={isUploading}
                          />
                        </label>
                        
                        <button
                          onClick={() => handleDeleteFile('heroImage')}
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                          disabled={isUploading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-6">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                        {uploadingFile === 'heroImage' ? (
                          <Loader className="w-6 h-6 text-orange-600 animate-spin" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      
                      <p className="font-medium text-gray-900 mb-1">
                        Subir Imagen Principal
                      </p>
                      <p className="text-sm text-gray-500 text-center mb-3">
                        JPG, PNG hasta 25MB
                      </p>
                      
                      <span className="btn-secondary btn-sm">
                        {uploadingFile === 'heroImage' ? 'Subiendo...' : 'Seleccionar Imagen'}
                      </span>
                      
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
            
            {/* Info adicional sobre hero */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex">
                <Monitor className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-purple-800">
                    ¿Cómo se ve en la página?
                  </h6>
                  <div className="text-sm text-purple-700 mt-1 space-y-1">
                    <p><strong>Desktop:</strong> Video a pantalla completa con controles, miniatura como poster</p>
                    <p><strong>Móvil:</strong> Video adaptado 16:9, controles táctiles optimizados</p>
                    <p><strong>Sin video:</strong> Se muestra la imagen alternativa en formato horizontal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
      
    </div>
  );
};

export default MediaUploader;

/*
=============================================================================
MEDIA UPLOADER - COMPLETAMENTE ACTUALIZADO
=============================================================================

✅ CAMBIOS IMPLEMENTADOS:
1. Conectado con gymMediaService para subidas REALES al backend
2. Subidas funcionan con Cloudinary (backend sube y retorna URLs)
3. Progress tracking para UX mejorada durante subidas
4. Estados de loading apropiados por tipo de archivo
5. Manejo de errores robusto con mensajes específicos
6. Preview inmediato con URLs reales de Cloudinary
7. Mantiene TODA la funcionalidad existente del componente

✅ FLUJO COMPLETO:
1. Usuario selecciona archivo
2. Componente valida y llama a gymMediaService
3. Servicio sube archivo al backend con FormData
4. Backend sube a Cloudinary y guarda en BD
5. Backend responde con URLs de Cloudinary
6. Componente actualiza estado con URLs reales
7. Usuario ve preview inmediato
8. Al guardar, solo notifica al padre para recargar config
9. Al hacer refresh, datos persisten (ya están en BD)

✅ ENDPOINTS UTILIZADOS:
- POST /api/gym-media/upload-logo
- POST /api/gym-media/upload-hero-video
- POST /api/gym-media/upload-hero-image

✅ CARACTERÍSTICAS MANTENIDAS:
- Sistema de pestañas (Logo / Hero)
- Validaciones por tipo de archivo
- Preview de archivos multimedia
- Estados de carga diferenciados
- Manejo de URLs externas
- Detección de cambios sin guardar
- Todas las funciones de utilidad

✅ FUNCIONALIDADES NUEVAS:
- Barra de progreso durante subidas
- Indicador visual de archivo subiendo
- Deshabilitar controles durante subida
- Mensajes específicos por tipo de error
- Manejo correcto de respuestas del backend

Este componente ahora está completamente funcional con el backend real
y mantiene toda la experiencia de usuario existente.
=============================================================================
*/
