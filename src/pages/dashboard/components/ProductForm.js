// src/pages/dashboard/components/ProductForm.js
// FUNCIÓN: Formulario completo para crear/editar productos
// INCLUYE: Información básica, precios, stock, imágenes, variantes

import React, { useState } from 'react';
import {
  Save, X, Upload, Trash2, Plus, Minus, Star, Tag, Package,
  DollarSign, Barcode, Image as ImageIcon, Palette, Ruler,
  Weight, AlertCircle, Info, Check, Eye, EyeOff
} from 'lucide-react';

const ProductForm = ({ 
  product, 
  productCategories, 
  availableBrands, 
  onSave, 
  onCancel, 
  onChange, 
  onImageUpload, 
  uploadingImage,
  isCreating, 
  calculateDiscount, 
  calculateMargin 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [newTag, setNewTag] = useState('');
  const [newVariant, setNewVariant] = useState({ type: 'flavors', value: '' });
  
  // 🔗 Tabs del formulario
  const formTabs = [
    { id: 'basic', label: 'Información Básica', icon: Package },
    { id: 'pricing', label: 'Precios y Stock', icon: DollarSign },
    { id: 'images', label: 'Imágenes', icon: ImageIcon },
    { id: 'variants', label: 'Variantes', icon: Palette },
    { id: 'details', label: 'Detalles', icon: Info }
  ];
  
  // 🏷️ Tipos de variantes
  const variantTypes = [
    { id: 'flavors', label: 'Sabores', placeholder: 'Ej: Chocolate, Vainilla, Fresa' },
    { id: 'sizes', label: 'Tamaños', placeholder: 'Ej: S, M, L, XL' },
    { id: 'colors', label: 'Colores', placeholder: 'Ej: Negro, Azul, Rojo' }
  ];
  
  // 🏷️ Agregar etiqueta
  const handleAddTag = () => {
    if (newTag.trim() && !product.tags.includes(newTag.trim())) {
      onChange({
        ...product,
        tags: [...(product.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };
  
  // ❌ Eliminar etiqueta
  const handleRemoveTag = (tagToRemove) => {
    onChange({
      ...product,
      tags: product.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // 🎨 Agregar variante
  const handleAddVariant = () => {
    if (newVariant.value.trim()) {
      const variantType = newVariant.type;
      const currentVariants = product.variants[variantType] || [];
      
      if (!currentVariants.includes(newVariant.value.trim())) {
        onChange({
          ...product,
          variants: {
            ...product.variants,
            [variantType]: [...currentVariants, newVariant.value.trim()]
          }
        });
        setNewVariant({ ...newVariant, value: '' });
      }
    }
  };
  
  // ❌ Eliminar variante
  const handleRemoveVariant = (variantType, variantToRemove) => {
    onChange({
      ...product,
      variants: {
        ...product.variants,
        [variantType]: product.variants[variantType].filter(v => v !== variantToRemove)
      }
    });
  };
  
  // 🖼️ Establecer imagen como principal
  const handleSetPrimaryImage = (imageIndex) => {
    const updatedImages = product.images.map((img, index) => ({
      ...img,
      isPrimary: index === imageIndex
    }));
    
    onChange({
      ...product,
      images: updatedImages
    });
  };
  
  // 🗑️ Eliminar imagen
  const handleRemoveImage = (imageIndex) => {
    const updatedImages = product.images.filter((_, index) => index !== imageIndex);
    
    // Si eliminamos la imagen principal, hacer la primera imagen como principal
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }
    
    onChange({
      ...product,
      images: updatedImages
    });
  };
  
  // 📊 Calcular métricas
  const discount = calculateDiscount(product.price, product.originalPrice);
  const margin = calculateMargin(product.price, product.cost);
  const profit = product.price - product.cost;

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER DEL FORMULARIO */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-gray-900">
            {isCreating ? 'Crear Nuevo Producto' : 'Editar Producto'}
          </h4>
          <p className="text-gray-600 mt-1">
            {isCreating ? 'Completa la información del nuevo producto' : 'Modifica la información del producto'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isCreating ? 'Crear Producto' : 'Guardar Cambios'}
          </button>
          
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </button>
        </div>
      </div>
      
      {/* 🔗 NAVEGACIÓN POR TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {formTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* 📋 CONTENIDO SEGÚN TAB ACTIVO */}
      <div className="bg-white">
        
        {/* TAB: Información Básica */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Columna izquierda */}
              <div className="space-y-4">
                
                {/* Nombre del producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => onChange({ ...product, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Proteína Whey Elite 2kg"
                  />
                </div>
                
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Barcode className="w-4 h-4 inline mr-1" />
                    SKU (Código) *
                  </label>
                  <input
                    type="text"
                    value={product.sku}
                    onChange={(e) => onChange({ ...product, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: PRO-WHE-2KG-001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Código único para identificar el producto
                  </p>
                </div>
                
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={product.category}
                    onChange={(e) => onChange({ ...product, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {productCategories.slice(1).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <select
                    value={product.brand}
                    onChange={(e) => onChange({ ...product, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {availableBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                
              </div>
              
              {/* Columna derecha */}
              <div className="space-y-4">
                
                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) => onChange({ ...product, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe las características y beneficios del producto..."
                  />
                </div>
                
                {/* Peso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Weight className="w-4 h-4 inline mr-1" />
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={product.weight || ''}
                    onChange={(e) => onChange({ ...product, weight: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                
                {/* Dimensiones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="w-4 h-4 inline mr-1" />
                    Dimensiones (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={product.dimensions?.length || ''}
                      onChange={(e) => onChange({ 
                        ...product, 
                        dimensions: { 
                          ...product.dimensions, 
                          length: parseFloat(e.target.value) || null 
                        }
                      })}
                      className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      placeholder="Largo"
                      min="0"
                    />
                    <input
                      type="number"
                      value={product.dimensions?.width || ''}
                      onChange={(e) => onChange({ 
                        ...product, 
                        dimensions: { 
                          ...product.dimensions, 
                          width: parseFloat(e.target.value) || null 
                        }
                      })}
                      className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      placeholder="Ancho"
                      min="0"
                    />
                    <input
                      type="number"
                      value={product.dimensions?.height || ''}
                      onChange={(e) => onChange({ 
                        ...product, 
                        dimensions: { 
                          ...product.dimensions, 
                          height: parseFloat(e.target.value) || null 
                        }
                      })}
                      className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      placeholder="Alto"
                      min="0"
                    />
                  </div>
                </div>
                
                {/* Estados */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={product.active}
                      onChange={(e) => onChange({ ...product, active: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                      Producto activo
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={product.featured}
                      onChange={(e) => onChange({ ...product, featured: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                      Producto destacado
                    </label>
                  </div>
                </div>
                
              </div>
              
            </div>
            
          </div>
        )}
        
        {/* TAB: Precios y Stock */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Precios */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Precios</h5>
                
                {/* Precio de venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Venta (Q) *
                  </label>
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => onChange({ ...product, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                {/* Precio original */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Original (Q)
                  </label>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => onChange({ ...product, originalPrice: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para mostrar descuentos (opcional)
                  </p>
                </div>
                
                {/* Costo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo (Q)
                  </label>
                  <input
                    type="number"
                    value={product.cost}
                    onChange={(e) => onChange({ ...product, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Costo de adquisición del producto
                  </p>
                </div>
                
                {/* Métricas calculadas */}
                {product.price > 0 && product.cost > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h6 className="font-medium text-gray-900">Métricas</h6>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento:</span>
                        <span className="text-green-600 font-medium">{discount}%</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Margen de ganancia:</span>
                      <span className="text-blue-600 font-medium">{margin}%</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ganancia por unidad:</span>
                      <span className="text-green-600 font-medium">Q{profit.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
              </div>
              
              {/* Stock */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Inventario</h5>
                
                {/* Stock actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => onChange({ ...product, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                {/* Stock mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={product.minStock}
                    onChange={(e) => onChange({ ...product, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="5"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alerta cuando el stock llegue a este nivel
                  </p>
                </div>
                
                {/* Stock máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    value={product.maxStock}
                    onChange={(e) => onChange({ ...product, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="100"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Capacidad máxima de almacenamiento
                  </p>
                </div>
                
                {/* Indicador de estado del stock */}
                {product.stock <= product.minStock && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div className="ml-3">
                        <h6 className="text-sm font-medium text-red-800">
                          Stock Bajo
                        </h6>
                        <p className="text-sm text-red-700">
                          El producto está por debajo del stock mínimo
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Barra de stock */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Nivel de stock</span>
                    <span>{product.stock} de {product.maxStock}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        product.stock <= product.minStock ? 'bg-red-500' : 
                        product.stock <= product.minStock * 2 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((product.stock / product.maxStock) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
              </div>
              
            </div>
            
          </div>
        )}
        
        {/* TAB: Imágenes */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <h5 className="text-lg font-medium text-gray-900">Imágenes del Producto</h5>
            
            {/* Área de subida */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-medium font-medium text-gray-900 mb-1">
                  Subir Imágenes
                </p>
                <p className="text-sm text-gray-500 text-center">
                  Selecciona múltiples imágenes o arrastra y suelta aquí<br />
                  JPG, PNG hasta 5MB por imagen
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    Array.from(e.target.files).forEach(file => onImageUpload(product.id, file));
                  }}
                  disabled={uploadingImage}
                />
              </label>
            </div>
            
            {/* Grid de imágenes */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={image.url}
                        alt={image.alt || `Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSetPrimaryImage(index)}
                          className={`p-2 rounded-full ${
                            image.isPrimary 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                          title={image.isPrimary ? 'Imagen principal' : 'Establecer como principal'}
                        >
                          <Star className={`w-4 h-4 ${image.isPrimary ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Indicador de imagen principal */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Principal
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(!product.images || product.images.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay imágenes del producto</p>
                <p className="text-sm">Sube la primera imagen para comenzar</p>
              </div>
            )}
          </div>
        )}
        
        {/* TAB: Variantes */}
        {activeTab === 'variants' && (
          <div className="space-y-6">
            <h5 className="text-lg font-medium text-gray-900">Variantes del Producto</h5>
            
            {variantTypes.map((variantType) => (
              <div key={variantType.id} className="space-y-3">
                <h6 className="font-medium text-gray-900">{variantType.label}</h6>
                
                {/* Variantes existentes */}
                {product.variants[variantType.id] && product.variants[variantType.id].length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.variants[variantType.id].map((variant, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {variant}
                        <button
                          onClick={() => handleRemoveVariant(variantType.id, variant)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Agregar nueva variante */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newVariant.type === variantType.id ? newVariant.value : ''}
                    onChange={(e) => setNewVariant({ type: variantType.id, value: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={variantType.placeholder}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newVariant.type === variantType.id) {
                        handleAddVariant();
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setNewVariant({ type: variantType.id, value: newVariant.value });
                      handleAddVariant();
                    }}
                    className="btn-secondary btn-sm"
                    disabled={!newVariant.value.trim() || newVariant.type !== variantType.id}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* TAB: Detalles */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <h5 className="text-lg font-medium text-gray-900">Detalles Adicionales</h5>
            
            {/* Etiquetas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-4 h-4 inline mr-1" />
                Etiquetas
              </label>
              
              {/* Etiquetas existentes */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Agregar nueva etiqueta */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: proteína, fitness, bestseller"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="btn-secondary btn-sm"
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Las etiquetas ayudan a categorizar y buscar productos
              </p>
            </div>
            
          </div>
        )}
        
      </div>
      
    </div>
  );
};

export default ProductForm;