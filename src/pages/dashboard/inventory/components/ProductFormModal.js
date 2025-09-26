// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ProductFormModal.js
// FUNCIÓN: Modal reutilizable para crear y editar productos - VERSIÓN CORREGIDA

import React, { useState, useEffect } from 'react';
import {
  Package, Save, X, Loader, Plus, Building, Tag,
  CloudUpload, Image, Trash, Camera, Search, ChevronDown
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

// ✅ IMPORTAR LOS SUB-COMPONENTES DE CATEGORÍAS Y MARCAS
import CategoryFormModal from './CategoryFormModal';
import BrandFormModal from './BrandFormModal';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  onSave,
  isCreating = false,
  categories = [],
  brands = [],
  onCategoriesUpdate,
  onBrandsUpdate
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ ESTADOS PARA SUB-MODALES
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  
  // ✅ ESTADOS PARA UPLOAD DE IMAGEN DEL PRODUCTO
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ✅ ESTADOS MEJORADOS PARA FILTRADO DE CATEGORÍAS Y MARCAS
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  
  // Plantilla para nuevo producto
  const emptyProduct = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    sku: '',
    stockQuantity: '',
    minStock: '5',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    categoryId: '',
    brandId: '',
    isFeatured: false,
    allowOnlinePayment: true,
    allowCardPayment: true,
    allowCashOnDelivery: true,
    deliveryTime: '1-3 días hábiles'
  };
  
  // ✅ INICIALIZAR DATOS AL ABRIR EL MODAL CON DEBUG
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 ProductFormModal: Inicializando modal');
      console.log('📦 Producto recibido:', product);
      console.log('🏗️ Es creación:', isCreating);
      
      if (product) {
        const initialProduct = {
          ...product,
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          stockQuantity: product.stockQuantity?.toString() || '',
          minStock: product.minStock?.toString() || '5',
          weight: product.weight?.toString() || '',
          dimensions: product.dimensions || emptyProduct.dimensions
        };
        console.log('✅ Producto para edición:', initialProduct);
        setEditingProduct(initialProduct);
      } else {
        console.log('✅ Nuevo producto con plantilla:', emptyProduct);
        setEditingProduct({ ...emptyProduct });
      }
      
      // Limpiar estados de imagen
      setProductImage(null);
      setImagePreview(null);
      setUploadingImage(false);
      
      // Limpiar filtros
      setCategorySearch('');
      setBrandSearch('');
      setShowCategoryDropdown(false);
      setShowBrandDropdown(false);
    }
  }, [isOpen, product, isCreating]);
  
  // ✅ CERRAR DROPDOWNS AL HACER CLIC FUERA
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (!event.target.closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // ✅ MÉTODOS PARA MANEJO DE IMAGEN
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };
  
  const handleImageFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (5MB max para productos)
    if (file.size > 5 * 1024 * 1024) {
      showError('El archivo es muy grande. Máximo 5MB');
      return;
    }
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setProductImage(file);
      console.log('🖼️ Imagen seleccionada:', {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type
      });
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
      handleImageFile(files[0]);
    }
  };
  
  const clearImage = () => {
    setProductImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };
  
  // ✅ FILTRADO MEJORADO DE CATEGORÍAS Y MARCAS
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  
  // ✅ FUNCIONES MEJORADAS PARA OBTENER NOMBRES SELECCIONADOS
  const getSelectedCategoryName = () => {
    if (showCategoryDropdown && categorySearch) return categorySearch;
    const selected = categories.find(c => c.id == editingProduct?.categoryId);
    return selected?.name || '';
  };
  
  const getSelectedBrandName = () => {
    if (showBrandDropdown && brandSearch) return brandSearch;
    const selected = brands.find(b => b.id == editingProduct?.brandId);
    return selected?.name || '';
  };
  
  // ✅ HANDLERS MEJORADOS PARA SELECCIÓN
  const handleCategorySelect = (category) => {
    console.log('📂 Categoría seleccionada:', category);
    setEditingProduct(prev => ({ ...prev, categoryId: category.id }));
    setCategorySearch(''); // ✅ Limpiar búsqueda
    setShowCategoryDropdown(false);
  };
  
  const handleBrandSelect = (brand) => {
    console.log('🏷️ Marca seleccionada:', brand);
    setEditingProduct(prev => ({ ...prev, brandId: brand.id }));
    setBrandSearch(''); // ✅ Limpiar búsqueda
    setShowBrandDropdown(false);
  };
  
  // ✅ HANDLERS PARA CATEGORÍAS
  const handleCreateCategory = () => {
    setShowCategoryModal(true);
  };
  
  const handleCategorySaved = (savedCategory) => {
    console.log('✅ Category saved from product modal:', savedCategory);
    // Actualizar el producto actual con la nueva categoría
    setEditingProduct(prev => ({ ...prev, categoryId: savedCategory.id }));
    // Notificar al componente padre para actualizar la lista
    if (onCategoriesUpdate) {
      onCategoriesUpdate();
    }
    showSuccess('Categoría creada y seleccionada');
  };
  
  // ✅ HANDLERS PARA MARCAS
  const handleCreateBrand = () => {
    setShowBrandModal(true);
  };
  
  const handleBrandSaved = (savedBrand) => {
    console.log('✅ Brand saved from product modal:', savedBrand);
    // Actualizar el producto actual con la nueva marca
    setEditingProduct(prev => ({ ...prev, brandId: savedBrand.id }));
    // Notificar al componente padre para actualizar la lista
    if (onBrandsUpdate) {
      onBrandsUpdate();
    }
    showSuccess('Marca creada y seleccionada');
  };
  
  // ✅ MÉTODO CORREGIDO PARA MANEJAR GUARDADO
  const handleSave = async () => {
    if (!editingProduct) {
      console.error('❌ No hay producto para guardar');
      return;
    }
    
    console.log('🔍 ProductFormModal: Iniciando guardado');
    console.log('📦 Estado del producto:', editingProduct);
    console.log('🖼️ Imagen seleccionada:', productImage?.name);
    console.log('🏗️ Es creación:', isCreating);
    
    // ✅ VALIDACIONES MEJORADAS
    if (!editingProduct.name?.trim()) {
      showError('El nombre del producto es obligatorio');
      console.error('❌ Validación: nombre vacío');
      return;
    }
    
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) {
      showError('El precio de venta es obligatorio y debe ser mayor a 0');
      console.error('❌ Validación: precio inválido', editingProduct.price);
      return;
    }
    
    if (!editingProduct.categoryId) {
      showError('Debe seleccionar una categoría');
      console.error('❌ Validación: categoría no seleccionada');
      return;
    }
    
    try {
      setIsSaving(true);
      setUploadingImage(true);
      
      let response;
      
      // ✅ SI HAY IMAGEN Y ES CREACIÓN, USAR FORMDATA
      if (productImage && isCreating) {
        console.log('📤 ProductFormModal: Enviando con FormData (producto + imagen)');
        
        const formData = new FormData();
        
        // ✅ AÑADIR TODOS LOS CAMPOS CORRECTAMENTE
        formData.append('name', editingProduct.name.trim());
        formData.append('description', editingProduct.description?.trim() || '');
        formData.append('price', parseFloat(editingProduct.price));
        
        if (editingProduct.originalPrice) {
          formData.append('originalPrice', parseFloat(editingProduct.originalPrice));
        }
        
        formData.append('sku', editingProduct.sku?.trim() || '');
        formData.append('stockQuantity', parseInt(editingProduct.stockQuantity) || 0);
        formData.append('minStock', parseInt(editingProduct.minStock) || 5);
        
        if (editingProduct.weight) {
          formData.append('weight', parseFloat(editingProduct.weight));
        }
        
        if (editingProduct.dimensions) {
          formData.append('dimensions', JSON.stringify(editingProduct.dimensions));
        }
        
        formData.append('categoryId', parseInt(editingProduct.categoryId));
        
        if (editingProduct.brandId) {
          formData.append('brandId', parseInt(editingProduct.brandId));
        }
        
        formData.append('isFeatured', editingProduct.isFeatured || false);
        formData.append('allowOnlinePayment', editingProduct.allowOnlinePayment !== false);
        formData.append('allowCardPayment', editingProduct.allowCardPayment !== false);
        formData.append('allowCashOnDelivery', editingProduct.allowCashOnDelivery !== false);
        formData.append('deliveryTime', editingProduct.deliveryTime?.trim() || '1-3 días hábiles');
        
        // ✅ AÑADIR LA IMAGEN
        formData.append('image', productImage);
        formData.append('isPrimary', 'true');
        formData.append('altText', `${editingProduct.name} - Imagen principal`);
        formData.append('displayOrder', '1');
        
        // Debug: Mostrar contenido del FormData
        console.log('📋 ProductFormModal: Contenido del FormData:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`  ${key}:`, value);
          }
        }
        
        response = await inventoryService.createProductWithImage(formData);
        
      } else {
        // ✅ SIN IMAGEN, USAR JSON TRADICIONAL
        console.log('📤 ProductFormModal: Enviando con JSON (solo producto)');
        
        const productData = inventoryService.formatProductDataForAPI(editingProduct);
        console.log('📋 ProductFormModal: Datos JSON formateados:', productData);
        
        if (isCreating) {
          response = await inventoryService.createProduct(productData);
        } else {
          response = await inventoryService.updateProduct(editingProduct.id, productData);
        }
      }
      
      if (response.success) {
        const message = isCreating 
          ? (productImage ? 'Producto creado con imagen subida a Cloudinary' : 'Producto creado exitosamente')
          : 'Producto actualizado exitosamente';
        
        console.log('✅ ProductFormModal: Producto guardado exitosamente');
        showSuccess(message);
        
        if (onSave) {
          onSave(response.data);
        }
        onClose();
      }
      
    } catch (error) {
      console.error('❌ ProductFormModal: Error saving product:', error);
      console.error('📋 ProductFormModal: Estado del producto al fallar:', editingProduct);
      showError(`Error al guardar producto: ${error.message}`);
    } finally {
      setIsSaving(false);
      setUploadingImage(false);
    }
  };
  
  if (!isOpen || !editingProduct) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <p className="text-gray-600">
                {isCreating ? 'Agrega un nuevo producto a tu inventario' : 'Modifica los datos del producto'}
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
            
            {/* COLUMNA 1: INFORMACIÓN BÁSICA */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Información Básica
                </h4>
                
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => {
                        console.log('📝 Actualizando nombre:', e.target.value);
                        setEditingProduct(prev => ({ ...prev, name: e.target.value }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Ej: Proteína Whey Premium"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>
                  
                  {/* ✅ CATEGORÍA CORREGIDA CON FILTRO Y BÚSQUEDA */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Categoría *
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Nueva Categoría
                      </button>
                    </div>
                    <div className="relative category-dropdown-container">
                      <div className="flex">
                        <input
                          type="text"
                          value={showCategoryDropdown ? categorySearch : getSelectedCategoryName()}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setShowCategoryDropdown(true);
                            if (!e.target.value) {
                              setEditingProduct(prev => ({ ...prev, categoryId: '' }));
                            }
                          }}
                          onFocus={() => {
                            if (!editingProduct?.categoryId) {
                              setCategorySearch('');
                            }
                            setShowCategoryDropdown(true);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Buscar categoría..."
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {showCategoryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCategories.length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm">
                              No se encontraron categorías
                            </div>
                          ) : (
                            filteredCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => handleCategorySelect(category)}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{category.name}</div>
                                {category.description && (
                                  <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ MARCA CORREGIDA CON FILTRO Y BÚSQUEDA */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Marca
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateBrand}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Nueva Marca
                      </button>
                    </div>
                    <div className="relative brand-dropdown-container">
                      <div className="flex">
                        <input
                          type="text"
                          value={showBrandDropdown ? brandSearch : getSelectedBrandName()}
                          onChange={(e) => {
                            setBrandSearch(e.target.value);
                            setShowBrandDropdown(true);
                            if (!e.target.value) {
                              setEditingProduct(prev => ({ ...prev, brandId: '' }));
                            }
                          }}
                          onFocus={() => {
                            if (!editingProduct?.brandId) {
                              setBrandSearch('');
                            }
                            setShowBrandDropdown(true);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Buscar marca..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {showBrandDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredBrands.length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm">
                              No se encontraron marcas
                            </div>
                          ) : (
                            filteredBrands.map(brand => (
                              <button
                                key={brand.id}
                                type="button"
                                onClick={() => handleBrandSelect(brand)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  {brand.logoUrl && (
                                    <img 
                                      src={brand.logoUrl} 
                                      alt={brand.name}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{brand.name}</div>
                                    {brand.description && (
                                      <div className="text-xs text-gray-500 mt-1">{brand.description}</div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU (Código de producto)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Código único del producto"
                    />
                  </div>
                  
                </div>
              </div>
              
              {/* ✅ IMAGEN DEL PRODUCTO */}
              {isCreating && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    Imagen del Producto
                  </h4>
                  
                  {/* Zona de drag & drop */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                  >
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {productImage?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {productImage && (productImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImage();
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <Trash className="w-4 h-4 inline mr-1" />
                          Eliminar imagen
                        </button>
                      </div>
                    ) : (
                      <div>
                        <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${
                          isDragging ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <p className={`text-lg font-medium mb-2 ${
                          isDragging ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, WebP hasta 5MB
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          ☁️ Se subirá automáticamente a Cloudinary
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {uploadingImage && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center text-green-600">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Subiendo imagen a Cloudinary...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* COLUMNA 2: PRECIOS E INVENTARIO */}
            <div className="space-y-6">
              
              {/* Precios */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">Q</span>
                  </div>
                  Precios
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio de venta * (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.price}
                      onChange={(e) => {
                        console.log('💰 Actualizando precio:', e.target.value);
                        setEditingProduct(prev => ({ ...prev, price: e.target.value }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio original (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.originalPrice}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para mostrar descuentos</p>
                  </div>
                </div>
                
                {/* Preview de descuento */}
                {editingProduct.originalPrice && editingProduct.price && 
                 parseFloat(editingProduct.originalPrice) > parseFloat(editingProduct.price) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-700 font-medium">Descuento:</span>
                      <span className="text-green-600">
                        {Math.round(((parseFloat(editingProduct.originalPrice) - parseFloat(editingProduct.price)) / parseFloat(editingProduct.originalPrice)) * 100)}%
                      </span>
                      <span className="text-gray-500">
                        (Q{(parseFloat(editingProduct.originalPrice) - parseFloat(editingProduct.price)).toFixed(2)} de ahorro)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Inventario */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">#</span>
                  </div>
                  Inventario
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad en stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.stockQuantity}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.minStock}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, minStock: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alerta cuando llegue a este nivel</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingProduct.weight}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiempo de entrega
                    </label>
                    <input
                      type="text"
                      value={editingProduct.deliveryTime}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="1-3 días hábiles"
                    />
                  </div>
                </div>
              </div>
              
              {/* Opciones */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Opciones de Producto</h4>
                
                <div className="space-y-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Producto destacado</span>
                      <p className="text-xs text-gray-500">Aparecerá en la sección de productos destacados</p>
                    </div>
                  </label>
                  
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700">Métodos de pago permitidos</h5>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowOnlinePayment}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowOnlinePayment: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago online</span>
                    </label>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowCardPayment}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCardPayment: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago con tarjeta</span>
                    </label>
                    
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.allowCashOnDelivery}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCashOnDelivery: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pago contra entrega</span>
                    </label>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              disabled={isSaving}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50"
              disabled={isSaving || !editingProduct.name || !editingProduct.price || !editingProduct.categoryId}
            >
              {isSaving ? (
                <div className="flex items-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  {isCreating ? 'Crear Producto' : 'Guardar Cambios'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* ✅ SUB-MODALES REUTILIZABLES */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={null}
        onSave={handleCategorySaved}
        isCreating={true}
      />
      
      <BrandFormModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        brand={null}
        onSave={handleBrandSaved}
        isCreating={true}
      />
    </>
  );
};

export default ProductFormModal;