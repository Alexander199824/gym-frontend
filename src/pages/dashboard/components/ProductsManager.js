// src/pages/dashboard/components/ProductsManager.js
// FUNCIÓN: Gestión PREPARADA de productos - Muestra datos actuales del backend
// ESTADO: Preparado para cuando se implemente la gestión completa de productos

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ShoppingBag, Package, 
  Star, Check, AlertTriangle, Eye, EyeOff, Image,
  DollarSign, Hash, Tag, Loader, Box
} from 'lucide-react';
import { useApp } from '../../../contexts/AppContext';

const ProductsManager = ({ products, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // 📱 Estados locales
  const [localProducts, setLocalProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // 🏷️ Categorías disponibles para productos
  const productCategories = [
    { id: 'suplementos', label: 'Suplementos', icon: Package },
    { id: 'ropa', label: 'Ropa Deportiva', icon: ShoppingBag },
    { id: 'accesorios', label: 'Accesorios', icon: Star },
    { id: 'equipamiento', label: 'Equipamiento', icon: Box }
  ];
  
  // 📊 Plantilla para nuevo producto
  const emptyProduct = {
    id: null,
    name: '',
    description: '',
    price: 0,
    originalPrice: null,
    category: 'suplementos',
    images: [],
    inStock: true,
    featured: false,
    sku: '',
    tags: []
  };
  
  // 🔄 INICIALIZAR CON DATOS ACTUALES - PREPARADO
  useEffect(() => {
    console.log('🔄 ProductsManager - Checking for products data:', {
      hasProducts: !!products,
      isLoading,
      isArray: Array.isArray(products),
      length: Array.isArray(products) ? products.length : 0,
      products: products
    });
    
    if (!isLoading) {
      if (products && Array.isArray(products)) {
        console.log('📥 ProductsManager - Loading products from backend:', products);
        
        // Mapear productos con estructura esperada
        const mappedProducts = products.map((product, index) => ({
          id: product.id || `product_${index}`,
          name: product.name || '',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
          category: product.category || 'suplementos',
          images: Array.isArray(product.images) ? product.images : [],
          inStock: product.inStock !== false,
          featured: product.featured === true,
          sku: product.sku || '',
          tags: Array.isArray(product.tags) ? product.tags : []
        }));
        
        console.log('✅ ProductsManager - Products mapped successfully:', {
          total: mappedProducts.length,
          featured: mappedProducts.filter(p => p.featured).length,
          inStock: mappedProducts.filter(p => p.inStock).length,
          names: mappedProducts.map(p => p.name)
        });
        
        setLocalProducts(mappedProducts);
        setIsDataLoaded(true);
        
      } else {
        console.log('⚠️ ProductsManager - No products data or invalid format');
        setLocalProducts([]);
        setIsDataLoaded(true);
      }
    } else {
      console.log('⏳ ProductsManager - Data is still loading...');
      setIsDataLoaded(false);
    }
  }, [products, isLoading]);
  
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
      id: `temp_${Date.now()}`,
      sku: `SKU${Date.now()}`
    });
  };
  
  // ✏️ Editar producto existente
  const handleEditProduct = (product) => {
    console.log('📝 Editing product:', product);
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
  
  // 👁️ Toggle disponible/agotado
  const handleToggleInStock = (productId) => {
    setLocalProducts(localProducts.map(product => 
      product.id === productId 
        ? { ...product, inStock: !product.inStock }
        : product
    ));
    setHasChanges(true);
  };
  
  // 💰 Calcular descuento
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // 🔄 Mostrar loading mientras se cargan los datos
  if (isLoading || !isDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando productos actuales...</p>
          </div>
        </div>
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
            Productos que aparecen en la tienda de la página web
          </p>
          
          {/* Mostrar productos actuales cargados */}
          {isDataLoaded && localProducts.length > 0 && (
            <div className="mt-2 flex space-x-2">
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✅ {localProducts.length} productos cargados
              </span>
              {localProducts.filter(p => p.featured).length > 0 && (
                <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  ⭐ {localProducts.filter(p => p.featured).length} destacados
                </span>
              )}
              {localProducts.filter(p => !p.inStock).length > 0 && (
                <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  ❌ {localProducts.filter(p => !p.inStock).length} agotados
                </span>
              )}
            </div>
          )}
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
      
      {/* 🚧 MENSAJE TEMPORAL - GESTIÓN COMPLETA PENDIENTE */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h4 className="text-lg font-medium text-blue-900 mb-2">
              Gestión de Productos en Desarrollo
            </h4>
            <p className="text-blue-800 mb-4">
              La gestión completa de productos está en desarrollo. Por ahora puedes ver los productos actuales 
              que aparecen en tu página web, pero la edición completa estará disponible próximamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-60 rounded p-3">
                <h5 className="font-medium text-blue-900 mb-1">✅ Disponible Ahora</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ver productos actuales</li>
                  <li>• Cargar desde backend</li>
                  <li>• Mostrar en landing page</li>
                </ul>
              </div>
              <div className="bg-white bg-opacity-60 rounded p-3">
                <h5 className="font-medium text-blue-900 mb-1">🚧 En Desarrollo</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Edición completa</li>
                  <li>• Subida de imágenes</li>
                  <li>• Gestión de inventario</li>
                </ul>
              </div>
              <div className="bg-white bg-opacity-60 rounded p-3">
                <h5 className="font-medium text-blue-900 mb-1">🔮 Próximamente</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ventas en línea</li>
                  <li>• Reportes de ventas</li>
                  <li>• Integración de pago</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📋 LISTA DE PRODUCTOS (SOLO VISTA) */}
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {localProducts.map((product) => (
          <div 
            key={product.id} 
            className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
              product.featured ? 'ring-2 ring-blue-200' : 'hover:shadow-md'
            } ${!product.inStock ? 'opacity-60' : ''}`}
          >
            
            {/* Imagen del producto */}
            <div className="aspect-w-4 aspect-h-3 bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].url || product.images[0]}
                  alt={product.name}
                  className="object-cover w-full h-48"
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-100">
                  <Image className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex space-x-2">
                {product.featured && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Destacado
                  </span>
                )}
                {!product.inStock && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Agotado
                  </span>
                )}
              </div>
            </div>
            
            {/* Información del producto */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-900 flex-1">
                  {product.name || 'Sin nombre'}
                </h4>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleToggleFeatured(product.id)}
                    className={`p-1 rounded ${
                      product.featured 
                        ? 'text-blue-600 hover:bg-blue-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={product.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                  >
                    <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => handleToggleInStock(product.id)}
                    className={`p-1 rounded ${
                      product.inStock 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={product.inStock ? 'Marcar como agotado' : 'Marcar como disponible'}
                  >
                    {product.inStock ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description || 'Sin descripción'}
              </p>
              
              {/* Precio */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-green-600 font-medium">
                      -{calculateDiscount(product.price, product.originalPrice)}% descuento
                    </span>
                  )}
                </div>
                
                {product.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {productCategories.find(cat => cat.id === product.category)?.label || product.category}
                  </span>
                )}
              </div>
              
              {/* SKU y tags */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                {product.sku && (
                  <span>SKU: {product.sku}</span>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex space-x-1">
                    {product.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Acciones (temporalmente deshabilitadas) */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleEditProduct(product)}
                  disabled
                  className="flex-1 btn-secondary btn-sm opacity-50 cursor-not-allowed"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar (Próximamente)
                </button>
                
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  disabled
                  className="btn-secondary btn-sm text-red-600 opacity-50 cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
          </div>
        ))}
        
        {/* Mensaje cuando no hay productos */}
        {localProducts.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-xl">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay productos configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Los productos aparecen en la tienda de tu página web
            </p>
            <button
              onClick={handleCreateProduct}
              disabled
              className="btn-primary opacity-50 cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto (Próximamente)
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ProductsManager;