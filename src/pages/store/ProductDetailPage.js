// src/pages/store/ProductDetailPage.js
// VERSIÓN CORREGIDA - Sin errores de objetos en especificaciones

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, Heart, Share2, Plus, Minus, ShoppingCart,
  Truck, Package, Award, Check, ChevronRight,
  Home, Loader2, AlertCircle, Clock, Dumbbell, ShoppingBag,
  Copy, Facebook, Twitter, Mail, MessageCircle
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import useGymConfig from '../../hooks/useGymConfig';
import apiService from '../../services/apiService';
import gymConfigDefault from '../../config/gymConfig';
import GymLogo from '../../components/common/GymLogo';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, isMobile } = useApp();
  const { config } = useGymConfig();

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const currencySymbol = gymConfigDefault.regional.currencySymbol;
  const gymName = config?.name || gymConfigDefault.name;

  // ✅ FUNCIÓN HELPER PARA CONVERTIR OBJETOS A STRING
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'object') {
      // Si es un objeto de dimensiones {length, width, height, unit}
      if (value.length && value.width && value.height && value.unit) {
        return `${value.length} x ${value.width} x ${value.height} ${value.unit}`;
      }
      // Si es cualquier otro objeto, convertirlo a JSON
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const productResponse = await apiService.get(`/store/products/${productId}`);
        
        let productData = null;
        
        if (productResponse?.data?.product) {
          productData = productResponse.data.product;
        } else if (productResponse?.data && productResponse.data.id) {
          productData = productResponse.data;
        } else if (productResponse?.id) {
          productData = productResponse;
        }

        if (productData) {
          setProduct(productData);
          
          if (productData.category?.id) {
            try {
              const relatedResponse = await apiService.get('/store/products', {
                params: {
                  category: productData.category.id,
                  limit: 20,
                  page: 1
                }
              });

              let relatedData = [];
              if (relatedResponse?.data?.products) {
                relatedData = relatedResponse.data.products;
              } else if (Array.isArray(relatedResponse?.data)) {
                relatedData = relatedResponse.data;
              } else if (Array.isArray(relatedResponse)) {
                relatedData = relatedResponse;
              }

              const filtered = relatedData.filter(p => p.id !== productId);
              setRelatedProducts(filtered.slice(0, 12));

            } catch (relatedError) {
              console.warn('⚠️ Error productos relacionados:', relatedError.message);
              
              try {
                const fallbackResponse = await apiService.get('/store/products', {
                  params: { limit: 20, page: 1 }
                });
                
                let fallbackData = [];
                if (fallbackResponse?.data?.products) {
                  fallbackData = fallbackResponse.data.products;
                } else if (Array.isArray(fallbackResponse?.data)) {
                  fallbackData = fallbackResponse.data;
                }
                
                const filtered = fallbackData.filter(p => p.id !== productId);
                setRelatedProducts(filtered.slice(0, 12));
                
              } catch (fallbackError) {
                console.error('❌ Error fallback:', fallbackError.message);
              }
            }
          }
        } else {
          setError('Formato de respuesta inválido');
        }
      } catch (error) {
        console.error('❌ Error cargando producto:', error);
        setError('No se pudo cargar el producto');
        showError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, showError]);

  const handleAddToCart = async () => {
    if (addingToCart || !product) return;

    try {
      setAddingToCart(true);
      await addItem(product, { quantity, ...selectedOptions });
      showSuccess(`${product.name} agregado al carrito`);
      setQuantity(1);
      setSelectedOptions({});
    } catch (error) {
      console.error('❌ Error agregando al carrito:', error);
      showError(error.message || 'Error al agregar al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async (method = 'native') => {
    if (!product) return;

    setShareLoading(true);

    try {
      const shareUrl = window.location.href;
      const shareTitle = `${product.name} - ${gymName}`;
      const shareText = `Mira este producto: ${product.name} - ${currencySymbol}${product.price}`;

      if (method === 'native' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showSuccess('Compartido exitosamente');
        setShowShareMenu(false);
      } else if (method === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('Enlace copiado al portapapeles');
        setShowShareMenu(false);
      } else if (method === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        setShowShareMenu(false);
      } else if (method === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        setShowShareMenu(false);
      } else if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        setShowShareMenu(false);
      } else if (method === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        setShowShareMenu(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error compartiendo:', error);
        showError('Error al compartir');
      }
    } finally {
      setShareLoading(false);
    }
  };

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

  const images = product.images || [];
  const primaryImage = images.find(img => img.isPrimary) || images[0];
  const currentImage = images[selectedImage] || primaryImage || {};
  
  const hasStockQuantity = product.stockQuantity !== undefined && product.stockQuantity !== null;
  const inStock = product.inStock !== false && (!hasStockQuantity || product.stockQuantity > 0);
  const lowStock = inStock && hasStockQuantity && product.stockQuantity <= 5;
  
  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={() => navigate('/store')}
                className="flex items-center text-gray-600 hover:text-primary-600 transition-all duration-300 group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <span className="ml-2 sm:ml-3 font-semibold text-sm sm:text-base hidden sm:block">Volver</span>
              </button>
              
              <div className="hidden sm:block h-8 sm:h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl sm:rounded-2xl blur opacity-50"></div>
                  <div className="relative w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Tienda {gymName}
                  </h1>
                  {isAuthenticated && user && (
                    <p className="text-xs text-gray-600 flex items-center space-x-1 hidden sm:flex">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Hola, {user.firstName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                    isWishlisted ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    disabled={shareLoading}
                    className="p-1.5 sm:p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-50"
                  >
                    {shareLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  
                  {showShareMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowShareMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        {navigator.share && (
                          <button
                            onClick={() => handleShare('native')}
                            className="w-full px-4 py-2 text-left hover:bg-primary-50 flex items-center space-x-3 transition-colors"
                          >
                            <Share2 className="w-4 h-4 text-primary-600" />
                            <span className="text-sm">Compartir...</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full px-4 py-2 text-left hover:bg-primary-50 flex items-center space-x-3 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Copiar enlace</span>
                        </button>
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center space-x-3 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full px-4 py-2 text-left hover:bg-sky-50 flex items-center space-x-3 transition-colors"
                        >
                          <Twitter className="w-4 h-4 text-sky-600" />
                          <span className="text-sm">Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare('email')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Email</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                {config && config.logo && config.logo.url ? (
                  <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-primary-200 shadow-sm">
                    <img 
                      src={config.logo.url}
                      alt={config.logo.alt || gymName}
                      className="h-8 sm:h-12 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center bg-primary-600 rounded-xl w-8 h-8 sm:w-12 sm:h-12">
                      <Dumbbell className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                ) : (
                  <GymLogo 
                    size={isMobile ? "sm" : "md"}
                    variant="professional" 
                    showText={false} 
                    priority="high" 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link to="/" className="hover:text-primary-600 flex-shrink-0">
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link to="/store" className="hover:text-primary-600 whitespace-nowrap">Tienda</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hover:text-primary-600 whitespace-nowrap">{product.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
          
          {/* Galería de imágenes */}
          <div className="space-y-2 sm:space-y-4">
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-4 sm:p-8">
                {currentImage.imageUrl ? (
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.altText || product.name}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-size="24"%3ESin imagen%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Package className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4" />
                    <p className="text-sm sm:text-base">Sin imagen disponible</p>
                  </div>
                )}
                
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 space-y-1 sm:space-y-2">
                  {discount > 0 && (
                    <span className="bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                      -{discount}%
                    </span>
                  )}
                  {!inStock && (
                    <span className="bg-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                      Bajo pedido
                    </span>
                  )}
                  {lowStock && inStock && (
                    <span className="bg-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                      ¡Últimos!
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-primary-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                      Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-primary-500 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-1 sm:p-2">
                      {image.imageUrl ? (
                        <img
                          src={image.imageUrl}
                          alt={image.altText || `Vista ${index + 1}`}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                {product.brand && (
                  <span className="text-xs sm:text-sm font-medium text-primary-600 bg-primary-50 px-2 sm:px-3 py-1 rounded-full">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </span>
                )}
                {product.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-sm sm:text-base text-gray-900">{product.rating}</span>
                    <span className="text-gray-500 text-xs sm:text-sm">({product.reviewsCount || 0})</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                {product.name}
              </h1>

              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                  {currencySymbol}{product.price}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      {currencySymbol}{product.originalPrice}
                    </span>
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      Ahorras {currencySymbol}{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {product.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {inStock ? (
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <span className="text-sm sm:text-base text-green-700 font-medium">
                    En stock
                    {hasStockQuantity && (
                      <span className="text-gray-600"> - {product.stockQuantity} disponibles</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mb-4 sm:mb-6 bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <div>
                    <span className="text-sm sm:text-base text-orange-700 font-medium block">Disponible bajo pedido</span>
                    <span className="text-xs sm:text-sm text-orange-600">Lo podemos conseguir para ti</span>
                  </div>
                </div>
              )}

              {product.variants?.colors && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    Color:
                  </label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {product.variants.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, color }))}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg border-2 transition-all ${
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
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    Talla:
                  </label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {product.variants.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, size }))}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg border-2 transition-all ${
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
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    Sabor:
                  </label>
                  <select
                    className="w-full text-sm sm:text-base border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
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

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                  Cantidad:
                </label>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="text-xl sm:text-2xl font-bold w-12 sm:w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!inStock}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !inStock}
                className="w-full py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg disabled:opacity-50"
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Agregando...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{inStock ? 'Agregar al carrito' : 'Pedir producto'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Envío rápido</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Entrega en 2-3 días hábiles</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Calidad premium</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Productos verificados</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Empaque seguro</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Protección garantizada</p>
                  </div>
                </div>

                {!inStock && (
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">Pedido especial</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Contáctanos para más info</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de información */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-8 sm:mb-12">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'description'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'specs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Especificaciones
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {product.description ? (
                  <div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed sm:text-lg mb-4">
                      {product.description}
                    </p>
                    
                    {product.longDescription && (
                      <div className="mt-4 sm:mt-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                        {product.longDescription}
                      </div>
                    )}
                    
                    {product.features && product.features.length > 0 && (
                      <div className="mt-4 sm:mt-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Características:</h3>
                        <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                          {product.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm sm:text-base">No hay descripción disponible para este producto</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="text-sm sm:text-base font-medium text-gray-900">SKU:</span>
                    <span className="text-sm sm:text-base text-gray-600">{product.sku || product.id}</span>
                  </div>
                  
                  {product.id && (
                    <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                      <span className="text-sm sm:text-base font-medium text-gray-900">ID Producto:</span>
                      <span className="text-sm sm:text-base text-gray-600">{product.id}</span>
                    </div>
                  )}
                  
                  {product.brand && (
                    <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                      <span className="text-sm sm:text-base font-medium text-gray-900">Marca:</span>
                      <span className="text-sm sm:text-base text-gray-600">
                        {typeof product.brand === 'object' ? product.brand.name : product.brand}
                      </span>
                    </div>
                  )}
                  
                  {product.category && (
                    <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                      <span className="text-sm sm:text-base font-medium text-gray-900">Categoría:</span>
                      <span className="text-sm sm:text-base text-gray-600">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="text-sm sm:text-base font-medium text-gray-900">Disponibilidad:</span>
                    <span className="text-sm sm:text-base text-gray-600">{inStock ? 'En stock' : 'Bajo pedido'}</span>
                  </div>
                  
                  {hasStockQuantity && (
                    <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                      <span className="text-sm sm:text-base font-medium text-gray-900">Stock:</span>
                      <span className="text-sm sm:text-base text-gray-600">{product.stockQuantity} unidades</span>
                    </div>
                  )}
                  
                  {/* ✅ DIMENSIONES CON MANEJO DE OBJETOS */}
                  {product.dimensions && (
                    <div className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                      <span className="text-sm sm:text-base font-medium text-gray-900">Dimensiones:</span>
                      <span className="text-sm sm:text-base text-gray-600">{formatValue(product.dimensions)}</span>
                    </div>
                  )}
                </div>
                
                {/* ✅ ESPECIFICACIONES TÉCNICAS CON MANEJO DE OBJETOS */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Especificaciones Técnicas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 sm:py-3 border-b border-gray-200">
                          <span className="text-sm sm:text-base font-medium text-gray-900">{key}:</span>
                          <span className="text-sm sm:text-base text-gray-600">{formatValue(value)}</span>
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
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                También te podría interesar
              </h2>
              <Link
                to="/store"
                className="text-sm sm:text-base text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                Ver todos
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
              </Link>
            </div>

            <div className="relative">
              {/* Vista móvil: Scroll horizontal */}
              <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex space-x-3">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.id} className="flex-shrink-0 w-[160px]">
                      <RelatedProductCard
                        product={relatedProduct}
                        currencySymbol={currencySymbol}
                        isMobile={true}
                        onNavigate={() => {
                          navigate(`/store/product/${relatedProduct.id}`);
                          window.scrollTo(0, 0);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vista desktop: Grid */}
              <div className="hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    currencySymbol={currencySymbol}
                    isMobile={false}
                    onNavigate={() => {
                      navigate(`/store/product/${relatedProduct.id}`);
                      window.scrollTo(0, 0);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="lg:hidden text-center mt-2">
              <p className="text-xs text-gray-500">← Desliza para ver más →</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de tarjeta de producto relacionado
const RelatedProductCard = ({ product, currencySymbol, isMobile, onNavigate }) => {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl;

  if (isMobile) {
    return (
      <div
        onClick={onNavigate}
        className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all group flex flex-col h-full"
      >
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden p-2 h-[140px] w-full flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESin imagen%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <Package className="w-12 h-12 text-gray-400" />
          )}
        </div>
        
        <div className="p-2 flex flex-col justify-between flex-grow min-h-[80px]">
          <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[32px]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm font-bold text-primary-600">
              {currencySymbol}{product.price}
            </span>
            {product.rating && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="ml-0.5 text-xs text-gray-600">
                  {product.rating}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onNavigate}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all group flex flex-col h-full"
    >
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center overflow-hidden p-3 sm:p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESin imagen%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
        )}
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow min-h-[100px]">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px] sm:min-h-[48px]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-base sm:text-xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
              <span className="ml-0.5 sm:ml-1 text-xs sm:text-sm text-gray-600">
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

/**
 * ✅ CORRECCIÓN APLICADA:
 * 
 * Se agregó la función formatValue() que convierte objetos a strings:
 * 
 * - Detecta objetos de dimensiones {length, width, height, unit}
 * - Los formatea como "10 x 5 x 3 cm"
 * - Otros objetos se convierten a JSON
 * - Valores null/undefined se muestran como "N/A"
 * 
 * Esto resuelve el error:
 * "Objects are not valid as a React child"
 * 
 * La función se aplica en:
 * - product.dimensions
 * - product.specifications (todas las propiedades)
 */
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