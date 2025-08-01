// src/pages/dashboard/components/MediaUploader.js
// FUNCIÓN: Gestor SIMPLIFICADO de multimedia - SOLO datos que aparecen en LandingPage
// INCLUYE: logo, hero image, hero video

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Eye, Save, X, Image as ImageIcon,
  Video, AlertTriangle, Play, Pause, Link, ExternalLink
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

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
  const [activeTab, setActiveTab] = useState('logo');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  
  // 🔗 Categorías de medios - SOLO lo que aparece en landing
  const mediaTabs = [
    { 
      id: 'logo', 
      label: 'Logo', 
      icon: ImageIcon, 
      description: 'Logo que aparece en la navegación y footer'
    },
    { 
      id: 'hero', 
      label: 'Imagen/Video Principal', 
      icon: Video, 
      description: 'Imagen o video que aparece en la sección principal'
    }
  ];
  
  // 🔄 Inicializar con archivos existentes
  useEffect(() => {
    if (gymConfig?.data) {
      setMediaFiles({
        logo: gymConfig.data.logo || null,
        heroImage: gymConfig.data.hero?.imageUrl ? {
          url: gymConfig.data.hero.imageUrl,
          name: 'Imagen Hero'
        } : null,
        heroVideo: gymConfig.data.hero?.videoUrl ? {
          url: gymConfig.data.hero.videoUrl,
          name: 'Video Hero',
          isExternal: true
        } : null
      });
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📁 Manejar subida de archivos
  const handleFileUpload = async (file, category) => {
    if (!file) return;
    
    try {
      setUploadingFile(category);
      
      // Validar tamaño del archivo
      const maxSizeMap = {
        logo: 2 * 1024 * 1024, // 2MB
        heroImage: 10 * 1024 * 1024, // 10MB
        heroVideo: 50 * 1024 * 1024 // 50MB
      };
      
      if (file.size > maxSizeMap[category]) {
        const maxSizeLabel = category === 'logo' ? '2MB' : category === 'heroImage' ? '10MB' : '50MB';
        showError(`El archivo es muy grande. Máximo permitido: ${maxSizeLabel}`);
        return;
      }
      
      // Simular subida de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileUrl = URL.createObjectURL(file);
      const fileData = {
        url: fileUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      // Actualizar estado según categoría
      setMediaFiles(prev => ({
        ...prev,
        [category]: fileData
      }));
      
      setHasChanges(true);
      showSuccess('Archivo subido exitosamente');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Error al subir el archivo');
    } finally {
      setUploadingFile(null);
    }
  };
  
  // 🗑️ Eliminar archivo
  const handleDeleteFile = (category) => {
    if (window.confirm('¿Estás seguro de eliminar este archivo?')) {
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
    
    // Validar URLs de YouTube, Vimeo, etc.
    const isValidVideoUrl = videoUrl.includes('youtube.com') || 
                           videoUrl.includes('youtu.be') || 
                           videoUrl.includes('vimeo.com') ||
                           videoUrl.includes('.mp4') ||
                           videoUrl.includes('.webm');
    
    if (!isValidVideoUrl) {
      showError('Por favor ingresa una URL válida de YouTube, Vimeo o archivo de video');
      return;
    }
    
    const videoData = {
      url: videoUrl,
      name: 'Video desde URL',
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
  
  // 💾 Guardar cambios
  const handleSave = async () => {
    try {
      console.log('Guardando archivos multimedia:', mediaFiles);
      
      // Preparar datos para enviar
      const updatedConfig = {
        logo: mediaFiles.logo,
        hero: {
          imageUrl: mediaFiles.heroImage?.url || '',
          videoUrl: mediaFiles.heroVideo?.url || ''
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
              <span className="text-sm text-gray-500">
                Máximo 2MB • PNG, JPG, SVG
              </span>
            </div>
            
            {mediaFiles.logo ? (
              <div className="flex items-center space-x-6">
                {/* Vista previa del logo */}
                <div className="w-32 h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={mediaFiles.logo.url}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                {/* Información del archivo */}
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{mediaFiles.logo.name || 'Logo'}</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    {mediaFiles.logo.size ? formatFileSize(mediaFiles.logo.size) : 'Tamaño desconocido'} • 
                    {mediaFiles.logo.uploadedAt ? 
                      ` Subido: ${new Date(mediaFiles.logo.uploadedAt).toLocaleDateString()}` : 
                      ' Logo actual'
                    }
                  </p>
                  
                  {/* Acciones */}
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
                      onClick={() => handleDeleteFile('logo')}
                      className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {uploadingFile === 'logo' ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Subir Logo
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Arrastra y suelta tu logo aquí, o haz clic para seleccionar<br />
                    PNG, JPG o SVG hasta 2MB
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
              <span className="text-sm text-gray-500">
                Imagen: 10MB • Video: 50MB o URL externa
              </span>
            </div>
            
            {/* Mostrar video hero si existe */}
            {mediaFiles.heroVideo && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Video Principal</h5>
                <div className="relative w-full h-64 border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
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
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="font-medium text-gray-900">{mediaFiles.heroVideo.name}</h6>
                    <p className="text-sm text-gray-500">
                      {mediaFiles.heroVideo.isExternal ? 'Video externo' : 'Video subido'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {mediaFiles.heroVideo.isExternal && (
                      <a
                        href={mediaFiles.heroVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
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
                <h5 className="font-medium text-gray-900">Imagen Principal</h5>
                <div className="relative w-full h-64 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={mediaFiles.heroImage.url}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="font-medium text-gray-900">{mediaFiles.heroImage.name}</h6>
                    <p className="text-sm text-gray-500">
                      {mediaFiles.heroImage.size ? formatFileSize(mediaFiles.heroImage.size) : 'Imagen actual'}
                    </p>
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
            )}
            
            {/* Área de subida si no hay contenido */}
            {!mediaFiles.heroImage && !mediaFiles.heroVideo && (
              <div className="space-y-4">
                {/* Subir archivo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Subir Imagen o Video
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Imagen: JPG, PNG hasta 10MB • Video: MP4, WebM hasta 50MB
                    </p>
                    
                    <div className="flex space-x-3 justify-center">
                      <label className="btn-secondary cursor-pointer">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Subir Imagen
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'heroImage')}
                        />
                      </label>
                      
                      <label className="btn-secondary cursor-pointer">
                        <Video className="w-4 h-4 mr-2" />
                        Subir Video
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'heroVideo')}
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
                        Agregar Video
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingVideo(false);
                          setVideoUrl('');
                        }}
                        className="btn-secondary btn-sm"
                      >
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