// src/pages/store/StorePage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, 
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
  Award
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

// 🛍️ PRODUCTOS EXTENSOS (datos de ejemplo)
const STORE_PRODUCTS = [
  // ROPA DEPORTIVA
  {
    id: 1,
    name: "Camiseta Elite Fitness Pro",
    description: "Camiseta deportiva de alta tecnología con tejido que absorbe la humedad",
    price: 149,
    originalPrice: 199,
    image: "/api/placeholder/400/400",
    category: "ropa",
    subcategory: "camisetas",
    brand: "Elite Sports",
    colors: ["Negro", "Blanco", "Azul", "Gris"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    rating: 4.8,
    reviews: 156,
    features: ["Absorbe humedad", "Antibacterial", "Secado rápido"],
    inStock: true,
    stock: 45
  },
  {
    id: 2,
    name: "Shorts Elite Performance",
    description: "Shorts de entrenamiento con compresión y bolsillos laterales",
    price: 99,
    originalPrice: 129,
    image: "/api/placeholder/400/400",
    category: "ropa",
    subcategory: "shorts",
    brand: "Elite Sports",
    colors: ["Negro", "Gris", "Azul marino", "Verde militar"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 89,
    features: ["Compresión", "Bolsillos", "Elasticidad"],
    inStock: true,
    stock: 32
  },
  {
    id: 3,
    name: "Sudadera Elite Hoodie",
    description: "Sudadera con capucha premium, perfecta para entrenar o uso casual",
    price: 249,
    originalPrice: 299,
    image: "/api/placeholder/400/400",
    category: "ropa",
    subcategory: "sudaderas",
    brand: "Elite Sports",
    colors: ["Negro", "Gris", "Azul", "Burdeos"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.9,
    reviews: 203,
    features: ["Algodón premium", "Capucha ajustable", "Bolsillo canguro"],
    inStock: true,
    stock: 28
  },
  
  // SUPLEMENTOS
  {
    id: 4,
    name: "Proteína Whey Elite Gold",
    description: "Proteína de suero aislada de la más alta calidad - 2.5kg",
    price: 399,
    originalPrice: 459,
    image: "/api/placeholder/400/400",
    category: "suplementos",
    subcategory: "proteinas",
    brand: "Elite Nutrition",
    flavors: ["Vainilla", "Chocolate", "Fresa", "Cookies & Cream", "Banana"],
    rating: 4.9,
    reviews: 342,
    features: ["25g proteína por servida", "Bajo en carbohidratos", "Fácil digestión"],
    inStock: true,
    stock: 67
  },
  {
    id: 5,
    name: "Creatina Monohidratada Elite",
    description: "Creatina pura para máximo rendimiento y fuerza - 500g",
    price: 159,
    originalPrice: 189,
    image: "/api/placeholder/400/400",
    category: "suplementos",
    subcategory: "creatina",
    brand: "Elite Nutrition",
    rating: 4.7,
    reviews: 178,
    features: ["100% pura", "Sin sabor", "Micronizada"],
    inStock: true,
    stock: 89
  },
  {
    id: 6,
    name: "BCAA Elite Recovery",
    description: "Aminoácidos de cadena ramificada para recuperación muscular",
    price: 199,
    originalPrice: 239,
    image: "/api/placeholder/400/400",
    category: "suplementos",
    subcategory: "bcaa",
    brand: "Elite Nutrition",
    flavors: ["Limón", "Sandía", "Uva", "Mango"],
    rating: 4.6,
    reviews: 134,
    features: ["Ratio 2:1:1", "Electrolitos", "Sin azúcar"],
    inStock: true,
    stock: 54
  },
  
  // ACCESORIOS
  {
    id: 7,
    name: "Shaker Elite Pro 750ml",
    description: "Shaker oficial con compartimentos y batidor de acero",
    price: 69,
    originalPrice: 89,
    image: "/api/placeholder/400/400",
    category: "accesorios",
    subcategory: "shakers",
    brand: "Elite Gear",
    colors: ["Negro", "Transparente", "Azul", "Rosa"],
    rating: 4.5,
    reviews: 267,
    features: ["750ml capacidad", "Compartimento pastillas", "Libre de BPA"],
    inStock: true,
    stock: 145
  },
  {
    id: 8,
    name: "Guantes Elite Grip",
    description: "Guantes de entrenamiento con agarre superior y ventilación",
    price: 89,
    originalPrice: 119,
    image: "/api/placeholder/400/400",
    category: "accesorios",
    subcategory: "guantes",
    brand: "Elite Gear",
    sizes: ["S", "M", "L", "XL"],
    rating: 4.4,
    reviews: 98,
    features: ["Agarre superior", "Ventilación", "Muñequera"],
    inStock: true,
    stock: 78
  },
  {
    id: 9,
    name: "Toalla Microfibra Elite",
    description: "Toalla de microfibra ultra absorbente para entrenamientos",
    price: 45,
    originalPrice: 59,
    image: "/api/placeholder/400/400",
    category: "accesorios",
    subcategory: "toallas",
    brand: "Elite Gear",
    colors: ["Negro", "Gris", "Azul", "Verde"],
    rating: 4.3,
    reviews: 156,
    features: ["Ultra absorbente", "Secado rápido", "Compacta"],
    inStock: true,
    stock: 234
  },
  
  // EQUIPAMIENTO
  {
    id: 10,
    name: "Mancuernas Ajustables Elite",
    description: "Set de mancuernas ajustables de 5 a 25kg cada una",
    price: 899,
    originalPrice: 1199,
    image: "/api/placeholder/400/400",
    category: "equipamiento",
    subcategory: "mancuernas",
    brand: "Elite Equipment",
    rating: 4.8,
    reviews: 89,
    features: ["Ajuste rápido", "5-25kg", "Base incluida"],
    inStock: true,
    stock: 12
  },
  {
    id: 11,
    name: "Banda Elástica Set Elite",
    description: "Set completo de bandas elásticas con diferentes resistencias",
    price: 129,
    originalPrice: 159,
    image: "/api/placeholder/400/400",
    category: "equipamiento",
    subcategory: "bandas",
    brand: "Elite Equipment",
    rating: 4.6,
    reviews: 134,
    features: ["5 resistencias", "Manijas ergonómicas", "Anclaje de puerta"],
    inStock: true,
    stock: 67
  },
  {
    id: 12,
    name: "Yoga Mat Elite Premium",
    description: "Esterilla de yoga premium antideslizante con correa",
    price: 159,
    originalPrice: 199,
    image: "/api/placeholder/400/400",
    category: "equipamiento",
    subcategory: "mats",
    brand: "Elite Equipment",
    colors: ["Negro", "Morado", "Verde", "Azul"],
    rating: 4.7,
    reviews: 178,
    features: ["Antideslizante", "6mm grosor", "Correa incluida"],
    inStock: true,
    stock: 45
  }
];

// 📋 CATEGORÍAS
const CATEGORIES = [
  { id: 'all', name: 'Todos los productos', icon: Package },
  { id: 'ropa', name: 'Ropa deportiva', icon: Package },
  { id: 'suplementos', name: 'Suplementos', icon: Package },
  { id: 'accesorios', name: 'Accesorios', icon: Package },
  { id: 'equipamiento', name: 'Equipamiento', icon: Package }
];

const StorePage = () => {
  const { addItem, toggleCart, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 📱 Estados
  const [products, setProducts] = useState(STORE_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState(STORE_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // 🔍 EFECTOS DE FILTRADO
  useEffect(() => {
    let filtered = [...products];
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtrar por precio
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 🔝 HEADER DE LA TIENDA */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🛍️ Tienda Elite Fitness
              </h1>
            </div>
            
            {/* Carrito */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
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
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          
          {/* 📋 SIDEBAR DE CATEGORÍAS */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categorías
              </h3>
              
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <category.icon className="w-4 h-4 mr-3" />
                    {category.name}
                  </button>
                ))}
              </div>
              
              {/* Filtro de precio */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Rango de precio
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Min"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 📦 GRID DE PRODUCTOS */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredProducts.length} productos encontrados
              </p>
            </div>
            
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  viewMode={viewMode}
                  onAddToCart={addItem}
                />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600">
                  Intenta cambiar los filtros o la búsqueda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto
const ProductCard = ({ product, viewMode, onAddToCart }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const handleAddToCart = () => {
    onAddToCart(product, { ...selectedOptions, quantity });
    setSelectedOptions({});
    setQuantity(1);
  };
  
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-6">
        <img 
          src={product.image}
          alt={product.name}
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
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {product.rating} ({product.reviews})
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {product.brand}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">
              Q{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                Q{product.originalPrice}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="btn-primary"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
      
      {/* Imagen del producto */}
      <div className="relative overflow-hidden">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-sm">
              Agotado
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
          <span className="text-sm text-gray-500">{product.brand}</span>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>
        
        {/* Nombre y descripción */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        {/* Características */}
        {product.features && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Opciones */}
        {product.colors && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, color: e.target.value }))}
            >
              <option value="">Seleccionar color</option>
              {product.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}
        
        {product.sizes && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Talla:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, size: e.target.value }))}
            >
              <option value="">Seleccionar talla</option>
              {product.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
        
        {product.flavors && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sabor:
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => setSelectedOptions(prev => ({ ...prev, flavor: e.target.value }))}
            >
              <option value="">Seleccionar sabor</option>
              {product.flavors.map(flavor => (
                <option key={flavor} value={flavor}>{flavor}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Precio */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">Q{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-gray-500 text-sm line-through ml-2">
                Q{product.originalPrice}
              </span>
            )}
          </div>
          
          {/* Control de cantidad */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stock */}
        {product.inStock && (
          <p className="text-xs text-gray-500 mb-4">
            {product.stock} disponibles
          </p>
        )}
        
        {/* Botón de agregar al carrito */}
        <button 
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full py-3 font-semibold rounded-lg transition-colors ${
            product.inStock
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.inStock ? 'Agregar al carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  );
};

export default StorePage;