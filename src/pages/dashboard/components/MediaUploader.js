// src/pages/dashboard/components/MediaUploader.js
// FUNCIÓN: Gestor SIMPLIFICADO de multimedia - SIN Cloudinary
// CAMBIOS: Muestra datos actuales del backend, sin mensajes de Cloudinary

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Save, X, Image as ImageIcon,
  Video, AlertTriangle, Play, Pause, Link, ExternalLink,
  Check, Loader, FileImage, FileVideo, Copy, RefreshCw,
  Eye, Download
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const MediaUploader = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [mediaFiles, setMediaFiles] = useState({
    logo: null,
    heroImage: null,
    heroVideo: null
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState('logo');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // 🔗 Categorías de medios
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
      maxSize: '50MB',
      formats: 'Imagen: JPG, PNG | Video: MP4, WebM'
    }
  ];
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - MEJORADO
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
      
      // Mapear datos del backend
      const newMediaFiles = {
        logo: backendData.logo ? {
          url: backendData.logo.url || backendData.logo,
          alt: backendData.logo.alt || 'Logo',
          width: backendData.logo.width,
          height: backendData.logo.height,
          name: 'Logo actual',
          type: 'image',
          isExternal: true
        } : null,
        
        heroImage: backendData.hero?.imageUrl ? {
          url: backendData.hero.imageUrl,
          alt: 'Imagen Principal',
          name: 'Imagen principal actual',
          type: 'image',
          isExternal: true
        } : null,
        
        heroVideo: backendData.hero?.videoUrl ? {
          url: backendData.hero.videoUrl,
          name: 'Video principal actual',
          type: 'video',
          isExternal: !backendData.hero.videoUrl.includes(window.location.origin)
        } : null
      };
      
      console.log('✅ MediaUploader - Data mapped successfully:', {
        hasLogo: !!newMediaFiles.logo,
        hasHeroImage: !!newMediaFiles.heroImage,
        hasHeroVideo: !!newMediaFiles.heroVideo,
        logoUrl: newMediaFiles.logo?.url,
        heroImageUrl: newMediaFiles.heroImage?.url,
        heroVideoUrl: newMediaFiles.heroVideo?.url
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
  
  // 📁 Manejar subida de archivos SIMPLIFICADA
  const handleFileUpload = async (file, category) => {
    if (!file) return;
    
    try {
      setUploadingFile(category);
      
      // Crear URL temporal para preview inmediato
      const tempUrl = URL.createObjectURL(file);
      
      // Preparar datos del archivo
      const fileData = {
        url: tempUrl, // URL temporal para preview
        name: file.name,
        type: file.type,
        size: file.size,
        isExternal: false,
        file: file, // Mantener referencia al archivo original
        uploadedAt: new Date().toISOString()
      };
      
      // Actualizar estado según categoría
      setMediaFiles(prev => ({
        ...prev,
        [category]: fileData
      }));
      
      setHasChanges(true);
      showSuccess(`${category === 'logo' ? 'Logo' : category === 'heroImage' ? 'Imagen' : 'Video'} cargado`);
      
    } catch (error) {
      console.error('Error loading file:', error);
      showError(error.message || 'Error al cargar el archivo');
    } finally {
      setUploadingFile(null);
    }
  };
  
  // 🗑️ Eliminar archivo
  const handleDeleteFile = (category) => {
    if (window.confirm('¿Estás seguro de eliminar este archivo?')) {
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
      showSuccess('Archivo eliminado');
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
      type: 'video',
      isExternal: true,
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
          height: mediaFiles.logo.height
        } : null,
        
        hero: {
          imageUrl: mediaFiles.heroImage?.url || '',
          videoUrl: mediaFiles.heroVideo?.url || '',
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
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Multimedia de la Página
          </h3>
          <p className="text-gray-600 mt-1">
            Logo, imagen y video que aparecen en tu página web
          </p>
          
          {/* Mostrar archivos actuales cargados */}
          {isDataLoaded && (
            <div className="mt-2 flex space-x-2">
              {mediaFiles.logo && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ Logo cargado
                </span>
              )}
              {mediaFiles.heroImage && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  ✅ Imagen cargada
                </span>
              )}
              {mediaFiles.heroVideo && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  ✅ Video cargado
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
                      {mediaFiles.logo.isExternal && (
                        <ExternalLink className="w-4 h-4 ml-2 text-blue-500" title="Archivo externo" />
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
                        <div>Actualizado: {new Date(mediaFiles.logo.uploadedAt).toLocaleDateString()}</div>
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
                      
                      <a
                        href={mediaFiles.logo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {uploadingFile === 'logo' ? (
                      <Loader className="w-8 h-8 text-primary-600 animate-spin" />
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
                    Se adapta automáticamente para diferentes tamaños de pantalla.
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
                <span className="text-sm text-gray-500 block">Imagen: 25MB | Video: 50MB</span>
                <span className="text-xs text-gray-400">JPG, PNG, MP4, WebM</span>
              </div>
            </div>
            
            {/* Mostrar video hero si existe */}
            {mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center">
                  Video Principal
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
                      {mediaFiles.heroVideo.isExternal ? 'Video externo' : 'Video subido'}
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
                  {mediaFiles.heroImage.isExternal && (
                    <ExternalLink className="w-4 h-4 ml-2 text-blue-500" title="Imagen externa" />
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
                      Imagen: JPG, PNG hasta 25MB • Video: MP4, WebM hasta 50MB
                    </p>
                    
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