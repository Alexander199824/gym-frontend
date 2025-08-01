// src/pages/dashboard/components/ProductsManager.js
// FUNCIÓN: Gestión SIMPLIFICADA de productos - SOLO datos que aparecen en LandingPage
// INCLUYE: name, description, price, images, featured - Optimizado para tienda web

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ShoppingBag, Package, 
  Upload, Image as ImageIcon, Eye, EyeOff, AlertTriangle, Star,
  Cloud, Copy, Loader, FileImage, Check, DollarSign, Tag
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const ProductsManager = ({ products, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localProducts, setLocalProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // 📊 Plantilla para nuevo producto - SOLO campos que aparecen en LandingPage
  const emptyProduct = {
    id: null,
    name: '',
    description: '',
    price: 0,
    originalPrice: null, // Para mostrar descuentos
    images: [], // Array de { url: string, isPrimary: boolean, cloudinaryId?: string }
    featured: false, // Para productos destacados en landing
    active: true,
    category: 'general'
  };
  
  // 🏷️ Categorías simplificadas para productos web
  const productCategories = [
    { id: 'general', name: 'General', icon: Package },
    { id: 'suplementos', name: 'Suplementos', icon: Package },
    { id: 'ropa', name: 'Ropa Deportiva', icon: ShoppingBag },
    { id: 'accesorios', name: 'Accesorios', icon: Star },
    { id: 'equipos', name: 'Equipos', icon: DollarSign }
  ];
  
  // 🔄 Inicializar productos locales
  useEffect(() => {
    if (products && Array.isArray(products)) {
      console.log('🔄 Initializing ProductsManager with products:', products);
      setLocalProducts(products);
    }
  }, [products]);
  
  // 🔔 Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // 📤 Subir imagen a Cloudinary
  const uploadImageToCloudinary = async (file, onProgress) => {
    try {
      console.log('📤 Uploading product image to Cloudinary:', file.name);
      
      // Validar archivo
      if (file.size > 10 * 1024 * 1024) { // 10MB límite
        throw new Error('La imagen es muy grande. Máximo 10MB.');
      }
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen.');
      }
      
      // Simular progreso (reemplazar con llamada real al backend)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress > 95) progress = 95;
        onProgress(Math.round(progress));
      }, 400);
      
      // Simular respuesta de Cloudinary
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      onProgress(100);
      
      // Respuesta simulada (reemplazar con apiService.uploadProductImage(file))
      const mockResponse = {
        url: URL.createObjectURL(file),
        cloudinaryId: `product_${Date.now()}`,
        width: 800,
        height: 600,
        format: file.type.split('/')[1]
      };
      
      console.log('✅ Image uploaded successfully:', mockResponse);
      return mockResponse;
      
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  };
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      console.log('💾 Saving products:', localProducts);
      
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
    
    if (editingProduct.originalPrice && editingProduct.originalPrice <= editingProduct.price) {
      showError('El precio original debe ser mayor al precio actual');
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
  
  // 👁️ Toggle activo/inactivo
  const handleToggleActive = (productId) => {
    setLocalProducts(localProducts.map(product => 
      product.id === productId 
        ? { ...product, active: !product.active }
        : product
    ));
    setHasChanges(true);
  };
  
  // 📷 Subir imagen para producto
  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    
    try {
      setUploadingImage(productId);
      setUploadProgress({ [productId]: 0 });
      
      const cloudinaryResponse = await uploadImageToCloudinary(
        file,
        (progress) => setUploadProgress({ [productId]: progress })
      );
      
      const newImage = {
        url: cloudinaryResponse.url,
        cloudinaryId: cloudinaryResponse.cloudinaryId,
        isPrimary: false,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        uploadedAt: new Date().toISOString()
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
      showError(error.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(null);
      setUploadProgress({});
    }
  };
  
  // 💰 Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
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
            Productos que aparecen en la página web y tienda online
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
      
      {/* 📊 ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">{localProducts.length}</div>
              <div className="text-sm text-gray-600">Total Productos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {localProducts.filter(p => p.featured).length}
              </div>
              <div className="text-sm text-gray-600">Destacados</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {localProducts.filter(p => p.active).length}
              </div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {productCategories.length - 1}
              </div>
              <div className="text-sm text-gray-600">Categorías</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📋 LISTA DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localProducts.map((product) => (
          <div key={product.id} className={`bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
            !product.active ? 'opacity-60' : ''
          }`}>
            
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
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 space-y-1">
                    {product.featured && (
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ⭐ Destacado
                      </span>
                    )}
                    {!product.active && (
                      <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </div>
                  
                  {/* Descuento */}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        -{calculateDiscount(product.price, product.originalPrice)}%
                      </span>
                    </div>
                  )}
                  
                  {/* Acciones en hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(product.id)}
                        className={`p-2 rounded-full ${
                          product.featured 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        title={product.featured ? 'Quitar destacado' : 'Marcar como destacado'}
                      >
                        <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={`p-2 rounded-full ${
                          product.active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={product.active ? 'Desactivar' : 'Activar'}
                      >
                        {product.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Información del producto */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                      {product.name}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded">
                      {productCategories.find(cat => cat.id === product.category)?.name || 'General'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {product.images?.length || 0} imágenes
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              categories={productCategories}
              onSave={handleSaveProduct}
              onCancel={handleCancelEdit}
              onChange={setEditingProduct}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              uploadProgress={uploadProgress}
              isCreating={isCreating}
              calculateDiscount={calculateDiscount}
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
  categories,
  onSave, 
  onCancel, 
  onChange, 
  onImageUpload, 
  uploadingImage,
  uploadProgress,
  isCreating,
  calculateDiscount
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
  
  // 📋 Copiar URL de imagen
  const handleCopyImageUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      // Mostrar feedback temporal
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* 🔝 HEADER DEL FORMULARIO */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Actual (Q) *
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Original (Q)
              </label>
              <input
                type="number"
                value={product.originalPrice || ''}
                onChange={(e) => onChange({ ...product, originalPrice: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Para descuentos"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          {/* Preview de descuento */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <Tag className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Descuento: {calculateDiscount(product.price, product.originalPrice)}%
                </span>
              </div>
            </div>
          )}
          
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
                Producto activo (visible en la tienda)
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
                Producto destacado (aparece primero)
              </label>
            </div>
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
                    <div className="relative">
                      <Loader className="w-6 h-6 text-primary-600 animate-spin" />
                      {uploadProgress[product.id] !== undefined && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600">
                            {uploadProgress[product.id]}%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <p className="text-medium font-medium text-gray-900 mb-1">
                  Subir Imágenes
                </p>
                <p className="text-sm text-gray-500 text-center">
                  JPG, PNG hasta 10MB cada una<br />
                  <span className="text-blue-600">Se optimizan automáticamente</span>
                </p>
                
                {uploadingImage === product.id && uploadProgress[product.id] !== undefined && (
                  <div className="w-full max-w-xs mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[product.id]}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
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
              <div className="grid grid-cols-3 gap-3 mt-4">
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
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                          onClick={() => handleCopyImageUrl(image.url)}
                          className="p-1 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Copiar URL"
                        >
                          <Copy className="w-3 h-3" />
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
                    
                    {/* Indicadores */}
                    <div className="absolute top-1 left-1 space-y-1">
                      {image.isPrimary && (
                        <span className="bg-primary-600 text-white px-1 py-0.5 rounded text-xs font-medium">
                          Principal
                        </span>
                      )}
                      {image.cloudinaryId && (
                        <Cloud className="w-3 h-3 text-blue-500" title="Alojado en Cloudinary" />
                      )}
                    </div>
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