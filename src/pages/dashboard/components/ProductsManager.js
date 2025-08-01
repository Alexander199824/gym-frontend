// src/pages/dashboard/components/ProductsManager.js
// FUNCIÓN: Gestión SIMPLIFICADA de productos - SOLO datos que aparecen en LandingPage
// INCLUYE: name, description, price, images

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ShoppingBag, Package, 
  Upload, Image as ImageIcon, Eye, EyeOff, AlertTriangle, Star
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ProductsManager = ({ products, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localProducts, setLocalProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  
  // 📊 Plantilla para nuevo producto - SOLO campos que aparecen en LandingPage
  const emptyProduct = {
    id: null,
    name: '',
    description: '',
    price: 0,
    images: [], // Array de { url: string, isPrimary: boolean }
    featured: false // Para productos destacados en landing
  };
  
  // 🔄 Inicializar productos locales
  useEffect(() => {
    if (products && Array.isArray(products)) {
      setLocalProducts(products);
    }
  }, [products]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      console.log('Guardando productos:', localProducts);
      
      onSave(localProducts);
      setHasChanges(false);
      showSuccess('Productos guardados exitosamente');
      
      // Cerrar modo edición
      setEditingProduct(null);
      setIsCreating(false);
      
    } catch (error) {
      console.error('Error saving products:', error);
      showError('Error al guardar productos');
    }
  };
  
  // ➕ Crear nuevo producto
  const handleCreateProduct = () => {
    setIsCreating(true);
    setEditingProduct({
      ...emptyProduct,
      id: `temp_${Date.now()}`
    });
  };
  
  // ✏️ Editar producto existente
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setIsCreating(false);
  };
  
  // 💾 Guardar producto individual
  const handleSaveProduct = () => {
    if (!editingProduct.name.trim()) {
      showError('El nombre del producto es obligatorio');
      return;
    }
    
    if (!editingProduct.price || editingProduct.price <= 0) {
      showError('El precio debe ser mayor a 0');
      return;
    }
    
    if (isCreating) {
      // Agregar nuevo producto
      const newProduct = {
        ...editingProduct,
        id: `new_${Date.now()}`
      };
      setLocalProducts([...localProducts, newProduct]);
    } else {
      // Actualizar producto existente
      setLocalProducts(localProducts.map(product => 
        product.id === editingProduct.id ? editingProduct : product
      ));
    }
    
    setHasChanges(true);
    setEditingProduct(null);
    setIsCreating(false);
    showSuccess(isCreating ? 'Producto creado' : 'Producto actualizado');
  };
  
  // ❌ Cancelar edición
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };
  
  // 🗑️ Eliminar producto
  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setLocalProducts(localProducts.filter(product => product.id !== productId));
      setHasChanges(true);
      showSuccess('Producto eliminado');
    }
  };
  
  // ⭐ Toggle producto destacado
  const handleToggleFeatured = (productId) => {
    setLocalProducts(localProducts.map(product => 
      product.id === productId 
        ? { ...product, featured: !product.featured }
        : product
    ));
    setHasChanges(true);
  };
  
  // 📷 Subir imagen para producto
  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    
    try {
      setUploadingImage(productId);
      
      // Simular subida de imagen
      const imageUrl = URL.createObjectURL(file);
      const newImage = {
        url: imageUrl,
        isPrimary: false
      };
      
      // Actualizar producto con nueva imagen
      if (editingProduct && editingProduct.id === productId) {
        const updatedImages = [...(editingProduct.images || []), newImage];
        // Si es la primera imagen, marcarla como principal
        if (updatedImages.length === 1) {
          newImage.isPrimary = true;
        }
        setEditingProduct({ ...editingProduct, images: updatedImages });
      } else {
        setLocalProducts(localProducts.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                images: [...(product.images || []), newImage]
              }
            : product
        ));
        setHasChanges(true);
      }
      
      showSuccess('Imagen subida exitosamente');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error al subir imagen');
    } finally {
      setUploadingImage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Productos de la Tienda
          </h3>
          <p className="text-gray-600 mt-1">
            Productos que aparecen en la página web
          </p>
        </div>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          )}
          
          <button
            onClick={handleCreateProduct}
            className="btn-secondary btn-sm"
            disabled={isCreating || editingProduct}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      {/* ⚠️ INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios".
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 📋 LISTA DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
            
            {/* Vista normal del producto */}
            {(!editingProduct || editingProduct.id !== product.id) && (
              <>
                {/* Imagen del producto */}
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Badge destacado */}
                  {product.featured && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Destacado
                      </span>
                    </div>
                  )}
                  
                  {/* Acciones */}
                  <div className="absolute top-2 right-2 space-y-1">
                    <button
                      onClick={() => handleToggleFeatured(product.id)}
                      className={`p-2 rounded-full ${
                        product.featured 
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={product.featured ? 'Quitar destacado' : 'Marcar como destacado'}
                    >
                      <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Información del producto */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h4>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            
          </div>
        ))}
        
        {/* Mensaje cuando no hay productos */}
        {localProducts.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay productos configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Los productos aparecen en la sección "Tienda" de tu página web
            </p>
            <button
              onClick={handleCreateProduct}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto
            </button>
          </div>
        )}
      </div>
      
      {/* 📝 MODAL DE EDICIÓN */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={handleCancelEdit}
              onChange={setEditingProduct}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              isCreating={isCreating}
            />
          </div>
        </div>
      )}
      
    </div>
  );
};

// 📝 COMPONENTE: Formulario de producto simplificado
const ProductForm = ({ 
  product, 
  onSave, 
  onCancel, 
  onChange, 
  onImageUpload, 
  uploadingImage,
  isCreating
}) => {
  
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

  return (
    <div className="p-6 space-y-6">
      
      {/* 🔝 HEADER DEL FORMULARIO */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-gray-900">
            {isCreating ? 'Crear Nuevo Producto' : 'Editar Producto'}
          </h4>
          <p className="text-gray-600 mt-1">
            Información que aparece en la tienda web
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna izquierda: Información básica */}
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
            <p className="text-xs text-gray-500 mt-1">
              Aparece como título del producto
            </p>
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={product.description}
              onChange={(e) => onChange({ ...product, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe las características y beneficios del producto..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Aparece bajo el título del producto
            </p>
          </div>
          
          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio (Q) *
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
            <p className="text-xs text-gray-500 mt-1">
              Precio que aparece en la tarjeta del producto
            </p>
          </div>
          
          {/* Producto destacado */}
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
            <p className="text-xs text-gray-500 ml-2">
              (aparece primero en la tienda)
            </p>
          </div>
          
        </div>
        
        {/* Columna derecha: Imágenes */}
        <div className="space-y-4">
          
          {/* Imágenes del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes del Producto
            </label>
            
            {/* Área de subida */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  {uploadingImage === product.id ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-medium font-medium text-gray-900 mb-1">
                  Subir Imágenes
                </p>
                <p className="text-sm text-gray-500 text-center">
                  JPG, PNG hasta 5MB
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    Array.from(e.target.files).forEach(file => onImageUpload(product.id, file));
                  }}
                  disabled={uploadingImage === product.id}
                />
              </label>
            </div>
            
            {/* Grid de imágenes */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={image.url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleSetPrimaryImage(index)}
                          className={`p-1 rounded-full ${
                            image.isPrimary 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                          title={image.isPrimary ? 'Imagen principal' : 'Establecer como principal'}
                        >
                          <Star className={`w-3 h-3 ${image.isPrimary ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 bg-white rounded-full text-red-600 hover:bg-red-50"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Indicador de imagen principal */}
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-primary-600 text-white px-1 py-0.5 rounded text-xs font-medium">
                          Principal
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Las imágenes aparecen en la tarjeta del producto. La imagen principal se muestra primero.
            </p>
          </div>
          
        </div>
        
      </div>
      
    </div>
  );
};

export default ProductsManager;