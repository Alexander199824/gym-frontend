// src/pages/store/StorePage.js
// FUNCIÓN: Página de tienda SIN carrito estático - Solo usa carrito flotante
// CAMBIOS: ✅ Removido carrito del header ✅ Solo carrito flotante ✅ Mantiene todas las funcionalidades

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  Grid, 
  List,
  Star,
  Heart,
  Eye,
  Plus,
  Minus,
  Package,
  Truck,
  Shield,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const StorePage = () => {
  const { addItem, isLoading: cartLoading } = useCart(); // ✅ Removido toggleCart e itemCount
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 📱 Estados para datos del backend
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // 📱 Estados para filtros y UI
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  
  // 🔍 EFECTO: Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // 🔍 EFECTO: Recargar productos cuando cambien los filtros
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedBrand, searchQuery, sortBy, sortOrder, priceRange, currentPage]);
  
  // 📥 FUNCIÓN: Cargar datos iniciales (categorías, marcas)
  const loadInitialData = async () => {
    try {
      console.log('🛍️ Loading initial store data...');
      
      // Cargar categorías y marcas en paralelo
      const [categoriesResult, brandsResult] = await Promise.all([
        apiService.get('/store/categories').catch(err => {
          console.warn('⚠️ Categories endpoint not available:', err.message);
          return { data: { categories: [] } };
        }),
        apiService.get('/store/brands').catch(err => {
          console.warn('⚠️ Brands endpoint not available:', err.message);
          return { data: { brands: [] } };
        })
      ]);
      
      // Procesar categorías
      if (categoriesResult?.data?.categories) {
        const categoriesWithAll = [
          { id: 'all', name: 'Todos los productos', productsCount: 0 },
          ...categoriesResult.data.categories
        ];
        setCategories(categoriesWithAll);
        console.log('✅ Categories loaded:', categoriesWithAll.length);
      } else {
        setCategories([{ id: 'all', name: 'Todos los productos' }]);
        console.log('📋 No categories available from backend');
      }
      
      // Procesar marcas
      if (brandsResult?.data?.brands) {
        const brandsWithAll = [
          { id: 'all', name: 'Todas las marcas' },
          ...brandsResult.data.brands
        ];
        setBrands(brandsWithAll);
        console.log('✅ Brands loaded:', brandsWithAll.length);
      } else {
        setBrands([{ id: 'all', name: 'Todas las marcas' }]);
        console.log('📋 No brands available from backend');
      }
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      showError('Error al cargar datos de la tienda');
    }
  };
  
  // 📦 FUNCIÓN: Cargar productos del backend
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛍️ Loading products from backend...');
      
      // Construir parámetros de la petición según README
      const params = {
        page: currentPage,
        limit: limit,
        sortBy: sortBy === 'name' ? 'name' : sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? 'price' : 'name',
        sortOrder: sortBy === 'price-high' ? 'DESC' : sortOrder
      };
      
      // Agregar filtros solo si no son "all"
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (selectedBrand && selectedBrand !== 'all') {
        params.brand = selectedBrand;
      }
      
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      if (priceRange[0] > 0) {
        params.minPrice = priceRange[0];
      }
      
      if (priceRange[1] < 2000) {
        params.maxPrice = priceRange[1];
      }
      
      // Solo productos activos y en stock
      params.featured = false; // Queremos todos los productos, no solo destacados
      
      console.log('📤 Request params:', params);
      
      // Llamar al backend usando la ruta del README
      const response = await apiService.get('/store/products', { params });
      
      console.log('📦 Products response:', response);
      
      // Procesar respuesta según estructura del README
      if (response?.data?.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
        console.log('✅ Products loaded successfully:', {
          count: response.data.products.length,
          total: response.data.pagination?.total || 'unknown',
          page: response.data.pagination?.page || currentPage
        });
      } else if (response?.data && Array.isArray(response.data)) {
        // Fallback si la respuesta es directamente un array
        setProducts(response.data);
        setPagination(null);
        console.log('✅ Products loaded (array format):', response.data.length);
      } else {
        console.warn('⚠️ No products found or unexpected format');
        setProducts([]);
        setPagination(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setError('Error al cargar productos. Verifica que el backend esté funcionando.');
      setProducts([]);
      setPagination(null);
      
      if (error.response?.status === 404) {
        showError('Los productos no están disponibles. Contacta al administrador.');
      } else if (error.code === 'ERR_NETWORK') {
        showError('No se puede conectar al servidor. Verifica tu conexión.');
      } else {
        showError('Error al cargar productos de la tienda');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 🔄 FUNCIÓN: Recargar productos
  const reloadProducts = () => {
    setCurrentPage(1);
    loadProducts();
  };
  
  // 🛒 FUNCIÓN: Agregar producto al carrito
  const handleAddToCart = async (product, selectedOptions = {}) => {
    try {
      console.log('🛒 Adding product to cart:', { product: product.name, options: selectedOptions });
      
      // Preparar datos del producto para el carrito
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.imageUrl || '/api/placeholder/400/400',
        options: selectedOptions,
        quantity: selectedOptions.quantity || 1
      };
      
      await addItem(productData);
      showSuccess(`${product.name} agregado al carrito`);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showError('Error al agregar producto al carrito');
    }
  };
  
  // 🎯 FUNCIÓN: Cambiar página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 🧹 FUNCIÓN: Limpiar filtros
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setPriceRange([0, 2000]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 🔝 HEADER DE LA TIENDA - SIN CARRITO */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y título con navegación */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Volver</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <h1 className="text-2xl font-bold text-gray-900">
                🛍️ Tienda Elite Fitness
              </h1>
              
              {isAuthenticated && user && (
                <span className="text-sm text-gray-600">
                  Hola, {user.firstName}
                </span>
              )}
            </div>
            
            {/* Info adicional en desktop */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Truck className="w-4 h-4 mr-1" />
                <span>Envío gratis +Q200</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                <span>Garantía incluida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 📱 CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Filtros y orden */}
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="reviews">Más reseñas</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-3 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          
          {/* 📋 SIDEBAR DE FILTROS */}
          <div className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              
              {/* Limpiar filtros */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filtros
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Limpiar
                </button>
              </div>
              
              {/* Categorías */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Categorías
                </h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{category.name}</span>
                      {category.productsCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {category.productsCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Marcas */}
              {brands.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Marcas
                  </h4>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrand(brand.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedBrand === brand.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Filtro de precio */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Rango de precio
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Min"
                      min="0"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Max"
                      min="0"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Q{priceRange[0]} - Q{priceRange[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 📦 CONTENIDO PRINCIPAL */}
          <div className="flex-1">
            
            {/* Estado de carga */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando productos...</p>
                </div>
              </div>
            )}
            
            {/* Estado de error */}
            {error && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error al cargar productos
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={reloadProducts}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </button>
              </div>
            )}
            
            {/* Lista de productos */}
            {!loading && !error && (
              <>
                {/* Header de resultados */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-gray-600">
                    {pagination?.total || products.length} productos encontrados
                    {searchQuery && (
                      <span className="ml-2">
                        para "<strong>{searchQuery}</strong>"
                      </span>
                    )}
                  </p>
                </div>
                
                {/* Grid/Lista de productos */}
                {products.length > 0 ? (
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        viewMode={viewMode}
                        onAddToCart={handleAddToCart}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron productos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' ? 
                        'Intenta cambiar los filtros o la búsqueda' : 
                        'No hay productos disponibles en este momento'
                      }
                    </p>
                    {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all') && (
                      <button
                        onClick={clearFilters}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}
                
                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Anterior
                    </button>
                    
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            pagination.page === page
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto
const ProductCard = ({ product, viewMode, onAddToCart, isAuthenticated }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Obtener imagen principal
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl || '/api/placeholder/400/400';
  const imageAlt = primaryImage?.altText || product.name;
  
  // Calcular descuento
  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  // Verificar stock
  const inStock = product.inStock !== false && (product.stockQuantity || 0) > 0;
  const lowStock = inStock && (product.stockQuantity || 0) <= 5;
  
  const handleAddToCart = async () => {
    if (!inStock || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      const optionsWithQuantity = {
        ...selectedOptions,
        quantity
      };
      
      await onAddToCart(product, optionsWithQuantity);
      
      // Reset form
      setSelectedOptions({});
      setQuantity(1);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-6">
        <img 
          src={imageUrl}
          alt={imageAlt}
          className="w-24 h-24 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {product.description}
          </p>
          <div className="flex items-center space-x-4">
            {product.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-600">
                  {product.rating} ({product.reviews || 0})
                </span>
              </div>
            )}
            {product.brand && (
              <span className="text-sm text-gray-500">
                {product.brand.name || product.brand}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">
              Q{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                Q{product.originalPrice}
              </span>
            )}
          </div>
          {inStock ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="btn-primary disabled:opacity-50 flex items-center space-x-2"
            >
              {addingToCart && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{addingToCart ? 'Agregando...' : 'Agregar al carrito'}</span>
            </button>
          ) : (
            <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
              Agotado
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
      
      {/* Imagen del producto */}
      <div className="relative overflow-hidden">
        <img 
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-sm">
              Agotado
            </span>
          )}
          {lowStock && inStock && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-sm">
              ¡Últimos!
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
              Destacado
            </span>
          )}
        </div>
        
        {/* Acciones */}
        <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        
        {/* Marca y rating */}
        <div className="flex items-center justify-between mb-2">
          {product.brand && (
            <span className="text-sm text-gray-500">
              {product.brand.name || product.brand}
            </span>
          )}
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {product.rating} ({product.reviews || 0})
              </span>
            </div>
          )}
        </div>
        
        {/* Nombre y descripción */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        {/* Variantes - Solo mostrar si hay opciones */}
        {product.variants?.colors && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, color: e.target.value }))}
              value={selectedOptions.color || ''}
            >
              <option value="">Seleccionar color</option>
              {product.variants.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}
        
        {product.variants?.sizes && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Talla:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, size: e.target.value }))}
              value={selectedOptions.size || ''}
            >
              <option value="">Seleccionar talla</option>
              {product.variants.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
        
        {product.variants?.flavors && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sabor:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, flavor: e.target.value }))}
              value={selectedOptions.flavor || ''}
            >
              <option value="">Seleccionar sabor</option>
              {product.variants.flavors.map(flavor => (
                <option key={flavor} value={flavor}>{flavor}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Precio */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">Q{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-500 text-sm line-through ml-2">
                Q{product.originalPrice}
              </span>
            )}
          </div>
          
          {/* Control de cantidad */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
              disabled={!inStock}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
              disabled={!inStock}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stock */}
        {inStock && product.stockQuantity && (
          <p className="text-xs text-gray-500 mb-4">
            {product.stockQuantity} disponibles
            {lowStock && <span className="text-orange-600 font-medium"> - ¡Pocos disponibles!</span>}
          </p>
        )}
        
        {/* Botón de agregar al carrito */}
        <button 
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className={`w-full py-3 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            inStock
              ? 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {addingToCart && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          <span>{addingToCart ? 'Agregando...' : inStock ? 'Agregar al carrito' : 'Agotado'}</span>
        </button>
      </div>
    </div>
  );
};

export default StorePage;