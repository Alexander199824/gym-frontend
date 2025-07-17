// src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page MEJORADA - más limpia, ordenada y profesional
// CONECTA CON: Configuración desde .env, diseño serio pero atractivo
// src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page MEJORADA con tienda integrada y sin necesidad de login

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Star, Users, Target, Trophy, Clock, MapPin, Phone, Mail,
  Instagram, Facebook, Twitter, Youtube, MessageCircle, Play, Check,
  Shield, Award, ArrowRight, Menu, X, Gift, Zap, Heart, Crown,
  ChevronRight, ShoppingCart, Package, Truck, CreditCard, Eye,
  Filter, Search, Plus, Minus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useGymConfig } from '../../hooks/useGymConfig';
import GymLogo from '../../components/common/GymLogo';

// 🛍️ PRODUCTOS DESTACADOS PARA LANDING
const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "Proteína Whey Elite Gold",
    description: "Proteína de suero aislada premium - 2.5kg",
    price: 399,
    originalPrice: 459,
    image: "/api/placeholder/300/300",
    category: "suplementos",
    rating: 4.9,
    reviews: 342,
    badge: "Más vendido"
  },
  {
    id: 2,
    name: "Camiseta Elite Fitness Pro",
    description: "Camiseta deportiva con tecnología de absorción",
    price: 149,
    originalPrice: 199,
    image: "/api/placeholder/300/300",
    category: "ropa",
    rating: 4.8,
    reviews: 156,
    badge: "Nuevo"
  },
  {
    id: 3,
    name: "Shaker Elite Pro 750ml",
    description: "Shaker oficial con compartimentos",
    price: 69,
    originalPrice: 89,
    image: "/api/placeholder/300/300",
    category: "accesorios",
    rating: 4.5,
    reviews: 267,
    badge: "Oferta"
  }
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { addItem, itemCount, toggleCart } = useCart();
  const navigate = useNavigate();
  const gymConfig = useGymConfig();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showStorePreview, setShowStorePreview] = useState(false);
  
  // 🔄 Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // 📱 Detectar scroll para navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 📊 Estadísticas principales
  const stats = [
    { number: gymConfig.stats.members, label: "Miembros Activos", icon: Users },
    { number: gymConfig.stats.trainers, label: "Entrenadores", icon: Award },
    { number: gymConfig.stats.experience, label: "Años de Experiencia", icon: Trophy },
    { number: gymConfig.stats.satisfaction, label: "Satisfacción", icon: Star }
  ];
  
  // 🏋️ Servicios principales
  const services = [
    {
      icon: Dumbbell,
      title: "Entrenamiento Personalizado",
      description: "Planes diseñados específicamente para tus objetivos",
      features: ["Evaluación inicial", "Plan personalizado", "Seguimiento semanal"]
    },
    {
      icon: Users,
      title: "Clases Grupales",
      description: "Variedad de clases para todos los niveles",
      features: ["Múltiples disciplinas", "Horarios flexibles", "Instructores certificados"]
    },
    {
      icon: Target,
      title: "Nutrición Deportiva",
      description: "Asesoría nutricional especializada",
      features: ["Plan nutricional", "Consultas personalizadas", "Seguimiento"]
    }
  ];
  
  // 💳 Planes de membresía
  const membershipPlans = [
    {
      name: "Básico",
      price: 299,
      originalPrice: 399,
      duration: "mes",
      features: [
        "Acceso a área de pesas",
        "Clases grupales básicas",
        "Casillero incluido",
        "Horario completo"
      ],
      popular: false,
      icon: Shield
    },
    {
      name: "Premium",
      price: 499,
      originalPrice: 699,
      duration: "mes",
      features: [
        "Todo lo del plan Básico",
        "Entrenamiento personalizado",
        "Acceso a todas las clases",
        "Nutricionista incluido",
        "Área VIP"
      ],
      popular: true,
      icon: Crown
    }
  ];
  
  // 💬 Testimonios
  const testimonials = [
    {
      name: "María González",
      role: "Empresaria",
      text: "Excelente gimnasio, instalaciones modernas y personal muy profesional. He visto resultados increíbles.",
      rating: 5
    },
    {
      name: "Carlos Mendoza",
      role: "Ingeniero",
      text: "El mejor gimnasio de la ciudad. Equipos de última generación y ambiente muy motivador.",
      rating: 5
    }
  ];
  
  // 🔗 Función para obtener icono de red social
  const getSocialIcon = (platform) => {
    const icons = {
      instagram: Instagram,
      facebook: Facebook,
      twitter: Twitter,
      youtube: Youtube,
      whatsapp: MessageCircle
    };
    return icons[platform] || Star;
  };
  
  // 🎯 Cambiar testimonial automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => 
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white">
      
      {/* 🔝 NAVBAR FLOTANTE - CON CARRITO */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white bg-opacity-95 backdrop-blur-lg shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <GymLogo size="md" variant="professional" showText={true} />
            
            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Inicio
              </a>
              <a href="#servicios" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Servicios
              </a>
              <a href="#planes" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Planes
              </a>
              <a href="#tienda" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Tienda
              </a>
              <a href="#contacto" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Contacto
              </a>
            </div>
            
            {/* Botones de acción + Carrito */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Carrito */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              
              <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                <Gift className="w-4 h-4 mr-2" />
                Únete Gratis
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Carrito móvil */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#inicio" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
                Inicio
              </a>
              <a href="#servicios" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
                Servicios
              </a>
              <a href="#planes" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
                Planes
              </a>
              <a href="#tienda" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
                Tienda
              </a>
              <a href="#contacto" className="block text-gray-600 hover:text-primary-600 font-medium py-2">
                Contacto
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link to="/login" className="block w-full btn-secondary text-center">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="block w-full btn-primary text-center">
                  <Gift className="w-4 h-4 mr-2" />
                  Únete Gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* 🏠 HERO SECTION */}
      <section id="inicio" className="relative pt-20 pb-24 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Elementos decorativos sutiles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500 bg-opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-500 bg-opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Contenido Hero */}
            <div className="space-y-10">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
                <Zap className="w-4 h-4 text-primary-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {gymConfig.tagline}
                </span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Bienvenido a{' '}
                  <span className="text-primary-600">
                    {gymConfig.name}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {gymConfig.description}
                </p>
              </div>
              
              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all">
                  <Gift className="w-5 h-5 mr-3" />
                  Primera Semana GRATIS
                </Link>
                <button 
                  onClick={() => setShowStorePreview(true)}
                  className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-all"
                >
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  Ver Tienda
                </button>
              </div>
              
            </div>
            
            {/* Imagen Hero */}
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/api/placeholder/600/450" 
                  alt={`${gymConfig.name} - Instalaciones`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 hover:scale-110 shadow-xl">
                    <Play className="w-8 h-8 text-primary-600 ml-1" />
                  </button>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* 📊 Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-16 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* 🛍️ SECCIÓN DE TIENDA DESTACADA */}
      <section id="tienda" className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header de tienda */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-6">
              <ShoppingCart className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-semibold text-primary-700">
                Tienda Elite Fitness
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Productos{' '}
              <span className="text-primary-600">premium</span>{' '}
              para tu entrenamiento
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubre nuestra selección de suplementos, ropa deportiva y accesorios de la más alta calidad
            </p>
            
            {/* Benefits de comprar */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Truck className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Envío gratis +Q200</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Shield className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Garantía de calidad</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Award className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Productos originales</span>
              </div>
            </div>
          </div>
          
          {/* Grid de productos destacados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductPreviewCard 
                key={product.id} 
                product={product} 
                onAddToCart={addItem}
              />
            ))}
          </div>
          
          {/* CTA para ver tienda completa */}
          <div className="text-center">
            <Link 
              to="/store"
              className="btn-primary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all"
            >
              Ver tienda completa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* 🏋️ SERVICIOS */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-semibold text-primary-700">
                Nuestros Servicios
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Todo lo que necesitas para{' '}
              <span className="text-primary-600">alcanzar tus metas</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Servicios profesionales diseñados para llevarte al siguiente nivel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {services.map((service, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-all duration-300">
                  <service.icon className="w-10 h-10 text-primary-600" />
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
                
                <ul className="text-sm text-gray-500 space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* 💳 PLANES */}
      <section id="planes" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-secondary-50 rounded-full mb-6">
              <Crown className="w-4 h-4 text-secondary-600 mr-2" />
              <span className="text-sm font-semibold text-secondary-700">
                Planes de Membresía
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Elige tu plan{' '}
              <span className="text-primary-600">ideal</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Planes diseñados para diferentes objetivos y estilos de vida
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {membershipPlans.map((plan, index) => (
              <div key={index} className={`
                relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-300
                ${plan.popular 
                  ? 'ring-2 ring-primary-500 scale-105' 
                  : 'hover:scale-105'
                }
              `}>
                
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                      🔥 Más Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <plan.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Plan {plan.name}
                  </h3>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-bold text-gray-900">
                        Q{plan.price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{plan.duration}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="line-through">Q{plan.originalPrice}</span>
                      <span className="ml-2 text-green-600 font-semibold">
                        Ahorra Q{plan.originalPrice - plan.price}
                      </span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    to="/register"
                    className={`
                      w-full btn text-center font-semibold py-4
                      ${plan.popular ? 'btn-primary' : 'btn-secondary'}
                    `}
                  >
                    {plan.popular ? '🔥 Elegir Plan Popular' : 'Elegir Plan'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              <Shield className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm font-semibold text-gray-700">
                Garantía de satisfacción 30 días
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* 💬 TESTIMONIOS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full mb-6">
              <Star className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm font-semibold text-yellow-700">
                Testimonios
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Lo que dicen nuestros{' '}
              <span className="text-primary-600">miembros</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-3xl p-12 text-center">
              <div className="flex justify-center mb-8">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl md:text-3xl text-gray-700 mb-8 leading-relaxed font-medium">
                "{testimonials[currentTestimonial].text}"
              </blockquote>
              
              <div>
                <div className="font-bold text-gray-900 text-xl">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentTestimonial].role}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-primary-500 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* 📞 CONTACTO */}
      <section id="contacto" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  ¿Listo para comenzar?
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Únete a {gymConfig.name} y comienza tu transformación hoy mismo.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Ubicación</div>
                    <div className="text-gray-300">{gymConfig.contact.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Teléfono</div>
                    <div className="text-gray-300">{gymConfig.contact.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Horarios</div>
                    <div className="text-gray-300 text-sm">{gymConfig.hours.full}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                {Object.entries(gymConfig.social).map(([platform, data]) => {
                  if (!data.url) return null;
                  const IconComponent = getSocialIcon(platform);
                  
                  return (
                    <a 
                      key={platform}
                      href={data.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center hover:bg-opacity-20 transition-all hover:scale-110"
                      title={data.handle}
                    >
                      <IconComponent className="w-6 h-6" />
                    </a>
                  );
                })}
              </div>
            </div>
            
            {/* CTA Card */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-10 border border-white border-opacity-20">
              <h3 className="text-3xl font-bold mb-8">
                🎉 Primera Semana GRATIS
              </h3>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Evaluación física completa</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Plan de entrenamiento personalizado</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Acceso a todas las instalaciones</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Sin compromisos</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <Link to="/register" className="w-full btn bg-white text-gray-900 hover:bg-gray-100 py-4 font-bold text-lg">
                  🚀 Registrarse GRATIS
                </Link>
                <Link to="/login" className="w-full btn btn-secondary border-white text-white hover:bg-white hover:text-gray-900 py-4">
                  Ya soy miembro
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* 🔽 FOOTER */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-6">
              <GymLogo size="lg" variant="white" showText={true} />
              <p className="text-gray-400 leading-relaxed">
                {gymConfig.description}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Enlaces Rápidos</h3>
              <ul className="space-y-3">
                <li><a href="#inicio" className="text-gray-400 hover:text-white transition-colors">Inicio</a></li>
                <li><a href="#servicios" className="text-gray-400 hover:text-white transition-colors">Servicios</a></li>
                <li><a href="#planes" className="text-gray-400 hover:text-white transition-colors">Planes</a></li>
                <li><a href="#tienda" className="text-gray-400 hover:text-white transition-colors">Tienda</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Tienda</h3>
              <ul className="space-y-3">
                <li><Link to="/store?category=suplementos" className="text-gray-400 hover:text-white transition-colors">Suplementos</Link></li>
                <li><Link to="/store?category=ropa" className="text-gray-400 hover:text-white transition-colors">Ropa Deportiva</Link></li>
                <li><Link to="/store?category=accesorios" className="text-gray-400 hover:text-white transition-colors">Accesorios</Link></li>
                <li><Link to="/store?category=equipamiento" className="text-gray-400 hover:text-white transition-colors">Equipamiento</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contáctanos</h3>
              <ul className="space-y-3">
                <li className="text-gray-400">{gymConfig.contact.phone}</li>
                <li className="text-gray-400">{gymConfig.contact.email}</li>
                <li className="text-gray-400">{gymConfig.contact.address}</li>
              </ul>
              
              <div className="flex space-x-4 mt-6">
                {Object.entries(gymConfig.social).map(([platform, data]) => {
                  if (!data.url) return null;
                  const IconComponent = getSocialIcon(platform);
                  
                  return (
                    <a 
                      key={platform}
                      href={data.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
            
          </div>
          
          <div className="border-t border-gray-700 pt-8 mt-12 text-center">
            <p className="text-gray-400">
              &copy; 2024 {gymConfig.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      
      {/* 🛍️ MODAL DE VISTA PREVIA DE TIENDA */}
      {showStorePreview && (
        <StorePreviewModal 
          onClose={() => setShowStorePreview(false)}
          products={FEATURED_PRODUCTS}
          onAddToCart={addItem}
        />
      )}
      
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto para landing
const ProductPreviewCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    onAddToCart(product, { quantity });
    setQuantity(1);
  };
  
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
      
      <div className="relative overflow-hidden">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {product.badge && (
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </span>
          )}
        </div>
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-primary-600 font-medium">{product.category}</span>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">Q{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-gray-500 text-sm line-through ml-2">
                Q{product.originalPrice}
              </span>
            )}
          </div>
          
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
        
        <button 
          onClick={handleAddToCart}
          className="w-full btn-primary py-3 font-semibold"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

// 🛍️ COMPONENTE: Modal de vista previa de tienda
const StorePreviewModal = ({ onClose, products, onAddToCart }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            🛍️ Vista previa de la tienda
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <ProductPreviewCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              to="/store"
              onClick={onClose}
              className="btn-primary px-8 py-4 text-lg font-semibold"
            >
              Ver tienda completa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;