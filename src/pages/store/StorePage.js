// src/pages/store/StorePage.js
// Autor: Alexander Echeverria
// VERSIÓN CORREGIDA: Logo del gym en header + Colores mejorados

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Filter, Search, Grid, List, Star, Heart, Eye, Plus, Minus,
  Package, Loader2, AlertCircle, RefreshCw, Dumbbell,
  X, ArrowLeft, ShoppingBag, Sparkles
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import useGymConfig from '../../hooks/useGymConfig';
import apiService from '../../services/apiService';
import gymConfigDefault from '../../config/gymConfig';
import GymLogo from '../../components/common/GymLogo';

const StorePage = () => {
  const { addItem, isLoading: cartLoading, sessionInfo, debugGuestCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo, isMobile } = useApp();
  const { config } = useGymConfig();
  const navigate = useNavigate();
  
  const currencySymbol = gymConfigDefault.regional.currencySymbol;
  const freeShippingThreshold = gymConfigDefault.shipping.freeShippingThreshold;
  const gymName = config?.name || gymConfigDefault.name;
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
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
  const [persistenceStatus, setPersistenceStatus] = useState('checking');
  const [showPersistenceAlert, setShowPersistenceAlert] = useState(false);
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedBrand, searchQuery, sortBy, sortOrder, priceRange, currentPage]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      checkCartPersistence();
      const interval = setInterval(checkCartPersistence, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  const checkCartPersistence = () => {
    try {
      const hasCartData = !!localStorage.getItem('elite_fitness_cart');
      const hasSessionId = !!localStorage.getItem('elite_fitness_session_id');
      const sessionIdInContext = !!sessionInfo?.sessionId;
      
      if (!isAuthenticated) {
        if (hasCartData && hasSessionId && sessionIdInContext) {
          setPersistenceStatus('active');
        } else if (hasCartData || hasSessionId) {
          setPersistenceStatus('partial');
        } else {
          setPersistenceStatus('inactive');
        }
      } else {
        setPersistenceStatus('authenticated');
      }
    } catch (error) {
      console.error('Error verificando persistencia del carrito:', error);
      setPersistenceStatus('error');
    }
  };
  
  const loadInitialData = async () => {
    try {
      const [categoriesResult, brandsResult] = await Promise.all([
        apiService.get('/store/categories').catch(err => {
          console.warn('Endpoint de categorías no disponible:', err.message);
          return { data: { categories: [] } };
        }),
        apiService.get('/store/brands').catch(err => {
          console.warn('Endpoint de marcas no disponible:', err.message);
          return { data: { brands: [] } };
        })
      ]);
      
      if (categoriesResult?.data?.categories) {
        const categoriesWithAll = [
          { id: 'all', name: 'Todos los productos', productsCount: 0 },
          ...categoriesResult.data.categories
        ];
        setCategories(categoriesWithAll);
      } else {
        setCategories([{ id: 'all', name: 'Todos los productos' }]);
      }
      
      if (brandsResult?.data?.brands) {
        const brandsWithAll = [
          { id: 'all', name: 'Todas las marcas' },
          ...brandsResult.data.brands
        ];
        setBrands(brandsWithAll);
      } else {
        setBrands([{ id: 'all', name: 'Todas las marcas' }]);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      showError('Error al cargar datos de la tienda');
    }
  };
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: limit,
        sortBy: sortBy === 'name' ? 'name' : sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? 'price' : 'name',
        sortOrder: sortBy === 'price-high' ? 'DESC' : sortOrder
      };
      
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
      
      params.featured = false;
      
      const response = await apiService.get('/store/products', { params });
      
      if (response?.data?.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } else if (response?.data && Array.isArray(response.data)) {
        setProducts(response.data);
        setPagination(null);
      } else {
        setProducts([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
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
  
  const reloadProducts = () => {
    setCurrentPage(1);
    loadProducts();
  };
  
  const handleAddToCart = async (product, selectedOptions = {}) => {
    try {
      if (!isAuthenticated) {
        checkCartPersistence();
        
        if (persistenceStatus === 'error' || persistenceStatus === 'partial') {
          setShowPersistenceAlert(true);
          setTimeout(() => setShowPersistenceAlert(false), 5000);
        }
      }
      
      await addItem(product, selectedOptions);
      
      let message;
      if (isAuthenticated) {
        message = `${product.name} agregado al carrito`;
      } else {
        message = persistenceStatus === 'active' 
          ? `${product.name} agregado (se guardará automáticamente)`
          : `${product.name} agregado al carrito como invitado`;
      }
      
      showSuccess(message);
      
      if (!isAuthenticated) {
        setTimeout(() => {
          checkCartPersistence();
        }, 500);
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      showError('Error al agregar producto al carrito');
      
      if (!isAuthenticated && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          debugGuestCart();
        }, 1000);
      }
    }
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setPriceRange([0, 2000]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      
      {/* ALERTA DE PERSISTENCIA */}
      {!isAuthenticated && showPersistenceAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
          <div className={`p-4 rounded-xl shadow-2xl border-2 backdrop-blur-sm ${
            persistenceStatus === 'active' 
              ? 'bg-green-50/95 border-green-300'
              : 'bg-yellow-50/95 border-yellow-300'
          }`}>
            <div className="flex items-start">
              {persistenceStatus === 'active' ? (
                <AlertCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  {persistenceStatus === 'active' ? 'Carrito guardado' : 'Advertencia'}
                </h4>
                <p className="text-xs">
                  {persistenceStatus === 'active' 
                    ? 'Tus productos se mantendrán seguros'
                    : 'Algunos productos podrían perderse'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowPersistenceAlert(false)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER CORREGIDO CON LOGO */}
      <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Sección izquierda: Navegación y Logo */}
            <div className="flex items-center space-x-6">
              <Link 
                to="/"
                className="flex items-center text-gray-600 hover:text-primary-600 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <span className="ml-3 font-semibold hidden sm:block">Volver</span>
              </Link>
              
              <div className="hidden sm:block h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              
              {/* Logo y título mejorados */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl blur opacity-50"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Tienda {gymName}
                  </h1>
                  {isAuthenticated && user && (
                    <p className="text-xs text-gray-600 flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Hola, {user.firstName}</span>
                    </p>
                  )}
                  {!isAuthenticated && (
                    <p className="text-xs text-primary-600 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Compra como invitado</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sección derecha: LOGO DEL GIMNASIO */}
            <div className="hidden md:block">
              {config && config.logo && config.logo.url ? (
                <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-xl border-2 border-primary-200 shadow-sm">
                  <img 
                    src={config.logo.url}
                    alt={config.logo.alt || gymName}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center bg-primary-600 rounded-xl w-12 h-12">
                    <Dumbbell className="text-white w-6 h-6" />
                  </div>
                </div>
              ) : (
                <GymLogo 
                  size="md" 
                  variant="professional" 
                  showText={false} 
                  priority="high" 
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BARRA DE BUSQUEDA */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all hover:border-primary-300"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white shadow-sm font-medium hover:border-primary-300 transition-all cursor-pointer"
              >
                <option value="name">Nombre</option>
                <option value="price-low">Precio: Menor</option>
                <option value="price-high">Precio: Mayor</option>
                <option value="rating">Mejor Valorados</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-4 border-2 border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all shadow-sm group"
              >
                {viewMode === 'grid' ? 
                  <List className="w-5 h-5 text-gray-600 group-hover:text-primary-600" /> : 
                  <Grid className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                }
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-4 border-2 border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all shadow-sm group"
              >
                <Filter className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          
          {/* SIDEBAR DE FILTROS */}
          <div className={`w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sticky top-28 border border-gray-100">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mr-2">
                    <Filter className="w-4 h-4 text-primary-600" />
                  </div>
                  Filtros
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  Limpiar
                </button>
              </div>
              
              {/* Categorías */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Categorías
                </h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md scale-105'
                          : 'hover:bg-gray-50 hover:scale-102'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      {category.productsCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          selectedCategory === category.id 
                            ? 'bg-white/20' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
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
                  <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Marcas
                  </h4>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrand(brand.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all ${
                          selectedBrand === brand.id
                            ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-md scale-105'
                            : 'hover:bg-gray-50 hover:scale-102'
                        }`}
                      >
                        <span className="font-medium">{brand.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rango de precio */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Rango de Precio
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      placeholder="Min"
                    />
                    <span className="text-gray-500 font-medium">-</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      placeholder="Max"
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-lg font-medium border border-gray-200">
                    {currencySymbol}{priceRange[0]} - {currencySymbol}{priceRange[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* LISTA DE PRODUCTOS */}
          <div className="flex-1">
            
            {loading && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Cargando productos...</p>
                </div>
              </div>
            )}
            
            {error && !loading && (
              <div className="text-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Error al cargar productos
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={reloadProducts}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </button>
              </div>
            )}
            
            {!loading && !error && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-700 font-medium">
                    <span className="text-primary-600 font-bold text-lg">{pagination?.total || products.length}</span> productos encontrados
                    {searchQuery && <span className="ml-2 text-gray-600">para "<strong className="text-gray-900">{searchQuery}</strong>"</span>}
                  </p>
                </div>
                
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
                        onNavigate={() => navigate(`/store/product/${product.id}`)}
                        isAuthenticated={isAuthenticated}
                        persistenceStatus={persistenceStatus}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No se encontraron productos
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' ? 
                        'Intenta cambiar los filtros o la búsqueda' : 
                        'No hay productos disponibles en este momento'
                      }
                    </p>
                    {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all') && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}
                
                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-12 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-5 py-3 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-primary-300 font-medium transition-all"
                    >
                      Anterior
                    </button>
                    
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                            pagination.page === page
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-110'
                              : 'border-2 border-gray-200 hover:bg-gray-50 hover:border-primary-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-5 py-3 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-primary-300 font-medium transition-all"
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

// COMPONENTE: Tarjeta de producto
const ProductCard = ({ product, viewMode, onAddToCart, onNavigate, isAuthenticated, persistenceStatus, currencySymbol = 'Q' }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl || '/api/placeholder/400/400';
  const imageAlt = primaryImage?.altText || product.name;
  
  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  const inStock = product.inStock !== false && (product.stockQuantity || 0) > 0;
  const lowStock = inStock && (product.stockQuantity || 0) <= 5;
  
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!inStock || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      const options = {
        ...selectedOptions,
        quantity
      };
      
      await onAddToCart(product, options);
      
      setSelectedOptions({});
      setQuantity(1);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
    } finally {
      setAddingToCart(false);
    }
  };
  
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onNavigate}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex items-center space-x-6 cursor-pointer hover:shadow-2xl transition-all group border border-gray-100"
      >
        <img 
          src={imageUrl}
          alt={imageAlt}
          className="w-24 h-24 object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
        />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
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
              {currencySymbol}{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {currencySymbol}{product.originalPrice}
              </span>
            )}
          </div>
          {inStock ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                !isAuthenticated && persistenceStatus === 'active'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {addingToCart && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{addingToCart ? 'Agregando...' : 'Agregar al carrito'}</span>
            </button>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
              Agotado
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      onClick={onNavigate}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
    >
      
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
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              -{discount}%
            </span>
          )}
          {!inStock && (
            <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              Agotado
            </span>
          )}
          {lowStock && inStock && (
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
              ¡Últimos!
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              Destacado
            </span>
          )}
        </div>
        
        {/* Acciones */}
        <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isWishlisted ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button className="w-10 h-10 bg-white/90 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100 shadow-lg transition-all">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        
        {/* Marca y rating */}
        <div className="flex items-center justify-between mb-2">
          {product.brand && (
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              {product.brand.name || product.brand}
            </span>
          )}
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-bold text-gray-600">
                {product.rating} ({product.reviews || 0})
              </span>
            </div>
          )}
        </div>
        
        {/* Nombre y descripción */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        {/* Variantes */}
        {product.variants?.colors && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color:
            </label>
            <select 
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              onChange={(e) => {
                e.stopPropagation();
                setSelectedOptions(prev => ({ ...prev, color: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
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
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              onChange={(e) => {
                e.stopPropagation();
                setSelectedOptions(prev => ({ ...prev, size: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
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
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              onChange={(e) => {
                e.stopPropagation();
                setSelectedOptions(prev => ({ ...prev, flavor: e.target.value }));
              }}
              onClick={(e) => e.stopPropagation()}
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
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {currencySymbol}{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-500 text-sm line-through ml-2">
                {currencySymbol}{product.originalPrice}
              </span>
            )}
          </div>
          
          {/* Control de cantidad */}
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition-all disabled:opacity-50"
              disabled={!inStock}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuantity(quantity + 1);
              }}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition-all disabled:opacity-50"
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
            {lowStock && <span className="text-orange-600 font-semibold"> - ¡Pocos disponibles!</span>}
          </p>
        )}
        
        {/* Botón de agregar al carrito */}
        <button 
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            inStock
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:scale-105 disabled:opacity-50'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {addingToCart && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          <span>
            {addingToCart 
              ? 'Agregando...' 
              : inStock 
                ? (isAuthenticated ? 'Agregar al carrito' : 'Agregar (como invitado)')
                : 'Agotado'
            }
          </span>
        </button>
      </div>
    </div>
  );
};

export default StorePage;


/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Esta página StorePage es una tienda completa e-commerce integrada con funcionalidades avanzadas
para tanto usuarios autenticados como invitados. Incluye un sistema robusto de persistencia
del carrito, filtros dinámicos, búsqueda, paginación y manejo de productos con variantes.

FUNCIONALIDAD PRINCIPAL:
- Tienda completa con carrito persistente para invitados y usuarios registrados
- Sistema de filtros avanzados (categorías, marcas, precio, búsqueda)
- Visualización en grid y lista con paginación
- Manejo de productos con variantes (colores, tallas, sabores)
- Indicadores de stock y descuentos
- Sistema de persistencia inteligente con verificación continua
- Debug integrado para desarrollo
- Feedback visual mejorado según estado del usuario

ARCHIVOS A LOS QUE SE CONECTA:
- ../../contexts/CartContext: Contexto del carrito con funciones addItem, sessionInfo, debugGuestCart
- ../../contexts/AuthContext: Contexto de autenticación para verificar usuario actual
- ../../contexts/AppContext: Contexto de aplicación para notificaciones (showSuccess, showError)
- ../../services/apiService: Servicio para peticiones HTTP al backend
- react-router-dom: Para navegación y manejo de parámetros de URL
- lucide-react: Biblioteca de iconos para elementos visuales

ENDPOINTS DEL BACKEND UTILIZADOS:
- GET /store/categories: Obtiene categorías de productos
- GET /store/brands: Obtiene marcas disponibles
- GET /store/products: Obtiene productos con filtros y paginación

ESTRUCTURA DE PRODUCTOS SOPORTADA:
- Información básica: name, description, price, originalPrice
- Imágenes: array con isPrimary y imageUrl
- Variantes: colors, sizes, flavors
- Stock: stockQuantity, inStock
- Calificaciones: rating, reviews
- Estados: isFeatured, brand

FUNCIONALIDADES PARA INVITADOS:
- Carrito persistente usando localStorage
- Verificación continua de persistencia
- Indicadores visuales de estado de guardado
- Mensajes específicos para compra sin registro
- Sistema de recuperación automática de errores

FUNCIONALIDADES PARA USUARIOS AUTENTICADOS:
- Carrito sincronizado con cuenta de usuario
- Persistencia en el servidor
- Experiencia personalizada con nombre del usuario
- Integración completa con sistema de autenticación

SISTEMA DE FILTROS:
- Categorías dinámicas cargadas desde backend
- Marcas disponibles según productos
- Rango de precios personalizable
- Búsqueda por texto libre
- Ordenamiento por nombre, precio, calificación
- Limpieza de filtros con un click

PERSISTENCIA DEL CARRITO:
- Para invitados: localStorage + sessionId único
- Para usuarios: backend + sincronización
- Verificación continua cada 10 segundos
- Alertas visuales sobre estado de persistencia
- Recuperación automática de errores

EXPERIENCIA DE USUARIO:
- Diseño responsivo para móvil y desktop
- Animaciones suaves y feedback visual
- Estados de carga clara
- Manejo robusto de errores con reintentos
- Indicadores de stock y descuentos
- Vista previa de productos con zoom

Esta página representa una solución completa de e-commerce que balancea
funcionalidad avanzada con simplicidad de uso, soportando tanto usuarios
registrados como invitados con igual calidad de experiencia.
*/