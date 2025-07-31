// src/pages/dashboard/components/MediaUploader.js
// FUNCIÓN: Gestor completo de multimedia (logo, imágenes, videos)
// INCLUYE: Subir, eliminar, reemplazar archivos multimedia

import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, Eye, Edit, Save, X, Image as ImageIcon,
  Video, FileText, AlertTriangle, Download, Copy, ExternalLink,
  Play, Pause, RotateCcw, Crop, Maximize2, Plus, Link
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const MediaUploader = ({ gymConfig, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // 📱 Estados locales
  const [mediaFiles, setMediaFiles] = useState({
    logo: null,
    heroImage: null,
    heroVideo: null,
    galleryImages: [],
    testimonialImages: []
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [activeTab, setActiveTab] = useState('logo');
  const [previewModal, setPreviewModal] = useState({ open: false, type: '', url: '', title: '' });
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  
  // 🔗 Categorías de medios
  const mediaTabs = [
    { 
      id: 'logo', 
      label: 'Logo', 
      icon: ImageIcon, 
      description: 'Logo principal del gimnasio',
      accept: 'image/*',
      maxSize: '2MB'
    },
    { 
      id: 'hero', 
      label: 'Portada', 
      icon: Maximize2, 
      description: 'Imagen/Video de la página principal',
      accept: 'image/*,video/*',
      maxSize: '50MB'
    },
    { 
      id: 'gallery', 
      label: 'Galería', 
      icon: ImageIcon, 
      description: 'Imágenes de instalaciones y actividades',
      accept: 'image/*',
      maxSize: '5MB'
    },
    { 
      id: 'testimonials', 
      label: 'Testimonios', 
      icon: ImageIcon, 
      description: 'Fotos de clientes para testimonios',
      accept: 'image/*',
      maxSize: '2MB'
    }
  ];
  
  // 🔄 Inicializar con archivos existentes
  useEffect(() => {
    if (gymConfig?.data?.media) {
      setMediaFiles({
        ...mediaFiles,
        ...gymConfig.data.media
      });
    }
  }, [gymConfig]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📁 Manejar subida de archivos
  const handleFileUpload = async (file, category, index = null) => {
    if (!file) return;
    
    try {
      setUploadingFile(`${category}_${index || 'single'}`);
      
      // Validar tamaño del archivo
      const maxSizeMap = {
        logo: 2 * 1024 * 1024, // 2MB
        hero: 50 * 1024 * 1024, // 50MB
        gallery: 5 * 1024 * 1024, // 5MB
        testimonials: 2 * 1024 * 1024 // 2MB
      };
      
      if (file.size > maxSizeMap[category]) {
        showError(`El archivo es muy grande. Máximo permitido: ${mediaTabs.find(t => t.id === category)?.maxSize}`);
        return;
      }
      
      // Simular subida de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileUrl = URL.createObjectURL(file);
      const fileData = {
        id: Date.now(),
        name: file.name,
        url: fileUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      // Actualizar estado según categoría
      setMediaFiles(prev => {
        const updated = { ...prev };
        
        if (category === 'logo' || category === 'heroImage' || category === 'heroVideo') {
          updated[category] = fileData;
        } else if (category === 'gallery' || category === 'testimonials') {
          if (index !== null) {
            // Reemplazar archivo existente
            updated[category][index] = fileData;
          } else {
            // Agregar nuevo archivo
            updated[category] = [...(updated[category] || []), fileData];
          }
        }
        
        return updated;
      });
      
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
  const handleDeleteFile = (category, index = null) => {
    if (window.confirm('¿Estás seguro de eliminar este archivo?')) {
      setMediaFiles(prev => {
        const updated = { ...prev };
        
        if (category === 'logo' || category === 'heroImage' || category === 'heroVideo') {
          updated[category] = null;
        } else if (category === 'gallery' || category === 'testimonials') {
          updated[category] = updated[category].filter((_, i) => i !== index);
        }
        
        return updated;
      });
      
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
      id: Date.now(),
      name: 'Video desde URL',
      url: videoUrl,
      type: 'video/url',
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
  
  // 👁️ Vista previa de archivos
  const handlePreview = (file, type) => {
    setPreviewModal({
      open: true,
      type: file.type || type,
      url: file.url,
      title: file.name
    });
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
      console.log('Guardando archivos multimedia:', mediaFiles);
      
      // Simular guardado exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave({ media: mediaFiles });
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
            Gestión de Multimedia
          </h3>
          <p className="text-gray-600 mt-1">
            Administra imágenes, videos y el logo de tu gimnasio
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
                  <h5 className="font-medium text-gray-900">{mediaFiles.logo.name}</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(mediaFiles.logo.size)} • 
                    Subido: {new Date(mediaFiles.logo.uploadedAt).toLocaleDateString()}
                  </p>
                  
                  {/* Acciones */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handlePreview(mediaFiles.logo, 'image')}
                      className="btn-secondary btn-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </button>
                    
                    <button
                      onClick={() => handleCopyUrl(mediaFiles.logo.url)}
                      className="btn-secondary btn-sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar URL
                    </button>
                    
                    <label className="btn-secondary btn-sm cursor-pointer">
                      <Edit className="w-4 h-4 mr-1" />
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
                    {uploadingFile === 'logo_single' ? (
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
                    disabled={uploadingFile === 'logo_single'}
                  />
                </label>
              </div>
            )}
          </div>
        )}
        
        {/* CATEGORÍA: Hero/Portada */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Imagen/Video de Portada
              </h4>
              <span className="text-sm text-gray-500">
                Máximo 50MB • Imagen o Video
              </span>
            </div>
            
            {/* Selector de tipo */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('hero-image')}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === 'hero-image' || (!mediaFiles.heroVideo && mediaFiles.heroImage)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Imagen
              </button>
              
              <button
                onClick={() => setActiveTab('hero-video')}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === 'hero-video' || mediaFiles.heroVideo
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Video className="w-4 h-4 inline mr-2" />
                Video
              </button>
            </div>
            
            {/* Mostrar imagen hero si existe */}
            {mediaFiles.heroImage && !mediaFiles.heroVideo && (
              <div className="space-y-4">
                <div className="relative w-full h-64 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={mediaFiles.heroImage.url}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-900">{mediaFiles.heroImage.name}</h5>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(mediaFiles.heroImage.size)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(mediaFiles.heroImage, 'image')}
                      className="btn-secondary btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <label className="btn-secondary btn-sm cursor-pointer">
                      <Edit className="w-4 h-4" />
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
            
            {/* Mostrar video hero si existe */}
            {mediaFiles.heroVideo && (
              <div className="space-y-4">
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
                    <h5 className="font-medium text-gray-900">{mediaFiles.heroVideo.name}</h5>
                    <p className="text-sm text-gray-500">
                      {mediaFiles.heroVideo.isExternal ? 'Video externo' : formatFileSize(mediaFiles.heroVideo.size)}
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
            
            {/* Área de subida si no hay contenido */}
            {!mediaFiles.heroImage && !mediaFiles.heroVideo && (
              <div className="space-y-4">
                {/* Subir archivo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Subir Imagen o Video
                    </p>
                    <p className="text-sm text-gray-500 text-center">
                      Arrastra y suelta tu archivo aquí, o haz clic para seleccionar<br />
                      Imagen: JPG, PNG hasta 10MB • Video: MP4, WebM hasta 50MB
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const category = file.type.startsWith('video/') ? 'heroVideo' : 'heroImage';
                          handleFileUpload(file, category);
                        }
                      }}
                    />
                  </label>
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
          </div>
        )}
        
        {/* CATEGORÍA: Galería */}
        {activeTab === 'gallery' && (
          <GalleryManager
            images={mediaFiles.galleryImages || []}
            onUpload={(file) => handleFileUpload(file, 'gallery')}
            onDelete={(index) => handleDeleteFile('gallery', index)}
            onPreview={handlePreview}
            uploadingFile={uploadingFile}
            formatFileSize={formatFileSize}
          />
        )}
        
        {/* CATEGORÍA: Testimonios */}
        {activeTab === 'testimonials' && (
          <GalleryManager
            images={mediaFiles.testimonialImages || []}
            onUpload={(file) => handleFileUpload(file, 'testimonials')}
            onDelete={(index) => handleDeleteFile('testimonials', index)}
            onPreview={handlePreview}
            uploadingFile={uploadingFile}
            formatFileSize={formatFileSize}
            title="Imágenes para Testimonios"
            description="Fotos de clientes para usar en testimonios"
          />
        )}
        
      </div>
      
      {/* 👁️ MODAL DE VISTA PREVIA */}
      {previewModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h5 className="font-medium text-gray-900">{previewModal.title}</h5>
              <button
                onClick={() => setPreviewModal({ open: false, type: '', url: '', title: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {previewModal.type.startsWith('image/') ? (
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              ) : (
                <video
                  src={previewModal.url}
                  className="max-w-full max-h-[70vh] mx-auto"
                  controls
                />
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

// 🖼️ COMPONENTE: Gestor de galería
const GalleryManager = ({ 
  images, 
  onUpload, 
  onDelete, 
  onPreview, 
  uploadingFile, 
  formatFileSize,
  title = "Galería de Imágenes",
  description = "Imágenes de instalaciones y actividades"
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className="text-sm text-gray-500">
          Máximo 5MB por imagen • JPG, PNG
        </span>
      </div>
      
      {/* Área de subida */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            {uploadingFile?.startsWith('gallery') || uploadingFile?.startsWith('testimonials') ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            ) : (
              <Plus className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-medium font-medium text-gray-900 mb-1">
            Agregar Imágenes
          </p>
          <p className="text-sm text-gray-500 text-center">
            Selecciona múltiples imágenes o arrastra y suelta aquí
          </p>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              Array.from(e.target.files).forEach(file => onUpload(file));
            }}
          />
        </label>
      </div>
      
      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPreview(image, 'image')}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDelete(index)}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Info del archivo */}
              <div className="mt-2">
                <p className="text-xs text-gray-600 truncate">{image.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay imágenes en la galería</p>
          <p className="text-sm">Comienza subiendo tu primera imagen</p>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;