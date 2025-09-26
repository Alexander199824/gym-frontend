// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/BrandFormModal.js
// FUNCIÓN: Modal reutilizable para crear y editar marcas con upload de logo

import React, { useState, useEffect } from 'react';
import {
  Building, Save, X, Link, CloudUpload, Image, 
  Trash, Eye, Upload, Globe
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const BrandFormModal = ({ 
  isOpen, 
  onClose, 
  brand = null, 
  onSave,
  isCreating = false 
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados
  const [editingBrand, setEditingBrand] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ ESTADOS PARA UPLOAD DE MARCAS
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoSource, setLogoSource] = useState('url'); // 'url' | 'upload'
  
  // Plantilla vacía
  const emptyBrand = {
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    isActive: true
  };
  
  // Inicializar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const brandData = brand ? { ...brand } : { ...emptyBrand };
      setEditingBrand(brandData);
      setLogoPreview(null);
      setLogoSource(brandData.logoUrl ? 'url' : 'upload');
    }
  }, [isOpen, brand]);
  
  // ✅ MÉTODOS DE UPLOAD PARA MARCAS
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoFile(file);
    }
  };
  
  const handleLogoFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (3MB max)
    if (file.size > 3 * 1024 * 1024) {
      showError('El archivo es muy grande. Máximo 3MB');
      return;
    }
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview({
        file,
        url: e.target.result,
        name: file.name,
        size: file.size
      });
      
      // Limpiar URL manual si se selecciona archivo
      setEditingBrand(prev => ({ ...prev, logoUrl: '' }));
    };
    reader.readAsDataURL(file);
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
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
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleLogoFile(files[0]);
    }
  };
  
  const clearLogo = () => {
    setLogoPreview(null);
    setEditingBrand(prev => ({ ...prev, logoUrl: '' }));
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };
  
  // MANEJAR GUARDADO
  const handleSave = async () => {
    if (!editingBrand.name.trim()) {
      showError('El nombre de la marca es obligatorio');
      return;
    }
    
    setIsSaving(true);
    setUploadingLogo(true);
    
    try {
      let response;
      
      // ✅ SI HAY ARCHIVO, USAR FORMDATA PARA UPLOAD
      if (logoPreview && logoPreview.file) {
        const formData = new FormData();
        formData.append('name', editingBrand.name.trim());
        formData.append('description', editingBrand.description?.trim() || '');
        formData.append('website', editingBrand.website?.trim() || '');
        formData.append('isActive', editingBrand.isActive);
        formData.append('logo', logoPreview.file); // Archivo para Cloudinary
        
        if (isCreating) {
          response = await inventoryService.createBrandWithUpload(formData);
        } else {
          response = await inventoryService.updateBrandWithUpload(editingBrand.id, formData);
        }
      } else {
        // ✅ SI NO HAY ARCHIVO, USAR JSON NORMAL
        if (isCreating) {
          response = await inventoryService.createBrand(editingBrand);
        } else {
          response = await inventoryService.updateBrand(editingBrand.id, editingBrand);
        }
      }
      
      if (response.success) {
        showSuccess(isCreating ? 'Marca creada exitosamente' : 'Marca actualizada exitosamente');
        if (onSave) {
          onSave(response.data);
        }
        onClose();
        setLogoPreview(null);
      }
      
    } catch (error) {
      console.error('❌ Error saving brand:', error);
      showError(`Error al guardar marca: ${error.message}`);
    } finally {
      setIsSaving(false);
      setUploadingLogo(false);
    }
  };
  
  if (!isOpen || !editingBrand) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              {isCreating ? 'Nueva Marca' : 'Editar Marca'}
            </h3>
            <p className="text-gray-600">
              {isCreating ? 'Crea una nueva marca para categorizar tus productos' : 'Modifica los datos de la marca'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Formulario básico */}
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Nombre de la marca *
              </label>
              <input
                type="text"
                value={editingBrand.name}
                onChange={(e) => setEditingBrand(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ej: Nike, Adidas, MuscleTech, Optimum Nutrition..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Descripción
              </label>
              <textarea
                value={editingBrand.description}
                onChange={(e) => setEditingBrand(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Describe la marca, su historia, valores o características principales..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sitio web
              </label>
              <input
                type="url"
                value={editingBrand.website}
                onChange={(e) => setEditingBrand(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="https://www.marca.com"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBrand.isActive}
                  onChange={(e) => setEditingBrand(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Marca activa</span>
              </label>
            </div>
            
          </div>
          
          {/* ✅ GESTIÓN DE LOGO MEJORADA */}
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Logo de la marca
              </label>
              
              {/* Selector de fuente */}
              <div className="flex mb-4">
                <button
                  type="button"
                  onClick={() => setLogoSource('url')}
                  className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-all ${
                    logoSource === 'url'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Link className="w-4 h-4 inline mr-2" />
                  URL Externa
                </button>
                <button
                  type="button"
                  onClick={() => setLogoSource('upload')}
                  className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-all ${
                    logoSource === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CloudUpload className="w-4 h-4 inline mr-2" />
                  Subir Imagen
                </button>
              </div>
              
              {/* Contenido según la fuente seleccionada */}
              {logoSource === 'url' ? (
                <div>
                  <input
                    type="url"
                    value={editingBrand.logoUrl}
                    onChange={(e) => setEditingBrand(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    URL directa a la imagen del logo
                  </p>
                </div>
              ) : (
                <div>
                  {/* ✅ ZONA DE DRAG & DROP */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    {logoPreview ? (
                      <div className="space-y-4">
                        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={logoPreview.url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {logoPreview.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(logoPreview.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearLogo();
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <Trash className="w-4 h-4 inline mr-1" />
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${
                          isDragging ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-medium mb-2 ${
                          isDragging ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, WebP hasta 3MB
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {uploadingLogo && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Subiendo a Cloudinary...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Preview del logo actual */}
            {(editingBrand.logoUrl || logoPreview) && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Vista previa</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center">
                    <img
                      src={logoPreview?.url || editingBrand.logoUrl}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full bg-gray-100 flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{editingBrand.name || 'Nombre de la marca'}</p>
                    <p className="text-sm text-gray-500">
                      {logoPreview ? 'Imagen nueva' : 'Imagen actual'}
                      {editingBrand.logoUrl?.includes('cloudinary.com') && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Cloudinary
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
          
        </div>
        
        {/* Botones de acción mejorados */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <button
            onClick={() => {
              onClose();
              setLogoPreview(null);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            disabled={isSaving}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50"
            disabled={isSaving || !editingBrand.name.trim()}
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {uploadingLogo ? 'Subiendo...' : 'Guardando...'}
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-5 h-5 mr-2" />
                {isCreating ? 'Crear Marca' : 'Guardar Cambios'}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandFormModal;