// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ProductsManager.js
// FUNCIÓN: Gestión completa de productos conectado al backend real con sub-componentes modulares

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, ShoppingBag, Package, 
  Star, Check, AlertTriangle, Eye, EyeOff, Image,
  DollarSign, Hash, Tag, Loader, Box, Search,
  Filter, Grid, List, Download, Upload, Copy,
  Camera, Trash, RotateCcw, Check as CheckIcon
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

// ✅ IMPORTAR EL SUB-COMPONENTE
import ProductFormModal from './ProductFormModal';

const ProductsManager = ({ onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para modal de producto - SIMPLIFICADOS
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para filtros y vista
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Estados para imágenes
  const [uploadingImages, setUploadingImages] = useState({});
  const [productImages, setProductImages] = useState({});
  
  // Filtros de stock
  const stockFilters = [
    { id: 'all', label: 'Todo el stock' },
    { id: 'in-stock', label: 'En stock' },
    { id: 'low-stock', label: 'Stock bajo' },
    { id: 'out-of-stock', label: 'Sin stock' }
  ];
  
  // CARGAR DATOS INICIALES
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [hasChanges, onUnsavedChanges]);
  
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      console.log('ProductsManager: Loading all data...');
      
      // Cargar datos en paralelo
      const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        inventoryService.getProducts({ limit: 100 }),
        inventoryService.getCategories(),
        inventoryService.getBrands()
      ]);
      
      // Procesar productos
      if (productsResponse.success && productsResponse.data) {
        const productsList = productsResponse.data.products || [];
        setProducts(productsList);
        console.log(`✅ Loaded ${productsList.length} products`);
        
        // Cargar imágenes para cada producto
        loadProductImages(productsList);
      }
      
      // Procesar categorías
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesList = categoriesResponse.data.categories || [];
        setCategories(categoriesList);
        console.log(`✅ Loaded ${categoriesList.length} categories`);
      }
      
      // Procesar marcas
      if (brandsResponse.success && brandsResponse.data) {
        const brandsList = brandsResponse.data.brands || [];
        setBrands(brandsList);
        console.log(`✅ Loaded ${brandsList.length} brands`);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadProductImages = async (productsList) => {
    const imagesMap = {};
    
    for (const product of productsList.slice(0, 10)) { // Limitar a 10 para evitar muchas requests
      try {
        const imagesResponse = await inventoryService.getProductImages(product.id);
        if (imagesResponse.success && imagesResponse.data) {
          imagesMap[product.id] = imagesResponse.data.images || [];
        }
      } catch (error) {
        console.warn(`⚠️ Could not load images for product ${product.id}`);
        imagesMap[product.id] = [];
      }
    }
    
    setProductImages(imagesMap);
  };
  
  // ✅ RECARGAR SOLO CATEGORÍAS (para cuando se crea una nueva desde el modal)
  const loadCategories = async () => {
    try {
      const categoriesResponse = await inventoryService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesList = categoriesResponse.data.categories || [];
        setCategories(categoriesList);
        console.log(`✅ Reloaded ${categoriesList.length} categories`);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    }
  };
  
  // ✅ RECARGAR SOLO MARCAS (para cuando se crea una nueva desde el modal)
  const loadBrands = async () => {
    try {
      const brandsResponse = await inventoryService.getBrands();
      if (brandsResponse.success && brandsResponse.data) {
        const brandsList = brandsResponse.data.brands || [];
        setBrands(brandsList);
        console.log(`✅ Reloaded ${brandsList.length} brands`);
      }
    } catch (error) {
      console.error('❌ Error loading brands:', error);
    }
  };
  
  // FILTRAR PRODUCTOS
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.brand?.name && product.brand.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.categoryId == selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'in-stock') matchesStock = (product.stockQuantity || 0) > (product.minStock || 5);
    if (stockFilter === 'low-stock') matchesStock = (product.stockQuantity || 0) <= (product.minStock || 5) && (product.stockQuantity || 0) > 0;
    if (stockFilter === 'out-of-stock') matchesStock = (product.stockQuantity || 0) === 0;
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  // OBTENER ESTADO DEL STOCK
  const getStockStatus = (product) => {
    const stock = product.stockQuantity || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) return { 
      status: 'out', 
      label: 'Sin stock', 
      color: 'bg-red-50 text-red-700 border-red-200' 
    };
    if (stock <= minStock) return { 
      status: 'low', 
      label: 'Stock bajo', 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200' 
    };
    return { 
      status: 'good', 
      label: 'En stock', 
      color: 'bg-green-50 text-green-700 border-green-200' 
    };
  };
  
  // ✅ MÉTODOS SIMPLIFICADOS PARA EL MODAL
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsCreating(true);
    setShowProductModal(true);
  };
  
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsCreating(false);
    setShowProductModal(true);
  };
  
  const handleProductSaved = async (savedProduct) => {
    console.log('✅ Product saved:', savedProduct);
    await loadAllData(); // Recargar todos los datos
    if (onSave) {
      onSave(savedProduct);
    }
  };
  
  // ELIMINAR PRODUCTO
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      return;
    }
    
    try {
      const response = await inventoryService.deleteProduct(product.id);
      
      if (response.success) {
        await loadAllData(); // Recargar datos
        showSuccess('Producto eliminado exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      // El error ya se muestra en el servicio
    }
  };
  
  // TOGGLE PRODUCTO DESTACADO
  const handleToggleFeatured = async (product) => {
    try {
      const updatedData = { isFeatured: !product.isFeatured };
      const response = await inventoryService.updateProduct(product.id, updatedData);
      
      if (response.success) {
        // Actualizar producto local
        setProducts(products.map(p => 
          p.id === product.id 
            ? { ...p, isFeatured: !p.isFeatured }
            : p
        ));
        showSuccess(`Producto ${!product.isFeatured ? 'marcado como destacado' : 'quitado de destacados'}`);
      }
      
    } catch (error) {
      console.error('❌ Error toggling featured:', error);
    }
  };
  
  // SUBIR IMAGEN
  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    
    try {
      setUploadingImages(prev => ({ ...prev, [productId]: true }));
      
      const response = await inventoryService.uploadProductImage(productId, file, {
        isPrimary: !productImages[productId] || productImages[productId].length === 0,
        altText: `${products.find(p => p.id === productId)?.name} - Imagen principal`
      });
      
      if (response.success) {
        // Actualizar imágenes locales
        setProductImages(prev => ({
          ...prev,
          [productId]: [...(prev[productId] || []), response.data.image]
        }));
        showSuccess('Imagen subida exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
    } finally {
      setUploadingImages(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  // CALCULAR MÉTRICAS
  const metrics = {
    totalProducts: filteredProducts.length,
    totalValue: filteredProducts.reduce((sum, product) => 
      sum + ((product.price || 0) * (product.stockQuantity || 0)), 0
    ),
    lowStockCount: filteredProducts.filter(p => 
      (p.stockQuantity || 0) <= (p.minStock || 5) && (p.stockQuantity || 0) > 0
    ).length,
    outOfStockCount: filteredProducts.filter(p => (p.stockQuantity || 0) === 0).length
  };

  // MOSTRAR LOADING
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos del inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER CON MÉTRICAS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Productos</h2>
          <p className="text-gray-600">Control completo del inventario</p>
          
          {/* Métricas */}
          <div className="mt-3 flex flex-wrap gap-4">
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {metrics.totalProducts} productos
            </span>
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Valor: {formatCurrency(metrics.totalValue)}
            </span>
            {metrics.lowStockCount > 0 && (
              <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                {metrics.lowStockCount} con stock bajo
              </span>
            )}
            {metrics.outOfStockCount > 0 && (
              <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                {metrics.outOfStockCount} sin stock
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAllData()}
            className="btn-secondary btn-sm"
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          
          <button
            onClick={handleCreateProduct}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos, SKU, marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          {/* Filtro de categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          {/* Filtro de stock */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {stockFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          {/* Controles de vista */}
          <div className="flex items-center justify-end gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* LISTA DE PRODUCTOS */}
      <div className="bg-white rounded-lg shadow-sm">
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
                ? 'No se encontraron productos'
                : 'No hay productos en el inventario'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Comienza agregando tu primer producto al inventario'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && stockFilter === 'all' && (
              <button
                onClick={handleCreateProduct}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header de resultados */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredProducts.length} de {products.length} productos
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Valor total: {formatCurrency(metrics.totalValue)}</span>
                </div>
              </div>
            </div>
            
            {/* Vista Grid */}
            {viewMode === 'grid' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const images = productImages[product.id] || [];
                    const primaryImage = images.find(img => img.isPrimary) || images[0];
                    
                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                        
                        {/* Header del producto */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate" title={product.name}>
                                {product.name}
                              </h3>
                              {product.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {product.brand?.name && (
                                <span>{product.brand.name}</span>
                              )}
                              {product.sku && (
                                <>
                                  {product.brand?.name && <span>•</span>}
                                  <span>{product.sku}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleToggleFeatured(product)}
                              className={`p-1 transition-colors ${
                                product.isFeatured 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={product.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                            >
                              <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Imagen */}
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group">
                          {primaryImage ? (
                            <img 
                              src={primaryImage.imageUrl} 
                              alt={primaryImage.altText || product.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Placeholder si no hay imagen */}
                          <div className={`w-full h-full flex flex-col items-center justify-center ${primaryImage ? 'hidden' : ''}`}>
                            <Image className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Sin imagen</span>
                          </div>
                          
                          {/* Overlay para subir imagen */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(product.id, file);
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2 text-white bg-black bg-opacity-50 px-3 py-2 rounded">
                                {uploadingImages[product.id] ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Camera className="w-4 h-4" />
                                )}
                                <span className="text-sm">
                                  {uploadingImages[product.id] ? 'Subiendo...' : 'Cambiar'}
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Información del producto */}
                        <div className="space-y-2">
                          {/* Precios */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(product.price || 0)}
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="text-xs text-green-600">
                                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% descuento
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Stock */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stockQuantity || 0}</span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Categoría */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Categoría:</span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {product.category?.name || 'Sin categoría'}
                            </span>
                          </div>
                          
                          {/* Descripción corta */}
                          {product.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mt-2" title={product.description}>
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Vista Lista */}
            {viewMode === 'list' && (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  
                  return (
                    <div key={product.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                              {product.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              {product.brand?.name && (
                                <span>{product.brand.name}</span>
                              )}
                              {product.sku && (
                                <span>SKU: {product.sku}</span>
                              )}
                              <span>Stock: {product.stockQuantity || 0}</span>
                              <span className={`px-2 py-1 rounded-full text-xs border ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(product.price || 0)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category?.name}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleFeatured(product)}
                              className={`p-2 transition-colors ${
                                product.isFeatured 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                              title={product.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                            >
                              <Star className={`w-5 h-5 ${product.isFeatured ? 'fill-current' : ''}`} />
                            </button>
                            
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* ✅ MODAL USANDO SUB-COMPONENTE */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
        onSave={handleProductSaved}
        isCreating={isCreating}
        categories={categories}
        brands={brands}
        onCategoriesUpdate={loadCategories}
        onBrandsUpdate={loadBrands}
      />
      
    </div>
  );
};

export default ProductsManager;
/**
 * COMENTARIOS FINALES DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Este componente está preparado para la gestión completa de productos de la tienda del gimnasio.
 * Actualmente muestra productos existentes desde el backend y está estructurado para implementar
 * la funcionalidad completa de CRUD (crear, leer, actualizar, eliminar) próximamente.
 * 
 * FUNCIONALIDADES ACTUALES:
 * - Visualización de productos cargados desde el backend
 * - Marcado/desmarcado de productos como "destacados"
 * - Control de disponibilidad (en stock/agotado)
 * - Cálculo automático de descuentos basado en precio original vs actual
 * - Categorización de productos (suplementos, ropa, accesorios, equipamiento)
 * - Vista responsiva en tarjetas para escritorio y móvil
 * - Soporte para múltiples imágenes por producto
 * - Sistema de etiquetas (tags) y códigos SKU
 * - Precios mostrados en quetzales guatemaltecos
 * 
 * FUNCIONALIDADES EN DESARROLLO:
 * - Edición completa de productos (nombre, descripción, precio, categoría)
 * - Subida y gestión de imágenes de productos
 * - Gestión completa de inventario y stock
 * - Sistema de variantes de productos (tallas, colores)
 * - Integración con sistema de pagos
 * - Reportes de ventas y productos más vendidos
 * 
 * CONEXIONES CON OTROS ARCHIVOS:
 * - AppContext: Para mostrar notificaciones y formatear precios en quetzales
 * - Lucide React: Para iconografía completa del sistema
 * - Backend API: Para cargar productos existentes (pendiente implementar CRUD completo)
 * - Landing Page: Los productos se muestran en la sección tienda de la página web
 * 
 * DATOS QUE MUESTRA AL USUARIO:
 * - Lista visual de todos los productos de la tienda
 * - Nombres, descripciones y categorías de productos
 * - Precios en quetzales guatemaltecos con sistema de descuentos
 * - Imágenes principales de cada producto
 * - Estados de disponibilidad (disponible/agotado)
 * - Productos destacados con indicador visual especial
 * - Códigos SKU para identificación única
 * - Etiquetas descriptivas para cada producto
 * - Badges informativos (destacado, agotado, categoría)
 * 
 * ESTRUCTURA DE DATOS:
 * - ID único del producto
 * - Nombre y descripción
 * - Precio actual y precio original (para descuentos)
 * - Categoría (suplementos, ropa, accesorios, equipamiento)
 * - Array de imágenes con URLs
 * - Estado de stock (disponible/agotado)
 * - Flag de producto destacado
 * - Código SKU único
 * - Array de etiquetas descriptivas
 * 
 * PREPARACIÓN FUTURA:
 * El componente está estructurado para expandirse fácilmente con:
 * - Sistema completo de gestión de inventario
 * - Integración con pasarela de pagos
 * - Carritos de compra y órdenes
 * - Sistema de reviews y calificaciones
 * - Gestión de promociones y descuentos temporales
 * - Analytics de productos más vistos y vendidos
 */