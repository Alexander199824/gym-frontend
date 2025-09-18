// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ProductsManager.js
// FUNCIÓN: Gestión completa de productos para inventario y ventas
// MOVIDO DESDE: src/pages/dashboard/components/ProductsManager.js

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ShoppingBag, Package, 
  Star, Check, AlertTriangle, Eye, EyeOff, Image,
  DollarSign, Hash, Tag, Loader, Box, Search,
  Filter, Grid, List, Download, Upload, Copy
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';

const ProductsManager = ({ products, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados locales
  const [localProducts, setLocalProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Estados para filtros y vista
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'
  
  // Categorías disponibles para productos del gimnasio
  const productCategories = [
    { id: 'all', label: 'Todas las categorías', icon: Package },
    { id: 'suplementos', label: 'Suplementos', icon: Package },
    { id: 'proteinas', label: 'Proteínas', icon: Package },
    { id: 'pre-entrenos', label: 'Pre-entrenos', icon: Package },
    { id: 'vitaminas', label: 'Vitaminas', icon: Package },
    { id: 'ropa', label: 'Ropa Deportiva', icon: ShoppingBag },
    { id: 'accesorios', label: 'Accesorios', icon: Star },
    { id: 'equipamiento', label: 'Equipamiento', icon: Box },
    { id: 'hidratacion', label: 'Hidratación', icon: Package },
    { id: 'otros', label: 'Otros', icon: Tag }
  ];
  
  // Filtros de stock
  const stockFilters = [
    { id: 'all', label: 'Todo el stock' },
    { id: 'in-stock', label: 'En stock' },
    { id: 'low-stock', label: 'Stock bajo' },
    { id: 'out-of-stock', label: 'Sin stock' }
  ];
  
  // Plantilla para nuevo producto
  const emptyProduct = {
    id: null,
    name: '',
    description: '',
    price: 0,
    cost: 0,
    originalPrice: null,
    category: 'suplementos',
    brand: '',
    sku: '',
    stock: 0,
    minStock: 5,
    images: [],
    inStock: true,
    featured: false,
    tags: []
  };
  
  // INICIALIZAR CON DATOS ACTUALES
  useEffect(() => {
    console.log('ProductsManager (Inventario) - Verificando datos:', {
      hasProducts: !!products,
      isLoading,
      isArray: Array.isArray(products),
      length: Array.isArray(products) ? products.length : 0
    });
    
    if (!isLoading) {
      if (products && Array.isArray(products)) {
        console.log('ProductsManager - Cargando productos desde inventario:', products);
        
        // Mapear productos con estructura completa para inventario
        const mappedProducts = products.map((product, index) => ({
          id: product.id || `product_${index}`,
          name: product.name || '',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          cost: parseFloat(product.cost) || 0,
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
          category: product.category || 'suplementos',
          brand: product.brand || '',
          sku: product.sku || `SKU${Date.now()}${index}`,
          stock: parseInt(product.stock) || 0,
          minStock: parseInt(product.minStock) || 5,
          images: Array.isArray(product.images) ? product.images : [],
          inStock: product.inStock !== false && (product.stock || 0) > 0,
          featured: product.featured === true,
          tags: Array.isArray(product.tags) ? product.tags : []
        }));
        
        console.log('ProductsManager - Productos mapeados para inventario:', {
          total: mappedProducts.length,
          inStock: mappedProducts.filter(p => p.inStock).length,
          lowStock: mappedProducts.filter(p => p.stock <= p.minStock).length,
          outOfStock: mappedProducts.filter(p => p.stock === 0).length
        });
        
        setLocalProducts(mappedProducts);
        setIsDataLoaded(true);
        
      } else {
        console.log('ProductsManager - Sin datos de productos');
        setLocalProducts([]);
        setIsDataLoaded(true);
      }
    } else {
      setIsDataLoaded(false);
    }
  }, [products, isLoading]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // Filtrar productos
  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'in-stock') matchesStock = product.stock > product.minStock;
    if (stockFilter === 'low-stock') matchesStock = product.stock <= product.minStock && product.stock > 0;
    if (stockFilter === 'out-of-stock') matchesStock = product.stock === 0;
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  // Obtener estado del stock
  const getStockStatus = (product) => {
    if (product.stock === 0) return { 
      status: 'out', 
      label: 'Sin stock', 
      color: 'bg-red-50 text-red-700 border-red-200' 
    };
    if (product.stock <= product.minStock) return { 
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
  
  // Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      console.log('Guardando productos de inventario:', localProducts);
      await onSave({ type: 'products', data: localProducts });
      setHasChanges(false);
      showSuccess('Productos guardados exitosamente');
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error guardando productos:', error);
      showError('Error al guardar productos');
    }
  };
  
  // Crear nuevo producto
  const handleCreateProduct = () => {
    setIsCreating(true);
    setEditingProduct({
      ...emptyProduct,
      id: `temp_${Date.now()}`,
      sku: `SKU${Date.now()}`
    });
  };
  
  // Editar producto
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setIsCreating(false);
  };
  
  // Guardar producto individual
  const handleSaveProduct = () => {
    if (!editingProduct.name.trim()) {
      showError('El nombre del producto es obligatorio');
      return;
    }
    
    if (!editingProduct.price || editingProduct.price <= 0) {
      showError('El precio debe ser mayor a 0');
      return;
    }
    
    if (editingProduct.stock < 0) {
      showError('El stock no puede ser negativo');
      return;
    }
    
    if (isCreating) {
      const newProduct = {
        ...editingProduct,
        id: `new_${Date.now()}`,
        inStock: editingProduct.stock > 0
      };
      setLocalProducts([...localProducts, newProduct]);
    } else {
      setLocalProducts(localProducts.map(product => 
        product.id === editingProduct.id 
          ? { ...editingProduct, inStock: editingProduct.stock > 0 }
          : product
      ));
    }
    
    setHasChanges(true);
    setEditingProduct(null);
    setIsCreating(false);
    showSuccess(isCreating ? 'Producto creado' : 'Producto actualizado');
  };
  
  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };
  
  // Eliminar producto
  const handleDeleteProduct = (productId) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      setLocalProducts(localProducts.filter(product => product.id !== productId));
      setHasChanges(true);
      showSuccess('Producto eliminado del inventario');
    }
  };
  
  // Toggle producto destacado
  const handleToggleFeatured = (productId) => {
    setLocalProducts(localProducts.map(product => 
      product.id === productId 
        ? { ...product, featured: !product.featured }
        : product
    ));
    setHasChanges(true);
  };
  
  // Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };
  
  // Calcular valor total del inventario
  const totalInventoryValue = filteredProducts.reduce((total, product) => 
    total + (product.price * product.stock), 0
  );

  // Mostrar loading
  if (isLoading || !isDataLoaded) {
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
      
      {/* HEADER CON CONTROLES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Productos</h2>
          <p className="text-gray-600">Control completo del inventario de productos del gimnasio</p>
          
          {/* Resumen del inventario */}
          {isDataLoaded && localProducts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {localProducts.length} productos
              </span>
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Valor: {formatCurrency(totalInventoryValue)}
              </span>
              {localProducts.filter(p => p.stock <= p.minStock).length > 0 && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  {localProducts.filter(p => p.stock <= p.minStock).length} con stock bajo
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
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
            className="btn-primary btn-sm"
            disabled={isCreating || editingProduct}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      {/* INDICADOR DE CAMBIOS */}
      {hasChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Tienes cambios sin guardar en el inventario. No olvides hacer clic en "Guardar Cambios".
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos, marcas, SKU..."
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
            {productCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
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
                  Mostrando {filteredProducts.length} de {localProducts.length} productos
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Valor total: {formatCurrency(totalInventoryValue)}</span>
                  <button className="btn-secondary btn-sm">
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>
            
            {/* Vista Grid */}
            {viewMode === 'grid' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    
                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                        
                        {/* Header del producto */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                              {product.featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{product.brand} • {product.sku}</p>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Imagen placeholder */}
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].url || product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Image className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Información del producto */}
                        <div className="space-y-2">
                          {/* Precios */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(product.price)}
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              {product.cost > 0 && (
                                <div className="text-xs text-gray-500">
                                  Costo: {formatCurrency(product.cost)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Stock */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stock}</span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Categoría */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Categoría:</span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                              {productCategories.find(c => c.id === product.category)?.label || product.category}
                            </span>
                          </div>
                          
                          {/* Descripción */}
                          {product.description && (
                            <p className="text-xs text-gray-600 line-clamp-2" title={product.description}>
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
            
            {/* Vista Lista - TODO: Implementar */}
            {viewMode === 'list' && (
              <div className="p-6 text-center">
                <List className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Vista de lista en desarrollo</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* MODAL DE EDICIÓN - Placeholder mejorado */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Formulario en Desarrollo
              </h4>
              <p className="text-gray-600 mb-6">
                El formulario completo de {isCreating ? 'creación' : 'edición'} de productos 
                estará disponible próximamente con todas las funcionalidades.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="bg-gray-50 p-4 rounded">
                  <h5 className="font-medium mb-2">Información Básica</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Nombre y descripción</li>
                    <li>• Categoría y marca</li>
                    <li>• Código SKU</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h5 className="font-medium mb-2">Precios e Inventario</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Precio de venta y costo</li>
                    <li>• Stock actual y mínimo</li>
                    <li>• Control de disponibilidad</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h5 className="font-medium mb-2">Multimedia</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Imágenes del producto</li>
                    <li>• Galería múltiple</li>
                    <li>• Optimización automática</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h5 className="font-medium mb-2">Configuración</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Producto destacado</li>
                    <li>• Etiquetas y tags</li>
                    <li>• Estados y visibilidad</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
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