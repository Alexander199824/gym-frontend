// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ImageManager.js
// FUNCIÓN: Gestión especializada de imágenes de productos con Cloudinary

import React, { useState, useEffect } from 'react';
import {
  Upload, Image, Trash2, Star, RotateCcw, Eye, 
  Plus, X, Save, Edit, ArrowUp, ArrowDown,
  Loader, Camera, Download, Copy, Check,
  AlertTriangle, CloudUpload, Layers
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const ImageManager = ({ productId, productName, onImagesChange }) => {
  const { showSuccess, showError, isMobile } = useApp();
  
  // Estados principales
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState({});
  const [editingImage, setEditingImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estados para drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Estados para edición
  const [imageForm, setImageForm] = useState({
    altText: '',
    isPrimary: false,
    displayOrder: 1
  });
  
  // CARGAR IMÁGENES INICIALES
  useEffect(() => {
    if (productId) {
      loadProductImages();
    }
  }, [productId]);
  
  const loadProductImages = async () => {
    if (!productId) return;
    
    setIsLoading(true);
    
    try {
      console.log(`🖼️ Loading images for product ${productId}...`);
      
      const response = await inventoryService.getProductImages(productId);
      
      if (response.success && response.data) {
        const imagesList = response.data.images || [];
        setImages(imagesList);
        console.log(`✅ Loaded ${imagesList.length} images`);
        
        // Notificar al componente padre
        if (onImagesChange) {
          onImagesChange(imagesList);
        }
      } else {
        setImages([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading images:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // SUBIR IMAGEN INDIVIDUAL
  const uploadSingleImage = async (file, options = {}) => {
    if (!file || !productId) return;
    
    const uploadId = Date.now().toString();
    setUploadingImages(prev => ({ ...prev, [uploadId]: true }));
    
    try {
      console.log(`📤 Uploading image for product ${productId}:`, file.name);
      
      // Configurar opciones de subida
      const uploadOptions = {
        isPrimary: images.length === 0 || options.isPrimary, // Primera imagen es primaria por defecto
        altText: options.altText || `${productName} - ${file.name}`,
        displayOrder: options.displayOrder || (images.length + 1)
      };
      
      const response = await inventoryService.uploadProductImage(productId, file, uploadOptions);
      
      if (response.success && response.data?.image) {
        const newImage = response.data.image;
        setImages(prev => [...prev, newImage]);
        
        console.log(`✅ Image uploaded successfully:`, newImage.imageUrl);
        showSuccess('Imagen subida exitosamente');
        
        // Notificar al componente padre
        if (onImagesChange) {
          onImagesChange([...images, newImage]);
        }
        
        return newImage;
      } else {
        throw new Error('Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      showError(`Error al subir imagen: ${error.message}`);
      return null;
    } finally {
      setUploadingImages(prev => {
        const newState = { ...prev };
        delete newState[uploadId];
        return newState;
      });
    }
  };
  
  // SUBIR MÚLTIPLES IMÁGENES
  const uploadMultipleImages = async (files) => {
    if (!files || files.length === 0 || !productId) return;
    
    console.log(`📤 Uploading ${files.length} images for product ${productId}...`);
    
    try {
      const response = await inventoryService.uploadMultipleProductImages(productId, Array.from(files));
      
      if (response.success && response.data?.images) {
        const newImages = response.data.images;
        setImages(prev => [...prev, ...newImages]);
        
        console.log(`✅ ${newImages.length} images uploaded successfully`);
        showSuccess(`${newImages.length} imágenes subidas exitosamente`);
        
        // Notificar al componente padre
        if (onImagesChange) {
          onImagesChange([...images, ...newImages]);
        }
      }
      
    } catch (error) {
      console.error('❌ Error uploading multiple images:', error);
    }
  };
  
  // ELIMINAR IMAGEN
  const deleteImage = async (imageId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) {
      return;
    }
    
    try {
      const response = await inventoryService.deleteProductImage(productId, imageId);
      
      if (response.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        showSuccess('Imagen eliminada exitosamente');
        
        // Notificar al componente padre
        const updatedImages = images.filter(img => img.id !== imageId);
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      }
      
    } catch (error) {
      console.error('❌ Error deleting image:', error);
    }
  };
  
  // ESTABLECER COMO IMAGEN PRIMARIA
  const setPrimaryImage = async (imageId) => {
    try {
      const response = await inventoryService.setPrimaryProductImage(productId, imageId);
      
      if (response.success) {
        // Actualizar estado local
        setImages(prev => prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        })));
        
        showSuccess('Imagen principal establecida');
        
        // Notificar al componente padre
        const updatedImages = images.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      }
      
    } catch (error) {
      console.error('❌ Error setting primary image:', error);
    }
  };
  
  // REORDENAR IMÁGENES
  const reorderImages = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    try {
      const reorderedImages = [...images];
      const [movedImage] = reorderedImages.splice(fromIndex, 1);
      reorderedImages.splice(toIndex, 0, movedImage);
      
      // Actualizar displayOrder
      const imageOrders = reorderedImages.map((image, index) => ({
        id: image.id,
        displayOrder: index + 1
      }));
      
      const response = await inventoryService.reorderProductImages(productId, imageOrders);
      
      if (response.success) {
        setImages(reorderedImages);
        showSuccess('Orden de imágenes actualizado');
        
        // Notificar al componente padre
        if (onImagesChange) {
          onImagesChange(reorderedImages);
        }
      }
      
    } catch (error) {
      console.error('❌ Error reordering images:', error);
    }
  };
  
  // EDITAR IMAGEN
  const editImage = (image) => {
    setEditingImage(image);
    setImageForm({
      altText: image.altText || '',
      isPrimary: image.isPrimary || false,
      displayOrder: image.displayOrder || 1
    });
    setShowModal(true);
  };
  
  const saveImageChanges = async () => {
    if (!editingImage) return;
    
    try {
      const response = await inventoryService.updateProductImage(
        productId, 
        editingImage.id, 
        imageForm
      );
      
      if (response.success) {
        // Actualizar imagen en el estado
        setImages(prev => prev.map(img => 
          img.id === editingImage.id 
            ? { ...img, ...imageForm }
            : img
        ));
        
        setShowModal(false);
        setEditingImage(null);
        showSuccess('Imagen actualizada exitosamente');
        
        // Notificar al componente padre
        const updatedImages = images.map(img => 
          img.id === editingImage.id 
            ? { ...img, ...imageForm }
            : img
        );
        
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
      }
      
    } catch (error) {
      console.error('❌ Error updating image:', error);
    }
  };
  
  // MANEJO DE DRAG & DROP
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      if (files.length === 1) {
        uploadSingleImage(files[0]);
      } else {
        uploadMultipleImages(files);
      }
    }
  };
  
  // OBTENER URL OPTIMIZADA DE CLOUDINARY
  const getOptimizedImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }
    
    const { width = 300, height = 300, quality = 'auto', format = 'auto' } = options;
    
    // Insertar transformaciones de Cloudinary
    return imageUrl.replace(
      '/upload/',
      `/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/`
    );
  };

  if (!productId) {
    return (
      <div className="text-center py-8">
        <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Selecciona un producto para gestionar sus imágenes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gestión de Imágenes</h3>
          <p className="text-sm text-gray-600">
            {productName && `Producto: ${productName}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadProductImages}
            className="btn-secondary btn-sm"
            disabled={isLoading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <label className="btn-primary btn-sm cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Imágenes
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length === 1) {
                  uploadSingleImage(files[0]);
                } else if (files.length > 1) {
                  uploadMultipleImages(files);
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
      
      {/* ZONA DE DRAG & DROP */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${
          isDragging ? 'text-purple-600' : 'text-gray-400'
        }`} />
        <p className={`text-lg font-medium mb-2 ${
          isDragging ? 'text-purple-600' : 'text-gray-900'
        }`}>
          {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí'}
        </p>
        <p className="text-sm text-gray-600">
          Formatos soportados: JPG, PNG, WebP (máximo 10MB cada una)
        </p>
        
        {Object.keys(uploadingImages).length > 0 && (
          <div className="mt-4">
            <div className="inline-flex items-center text-purple-600">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Subiendo {Object.keys(uploadingImages).length} imagen{Object.keys(uploadingImages).length > 1 ? 'es' : ''}...
            </div>
          </div>
        )}
      </div>
      
      {/* LISTA DE IMÁGENES */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay imágenes
          </h3>
          <p className="text-gray-600 mb-4">
            Este producto no tiene imágenes. Sube la primera imagen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Resumen */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {images.length} imagen{images.length !== 1 ? 'es' : ''} • 
              {images.filter(img => img.isPrimary).length} primaria{images.filter(img => img.isPrimary).length !== 1 ? 's' : ''}
            </p>
            
            {images.length > 1 && (
              <p className="text-xs text-gray-500">
                Arrastra para reordenar
              </p>
            )}
          </div>
          
          {/* Grid de imágenes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', index.toString());
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  reorderImages(fromIndex, index);
                }}
              >
                {/* Badge de imagen primaria */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Principal
                    </div>
                  </div>
                )}
                
                {/* Orden de visualización */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    #{image.displayOrder || index + 1}
                  </div>
                </div>
                
                {/* Imagen */}
                <div className="aspect-square">
                  <img
                    src={getOptimizedImageUrl(image.imageUrl, { width: 300, height: 300 })}
                    alt={image.altText || `Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2">
                    
                    {/* Ver imagen completa */}
                    <button
                      onClick={() => window.open(image.imageUrl, '_blank')}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-opacity"
                      title="Ver imagen completa"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                    
                    {/* Establecer como primaria */}
                    {!image.isPrimary && (
                      <button
                        onClick={() => setPrimaryImage(image.id)}
                        className="p-2 bg-yellow-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-opacity"
                        title="Establecer como imagen principal"
                      >
                        <Star className="w-4 h-4 text-white" />
                      </button>
                    )}
                    
                    {/* Editar */}
                    <button
                      onClick={() => editImage(image)}
                      className="p-2 bg-blue-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-opacity"
                      title="Editar imagen"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    
                    {/* Eliminar */}
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-opacity"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                    
                  </div>
                </div>
                
                {/* Información de la imagen */}
                <div className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-600 truncate" title={image.altText}>
                    {image.altText || 'Sin descripción'}
                  </p>
                  
                  {image.imageUrl.includes('cloudinary.com') && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Cloudinary
                      </span>
                      
                      {/* Botones de reordenamiento */}
                      {images.length > 1 && (
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => reorderImages(index, index - 1)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Mover arriba"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          )}
                          
                          {index < images.length - 1 && (
                            <button
                              onClick={() => reorderImages(index, index + 1)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Mover abajo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* MODAL DE EDICIÓN */}
      {showModal && editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Imagen
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Vista previa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista Previa
                </label>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={getOptimizedImageUrl(editingImage.imageUrl, { width: 400, height: 400 })}
                    alt={editingImage.altText}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Formulario */}
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto alternativo (Alt)
                  </label>
                  <textarea
                    value={imageForm.altText}
                    onChange={(e) => setImageForm(prev => ({ ...prev, altText: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Descripción de la imagen para SEO y accesibilidad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={imageForm.displayOrder}
                    onChange={(e) => setImageForm(prev => ({ 
                      ...prev, 
                      displayOrder: parseInt(e.target.value) || 1 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={imageForm.isPrimary}
                      onChange={(e) => setImageForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Imagen principal</span>
                  </label>
                </div>
                
                {/* Información de Cloudinary */}
                {editingImage.cloudinaryInfo && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Información de Cloudinary
                    </h4>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>Public ID: {editingImage.cloudinaryInfo.publicId}</p>
                      <p>Formato: {editingImage.cloudinaryInfo.format}</p>
                      <p>Dimensiones: {editingImage.cloudinaryInfo.width}x{editingImage.cloudinaryInfo.height}</p>
                      <p>Tamaño: {(editingImage.cloudinaryInfo.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                )}
                
              </div>
              
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                onClick={saveImageChanges}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ImageManager; 