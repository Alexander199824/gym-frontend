// src/pages/dashboard/components/MediaUploader.js
// FUNCIÓN: Gestor MEJORADO de multimedia - Logo, Video Hero + Miniatura
// CAMBIOS: Mejor manejo de video + poster, estados separados, UI mejorada

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Save, X, Image as ImageIcon,
  Video, AlertTriangle, Play, Pause, Link, ExternalLink,
  Check, Loader, FileImage, FileVideo, Copy, RefreshCw,
  Eye, Download, Monitor, Smartphone, Camera, PlayCircle
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const MediaUploader = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales - SEPARADOS Y MEJORADOS
  const [mediaFiles, setMediaFiles] = useState({
    logo: null,
    heroVideo: null,
    heroPoster: null, // Nueva: miniatura/poster del video
    heroImage: null   // Imagen alternativa si no hay video
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState('logo');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(false);
  
  // 🔗 Categorías de medios MEJORADAS
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
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - MEJORADO para video + poster
  useEffect(() => {
    console.log('🔄 MediaUploader - Checking for gym config data:', {
      hasGymConfig: !!gymConfig,
      isLoading: gymConfig?.isLoading,
      hasData: !!gymConfig?.data,
      dataKeys: gymConfig?.data ? Object.keys(gymConfig.data) : []
    });
    
    if (gymConfig?.data && !gymConfig.isLoading) {
      console.log('📥 MediaUploader - Loading data from backend:', gymConfig.data);
      
      const backendData = gymConfig.data;
      
      // Mapear datos del backend - MEJORADO
      const newMediaFiles = {
        // Logo
        logo: backendData.logo ? {
          url: backendData.logo.url || backendData.logo,
          alt: backendData.logo.alt || 'Logo',
          width: backendData.logo.width,
          height: backendData.logo.height,
          name: 'Logo actual',
          type: 'image',
          isExternal: true
        } : null,
        
        // Video hero
        heroVideo: backendData.hero?.videoUrl ? {
          url: backendData.hero.videoUrl,
          name: 'Video principal actual',
          type: 'video',
          isExternal: !backendData.hero.videoUrl.includes(window.location.origin),
          title: backendData.hero.title,
          description: backendData.hero.description
        } : null,
        
        // Poster/miniatura del video
        heroPoster: backendData.hero?.posterUrl || backendData.hero?.imageUrl ? {
          url: backendData.hero.posterUrl || backendData.hero.imageUrl,
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
      
      console.log('✅ MediaUploader - Data mapped successfully:', {
        hasLogo: !!newMediaFiles.logo,
        hasHeroVideo: !!newMediaFiles.heroVideo,
        hasHeroPoster: !!newMediaFiles.heroPoster,
        hasHeroImage: !!newMediaFiles.heroImage,
        logoUrl: newMediaFiles.logo?.url,
        heroVideoUrl: newMediaFiles.heroVideo?.url,
        heroPosterUrl: newMediaFiles.heroPoster?.url,
        heroImageUrl: newMediaFiles.heroImage?.url
      });
      
      setMediaFiles(newMediaFiles);
      setIsDataLoaded(true);
      
    } else if (gymConfig?.isLoading) {
      console.log('⏳ MediaUploader - Data is still loading...');
      setIsDataLoaded(false);
    } else {
      console.log('⚠️ MediaUploader - No data available');
      setIsDataLoaded(true);
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📁 Manejar subida de archivos MEJORADA
  const handleFileUpload = async (file, category) => {
    if (!file) return;
    
    // Validaciones específicas por categoría
    const validations = {
      logo: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/svg+xml'] },
      heroVideo: { maxSize: 100 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/mov'] },
      heroPoster: { maxSize: 25 * 1024 * 1024, types: ['image/jpeg', 'image/png'] },
      heroImage: { maxSize: 25 * 1024 * 1024, types: ['image/jpeg', 'image/png'] }
    };
    
    const validation = validations[category];
    if (validation) {
      if (file.size > validation.maxSize) {
        showError(`Archivo muy grande. Máximo ${Math.round(validation.maxSize / 1024 / 1024)}MB`);
        return;
      }
      
      if (!validation.types.includes(file.type)) {
        showError(`Tipo de archivo no válido para ${category}`);
        return;
      }
    }
    
    try {
      setUploadingFile(category);
      
      // Crear URL temporal para preview inmediato
      const tempUrl = URL.createObjectURL(file);
      
      // Preparar datos del archivo
      const fileData = {
        url: tempUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        isExternal: false,
        file: file,
        uploadedAt: new Date().toISOString()
      };
      
      // Para videos, extraer duración si es posible
      if (category === 'heroVideo') {
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = function() {
            fileData.duration = video.duration;
            window.URL.revokeObjectURL(video.src);
          };
          video.src = tempUrl;
        } catch (error) {
          console.log('Could not extract video duration:', error);
        }
      }
      
      // Para imágenes, extraer dimensiones
      if (file.type.startsWith('image/')) {
        try {
          const img = new Image();
          img.onload = function() {
            fileData.width = img.naturalWidth;
            fileData.height = img.naturalHeight;
            window.URL.revokeObjectURL(img.src);
          };
          img.src = tempUrl;
        } catch (error) {
          console.log('Could not extract image dimensions:', error);
        }
      }
      
      // Actualizar estado
      setMediaFiles(prev => ({
        ...prev,
        [category]: fileData
      }));
      
      setHasChanges(true);
      
      const typeNames = {
        logo: 'Logo',
        heroVideo: 'Video',
        heroPoster: 'Miniatura',
        heroImage: 'Imagen'
      };
      
      showSuccess(`${typeNames[category]} cargado exitosamente`);
      
    } catch (error) {
      console.error('Error loading file:', error);
      showError(error.message || 'Error al cargar el archivo');
    } finally {
      setUploadingFile(null);
    }
  };
  
  // 🗑️ Eliminar archivo MEJORADO
  const handleDeleteFile = (category) => {
    const typeNames = {
      logo: 'logo',
      heroVideo: 'video',
      heroPoster: 'miniatura',
      heroImage: 'imagen'
    };
    
    if (window.confirm(`¿Estás seguro de eliminar ${typeNames[category]}?`)) {
      // Liberar URL temporal si existe
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
  
  // 🔗 Agregar video desde URL MEJORADO
  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      showError('Por favor ingresa una URL válida');
      return;
    }
    
    // Validar URLs de video más ampliamente
    const videoRegex = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|\.mp4|\.webm|\.mov|\.avi)/i;
    if (!videoRegex.test(videoUrl)) {
      showError('URL no válida. Soportamos YouTube, Vimeo, Dailymotion o archivos de video directos');
      return;
    }
    
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
  
  // 🔧 HELPER: Detectar plataforma de video
  const detectVideoPlatform = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('dailymotion.com')) return 'Dailymotion';
    return 'Archivo directo';
  };
  
  // 🔧 HELPER: Obtener nombre del video desde URL
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
  
  // 📋 Copiar URL al portapapeles
  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('URL copiada al portapapeles');
    } catch (error) {
      showError('Error al copiar URL');
    }
  };
  
  // 💾 Guardar cambios MEJORADO
  const handleSave = async () => {
    try {
      console.log('💾 Saving media files:', mediaFiles);
      
      // Preparar datos para enviar - ESTRUCTURA MEJORADA
      const updatedConfig = {
        logo: mediaFiles.logo ? {
          url: mediaFiles.logo.url,
          alt: mediaFiles.logo.alt || 'Logo',
          width: mediaFiles.logo.width,
          height: mediaFiles.logo.height
        } : null,
        
        hero: {
          // Video principal
          videoUrl: mediaFiles.heroVideo?.url || '',
          videoIsExternal: mediaFiles.heroVideo?.isExternal || false,
          videoPlatform: mediaFiles.heroVideo?.platform || '',
          videoTitle: mediaFiles.heroVideo?.title || '',
          videoDescription: mediaFiles.heroVideo?.description || '',
          
          // Poster/miniatura del video
          posterUrl: mediaFiles.heroPoster?.url || '',
          posterAlt: mediaFiles.heroPoster?.alt || 'Miniatura del video',
          
          // Imagen alternativa (si no hay video)
          imageUrl: mediaFiles.heroImage?.url || '',
          imageAlt: mediaFiles.heroImage?.alt || 'Imagen principal'
        }
      };
      
      console.log('📤 Sending updated config to backend:', updatedConfig);
      
      onSave(updatedConfig);
      setHasChanges(false);
      showSuccess('Multimedia actualizada exitosamente');
      
    } catch (error) {
      console.error('Error saving media:', error);
      showError('Error al guardar multimedia');
    }
  };
  
  // 📊 Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 🎬 Formatear duración de video
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 🔄 Mostrar loading mientras se cargan los datos
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
      
      {/* 🔝 HEADER MEJORADO */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Multimedia de la Página
          </h3>
          <p className="text-gray-600 mt-1">
            Logo, video principal y miniatura
          </p>
          
          {/* Mostrar archivos actuales cargados - MEJORADO */}
          {isDataLoaded && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaFiles.logo && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  ✅ Logo
                </span>
              )}
              {mediaFiles.heroVideo && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                  🎬 Video
                </span>
              )}
              {mediaFiles.heroPoster && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                  🖼️ Miniatura
                </span>
              )}
              {mediaFiles.heroImage && !mediaFiles.heroVideo && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                  📸 Imagen
                </span>
              )}
            </div>
          )}
        </div>
        
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
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
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
      
      {/* 🔗 NAVEGACIÓN POR CATEGORÍAS MEJORADA */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {mediaTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? `bg-${tab.color}-100 text-${tab.color}-700 shadow-sm`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
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
      
      {/* 📋 CONTENIDO SEGÚN CATEGORÍA ACTIVA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* CATEGORÍA: Logo */}
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
              <div className="space-y-4">
                {/* Vista previa del logo MEJORADA */}
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
                        <ExternalLink className="w-4 h-4 ml-2 text-blue-500" title="Archivo externo" />
                      )}
                    </h5>
                    
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      {mediaFiles.logo.size && (
                        <div className="flex items-center">
                          <span className="w-16">Tamaño:</span>
                          <span>{formatFileSize(mediaFiles.logo.size)}</span>
                        </div>
                      )}
                      {mediaFiles.logo.width && mediaFiles.logo.height && (
                        <div className="flex items-center">
                          <span className="w-16">Resolución:</span>
                          <span>{mediaFiles.logo.width} × {mediaFiles.logo.height}px</span>
                        </div>
                      )}
                      {mediaFiles.logo.uploadedAt && (
                        <div className="flex items-center">
                          <span className="w-16">Actualizado:</span>
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
                        />
                      </label>
                      
                      <button
                        onClick={() => handleCopyUrl(mediaFiles.logo.url)}
                        className="btn-secondary btn-sm"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
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
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                    Seleccionar Logo
                  </span>
                  
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                    disabled={uploadingFile === 'logo'}
                  />
                </label>
              </div>
            )}
            
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
        
        {/* CATEGORÍA: Sección Principal COMPLETAMENTE NUEVA */}
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
            
            {/* RESUMEN ACTUAL */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Estado Actual:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroVideo ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <Video className={`w-4 h-4 mr-2 ${mediaFiles.heroVideo ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Video Principal</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroVideo ? '✅ Configurado' : '⭕ Sin video'}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroPoster ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <Camera className={`w-4 h-4 mr-2 ${mediaFiles.heroPoster ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Miniatura</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroPoster ? '✅ Configurada' : '⭕ Sin miniatura'}
                  </p>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${mediaFiles.heroImage && !mediaFiles.heroVideo ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <ImageIcon className={`w-4 h-4 mr-2 ${mediaFiles.heroImage && !mediaFiles.heroVideo ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Imagen Alternativa</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {mediaFiles.heroImage && !mediaFiles.heroVideo ? '✅ Activa' : '⭕ No se usa'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 🎬 SECCIÓN: VIDEO PRINCIPAL */}
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
                  >
                    {previewVideo ? <Eye className="w-4 h-4 mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
                    {previewVideo ? 'Ocultar' : 'Vista previa'}
                  </button>
                )}
              </div>
              
              {mediaFiles.heroVideo ? (
                <div className="space-y-4">
                  {/* Preview del video */}
                  {previewVideo && (
                    <div className="relative w-full aspect-video border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
                      {mediaFiles.heroVideo.isExternal ? (
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
                          {mediaFiles.heroVideo.duration && (
                            <div>Duración: {formatDuration(mediaFiles.heroVideo.duration)}</div>
                          )}
                          {mediaFiles.heroVideo.size && (
                            <div>Tamaño: {formatFileSize(mediaFiles.heroVideo.size)}</div>
                          )}
                          <div>Tipo: {mediaFiles.heroVideo.isExternal ? 'Video externo' : 'Video subido'}</div>
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
                          />
                        </label>
                        
                        <button
                          onClick={() => handleCopyUrl(mediaFiles.heroVideo.url)}
                          className="btn-secondary btn-sm"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteFile('heroVideo')}
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
                        Seleccionar Video
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'heroVideo')}
                          disabled={!!uploadingFile}
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
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddVideoUrl}
                          className="btn-primary btn-sm"
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
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Agregar Video desde URL (YouTube, Vimeo, etc.)
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* 🖼️ SECCIÓN: MINIATURA DEL VIDEO */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 flex items-center">
                <Camera className="w-4 h-4 text-blue-600 mr-2" />
                Miniatura del Video
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Se muestra antes de reproducir el video)
                </span>
              </h5>
              
              {mediaFiles.heroPoster ? (
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
                      
                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                        {mediaFiles.heroPoster.width && mediaFiles.heroPoster.height && (
                          <div>Resolución: {mediaFiles.heroPoster.width} × {mediaFiles.heroPoster.height}px</div>
                        )}
                        {mediaFiles.heroPoster.size && (
                          <div>Tamaño: {formatFileSize(mediaFiles.heroPoster.size)}</div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <label className="btn-secondary btn-sm cursor-pointer">
                          <Upload className="w-4 h-4 mr-1" />
                          Cambiar
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e.target.files[0], 'heroPoster')}
                          />
                        </label>
                        
                        <button
                          onClick={() => handleDeleteFile('heroPoster')}
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      {uploadingFile === 'heroPoster' ? (
                        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    
                    <p className="font-medium text-gray-900 mb-1">
                      Subir Miniatura
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-3">
                      JPG, PNG hasta 25MB<br />
                      Recomendado: 1920×1080px
                    </p>
                    
                    <span className="btn-secondary btn-sm">
                      Seleccionar Imagen
                    </span>
                    
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'heroPoster')}
                      disabled={uploadingFile === 'heroPoster'}
                    />
                  </label>
                </div>
              )}
            </div>
            
            {/* 📸 SECCIÓN: IMAGEN ALTERNATIVA (si no hay video) */}
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
                          {mediaFiles.heroImage.width && mediaFiles.heroImage.height && 
                            `${mediaFiles.heroImage.width} × ${mediaFiles.heroImage.height}px`}
                          {mediaFiles.heroImage.size && ` • ${formatFileSize(mediaFiles.heroImage.size)}`}
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
                          />
                        </label>
                        
                        <button
                          onClick={() => handleDeleteFile('heroImage')}
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
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
                        Seleccionar Imagen
                      </span>
                      
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                        disabled={uploadingFile === 'heroImage'}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
            
            {/* 📱 VISTA PREVIA EN DIFERENTES DISPOSITIVOS */}
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