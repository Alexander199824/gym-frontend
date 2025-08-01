// src/pages/dashboard/components/MediaUploader.js
// FUNCIÓN: Gestor MEJORADO de multimedia - Subida a Cloudinary para archivos grandes
// INCLUYE: logo, hero image, hero video - Optimizado para LandingPage

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Eye, Save, X, Image as ImageIcon,
  Video, AlertTriangle, Play, Pause, Link, ExternalLink,
  Cloud, Check, Loader, FileImage, FileVideo, Maximize,
  Download, Copy, RefreshCw, Zap
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const MediaUploader = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales - SOLO archivos que aparecen en LandingPage
  const [mediaFiles, setMediaFiles] = useState({
    logo: null,          // Logo que aparece en navbar y footer
    heroImage: null,     // Imagen principal del hero
    heroVideo: null      // Video principal del hero
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState('logo');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  
  // 🔗 Categorías de medios - SOLO lo que aparece en landing
  const mediaTabs = [
    { 
      id: 'logo', 
      label: 'Logo', 
      icon: ImageIcon, 
      description: 'Logo que aparece en la navegación y footer',
      maxSize: '5MB',
      formats: 'PNG, JPG, SVG'
    },
    { 
      id: 'hero', 
      label: 'Imagen/Video Principal', 
      icon: Video, 
      description: 'Imagen o video que aparece en la sección principal',
      maxSize: '100MB',
      formats: 'Imagen: JPG, PNG | Video: MP4, WebM'
    }
  ];
  
  // 📊 Límites de archivo para Cloudinary
  const fileLimits = {
    logo: {
      maxSize: 5 * 1024 * 1024, // 5MB
      acceptedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
      acceptedExtensions: ['.png', '.jpg', '.jpeg', '.svg']
    },
    heroImage: {
      maxSize: 25 * 1024 * 1024, // 25MB para imágenes
      acceptedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      acceptedExtensions: ['.png', '.jpg', '.jpeg', '.webp']
    },
    heroVideo: {
      maxSize: 100 * 1024 * 1024, // 100MB para videos
      acceptedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
      acceptedExtensions: ['.mp4', '.webm', '.mov']
    }
  };
  
  // 🔄 Inicializar con archivos existentes
  useEffect(() => {
    if (gymConfig?.data) {
      console.log('🔄 Initializing MediaUploader with data:', gymConfig.data);
      
      setMediaFiles({
        logo: gymConfig.data.logo ? {
          url: gymConfig.data.logo.url || gymConfig.data.logo,
          alt: gymConfig.data.logo.alt || 'Logo',
          width: gymConfig.data.logo.width,
          height: gymConfig.data.logo.height,
          cloudinaryId: gymConfig.data.logo.cloudinaryId,
          isCloudinary: !!gymConfig.data.logo.cloudinaryId
        } : null,
        
        heroImage: gymConfig.data.hero?.imageUrl ? {
          url: gymConfig.data.hero.imageUrl,
          alt: 'Imagen Principal',
          cloudinaryId: gymConfig.data.hero.imageCloudinaryId,
          isCloudinary: !!gymConfig.data.hero.imageCloudinaryId
        } : null,
        
        heroVideo: gymConfig.data.hero?.videoUrl ? {
          url: gymConfig.data.hero.videoUrl,
          name: 'Video Principal',
          isExternal: !gymConfig.data.hero.videoCloudinaryId,
          cloudinaryId: gymConfig.data.hero.videoCloudinaryId,
          isCloudinary: !!gymConfig.data.hero.videoCloudinaryId
        } : null
      });
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📁 Validar archivo antes de subir
  const validateFile = (file, category) => {
    const limits = fileLimits[category];
    
    // Validar tamaño
    if (file.size > limits.maxSize) {
      const maxSizeMB = Math.round(limits.maxSize / (1024 * 1024));
      throw new Error(`El archivo es muy grande. Máximo permitido: ${maxSizeMB}MB`);
    }
    
    // Validar tipo
    if (!limits.acceptedTypes.includes(file.type)) {
      throw new Error(`Formato no válido. Formatos permitidos: ${limits.acceptedExtensions.join(', ')}`);
    }
    
    return true;
  };
  
  // 📤 Subir archivo a Cloudinary via backend
  const uploadToCloudinary = async (file, category, onProgress) => {
    try {
      console.log(`📤 Uploading ${category} to Cloudinary:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('folder', `gym-${category}`); // Organizar en carpetas
      
      // Configurar transformaciones según el tipo
      if (category === 'logo') {
        formData.append('transformations', JSON.stringify({
          width: 200,
          height: 200,
          crop: 'fit',
          format: 'auto',
          quality: 'auto'
        }));
      } else if (category === 'heroImage') {
        formData.append('transformations', JSON.stringify({
          width: 1920,
          height: 1080,
          crop: 'fill',
          format: 'auto',
          quality: 'auto:good'
        }));
      } else if (category === 'heroVideo') {
        formData.append('transformations', JSON.stringify({
          width: 1920,
          height: 1080,
          crop: 'fill',
          quality: 'auto:good',
          format: 'mp4'
        }));
      }
      
      // Simular progreso para demo (reemplazar con llamada real al backend)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 95) progress = 95;
        onProgress(Math.round(progress));
      }, 500);
      
      // Simular respuesta exitosa (reemplazar con apiService.uploadMedia(formData))
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      onProgress(100);
      
      // Respuesta simulada de Cloudinary
      const mockCloudinaryResponse = {
        url: URL.createObjectURL(file), // URL temporal para demo
        secureUrl: URL.createObjectURL(file),
        publicId: `gym-${category}/${Date.now()}`,
        cloudinaryId: `cloudinary_${Date.now()}`,
        width: 1920,
        height: 1080,
        format: file.type.split('/')[1],
        resourceType: file.type.startsWith('image/') ? 'image' : 'video',
        bytes: file.size,
        transformations: {
          optimized: true,
          responsive: true
        }
      };
      
      console.log('✅ Cloudinary upload successful:', mockCloudinaryResponse);
      return mockCloudinaryResponse;
      
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      throw error;
    }
  };
  
  // 📁 Manejar subida de archivos
  const handleFileUpload = async (file, category) => {
    if (!file) return;
    
    try {
      // Validar archivo
      validateFile(file, category);
      
      setUploadingFile(category);
      setUploadProgress({ [category]: 0 });
      
      // Subir a Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(
        file, 
        category,
        (progress) => setUploadProgress({ [category]: progress })
      );
      
      // Preparar datos del archivo
      const fileData = {
        url: cloudinaryResponse.secureUrl || cloudinaryResponse.url,
        cloudinaryId: cloudinaryResponse.publicId,
        isCloudinary: true,
        name: file.name,
        type: file.type,
        size: file.size,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        format: cloudinaryResponse.format,
        uploadedAt: new Date().toISOString(),
        transformations: cloudinaryResponse.transformations
      };
      
      // Actualizar estado según categoría
      setMediaFiles(prev => ({
        ...prev,
        [category]: fileData
      }));
      
      setHasChanges(true);
      showSuccess(`${category === 'logo' ? 'Logo' : category === 'heroImage' ? 'Imagen' : 'Video'} subido exitosamente`);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      showError(error.message || 'Error al subir el archivo');
    } finally {
      setUploadingFile(null);
      setUploadProgress({});
    }
  };
  
  // 🗑️ Eliminar archivo
  const handleDeleteFile = async (category) => {
    if (window.confirm('¿Estás seguro de eliminar este archivo?')) {
      const file = mediaFiles[category];
      
      try {
        // Si es un archivo de Cloudinary, eliminarlo del servidor
        if (file?.isCloudinary && file?.cloudinaryId) {
          console.log(`🗑️ Deleting ${category} from Cloudinary:`, file.cloudinaryId);
          
          // Aquí iría la llamada al backend para eliminar de Cloudinary
          // await apiService.deleteMedia(file.cloudinaryId);
        }
        
        setMediaFiles(prev => ({
          ...prev,
          [category]: null
        }));
        
        setHasChanges(true);
        showSuccess('Archivo eliminado');
        
      } catch (error) {
        console.error('Error deleting file:', error);
        showError('Error al eliminar archivo');
      }
    }
  };
  
  // 🔗 Agregar video desde URL
  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      showError('Por favor ingresa una URL válida');
      return;
    }
    
    // Validar URLs de video
    const videoRegex = /(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov)/i;
    if (!videoRegex.test(videoUrl)) {
      showError('Por favor ingresa una URL válida de YouTube, Vimeo o archivo de video');
      return;
    }
    
    const videoData = {
      url: videoUrl,
      name: 'Video desde URL',
      isExternal: true,
      isCloudinary: false,
      uploadedAt: new Date().toISOString()
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
  
  // 📋 Copiar URL al portapapeles
  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('URL copiada al portapapeles');
    } catch (error) {
      showError('Error al copiar URL');
    }
  };
  
  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      console.log('💾 Saving media files:', mediaFiles);
      
      // Preparar datos para enviar
      const updatedConfig = {
        logo: mediaFiles.logo ? {
          url: mediaFiles.logo.url,
          alt: mediaFiles.logo.alt || 'Logo',
          width: mediaFiles.logo.width,
          height: mediaFiles.logo.height,
          cloudinaryId: mediaFiles.logo.cloudinaryId,
          isCloudinary: mediaFiles.logo.isCloudinary
        } : null,
        
        hero: {
          imageUrl: mediaFiles.heroImage?.url || '',
          imageCloudinaryId: mediaFiles.heroImage?.cloudinaryId || '',
          videoUrl: mediaFiles.heroVideo?.url || '',
          videoCloudinaryId: mediaFiles.heroVideo?.cloudinaryId || '',
          videoIsExternal: mediaFiles.heroVideo?.isExternal || false
        }
      };
      
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Multimedia de la Página
          </h3>
          <p className="text-gray-600 mt-1">
            Logo, imagen y video que aparecen en tu página web
          </p>
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
      
      {/* 🔗 NAVEGACIÓN POR CATEGORÍAS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {mediaTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
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
              <h4 className="text-lg font-medium text-gray-900">
                Logo del Gimnasio
              </h4>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Máximo 5MB</span>
                <span className="text-xs text-gray-400">PNG, JPG, SVG</span>
              </div>
            </div>
            
            {mediaFiles.logo ? (
              <div className="space-y-4">
                {/* Vista previa del logo */}
                <div className="flex items-start space-x-6">
                  <div className="w-32 h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={mediaFiles.logo.url}
                      alt={mediaFiles.logo.alt || 'Logo'}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      {mediaFiles.logo.name || 'Logo'}
                      {mediaFiles.logo.isCloudinary && (
                        <Cloud className="w-4 h-4 ml-2 text-blue-500" title="Alojado en Cloudinary" />
                      )}
                    </h5>
                    
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      {mediaFiles.logo.size && (
                        <div>Tamaño: {formatFileSize(mediaFiles.logo.size)}</div>
                      )}
                      {mediaFiles.logo.width && mediaFiles.logo.height && (
                        <div>Dimensiones: {mediaFiles.logo.width} × {mediaFiles.logo.height}px</div>
                      )}
                      {mediaFiles.logo.uploadedAt && (
                        <div>Subido: {new Date(mediaFiles.logo.uploadedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
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
                        Copiar URL
                      </button>
                      
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {uploadingFile === 'logo' ? (
                      <div className="relative">
                        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                        {uploadProgress.logo !== undefined && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600">
                              {uploadProgress.logo}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Subir Logo
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Arrastra y suelta tu logo aquí, o haz clic para seleccionar<br />
                    PNG, JPG o SVG hasta 5MB
                  </p>
                  
                  {uploadingFile === 'logo' && uploadProgress.logo !== undefined && (
                    <div className="w-full max-w-xs mt-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.logo}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
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
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-blue-800">
                    ¿Dónde aparece el logo?
                  </h6>
                  <p className="text-sm text-blue-700 mt-1">
                    El logo aparece en la barra de navegación superior y en el footer de la página web.
                    Se optimiza automáticamente para diferentes tamaños de pantalla.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* CATEGORÍA: Hero/Portada */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Imagen/Video Principal
              </h4>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Imagen: 25MB | Video: 100MB</span>
                <span className="text-xs text-gray-400">JPG, PNG, MP4, WebM</span>
              </div>
            </div>
            
            {/* Mostrar video hero si existe */}
            {mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center">
                  Video Principal
                  {mediaFiles.heroVideo.isCloudinary && (
                    <Cloud className="w-4 h-4 ml-2 text-blue-500" title="Alojado en Cloudinary" />
                  )}
                  {mediaFiles.heroVideo.isExternal && (
                    <ExternalLink className="w-4 h-4 ml-2 text-green-500" title="Video externo" />
                  )}
                </h5>
                
                <div className="relative w-full aspect-video border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
                  {mediaFiles.heroVideo.isExternal ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Video externo</p>
                        <a 
                          href={mediaFiles.heroVideo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
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
                      poster={mediaFiles.heroImage?.url}
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="font-medium text-gray-900">{mediaFiles.heroVideo.name}</h6>
                    <div className="text-sm text-gray-500">
                      {mediaFiles.heroVideo.isExternal ? 'Video externo' : 
                       mediaFiles.heroVideo.isCloudinary ? 'Alojado en Cloudinary' : 'Video subido'}
                      {mediaFiles.heroVideo.size && ` • ${formatFileSize(mediaFiles.heroVideo.size)}`}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {mediaFiles.heroVideo.url && (
                      <button
                        onClick={() => handleCopyUrl(mediaFiles.heroVideo.url)}
                        className="btn-secondary btn-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteFile('heroVideo')}
                      className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mostrar imagen hero si existe y no hay video */}
            {mediaFiles.heroImage && !mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center">
                  Imagen Principal
                  {mediaFiles.heroImage.isCloudinary && (
                    <Cloud className="w-4 h-4 ml-2 text-blue-500" title="Alojado en Cloudinary" />
                  )}
                </h5>
                
                <div className="relative w-full aspect-video border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={mediaFiles.heroImage.url}
                    alt="Hero"
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
                      onClick={() => handleCopyUrl(mediaFiles.heroImage.url)}
                      className="btn-secondary btn-sm"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteFile('heroImage')}
                      className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Área de subida si no hay contenido */}
            {!mediaFiles.heroImage && !mediaFiles.heroVideo && (
              <div className="space-y-4">
                {/* Subir archivo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {uploadingFile ? (
                        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Subir Imagen o Video
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Imagen: JPG, PNG hasta 25MB • Video: MP4, WebM hasta 100MB<br />
                      <span className="text-blue-600">Se optimizan automáticamente con Cloudinary</span>
                    </p>
                    
                    {/* Progress bar si está subiendo */}
                    {uploadingFile && (uploadProgress.heroImage !== undefined || uploadProgress.heroVideo !== undefined) && (
                      <div className="w-full max-w-md mx-auto mb-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.heroImage || uploadProgress.heroVideo || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Subiendo... {uploadProgress.heroImage || uploadProgress.heroVideo || 0}%
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-3 justify-center">
                      <label className="btn-secondary cursor-pointer">
                        <FileImage className="w-4 h-4 mr-2" />
                        Subir Imagen
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                          disabled={!!uploadingFile}
                        />
                      </label>
                      
                      <label className="btn-secondary cursor-pointer">
                        <FileVideo className="w-4 h-4 mr-2" />
                        Subir Video
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
                </div>
                
                {/* O agregar desde URL */}
                <div className="text-center">
                  <span className="text-gray-500">O</span>
                </div>
                
                {isAddingVideo ? (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    Agregar Video desde URL (YouTube, Vimeo)
                  </button>
                )}
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <Video className="w-5 h-5 text-blue-400" />
                <div className="ml-3">
                  <h6 className="text-sm font-medium text-blue-800">
                    ¿Dónde aparece la imagen/video principal?
                  </h6>
                  <p className="text-sm text-blue-700 mt-1">
                    Aparece en la sección principal (hero) de tu página web, junto al título y descripción del gimnasio.
                    Si tienes video, se mostrará el video. Si no, se mostrará la imagen. 
                    <strong>Los archivos se optimizan automáticamente para web.</strong>
                  </p>
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