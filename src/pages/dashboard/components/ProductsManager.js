// src/pages/dashboard/components/ProductsManager.js
// FUNCIÓN: Gestión completa de productos de la tienda
// INCLUYE: Crear, editar, eliminar, gestionar stock, ventas físicas

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ShoppingBag, Package, 
  DollarSign, Star, AlertTriangle, Upload, Image as ImageIcon,
  Tag, Barcode, Percent, TrendingUp, TrendingDown, Eye, EyeOff,
  Minus, Check, Search, Filter, Grid, List, ShoppingCart,
  Box, AlertCircle, Award, Heart, Zap, Gift, Crown
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploadingImage, setUploadingImage] = useState(null);
  const [showStockManager, setShowStockManager] = useState(false);
  const [stockOperation, setStockOperation] = useState({ productId: null, type: 'add', quantity: 0, reason: '' });
  
  // 🏷️ Categorías de productos
  const productCategories = [
    { id: 'all', name: 'Todas las categorías' },
    { id: 'suplementos', name: 'Suplementos' },
    { id: 'ropa', name: 'Ropa deportiva' },
    { id: 'accesorios', name: 'Accesorios' },
    { id: 'equipamiento', name: 'Equipamiento' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'snacks', name: 'Snacks saludables' }
  ];
  
  // 🏷️ Marcas disponibles
  const availableBrands = [
    'Elite Nutrition',
    'Elite Sports',
    'Elite Gear',
    'Elite Equipment',
    'Otra marca'
  ];
  
  // 📊 Plantilla para nuevo producto
  const emptyProduct = {
    id: null,
    name: '',
    description: '',
    price: 0,
    originalPrice: null,
    cost: 0,
    category: 'suplementos',
    brand: 'Elite Nutrition',
    sku: '',
    stock: 0,
    minStock: 5,
    maxStock: 100,
    images: [],
    featured: false,
    active: true,
    weight: null,
    dimensions: { length: null, width: null, height: null },
    tags: [],
    variants: { flavors: [], sizes: [], colors: [] }
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
  
  // 🔍 Filtrar productos
  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // 💾 Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      console.log('Guardando productos:', localProducts);
      
      // Simular guardado exitoso
      showSuccess('Productos guardados exitosamente');
      setHasChanges(false);
      onSave(localProducts);
      
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
      id: `temp_${Date.now()}`,
      sku: `SKU${Date.now()}`
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
    
    if (!editingProduct.sku.trim()) {
      showError('El SKU es obligatorio');
      return;
    }
    
    // Verificar SKU único
    const existingProduct = localProducts.find(p => 
      p.sku === editingProduct.sku && p.id !== editingProduct.id
    );
    if (existingProduct) {
      showError('El SKU ya existe. Debe ser único para cada producto.');
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
  
  // 👁️ Toggle activar/desactivar
  const handleToggleActive = (productId) => {
    setLocalProducts(localProducts.map(product => 
      product.id === productId 
        ? { ...product, active: !product.active }
        : product
    ));
    setHasChanges(true);
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
  
  // 📦 Gestionar stock
  const handleOpenStockManager = (productId) => {
    setStockOperation({ productId, type: 'subtract', quantity: 1, reason: 'Venta en tienda física' });
    setShowStockManager(true);
  };
  
  const handleStockOperation = () => {
    if (!stockOperation.quantity || stockOperation.quantity <= 0) {
      showError('La cantidad debe ser mayor a 0');
      return;
    }
    
    const product = localProducts.find(p => p.id === stockOperation.productId);
    if (!product) return;
    
    let newStock = product.stock;
    
    if (stockOperation.type === 'add') {
      newStock += stockOperation.quantity;
    } else {
      newStock -= stockOperation.quantity;
      if (newStock < 0) {
        showError('No hay suficiente stock disponible');
        return;
      }
    }
    
    // Actualizar stock
    setLocalProducts(localProducts.map(p => 
      p.id === stockOperation.productId 
        ? { ...p, stock: newStock }
        : p
    ));
    
    setHasChanges(true);
    setShowStockManager(false);
    setStockOperation({ productId: null, type: 'add', quantity: 0, reason: '' });
    
    const action = stockOperation.type === 'add' ? 'agregado' : 'reducido';
    showSuccess(`Stock ${action} correctamente`);
  };
  
  // 📷 Subir imagen para producto
  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    
    try {
      setUploadingImage(productId);
      
      // Simular subida de imagen
      const imageUrl = URL.createObjectURL(file);
      const newImage = {
        id: Date.now(),
        url: imageUrl,
        alt: file.name,
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
  
  // 💰 Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };
  
  // 💰 Calcular margen de ganancia
  const calculateMargin = (price, cost) => {
    if (!cost || cost <= 0) return 0;
    return Math.round(((price - cost) / price) * 100);
  };
  
  // ⚠️ Verificar stock bajo
  const isLowStock = (product) => {
    return product.stock <= product.minStock;
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
      
      {/* 🔝 HEADER CON CONTROLES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Gestión de Productos
          </h3>
          <p className="text-gray-600 mt-1">
            Administra el inventario de tu tienda
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
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
      
      {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos por nombre, marca o SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Filtro por categoría */}
          <div className="lg:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {productCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Vista */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{localProducts.length}</div>
            <div className="text-sm text-gray-600">Total productos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {localProducts.filter(p => p.active).length}
            </div>
            <div className="text-sm text-gray-600">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {localProducts.filter(p => isLowStock(p)).length}
            </div>
            <div className="text-sm text-gray-600">Stock bajo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {localProducts.filter(p => p.featured).length}
            </div>
            <div className="text-sm text-gray-600">Destacados</div>
          </div>
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
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onToggleActive={handleToggleActive}
              onToggleFeatured={handleToggleFeatured}
              onManageStock={handleOpenStockManager}
              calculateDiscount={calculateDiscount}
              calculateMargin={calculateMargin}
              isLowStock={isLowStock}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ProductTable 
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onToggleActive={handleToggleActive}
            onToggleFeatured={handleToggleFeatured}
            onManageStock={handleOpenStockManager}
            calculateDiscount={calculateDiscount}
            calculateMargin={calculateMargin}
            isLowStock={isLowStock}
            formatCurrency={formatCurrency}
          />
        </div>
      )}
      
      {/* Mensaje cuando no hay productos */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-lg">
          {searchQuery || filterCategory !== 'all' ? (
            <>
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta cambiar los filtros de búsqueda
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                }}
                className="btn-secondary"
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay productos configurados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando productos a tu tienda
              </p>
              <button
                onClick={handleCreateProduct}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Producto
              </button>
            </>
          )}
        </div>
      )}
      
      {/* 📝 FORMULARIO DE EDICIÓN */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              productCategories={productCategories}
              availableBrands={availableBrands}
              onSave={handleSaveProduct}
              onCancel={handleCancelEdit}
              onChange={setEditingProduct}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              isCreating={isCreating}
              calculateDiscount={calculateDiscount}
              calculateMargin={calculateMargin}
            />
          </div>
        </div>
      )}
      
      {/* 📦 MODAL DE GESTIÓN DE STOCK */}
      {showStockManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <StockManager
              stockOperation={stockOperation}
              onChange={setStockOperation}
              onSave={handleStockOperation}
              onCancel={() => setShowStockManager(false)}
              product={localProducts.find(p => p.id === stockOperation.productId)}
            />
          </div>
        </div>
      )}
      
    </div>
  );
};

// 🃏 COMPONENTE: Tarjeta de producto
const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onToggleFeatured, 
  onManageStock,
  calculateDiscount, 
  calculateMargin, 
  isLowStock, 
  formatCurrency 
}) => {
  const discount = calculateDiscount(product.price, product.originalPrice);
  const margin = calculateMargin(product.price, product.cost);
  const lowStock = isLowStock(product);
  
  return (
    <div className={`bg-white rounded-lg border overflow-hidden transition-all duration-300 hover:shadow-lg ${
      !product.active ? 'opacity-60' : ''
    } ${
      lowStock ? 'border-red-300' : 'border-gray-200'
    }`}>
      
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
          {!product.active && (
            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Inactivo
            </span>
          )}
          {product.featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Destacado
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              -{discount}%
            </span>
          )}
          {lowStock && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Stock bajo
            </span>
          )}
        </div>
        
        {/* Acciones rápidas */}
        <div className="absolute top-2 right-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleActive(product.id)}
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
            onClick={() => onToggleFeatured(product.id)}
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
        
        {/* Título y marca */}
        <div className="mb-2">
          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {product.brand} • SKU: {product.sku}
          </p>
        </div>
        
        {/* Precio */}
        <div className="mb-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          
          {margin > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Margen: {margin}%
            </p>
          )}
        </div>
        
        {/* Stock */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Stock:</span>
            <span className={`text-sm font-medium ${
              lowStock ? 'text-red-600' : 'text-gray-900'
            }`}>
              {product.stock} unidades
            </span>
          </div>
          
          {/* Barra de stock */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${
                lowStock ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((product.stock / product.maxStock) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 btn-secondary btn-sm text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </button>
          
          <button
            onClick={() => onManageStock(product.id)}
            className="flex-1 btn-primary btn-sm text-xs"
          >
            <Minus className="w-3 h-3 mr-1" />
            Stock
          </button>
        </div>
        
      </div>
    </div>
  );
};

// 📊 COMPONENTE: Tabla de productos
const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onToggleFeatured, 
  onManageStock,
  calculateDiscount, 
  calculateMargin, 
  isLowStock, 
  formatCurrency 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Precio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            const discount = calculateDiscount(product.price, product.originalPrice);
            const margin = calculateMargin(product.price, product.cost);
            const lowStock = isLowStock(product);
            
            return (
              <tr key={product.id} className={!product.active ? 'opacity-60' : ''}>
                
                {/* Producto */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.brand}
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* SKU */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.sku}
                </td>
                
                {/* Precio */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="text-sm text-gray-500">
                      <span className="line-through">{formatCurrency(product.originalPrice)}</span>
                      <span className="ml-2 text-green-600">-{discount}%</span>
                    </div>
                  )}
                  {margin > 0 && (
                    <div className="text-xs text-green-600">
                      Margen: {margin}%
                    </div>
                  )}
                </td>
                
                {/* Stock */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    lowStock ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.stock} unidades
                  </div>
                  {lowStock && (
                    <div className="text-xs text-red-600">
                      Stock bajo
                    </div>
                  )}
                </td>
                
                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                    
                    {product.featured && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Destacado
                      </span>
                    )}
                  </div>
                </td>
                
                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onManageStock(product.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onToggleActive(product.id)}
                      className={product.active ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => onToggleFeatured(product.id)}
                      className={product.featured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'}
                    >
                      <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Los componentes ProductForm y StockManager se continúan en el siguiente artifact...

export default ProductsManager;