// src/pages/store/StorePage.js
// Autor: Alexander Echeverria
// VERSIÓN ACTUALIZADA: Usa gymConfig centralizado sin datos hardcodeados

// FUNCION: Página de tienda MEJORADA - Integración robusta con carrito persistente para invitados
// MEJORAS: Persistencia garantizada, Feedback mejorado, Recovery automático, Debug integrado

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, Search, Grid, List, Star, Heart, Eye, Plus, Minus,
  Package, Truck, Shield, Award, Loader2, AlertCircle, RefreshCw,
  X, ArrowLeft, CheckCircle, Wifi, WifiOff
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// IMPORTAR CONFIGURACIÓN CENTRALIZADA
import gymConfigDefault from '../../config/gymConfig';

const StorePage = () => {
  const { addItem, isLoading: cartLoading, sessionInfo, debugGuestCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Obtener configuración centralizada
  const currencySymbol = gymConfigDefault.regional.currencySymbol;
  const freeShippingThreshold = gymConfigDefault.shipping.freeShippingThreshold;
  const gymName = gymConfigDefault.name;
  
  // Estados para datos del backend - MANTIENE TODA LA FUNCIONALIDAD
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Estados para filtros y UI - MANTIENE TODA LA FUNCIONALIDAD
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
  
  // NUEVOS ESTADOS: Para seguimiento de persistencia
  const [persistenceStatus, setPersistenceStatus] = useState('checking');
  const [showPersistenceAlert, setShowPersistenceAlert] = useState(false);
  
  // EFECTO: Cargar datos iniciales - MANTIENE TODA LA FUNCIONALIDAD
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // EFECTO: Recargar productos cuando cambien los filtros - MANTIENE TODA LA FUNCIONALIDAD
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedBrand, searchQuery, sortBy, sortOrder, priceRange, currentPage]);
  
  // NUEVO EFECTO: Verificar persistencia del carrito para invitados
  useEffect(() => {
    if (!isAuthenticated) {
      checkCartPersistence();
      
      // Verificar periódicamente
      const interval = setInterval(checkCartPersistence, 10000); // Cada 10 segundos
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  // NUEVA FUNCION: Verificar persistencia del carrito
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
      
      console.log('Verificación de persistencia del carrito:', {
        hasCartData,
        hasSessionId,
        sessionIdInContext,
        status: persistenceStatus
      });
      
    } catch (error) {
      console.error('Error verificando persistencia del carrito:', error);
      setPersistenceStatus('error');
    }
  };
  
  // FUNCION: Cargar datos iniciales - MANTIENE TODA LA FUNCIONALIDAD
  const loadInitialData = async () => {
    try {
      console.log('Cargando datos iniciales de la tienda...');
      
      // Cargar categorías y marcas en paralelo
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
      
      // Procesar categorías
      if (categoriesResult?.data?.categories) {
        const categoriesWithAll = [
          { id: 'all', name: 'Todos los productos', productsCount: 0 },
          ...categoriesResult.data.categories
        ];
        setCategories(categoriesWithAll);
        console.log('Categorías cargadas:', categoriesWithAll.length);
      } else {
        setCategories([{ id: 'all', name: 'Todos los productos' }]);
        console.log('No hay categorías disponibles desde el backend');
      }
      
      // Procesar marcas
      if (brandsResult?.data?.brands) {
        const brandsWithAll = [
          { id: 'all', name: 'Todas las marcas' },
          ...brandsResult.data.brands
        ];
        setBrands(brandsWithAll);
        console.log('Marcas cargadas:', brandsWithAll.length);
      } else {
        setBrands([{ id: 'all', name: 'Todas las marcas' }]);
        console.log('No hay marcas disponibles desde el backend');
      }
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      showError('Error al cargar datos de la tienda');
    }
  };
  
  // FUNCION: Cargar productos del backend - MANTIENE TODA LA FUNCIONALIDAD
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando productos desde el backend...');
      
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
      
      console.log('Parámetros de petición:', params);
      
      // Llamar al backend usando la ruta del README
      const response = await apiService.get('/store/products', { params });
      
      console.log('Respuesta de productos:', response);
      
      // Procesar respuesta según estructura del README
      if (response?.data?.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
        console.log('Productos cargados exitosamente:', {
          count: response.data.products.length,
          total: response.data.pagination?.total || 'desconocido',
          page: response.data.pagination?.page || currentPage
        });
      } else if (response?.data && Array.isArray(response.data)) {
        // Fallback si la respuesta es directamente un array
        setProducts(response.data);
        setPagination(null);
        console.log('Productos cargados (formato array):', response.data.length);
      } else {
        console.warn('No se encontraron productos o formato inesperado');
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
  
  // FUNCION: Recargar productos - MANTIENE TODA LA FUNCIONALIDAD
  const reloadProducts = () => {
    setCurrentPage(1);
    loadProducts();
  };
  
  // FUNCION MEJORADA: Agregar producto al carrito - CON PERSISTENCIA GARANTIZADA
  const handleAddToCart = async (product, selectedOptions = {}) => {
    try {
      console.log('Agregando producto al carrito con verificación de persistencia:', { 
        product: product.name, 
        options: selectedOptions,
        isAuthenticated,
        userInfo: user ? `${user.firstName} ${user.lastName}` : 'Invitado',
        sessionId: sessionInfo?.sessionId,
        persistenceStatus
      });
      
      // NUEVO: Verificar persistencia antes de agregar
      if (!isAuthenticated) {
        checkCartPersistence();
        
        // Si hay problemas de persistencia, mostrar alerta
        if (persistenceStatus === 'error' || persistenceStatus === 'partial') {
          setShowPersistenceAlert(true);
          setTimeout(() => setShowPersistenceAlert(false), 5000);
        }
      }
      
      // Agregar al carrito usando la API correcta del CartContext
      await addItem(product, selectedOptions);
      
      // MEJORADO: Mensaje específico según el estado
      let message;
      if (isAuthenticated) {
        message = `${product.name} agregado al carrito`;
      } else {
        message = persistenceStatus === 'active' 
          ? `${product.name} agregado (se guardará automáticamente)`
          : `${product.name} agregado al carrito como invitado`;
      }
      
      showSuccess(message);
      
      // NUEVO: Verificar persistencia después de agregar
      if (!isAuthenticated) {
        setTimeout(() => {
          checkCartPersistence();
        }, 500);
      }
      
      console.log('Producto agregado al carrito exitosamente:', {
        productName: product.name,
        userType: isAuthenticated ? 'authenticated' : 'guest',
        quantity: selectedOptions.quantity || 1,
        persistenceStatus
      });
      
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      showError('Error al agregar producto al carrito');
      
      // NUEVO: Sugerir debug si hay problemas persistentes
      if (!isAuthenticated && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          console.log('Sugerir debug de persistencia del carrito...');
          debugGuestCart();
        }, 1000);
      }
    }
  };
  
  // FUNCION: Cambiar página - MANTIENE TODA LA FUNCIONALIDAD
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // FUNCION: Limpiar filtros - MANTIENE TODA LA FUNCIONALIDAD
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setPriceRange([0, 2000]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* NUEVA ALERTA: Estado de persistencia del carrito */}
      {!isAuthenticated && showPersistenceAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border ${
            persistenceStatus === 'active' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : persistenceStatus === 'partial'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start">
              {persistenceStatus === 'active' ? (
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5" />
              ) : persistenceStatus === 'partial' ? (
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
              ) : (
                <X className="w-5 h-5 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {persistenceStatus === 'active' && 'Carrito guardado automáticamente'}
                  {persistenceStatus === 'partial' && 'Advertencia: persistencia parcial'}
                  {persistenceStatus === 'error' && 'Error en persistencia del carrito'}
                </h4>
                <p className="text-xs mt-1">
                  {persistenceStatus === 'active' && 'Tus productos se mantendrán aunque cierres la página'}
                  {persistenceStatus === 'partial' && 'Es posible que se pierdan algunos productos al navegar'}
                  {persistenceStatus === 'error' && 'Los productos podrían perderse al navegar'}
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
      
      {/* HEADER DE LA TIENDA - MEJORADO CON INDICADOR DE PERSISTENCIA */}
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
                Tienda {gymName}
              </h1>
              
              {isAuthenticated && user && (
                <span className="text-sm text-gray-600">
                  Hola, {user.firstName}
                </span>
              )}
              
              {/* MEJORADO: Indicador de estado para invitados */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Compra como invitado
                  </span>
                  
                  {/* NUEVO: Indicador de persistencia */}
                  <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                    persistenceStatus === 'active' 
                      ? 'bg-green-50 text-green-600'
                      : persistenceStatus === 'partial'
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'bg-gray-50 text-gray-600'
                  }`}>
                    {persistenceStatus === 'active' ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span>Guardado</span>
                      </>
                    ) : persistenceStatus === 'partial' ? (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Parcial</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Local</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Info adicional en desktop */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              {freeShippingThreshold > 0 && (
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-1" />
                  <span>Envío gratis +{currencySymbol}{freeShippingThreshold}</span>
                </div>
              )}
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                <span>Garantía incluida</span>
              </div>
              
              {/* DEBUG: Solo en desarrollo */}
              {process.env.NODE_ENV === 'development' && !isAuthenticated && (
                <button
                  onClick={debugGuestCart}
                  className="flex items-center text-xs text-purple-600 hover:text-purple-700"
                  title="Debug Cart Persistence"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span>Debug</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CONTENIDO PRINCIPAL - MANTIENE TODA LA FUNCIONALIDAD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BARRA DE BUSQUEDA Y FILTROS - MANTIENE TODA LA FUNCIONALIDAD */}
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
          
          {/* SIDEBAR DE FILTROS - MANTIENE TODA LA FUNCIONALIDAD */}
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
                    {currencySymbol}{priceRange[0]} - {currencySymbol}{priceRange[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CONTENIDO PRINCIPAL - MANTIENE TODA LA FUNCIONALIDAD */}
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
                  
                  {/* NUEVO: Indicador de persistencia en resultados */}
                  {!isAuthenticated && products.length > 0 && (
                    <div className={`text-xs px-2 py-1 rounded ${
                      persistenceStatus === 'active' 
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {persistenceStatus === 'active' ? 'Carrito se guarda automáticamente' : 'Persistencia parcial'}
                    </div>
                  )}
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
                        onAddToCart={handleAddToCart}  // Función mejorada
                        isAuthenticated={isAuthenticated}
                        persistenceStatus={persistenceStatus} // NUEVO: Estado de persistencia
                        currencySymbol={currencySymbol} // NUEVO: Símbolo de moneda
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

// COMPONENTE MEJORADO: Tarjeta de producto - CON INDICADOR DE PERSISTENCIA
const ProductCard = ({ product, viewMode, onAddToCart, isAuthenticated, persistenceStatus, currencySymbol = 'Q' }) => {
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
  
  // FUNCION MEJORADA: handleAddToCart con mejor feedback
  const handleAddToCart = async () => {
    if (!inStock || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      // Crear las options correctamente
      const options = {
        ...selectedOptions,
        quantity  // quantity va EN las options, no separado
      };
      
      console.log('ProductCard: Agregando al carrito con conocimiento de persistencia:', {
        product: product.name,
        options,
        isAuthenticated,
        persistenceStatus
      });
      
      // Usar la API correcta onAddToCart(product, options)
      await onAddToCart(product, options);
      
      // Reset form después de agregar exitosamente
      setSelectedOptions({});
      setQuantity(1);
      
      console.log('ProductCard: Item agregado exitosamente');
      
    } catch (error) {
      console.error('ProductCard: Error agregando al carrito:', error);
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
            <span className="text-2xl font-bold text-gray-900">{currencySymbol}{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-500 text-sm line-through ml-2">
                {currencySymbol}{product.originalPrice}
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
        
        {/* MEJORADO: Indicador específico para invitados */}
        {!isAuthenticated && (
          <div className={`mb-4 text-xs p-2 rounded ${
            persistenceStatus === 'active' 
              ? 'text-green-700 bg-green-50 border border-green-200'
              : 'text-blue-700 bg-blue-50 border border-blue-200'
          }`}>
            {persistenceStatus === 'active' 
              ? 'Se guardará automáticamente en tu carrito'
              : 'Puedes comprar sin registrarte'
            }
          </div>
        )}
        
        {/* Botón de agregar al carrito */}
        <button 
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className={`w-full py-3 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            inStock
              ? (!isAuthenticated && persistenceStatus === 'active')
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
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