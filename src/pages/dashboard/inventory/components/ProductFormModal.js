// Autor: Alexander Echeverria
// ProductFormModal.js - VERSIÓN COMPLETA CORREGIDA
// ✅ Filtros funcionando + SKU auto-sugerido + Imagen en columna 2

import React, { useState, useEffect } from 'react';
import {
  Package, Save, X, Loader, Plus, CloudUpload, 
  Trash, ChevronDown, RefreshCw, AlertTriangle, Sparkles
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import CategoryFormModal from './CategoryFormModal';
import BrandFormModal from './BrandFormModal';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  onSave,
  isCreating = false,
  categories: propCategories = [],
  brands: propBrands = [],
  onCategoriesUpdate,
  onBrandsUpdate
}) => {
  const { showSuccess, showError } = useApp();
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [categories, setCategories] = useState(propCategories);
  const [brands, setBrands] = useState(propBrands);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [brandsError, setBrandsError] = useState(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // ✅ ARREGLAR: Estados separados para búsqueda
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [brandSearchInput, setBrandSearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  
  const emptyProduct = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    sku: '',
    stockQuantity: '0',
    minStock: '5',
    weight: '',
    dimensions: { length: '', width: '', height: '', unit: 'cm' },
    categoryId: '',
    brandId: '',
    isFeatured: false,
    allowOnlinePayment: true,
    allowCardPayment: true,
    allowCashOnDelivery: true,
    deliveryTime: '1-3 días hábiles'
  };
  
  // ✅ NUEVA: Generar SKU sugerido automáticamente
  const generateSuggestedSKU = () => {
    if (!editingProduct) return '';
    
    const parts = [];
    
    // Parte 1: Nombre del producto (primeras 4 letras)
    if (editingProduct.name) {
      const nameCode = editingProduct.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4)
        .padEnd(4, 'X');
      parts.push(nameCode);
    }
    
    // Parte 2: Categoría (primeras 3 letras)
    if (editingProduct.categoryId) {
      const category = categories.find(c => c.id == editingProduct.categoryId);
      if (category) {
        const catCode = category.name
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .substring(0, 3)
          .padEnd(3, 'X');
        parts.push(catCode);
      }
    }
    
    // Parte 3: Marca (primeras 3 letras)
    if (editingProduct.brandId) {
      const brand = brands.find(b => b.id == editingProduct.brandId);
      if (brand) {
        const brandCode = brand.name
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .substring(0, 3)
          .padEnd(3, 'X');
        parts.push(brandCode);
      }
    }
    
    // Parte 4: Número aleatorio (4 dígitos)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    parts.push(randomNum.toString());
    
    return parts.join('-');
  };
  
  const applySuggestedSKU = () => {
    const suggested = generateSuggestedSKU();
    if (suggested) {
      setEditingProduct(prev => ({ ...prev, sku: suggested }));
      showSuccess('SKU sugerido aplicado');
    }
  };
  
  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    
    try {
      const response = await inventoryService.getCategories({ limit: 100 });
      
      if (response.success && response.data) {
        let categoriesList = [];
        
        if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesList = response.data.categories;
        } else if (Array.isArray(response.data)) {
          categoriesList = response.data;
        }
        
        setCategories(categoriesList);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setCategoriesError(error.message);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };
  
  const loadBrands = async () => {
    setLoadingBrands(true);
    setBrandsError(null);
    
    try {
      const response = await inventoryService.getBrands({ limit: 100 });
      
      if (response.success && response.data) {
        let brandsList = [];
        
        if (response.data.brands && Array.isArray(response.data.brands)) {
          brandsList = response.data.brands;
        } else if (Array.isArray(response.data)) {
          brandsList = response.data;
        }
        
        setBrands(brandsList);
      }
    } catch (error) {
      console.error('Error cargando marcas:', error);
      setBrandsError(error.message);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      if (propCategories.length === 0) {
        loadCategories();
      } else {
        setCategories(propCategories);
      }
      
      if (propBrands.length === 0) {
        loadBrands();
      } else {
        setBrands(propBrands);
      }
    }
  }, [isOpen, propCategories.length, propBrands.length]);
  
  useEffect(() => {
    if (isOpen) {
      if (product && !isCreating) {
        setEditingProduct({
          ...product,
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          sku: product.sku || '',
          stockQuantity: product.stockQuantity?.toString() || '0',
          minStock: product.minStock?.toString() || '5',
          weight: product.weight?.toString() || '',
          deliveryTime: product.deliveryTime || '1-3 días hábiles',
          categoryId: product.categoryId?.toString() || '',
          brandId: product.brandId?.toString() || '',
          dimensions: product.dimensions || emptyProduct.dimensions,
          isFeatured: Boolean(product.isFeatured),
          allowOnlinePayment: product.allowOnlinePayment !== false,
          allowCardPayment: product.allowCardPayment !== false,
          allowCashOnDelivery: product.allowCashOnDelivery !== false
        });
      } else {
        setEditingProduct({ ...emptyProduct });
      }
      
      setProductImage(null);
      setImagePreview(null);
      setUploadingImage(false);
      setCategorySearchInput('');
      setBrandSearchInput('');
      setShowCategoryDropdown(false);
      setShowBrandDropdown(false);
    }
  }, [isOpen, product, isCreating]);
  
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
  
  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showError('Selecciona un archivo de imagen válido');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showError('Archivo muy grande. Máximo 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setProductImage(file);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handleImageFile(files[0]);
  };
  
  const clearImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };
  
  // ✅ ARREGLAR: Filtrado correcto
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearchInput.toLowerCase())
  );
  
  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearchInput.toLowerCase())
  );
  
  // ✅ ARREGLAR: Obtener nombre seleccionado
  const getSelectedCategoryName = () => {
    const selected = categories.find(c => c.id == editingProduct?.categoryId);
    return selected?.name || '';
  };
  
  const getSelectedBrandName = () => {
    const selected = brands.find(b => b.id == editingProduct?.brandId);
    return selected?.name || '';
  };
  
  const handleCategorySelect = (category) => {
    setEditingProduct(prev => ({ ...prev, categoryId: category.id }));
    setCategorySearchInput('');
    setShowCategoryDropdown(false);
  };
  
  const handleBrandSelect = (brand) => {
    setEditingProduct(prev => ({ ...prev, brandId: brand.id }));
    setBrandSearchInput('');
    setShowBrandDropdown(false);
  };
  
  const handleCategorySaved = async (savedCategory) => {
    setEditingProduct(prev => ({ ...prev, categoryId: savedCategory.id }));
    await loadCategories();
    if (onCategoriesUpdate) onCategoriesUpdate();
    showSuccess('Categoría creada y seleccionada');
  };
  
  const handleBrandSaved = async (savedBrand) => {
    setEditingProduct(prev => ({ ...prev, brandId: savedBrand.id }));
    await loadBrands();
    if (onBrandsUpdate) onBrandsUpdate();
    showSuccess('Marca creada y seleccionada');
  };
  
  const handleSave = async () => {
    if (!editingProduct) return;
    
    if (!editingProduct.name?.trim()) {
      showError('El nombre del producto es obligatorio');
      return;
    }
    
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) {
      showError('El precio debe ser mayor a 0');
      return;
    }
    
    if (!editingProduct.categoryId) {
      showError('Debe seleccionar una categoría');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const category = categories.find(c => c.id == editingProduct.categoryId);
      const brand = brands.find(b => b.id == editingProduct.brandId);
      
      if (!category) {
        showError('Categoría no encontrada');
        return;
      }
      
      const productPayload = {
        name: editingProduct.name.trim(),
        description: editingProduct.description?.trim() || '',
        price: parseFloat(editingProduct.price),
        originalPrice: editingProduct.originalPrice ? parseFloat(editingProduct.originalPrice) : null,
        sku: editingProduct.sku?.trim() || '',
        stockQuantity: parseInt(editingProduct.stockQuantity) || 0,
        minStock: parseInt(editingProduct.minStock) || 5,
        weight: editingProduct.weight ? parseFloat(editingProduct.weight) : null,
        dimensions: editingProduct.dimensions,
        categoryId: parseInt(category.id),
        brandId: brand ? parseInt(brand.id) : null,
        isFeatured: Boolean(editingProduct.isFeatured),
        allowOnlinePayment: Boolean(editingProduct.allowOnlinePayment),
        allowCardPayment: Boolean(editingProduct.allowCardPayment),
        allowCashOnDelivery: Boolean(editingProduct.allowCashOnDelivery),
        deliveryTime: editingProduct.deliveryTime || '1-3 días hábiles'
      };
      
      let response;
      let createdProductId;
      
      if (isCreating) {
        response = await inventoryService.createProduct(productPayload);
        
        if (!response.success) {
          throw new Error('Error al crear producto');
        }
        
        createdProductId = response.data?.product?.id;
        
        if (productImage && createdProductId) {
          try {
            setUploadingImage(true);
            
            const imageResponse = await inventoryService.uploadProductImage(
              createdProductId,
              productImage,
              {
                isPrimary: true,
                altText: `${productPayload.name} - Imagen principal`
              }
            );
            
            if (imageResponse.success) {
              showSuccess('Producto creado con imagen subida a Cloudinary');
            } else {
              showSuccess('Producto creado (imagen no se pudo subir)');
            }
          } catch (imageError) {
            console.error('Error subiendo imagen:', imageError);
            showSuccess('Producto creado pero imagen no se pudo subir');
          } finally {
            setUploadingImage(false);
          }
        } else {
          showSuccess('Producto creado exitosamente');
        }
        
      } else {
        response = await inventoryService.updateProduct(editingProduct.id, productPayload);
        
        if (response.success) {
          showSuccess('Producto actualizado exitosamente');
        }
      }
      
      if (onSave) {
        onSave(response.data);
      }
      onClose();
      
    } catch (error) {
      console.error('Error guardando producto:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar producto';
      showError(errorMessage);
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
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <p className="text-gray-600 mt-1">
                {isCreating ? 'Completa los datos y opcionalmente agrega una imagen' : 'Modifica los datos del producto'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              disabled={isSaving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-6">
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h4>
                
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Proteína Whey Premium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Descripción detallada..."
                    />
                  </div>
                  
                  {/* ✅ ARREGLAR: Categoría con input controlado correcto */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Categoría *</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={loadCategories}
                          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg"
                          disabled={loadingCategories}
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingCategories ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg"
                        >
                          <Plus className="w-3 h-3" />
                          Nueva
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative category-dropdown-container">
                      <div className="flex">
                        <input
                          type="text"
                          value={showCategoryDropdown ? categorySearchInput : getSelectedCategoryName()}
                          onChange={(e) => {
                            setCategorySearchInput(e.target.value);
                            setShowCategoryDropdown(true);
                          }}
                          onFocus={() => {
                            setShowCategoryDropdown(true);
                            setCategorySearchInput('');
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Buscar o escribir categoría..."
                          disabled={loadingCategories}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                          disabled={loadingCategories}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {showCategoryDropdown && !loadingCategories && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCategories.length === 0 ? (
                            <div className="p-3">
                              <p className="text-gray-500 text-sm mb-2">No se encontraron categorías</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCategoryModal(true);
                                  setShowCategoryDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Crear categoría "{categorySearchInput}"
                              </button>
                            </div>
                          ) : (
                            filteredCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => handleCategorySelect(category)}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
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
                  
                  {/* ✅ ARREGLAR: Marca con input controlado correcto */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Marca</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={loadBrands}
                          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg"
                          disabled={loadingBrands}
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingBrands ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBrandModal(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg"
                        >
                          <Plus className="w-3 h-3" />
                          Nueva
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative brand-dropdown-container">
                      <div className="flex">
                        <input
                          type="text"
                          value={showBrandDropdown ? brandSearchInput : getSelectedBrandName()}
                          onChange={(e) => {
                            setBrandSearchInput(e.target.value);
                            setShowBrandDropdown(true);
                          }}
                          onFocus={() => {
                            setShowBrandDropdown(true);
                            setBrandSearchInput('');
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Buscar o escribir marca..."
                          disabled={loadingBrands}
                        />
                        <button
                          type="button"
                          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                          disabled={loadingBrands}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {showBrandDropdown && !loadingBrands && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredBrands.length === 0 ? (
                            <div className="p-3">
                              <p className="text-gray-500 text-sm mb-2">No se encontraron marcas</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBrandModal(true);
                                  setShowBrandDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Crear marca "{brandSearchInput}"
                              </button>
                            </div>
                          ) : (
                            filteredBrands.map(brand => (
                              <button
                                key={brand.id}
                                type="button"
                                onClick={() => handleBrandSelect(brand)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{brand.name}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ NUEVO: SKU con generación automática */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">SKU</label>
                      {isCreating && editingProduct.name && editingProduct.categoryId && (
                        <button
                          type="button"
                          onClick={applySuggestedSKU}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generar SKU
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Código único del producto"
                    />
                    {isCreating && editingProduct.name && editingProduct.categoryId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sugerido: {generateSuggestedSKU()}
                      </p>
                    )}
                  </div>
                  
                </div>
              </div>
              
              {/* Precios */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Precios</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio (Q) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio original (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.originalPrice}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* COLUMNA DERECHA */}
            <div className="space-y-6">
              
              {/* ✅ NUEVO: Imagen en columna 2 (solo al crear) */}
              {isCreating && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Producto</h4>
                  
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
                    }`}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('image-input')?.click()}
                  >
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file);
                      }}
                    />
                    
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded" />
                        <p className="text-sm text-gray-600">{productImage?.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImage();
                          }}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          <Trash className="w-4 h-4 inline mr-1" />
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <CloudUpload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                        <p className="text-gray-900 font-medium mb-1">
                          {isDragging ? 'Suelta aquí' : 'Arrastra o haz clic'}
                        </p>
                        <p className="text-sm text-gray-500">PNG, JPG hasta 10MB</p>
                      </div>
                    )}
                  </div>
                  
                  {uploadingImage && (
                    <div className="mt-3 text-center">
                      <div className="inline-flex items-center text-green-600">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Subiendo a Cloudinary...
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Inventario */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      value={editingProduct.stockQuantity}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock mínimo</label>
                    <input
                      type="number"
                      value={editingProduct.minStock}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, minStock: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.weight}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo entrega</label>
                    <input
                      type="text"
                      value={editingProduct.deliveryTime}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      value={editingProduct.dimensions.length}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, length: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ancho</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.dimensions.width}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, width: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Alto</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.dimensions.height}
                      onChange={(e) => setEditingProduct(prev => ({ 
                        ...prev, 
                        dimensions: { ...prev.dimensions, height: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={editingProduct.dimensions.unit}
                  onChange={(e) => setEditingProduct(prev => ({ 
                    ...prev, 
                    dimensions: { ...prev.dimensions, unit: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cm">Centímetros</option>
                  <option value="m">Metros</option>
                  <option value="mm">Milímetros</option>
                </select>
              </div>
              
              {/* Opciones */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Opciones</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Producto destacado</span>
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.allowOnlinePayment}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, allowOnlinePayment: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pago online</span>
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.allowCardPayment}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCardPayment: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pago con tarjeta</span>
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.allowCashOnDelivery}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, allowCashOnDelivery: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pago contra entrega</span>
                  </label>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* BOTONES */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
              disabled={isSaving || !editingProduct.name || !editingProduct.price || !editingProduct.categoryId}
            >
              {isSaving || uploadingImage ? (
                <div className="flex items-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  {isCreating ? 'Crear Producto' : 'Guardar'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
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