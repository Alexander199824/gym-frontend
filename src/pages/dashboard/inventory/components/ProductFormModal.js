// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ProductFormModal.js
// FUNCIÓN: Modal para crear/editar productos - VERSIÓN CORREGIDA que carga sus propias categorías y marcas

import React, { useState, useEffect } from 'react';
import {
  Package, Save, X, Loader, Plus, Building, Tag,
  CloudUpload, Image, Trash, Camera, Search, ChevronDown,
  RefreshCw, AlertTriangle
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
  // ✅ MANTENER PROPS OPCIONALES PARA COMPATIBILIDAD
  categories: propCategories = [],
  brands: propBrands = [],
  onCategoriesUpdate,
  onBrandsUpdate
}) => {
  const { showSuccess, showError } = useApp();
  
  // Estados principales
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ NUEVOS ESTADOS PARA CARGAR CATEGORÍAS Y MARCAS INDEPENDIENTEMENTE
  const [categories, setCategories] = useState(propCategories);
  const [brands, setBrands] = useState(propBrands);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [brandsError, setBrandsError] = useState(null);
  
  // ✅ ESTADOS PARA SUB-MODALES
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  
  // ✅ ESTADOS PARA UPLOAD DE IMAGEN
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ✅ ESTADOS PARA FILTRADO DE CATEGORÍAS Y MARCAS
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  
  // ✅ CARGAR CATEGORÍAS INDEPENDIENTEMENTE
  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    
    try {
      console.log('📂 ProductFormModal: Cargando categorías...');
      const response = await inventoryService.getCategories({ limit: 100 });
      console.log('📋 ProductFormModal: Respuesta de categorías:', response);
      
      if (response.success && response.data) {
        let categoriesList = [];
        
        // ✅ PROBAR DIFERENTES ESTRUCTURAS DE RESPUESTA
        if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesList = response.data.categories;
        } else if (Array.isArray(response.data)) {
          categoriesList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesList = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          categoriesList = response.data.items;
        }
        
        setCategories(categoriesList);
        console.log(`✅ ProductFormModal: ${categoriesList.length} categorías cargadas`);
        
        if (categoriesList.length > 0) {
          console.log('📋 ProductFormModal: Primera categoría:', categoriesList[0]);
        }
        
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('❌ ProductFormModal: Error cargando categorías:', error);
      setCategoriesError(error.message);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };
  
  // ✅ CARGAR MARCAS INDEPENDIENTEMENTE
  const loadBrands = async () => {
    setLoadingBrands(true);
    setBrandsError(null);
    
    try {
      console.log('🏷️ ProductFormModal: Cargando marcas...');
      const response = await inventoryService.getBrands({ limit: 100 });
      console.log('📋 ProductFormModal: Respuesta de marcas:', response);
      
      if (response.success && response.data) {
        let brandsList = [];
        
        if (response.data.brands && Array.isArray(response.data.brands)) {
          brandsList = response.data.brands;
        } else if (Array.isArray(response.data)) {
          brandsList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          brandsList = response.data.data;
        }
        
        setBrands(brandsList);
        console.log(`✅ ProductFormModal: ${brandsList.length} marcas cargadas`);
        
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('❌ ProductFormModal: Error cargando marcas:', error);
      setBrandsError(error.message);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };
  
  // ✅ CARGAR DATOS AL ABRIR EL MODAL
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 ProductFormModal: Modal abierto, cargando datos...');
      
      // ✅ SI NO HAY CATEGORÍAS DESDE PROPS, CARGARLAS
      if (propCategories.length === 0) {
        console.log('📂 ProductFormModal: No hay categorías en props, cargando independientemente...');
        loadCategories();
      } else {
        console.log('📂 ProductFormModal: Usando categorías desde props:', propCategories.length);
        setCategories(propCategories);
      }
      
      // ✅ SI NO HAY MARCAS DESDE PROPS, CARGARLAS
      if (propBrands.length === 0) {
        console.log('🏷️ ProductFormModal: No hay marcas en props, cargando independientemente...');
        loadBrands();
      } else {
        console.log('🏷️ ProductFormModal: Usando marcas desde props:', propBrands.length);
        setBrands(propBrands);
      }
    }
  }, [isOpen, propCategories.length, propBrands.length]);
  
  // ✅ INICIALIZAR DATOS DEL PRODUCTO AL ABRIR EL MODAL
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 ProductFormModal: Inicializando producto...');
      
      if (product && !isCreating) {
        // ✅ EDITANDO PRODUCTO EXISTENTE
        const initialProduct = {
          ...product,
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          sku: product.sku || '',
          stockQuantity: product.stockQuantity?.toString() || '0',
          minStock: product.minStock?.toString() || '5',
          weight: product.weight?.toString() || '',
          deliveryTime: product.deliveryTime || '1-3 días hábiles',
          categoryId: product.categoryId?.toString() || '',
          brandId: product.brandId?.toString() || '',
          dimensions: product.dimensions || {
            length: '',
            width: '',
            height: '',
            unit: 'cm'
          },
          isFeatured: Boolean(product.isFeatured),
          allowOnlinePayment: product.allowOnlinePayment !== false,
          allowCardPayment: product.allowCardPayment !== false,
          allowCashOnDelivery: product.allowCashOnDelivery !== false
        };
        
        setEditingProduct(initialProduct);
        
      } else {
        // ✅ CREANDO NUEVO PRODUCTO
        const newProduct = {
          name: '',
          description: '',
          price: '',
          originalPrice: '',
          sku: '',
          stockQuantity: '0',
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
        
        setEditingProduct(newProduct);
      }
      
      // ✅ LIMPIAR ESTADOS DE IMAGEN
      setProductImage(null);
      setImagePreview(null);
      setUploadingImage(false);
      
      // ✅ LIMPIAR FILTROS
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
  
  // ✅ MÉTODOS PARA MANEJO DE IMAGEN (SIN CAMBIOS)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };
  
  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showError('El archivo es muy grande. Máximo 10MB');
      return;
    }
    
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
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };
  
  // ✅ FILTRADO DE CATEGORÍAS Y MARCAS
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  
  // ✅ OBTENER NOMBRES SELECCIONADOS
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
  
  // ✅ HANDLERS PARA SELECCIÓN
  const handleCategorySelect = (category) => {
    console.log('📂 Categoría seleccionada:', category);
    setEditingProduct(prev => ({ ...prev, categoryId: category.id }));
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };
  
  const handleBrandSelect = (brand) => {
    console.log('🏷️ Marca seleccionada:', brand);
    setEditingProduct(prev => ({ ...prev, brandId: brand.id }));
    setBrandSearch('');
    setShowBrandDropdown(false);
  };
  
  // ✅ HANDLERS PARA CATEGORÍAS Y MARCAS CON RECARGA
  const handleCreateCategory = () => setShowCategoryModal(true);
  const handleCreateBrand = () => setShowBrandModal(true);
  
  const handleCategorySaved = async (savedCategory) => {
    setEditingProduct(prev => ({ ...prev, categoryId: savedCategory.id }));
    // ✅ RECARGAR CATEGORÍAS DESPUÉS DE CREAR UNA NUEVA
    await loadCategories();
    if (onCategoriesUpdate) onCategoriesUpdate();
    showSuccess('Categoría creada y seleccionada');
  };
  
  const handleBrandSaved = async (savedBrand) => {
    setEditingProduct(prev => ({ ...prev, brandId: savedBrand.id }));
    // ✅ RECARGAR MARCAS DESPUÉS DE CREAR UNA NUEVA
    await loadBrands();
    if (onBrandsUpdate) onBrandsUpdate();
    showSuccess('Marca creada y seleccionada');
  };
  
  // ✅ MÉTODO PRINCIPAL DE GUARDADO (SIN CAMBIOS)
  const handleSave = async () => {
    if (!editingProduct) {
      console.error('❌ No hay producto para guardar');
      return;
    }
    
    console.log('🔍 ProductFormModal: Iniciando guardado');
    console.log('📦 Estado del producto:', editingProduct);
    console.log('🖼️ Imagen seleccionada:', productImage?.name);
    console.log('🏗️ Es creación:', isCreating);
    
    // ✅ VALIDACIONES ANTES DE PROCESAR
    if (!editingProduct.name?.trim()) {
      showError('El nombre del producto es obligatorio');
      return;
    }
    
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) {
      showError('El precio de venta es obligatorio y debe ser mayor a 0');
      return;
    }
    
    if (!editingProduct.categoryId) {
      showError('Debe seleccionar una categoría');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // ✅ BUSCAR CATEGORÍA Y MARCA
      const category = categories.find(c => c.id == editingProduct.categoryId);
      const brand = brands.find(b => b.id == editingProduct.brandId);
      
      if (!category) {
        showError('Categoría no encontrada');
        return;
      }
      
      // ✅ FORMATEAR DATOS
      const productPayload = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price),
        originalPrice: editingProduct.originalPrice ? parseFloat(editingProduct.originalPrice) : null,
        sku: editingProduct.sku,
        stockQuantity: parseInt(editingProduct.stockQuantity) || 0,
        minStock: parseInt(editingProduct.minStock) || 5,
        weight: editingProduct.weight ? parseFloat(editingProduct.weight) : null,
        dimensions: editingProduct.dimensions,
        categoryId: category.id,
        brandId: brand ? brand.id : null,
        isFeatured: editingProduct.isFeatured,
        allowOnlinePayment: editingProduct.allowOnlinePayment,
        allowCardPayment: editingProduct.allowCardPayment,
        allowCashOnDelivery: editingProduct.allowCashOnDelivery,
        deliveryTime: editingProduct.deliveryTime
      };
      
      console.log('📋 ProductFormModal: Datos formateados:', productPayload);
      
      let response;
      
      if (isCreating) {
        if (productImage) {
          console.log('📤 Creando producto con imagen...');
          setUploadingImage(true);
          
          const formData = new FormData();
          
          Object.keys(productPayload).forEach(key => {
            const value = productPayload[key];
            if (value !== null && value !== undefined) {
              if (key === 'dimensions' && typeof value === 'object') {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, value.toString());
              }
            }
          });
          
          formData.append('image', productImage);
          formData.append('isPrimary', 'true');
          formData.append('altText', `${productPayload.name} - Imagen principal`);
          formData.append('displayOrder', '1');
          
          response = await inventoryService.createProductWithImage(formData);
          
        } else {
          console.log('📤 Creando producto sin imagen...');
          response = await inventoryService.createProduct(productPayload);
        }
        
      } else {
        console.log('📤 Actualizando producto...');
        response = await inventoryService.updateProduct(editingProduct.id, productPayload);
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar producto';
      showError(`Error al guardar producto: ${errorMessage}`);
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
                {isCreating ? 'Agrega un nuevo producto - Carga independiente de categorías' : 'Modifica los datos del producto'}
              </p>
              {/* ✅ MOSTRAR DEBUG INFO */}
              <div className="text-xs text-gray-500 mt-2 flex gap-4">
                <span>📂 Categorías: {categories.length}</span>
                <span>🏷️ Marcas: {brands.length}</span>
                {loadingCategories && <span className="text-blue-600">Cargando categorías...</span>}
                {loadingBrands && <span className="text-blue-600">Cargando marcas...</span>}
              </div>
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
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
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
                  
                  {/* ✅ CATEGORÍA CON MEJOR MANEJO DE ERRORES */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Categoría * 
                        {loadingCategories && (
                          <span className="text-xs text-blue-600 ml-2">(Cargando...)</span>
                        )}
                        {categoriesError && (
                          <span className="text-xs text-red-600 ml-2">(Error: {categoriesError})</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={loadCategories}
                          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                          disabled={loadingCategories}
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingCategories ? 'animate-spin' : ''}`} />
                          Recargar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Nueva Categoría
                        </button>
                      </div>
                    </div>
                    
                    {categoriesError ? (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700">Error al cargar categorías</span>
                        <button
                          onClick={loadCategories}
                          className="ml-auto text-red-600 hover:text-red-800"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
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
                            placeholder={loadingCategories ? "Cargando categorías..." : "Buscar categoría..."}
                            required
                            disabled={loadingCategories}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                            disabled={loadingCategories}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {showCategoryDropdown && !loadingCategories && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredCategories.length === 0 ? (
                              <div className="p-3 text-gray-500 text-sm">
                                {categories.length === 0 ? 'No hay categorías disponibles' : 'No se encontraron categorías'}
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
                    )}
                  </div>
                  
                  {/* ✅ MARCA CON MEJOR MANEJO DE ERRORES */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Marca
                        {loadingBrands && (
                          <span className="text-xs text-blue-600 ml-2">(Cargando...)</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={loadBrands}
                          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                          disabled={loadingBrands}
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingBrands ? 'animate-spin' : ''}`} />
                          Recargar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateBrand}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Nueva Marca
                        </button>
                      </div>
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
                          placeholder={loadingBrands ? "Cargando marcas..." : "Buscar marca..."}
                          disabled={loadingBrands}
                        />
                        <button
                          type="button"
                          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                          disabled={loadingBrands}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {showBrandDropdown && !loadingBrands && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredBrands.length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm">
                              {brands.length === 0 ? 'No hay marcas disponibles' : 'No se encontraron marcas'}
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
              
              {/* ✅ IMAGEN DEL PRODUCTO (SOLO PARA CREAR) */}
              {isCreating && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    Imagen del Producto
                  </h4>
                  
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
                          PNG, JPG, WebP hasta 10MB
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
            
            {/* COLUMNA 2: EL RESTO DEL FORMULARIO SE MANTIENE IGUAL */}
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
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))}
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
              
              {/* Dimensiones */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Dimensiones</h4>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Largo</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingProduct.dimensions.length}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, length: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ancho</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingProduct.dimensions.width}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, width: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Alto</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingProduct.dimensions.height}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, height: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <select
                  value={editingProduct.dimensions.unit}
                  onChange={(e) => setEditingProduct(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, unit: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="cm">Centímetros (cm)</option>
                  <option value="m">Metros (m)</option>
                  <option value="mm">Milímetros (mm)</option>
                </select>
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
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
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