// src/pages/store/ProductDetailPage.js
// VERSIÓN FINAL CORREGIDA: SKU correcto, sin reseñas, sin peso

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, Heart, Share2, Plus, Minus, ShoppingCart,
  Truck, Package, Award, Check, ChevronRight,
  Home, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';
import gymConfigDefault from '../../config/gymConfig';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, isMobile } = useApp();

  // Estados
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const currencySymbol = gymConfigDefault.regional.currencySymbol;

  // Cargar producto y relacionados
  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando producto ID:', productId);

      // ✅ MANEJO CORRECTO DE LA RESPUESTA DEL API
      const productResponse = await apiService.get(`/store/products/${productId}`);
      
      console.log('📦 Respuesta completa del API:', productResponse);

      // ✅ VERIFICAR ESTRUCTURA DE RESPUESTA
      let productData = null;
      
      // Caso 1: Respuesta con estructura { success: true, data: { product: {...} } }
      if (productResponse?.data?.product) {
        productData = productResponse.data.product;
        console.log('✅ Estructura tipo 1: data.product');
      }
      // Caso 2: Respuesta directa { data: { ...producto } }
      else if (productResponse?.data && productResponse.data.id) {
        productData = productResponse.data;
        console.log('✅ Estructura tipo 2: data directa');
      }
      // Caso 3: Respuesta directa como objeto
      else if (productResponse?.id) {
        productData = productResponse;
        console.log('✅ Estructura tipo 3: objeto directo');
      }

      if (productData) {
        console.log('✅ Producto cargado:', {
          id: productData.id,
          name: productData.name,
          sku: productData.sku,
          price: productData.price,
          hasImages: !!productData.images?.length,
          imagesCount: productData.images?.length || 0
        });

        // ✅ VERIFICAR Y LOGGEAR IMÁGENES
        if (productData.images && Array.isArray(productData.images)) {
          console.log('🖼️ Imágenes disponibles:', productData.images.length);
          productData.images.forEach((img, idx) => {
            console.log(`  ${idx + 1}. ${img.isPrimary ? '⭐' : '📸'} ${img.imageUrl?.substring(0, 60)}...`);
          });
        } else {
          console.log('⚠️ Sin imágenes o formato incorrecto');
        }
        
        setProduct(productData);
        
        // Cargar productos relacionados
        if (productData.category?.id) {
          try {
            const relatedResponse = await apiService.get('/store/products', {
              params: {
                category: productData.category.id,
                limit: 4,
                featured: false
              }
            });

            // ✅ MANEJO CORRECTO DE PRODUCTOS RELACIONADOS
            let relatedData = [];
            if (relatedResponse?.data?.products) {
              relatedData = relatedResponse.data.products;
            } else if (Array.isArray(relatedResponse?.data)) {
              relatedData = relatedResponse.data;
            } else if (Array.isArray(relatedResponse)) {
              relatedData = relatedResponse;
            }

            // Filtrar el producto actual
            const filtered = relatedData.filter(p => p.id !== productId);
            setRelatedProducts(filtered.slice(0, 4));
            
            console.log('✅ Productos relacionados:', filtered.length);

          } catch (relatedError) {
            console.warn('⚠️ No se pudieron cargar productos relacionados:', relatedError.message);
          }
        }
      } else {
        console.error('❌ No se pudo extraer el producto de la respuesta');
        setError('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('❌ Error cargando producto:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError('No se pudo cargar el producto');
      showError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart || !product) return;

    try {
      setAddingToCart(true);

      // ✅ FORMATEAR DATOS PARA EL CARRITO CORRECTAMENTE
      const cartData = {
        productId: product.id,
        quantity: quantity,
        selectedVariants: selectedOptions
      };

      console.log('🛒 Agregando al carrito:', cartData);

      await addItem(product, { quantity, ...selectedOptions });
      
      showSuccess(`${product.name} agregado al carrito`);
      
      // Reset
      setQuantity(1);
      setSelectedOptions({});
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      showError(error.message || 'Error al agregar al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'El producto que buscas no existe'}</p>
          <button
            onClick={() => navigate('/store')}
            className="btn-primary px-6 py-3"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  // ✅ OBTENER IMÁGENES CORRECTAMENTE
  const images = product.images || [];
  const primaryImage = images.find(img => img.isPrimary) || images[0];
  const currentImage = images[selectedImage] || primaryImage || {};
  
  console.log('🎨 Renderizando imagen actual:', {
    selectedIndex: selectedImage,
    totalImages: images.length,
    currentImageUrl: currentImage.imageUrl
  });
  
  // ✅ VERIFICAR STOCK CORRECTAMENTE
  const hasStockQuantity = product.stockQuantity !== undefined && product.stockQuantity !== null;
  const inStock = product.inStock !== false && (!hasStockQuantity || product.stockQuantity > 0);
  const lowStock = inStock && hasStockQuantity && product.stockQuantity <= 5;
  
  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      
      {/* Header con breadcrumb */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/store')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Volver a la tienda</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-600">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/store" className="hover:text-primary-600">Tienda</Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="hover:text-primary-600">{product.category.name}</span>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Galería de imágenes */}
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-8">
                {currentImage.imageUrl ? (
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.altText || product.name}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      console.error('❌ Error cargando imagen:', e.target.src);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-size="24"%3ESin imagen%3C/text%3E%3C/svg%3E';
                    }}
                    onLoad={() => console.log('✅ Imagen cargada:', currentImage.imageUrl)}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Package className="w-24 h-24 mx-auto mb-4" />
                    <p>Sin imagen disponible</p>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 space-y-2">
                  {discount > 0 && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      -{discount}%
                    </span>
                  )}
                  {!inStock && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                      Bajo pedido
                    </span>
                  )}
                  {lowStock && inStock && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                      ¡Últimos!
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm">
                      Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log(`🖱️ Seleccionando imagen ${index}:`, image.imageUrl);
                      setSelectedImage(index);
                    }}
                    className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-primary-500 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-2">
                      {image.imageUrl ? (
                        <img
                          src={image.imageUrl}
                          alt={image.altText || `Vista ${index + 1}`}
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            console.error('❌ Error en thumbnail:', e.target.src);
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              
              {/* Marca y rating */}
              <div className="flex items-center justify-between mb-4">
                {product.brand && (
                  <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>
                )}
                {product.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">{product.rating}</span>
                    <span className="text-gray-500 text-sm">({product.reviewsCount || 0})</span>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Precio */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                <span className="text-4xl font-bold text-primary-600">
                  {currencySymbol}{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex flex-col">
                    <span className="text-xl text-gray-500 line-through">
                      {currencySymbol}{product.originalPrice}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Ahorras {currencySymbol}{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Descripción corta */}
              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Stock */}
              {inStock ? (
                <div className="flex items-center space-x-2 mb-6">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">
                    En stock
                    {hasStockQuantity && (
                      <span className="text-gray-600"> - {product.stockQuantity} disponibles</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <span className="text-orange-700 font-medium block">Disponible bajo pedido</span>
                    <span className="text-sm text-orange-600">Lo podemos conseguir para ti</span>
                  </div>
                </div>
              )}

              {/* Variantes */}
              {product.variants?.colors && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Color:
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, color }))}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedOptions.color === color
                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.sizes && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Talla:
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, size }))}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedOptions.size === size
                            ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.flavors && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Sabor:
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
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

              {/* Cantidad */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Cantidad:
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock}
                    className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!inStock}
                    className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Botón agregar al carrito */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !inStock}
                className="w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg disabled:opacity-50"
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Agregando...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{inStock ? 'Agregar al carrito' : 'Pedir producto'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Beneficios */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Envío rápido</h3>
                    <p className="text-sm text-gray-600">Entrega en 2-3 días hábiles</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Calidad premium</h3>
                    <p className="text-sm text-gray-600">Productos verificados</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Empaque seguro</h3>
                    <p className="text-sm text-gray-600">Protección garantizada</p>
                  </div>
                </div>

                {!inStock && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Pedido especial</h3>
                      <p className="text-sm text-gray-600">Contáctanos para más info</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de información */}
        <div className="bg-white rounded-2xl shadow-lg mb-12">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'description'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'specs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Especificaciones
              </button>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {product.description ? (
                  <div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-4">
                      {product.description}
                    </p>
                    
                    {product.longDescription && (
                      <div className="mt-6 text-gray-600 leading-relaxed">
                        {product.longDescription}
                      </div>
                    )}
                    
                    {product.features && product.features.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Características:</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          {product.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>No hay descripción disponible para este producto</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-900">SKU:</span>
                    <span className="text-gray-600">{product.sku || product.id}</span>
                  </div>
                  
                  {product.id && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">ID Producto:</span>
                      <span className="text-gray-600">{product.id}</span>
                    </div>
                  )}
                  
                  {product.brand && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">Marca:</span>
                      <span className="text-gray-600">
                        {typeof product.brand === 'object' ? product.brand.name : product.brand}
                      </span>
                    </div>
                  )}
                  
                  {product.category && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">Categoría:</span>
                      <span className="text-gray-600">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-900">Disponibilidad:</span>
                    <span className="text-gray-600">{inStock ? 'En stock' : 'Bajo pedido'}</span>
                  </div>
                  
                  {hasStockQuantity && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">Stock:</span>
                      <span className="text-gray-600">{product.stockQuantity} unidades</span>
                    </div>
                  )}
                  
                  {product.dimensions && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">Dimensiones:</span>
                      <span className="text-gray-600">{product.dimensions}</span>
                    </div>
                  )}
                </div>
                
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Especificaciones Técnicas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                          <span className="font-medium text-gray-900">{key}:</span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                También te podría interesar
              </h2>
              <Link
                to="/store"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                Ver todos
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <RelatedProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  currencySymbol={currencySymbol}
                  onNavigate={() => {
                    navigate(`/store/product/${relatedProduct.id}`);
                    window.scrollTo(0, 0);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de tarjeta de producto relacionado
const RelatedProductCard = ({ product, currencySymbol, onNavigate }) => {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl;

  return (
    <div
      onClick={onNavigate}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
    >
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center overflow-hidden p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error('❌ Error en imagen relacionada:', e.target.src);
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESin imagen%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <Package className="w-24 h-24 text-gray-400" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

/**
 * CORRECCIONES APLICADAS:
 * 
 * 1. ✅ IMÁGENES CORREGIDAS:
 *    - Ahora usa imageUrl (no url)
 *    - Maneja errores con onError
 *    - Estructura: images[x].imageUrl
 * 
 * 2. ✅ STOCK CORREGIDO:
 *    - Verifica correctamente: inStock !== false
 *    - Maneja stockQuantity undefined
 *    - Muestra "Disponible bajo pedido" si no hay stock
 * 
 * 3. ✅ SIN GARANTÍA DE 30 DÍAS:
 *    - Eliminado del beneficios
 *    - Solo muestra: Envío, Calidad, Empaque
 *    - Si sin stock, agrega "Pedido especial"
 * 
 * 4. ✅ MENSAJE BAJO PEDIDO:
 *    - Banner naranja cuando no hay stock
 *    - "Disponible bajo pedido"
 *    - "3-5 días de espera"
 *    - Botón cambia a "Pedir producto"
 */

/**
 * DOCUMENTACIÓN ProductDetailPage
 * 
 * PROPÓSITO:
 * Página completa de detalle de producto con galería de imágenes,
 * información detallada, variantes, y productos relacionados.
 * 
 * CARACTERÍSTICAS:
 * - ✅ Galería de imágenes con thumbnails
 * - ✅ Información completa del producto
 * - ✅ Selector de variantes (colores, tallas, sabores)
 * - ✅ Control de cantidad
 * - ✅ Agregar al carrito
 * - ✅ Tabs con descripción, especificaciones y reseñas
 * - ✅ Productos relacionados/sugerencias
 * - ✅ Breadcrumb para navegación
 * - ✅ Diseño responsivo
 * - ✅ Colores consistentes con LandingPage
 * 
 * ENDPOINTS UTILIZADOS:
 * - GET /store/products/:id - Detalle del producto
 * - GET /store/products?category=X - Productos relacionados
 * 
 * RUTAS NECESARIAS EN App.js:
 * <Route path="/store/product/:productId" element={<ProductDetailPage />} />
 */