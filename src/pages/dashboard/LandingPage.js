// src/pages/dashboard/LandingPage.js
// UBICACIÓN: /gym-frontend/src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page principal de Elite Fitness Club antes del login
// CONECTA CON: Páginas de login/register y preparada para e-commerce

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Star, 
  Users, 
  Target, 
  Trophy, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Play,
  Check,
  ShoppingCart,
  Heart,
  Zap,
  Shield,
  Award,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Gift,
  Flame,
  Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
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
  
  // 📊 Datos del gimnasio Elite Fitness
  const gymInfo = {
    name: "Elite Fitness Club",
    tagline: "Transforma tu cuerpo, eleva tu mente",
    phone: "+502 2345-6789",
    email: "info@elitefitness.com",
    address: "Zona 10, Ciudad de Guatemala",
    hours: "Lunes a Viernes: 5:00 AM - 11:00 PM | Sábados y Domingos: 6:00 AM - 10:00 PM",
    social: {
      instagram: "@elitefitness_gt",
      facebook: "Elite Fitness Club Guatemala",
      twitter: "@elitefitness_gt"
    }
  };
  
  // 🎯 Testimonios de clientes reales
  const testimonials = [
    {
      name: "María González",
      role: "Empresaria",
      image: "/api/placeholder/64/64",
      text: "Elite Fitness cambió mi vida completamente. Los entrenadores son increíbles y el ambiente es motivador. He perdido 15 kilos en 6 meses.",
      rating: 5,
      location: "Zona 10"
    },
    {
      name: "Carlos Mendoza",
      role: "Ingeniero",
      image: "/api/placeholder/64/64", 
      text: "Llevo 2 años entrenando aquí y es el mejor gimnasio de la ciudad. Equipos de última generación y personal altamente capacitado.",
      rating: 5,
      location: "Zona 15"
    },
    {
      name: "Ana Rodríguez",
      role: "Doctora",
      image: "/api/placeholder/64/64",
      text: "El personal es muy profesional y siempre están dispuestos a ayudar. Las instalaciones son impecables. Recomendado 100%.",
      rating: 5,
      location: "Zona 13"
    }
  ];
  
  // 🏋️ Servicios principales
  const services = [
    {
      icon: Dumbbell,
      title: "Entrenamiento Personalizado",
      description: "Planes diseñados específicamente para tus objetivos con entrenadores certificados",
      color: "primary",
      features: ["Evaluación inicial", "Plan personalizado", "Seguimiento semanal"]
    },
    {
      icon: Users,
      title: "Clases Grupales",
      description: "Crossfit, Yoga, Zumba, Spinning, Pilates y muchas más opciones",
      color: "secondary", 
      features: ["20+ clases diferentes", "Horarios flexibles", "Todos los niveles"]
    },
    {
      icon: Target,
      title: "Nutrición Deportiva",
      description: "Asesoría nutricional personalizada con nutricionistas especializados",
      color: "success",
      features: ["Plan nutricional", "Recetas saludables", "Seguimiento mensual"]
    },
    {
      icon: Trophy,
      title: "Competencias y Eventos",
      description: "Participa en eventos, competencias y desafíos mensuales",
      color: "warning",
      features: ["Competencias mensuales", "Premios y reconocimientos", "Comunidad activa"]
    }
  ];
  
  // 💪 Estadísticas del gym
  const stats = [
    { number: "2000+", label: "Miembros Activos", icon: Users },
    { number: "50+", label: "Entrenadores Certificados", icon: Award },
    { number: "15+", label: "Años de Experiencia", icon: Trophy },
    { number: "98%", label: "Satisfacción Cliente", icon: Star }
  ];
  
  // 🛍️ Productos destacados (preparado para e-commerce)
  const featuredProducts = [
    {
      id: 1,
      name: "Proteína Whey Elite",
      price: 299,
      originalPrice: 399,
      image: "/api/placeholder/300/300",
      rating: 4.8,
      reviews: 124,
      badge: "Más Vendido",
      badgeColor: "bg-danger-500"
    },
    {
      id: 2,
      name: "Pre-Entreno Explosion",
      price: 199,
      originalPrice: 249,
      image: "/api/placeholder/300/300",
      rating: 4.9,
      reviews: 89,
      badge: "Nuevo",
      badgeColor: "bg-primary-500"
    },
    {
      id: 3,
      name: "BCAA Recovery Plus",
      price: 159,
      originalPrice: 199,
      image: "/api/placeholder/300/300",
      rating: 4.7,
      reviews: 156,
      badge: "Oferta",
      badgeColor: "bg-success-500"
    }
  ];
  
  // 💳 Planes de membresía
  const membershipPlans = [
    {
      name: "Básico",
      price: 299,
      duration: "mes",
      originalPrice: 399,
      features: [
        "Acceso a área de pesas",
        "Clases grupales básicas",
        "Casillero incluido",
        "Horario completo",
        "Evaluación inicial"
      ],
      color: "gray",
      popular: false,
      icon: Shield
    },
    {
      name: "Premium",
      price: 499,
      duration: "mes", 
      originalPrice: 699,
      features: [
        "Todo lo del plan Básico",
        "Entrenamiento personalizado",
        "Acceso a todas las clases",
        "Nutricionista incluido",
        "Descuento 15% en productos",
        "Área VIP"
      ],
      color: "primary",
      popular: true,
      icon: Crown
    },
    {
      name: "Elite",
      price: 799,
      duration: "mes",
      originalPrice: 999,
      features: [
        "Todo lo del plan Premium",
        "Entrenador personal dedicado",
        "Acceso VIP 24/7",
        "Masajes de recuperación",
        "Productos gratuitos mensuales",
        "Parking gratis",
        "Invitados ilimitados"
      ],
      color: "secondary",
      popular: false,
      icon: Flame
    }
  ];
  
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
      
      {/* 🔝 NAVBAR FLOTANTE */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white bg-opacity-95 backdrop-blur-lg shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="container-elite">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Elite Fitness */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-elite-gradient rounded-xl flex items-center justify-center shadow-elite">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-gray-800">
                {gymInfo.name}
              </span>
            </div>
            
            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
                Inicio
              </a>
              <a href="#servicios" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
                Servicios
              </a>
              <a href="#planes" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
                Planes
              </a>
              <a href="#tienda" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
                Tienda
              </a>
              <a href="#contacto" className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200">
                Contacto
              </a>
            </div>
            
            {/* Botones de acción */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="btn-ghost">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary">
                <Gift className="w-4 h-4 mr-2" />
                Únete Gratis
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-4">
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
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link to="/login" className="block w-full btn-ghost text-center">
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
      
      {/* 🏠 HERO SECTION ÉPICO */}
      <section id="inicio" className="relative pt-16 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-primary-50 overflow-hidden">
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary-500 bg-opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary-500 bg-opacity-10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-elite relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Contenido Hero */}
            <div className="space-y-8 fade-in">
              
              {/* Badge de bienvenida */}
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
                <Flame className="w-4 h-4 text-primary-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  El gimnasio #1 de Guatemala
                </span>
              </div>
              
              {/* Título principal */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 leading-tight">
                  Transforma tu{' '}
                  <span className="text-gradient-elite">
                    cuerpo
                  </span>
                </h1>
                <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 leading-tight">
                  eleva tu{' '}
                  <span className="text-gradient-reverse">
                    mente
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-xl">
                  Únete a la comunidad fitness más elite de Guatemala. 
                  Entrenamiento personalizado, equipos de última generación 
                  y resultados garantizados.
                </p>
              </div>
              
              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary btn-xl hover-scale">
                  <Gift className="w-6 h-6 mr-3" />
                  Primera Semana GRATIS
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
                <button className="btn-outline btn-xl hover-scale">
                  <Play className="w-5 h-5 mr-3" />
                  Ver Instalaciones
                </button>
              </div>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <stat.icon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Imagen/Video Hero */}
            <div className="relative hover-lift">
              <div className="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/api/placeholder/600/450" 
                  alt="Elite Fitness Club - Instalaciones"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-elite-gradient opacity-20"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 hover:scale-110">
                    <Play className="w-8 h-8 text-primary-600 ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Elementos flotantes */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center animate-pulse-elite shadow-elite">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center shadow-magenta">
                <Heart className="w-10 h-10 text-white" />
              </div>
              
              {/* Tarjeta flotante de beneficios */}
              <div className="absolute top-8 -left-8 bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Primera semana</div>
                    <div className="text-success-600 font-bold">GRATIS</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* 🏋️ SERVICIOS PREMIUM */}
      <section id="servicios" className="section-padding bg-white">
        <div className="container-elite">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-semibold text-primary-700">
                Servicios Premium
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Todo lo que necesitas para{' '}
              <span className="text-gradient-elite">triunfar</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Servicios diseñados para llevarte al siguiente nivel con la mejor tecnología y profesionales certificados
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card-elite hover-lift hover-glow text-center p-8 group">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-${service.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className={`w-10 h-10 text-${service.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {service.description}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center justify-center">
                      <Check className="w-4 h-4 text-success-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* 💳 PLANES DE MEMBRESÍA */}
      <section id="planes" className="section-padding bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="container-elite">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-secondary-50 rounded-full mb-6">
              <Crown className="w-4 h-4 text-secondary-600 mr-2" />
              <span className="text-sm font-semibold text-secondary-700">
                Planes Exclusivos
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Elige tu plan{' '}
              <span className="text-gradient-elite">ideal</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Planes diseñados para diferentes objetivos y estilos de vida. Todos incluyen garantía de resultados.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipPlans.map((plan, index) => (
              <div key={index} className={`
                card relative transition-all duration-300 hover-lift
                ${plan.popular 
                  ? 'ring-2 ring-primary-500 scale-105 shadow-elite-lg' 
                  : 'hover:scale-105 hover-glow'
                }
              `}>
                
                {/* Badge popular */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-elite-gradient text-white px-6 py-2 rounded-full text-sm font-bold shadow-elite">
                      🔥 Más Popular
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  {/* Icono del plan */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-${plan.color}-100 flex items-center justify-center`}>
                    <plan.icon className={`w-8 h-8 text-${plan.color}-600`} />
                  </div>
                  
                  {/* Nombre y precio */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {plan.name}
                    </h3>
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
                      <span className="ml-2 text-success-600 font-semibold">
                        Ahorra Q{plan.originalPrice - plan.price}
                      </span>
                    </div>
                  </div>
                  
                  {/* Características */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-success-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA */}
                  <Link 
                    to="/register"
                    className={`
                      w-full btn text-center font-semibold
                      ${plan.popular ? 'btn-primary' : 'btn-outline'}
                    `}
                  >
                    {plan.popular ? '🔥 Elegir Plan Popular' : 'Elegir Plan'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Garantía */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              <Shield className="w-5 h-5 text-success-500 mr-3" />
              <span className="text-sm font-semibold text-gray-700">
                Garantía de satisfacción 30 días o te devolvemos tu dinero
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* 🛍️ TIENDA PREVIEW (E-COMMERCE PREPARADO) */}
      <section id="tienda" className="section-padding bg-white">
        <div className="container-elite">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-warning-50 rounded-full mb-6">
              <ShoppingCart className="w-4 h-4 text-warning-600 mr-2" />
              <span className="text-sm font-semibold text-warning-700">
                Tienda Elite - Próximamente
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Suplementos{' '}
              <span className="text-gradient-elite">Premium</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los mejores suplementos y productos fitness, próximamente disponibles en nuestra tienda online
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {featuredProducts.map((product) => (
              <div key={product.id} className="card hover-lift overflow-hidden group">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badge */}
                  {product.badge && (
                    <span className={`absolute top-4 left-4 ${product.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                      {product.badge}
                    </span>
                  )}
                  {/* Wishlist */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  {/* Overlay de "Próximamente" */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-semibold">Próximamente</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <div className="flex text-warning-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.reviews} reseñas)
                    </span>
                  </div>
                  
                  {/* Precio */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        Q{product.price}
                      </span>
                      <span className="text-gray-500 line-through">
                        Q{product.originalPrice}
                      </span>
                    </div>
                  </div>
                  
                  {/* CTA deshabilitado */}
                  <button 
                    disabled
                    className="w-full btn-secondary opacity-50 cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Próximamente
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA tienda completa */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 border border-primary-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🚀 Tienda Online en Desarrollo
              </h3>
              <p className="text-gray-600 mb-6">
                Estamos preparando una experiencia de compra increíble con los mejores productos fitness del mercado
              </p>
              <button className="btn-outline btn-lg opacity-50 cursor-not-allowed" disabled>
                Notificarme cuando esté lista
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* 💬 TESTIMONIOS DINÁMICOS */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-secondary-50">
        <div className="container-elite">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-success-50 rounded-full mb-6">
              <Star className="w-4 h-4 text-success-600 mr-2" />
              <span className="text-sm font-semibold text-success-700">
                Historias Reales
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Lo que dicen nuestros{' '}
              <span className="text-gradient-elite">campeones</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="card p-8 md:p-12 text-center relative overflow-hidden">
              
              {/* Decoración */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500 bg-opacity-10 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary-500 bg-opacity-10 rounded-full translate-x-20 translate-y-20"></div>
              
              <div className="relative z-10">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <img 
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-200"
                  />
                </div>
                
                {/* Rating */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-warning-500 fill-current" />
                  ))}
                </div>
                
                {/* Testimonio */}
                <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed font-medium">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                
                {/* Autor */}
                <div>
                  <div className="font-bold text-gray-900 text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Indicadores */}
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
      
      {/* 📞 CONTACTO Y CTA FINAL */}
      <section id="contacto" className="section-padding bg-elite-gradient text-white relative overflow-hidden">
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white bg-opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-white bg-opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-elite relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Información y contacto */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
                  ¿Listo para la{' '}
                  <span className="text-yellow-300">
                    transformación?
                  </span>
                </h2>
                <p className="text-xl text-white opacity-90 leading-relaxed">
                  Únete a Elite Fitness Club hoy mismo y comienza tu journey hacia la mejor versión de ti. 
                  Primera semana completamente gratis.
                </p>
              </div>
              
              {/* Información de contacto */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Ubicación</div>
                    <div className="opacity-90">{gymInfo.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Teléfono</div>
                    <div className="opacity-90">{gymInfo.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="opacity-90">{gymInfo.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Horarios</div>
                    <div className="opacity-90 text-sm">{gymInfo.hours}</div>
                  </div>
                </div>
              </div>
              
              {/* Redes sociales */}
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all hover:scale-110">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all hover:scale-110">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all hover:scale-110">
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            {/* CTA principal */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-20">
              <h3 className="text-3xl font-bold mb-6">
                🎉 Oferta Especial de Lanzamiento
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <Check className="w-6 h-6 text-green-400 mr-3" />
                  <span>Primera semana completamente gratis</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-6 h-6 text-green-400 mr-3" />
                  <span>Evaluación física completa incluida</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-6 h-6 text-green-400 mr-3" />
                  <span>Plan de entrenamiento personalizado</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-6 h-6 text-green-400 mr-3" />
                  <span>Consulta nutricional gratis</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-6 h-6 text-green-400 mr-3" />
                  <span>Sin compromisos ni penalizaciones</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <Link to="/register" className="w-full btn bg-white text-primary-600 hover:bg-gray-100 btn-lg font-bold">
                  🚀 Registrarse GRATIS Ahora
                </Link>
                <Link to="/login" className="w-full btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
                  Ya soy miembro
                </Link>
              </div>
              
              <div className="mt-6 text-center text-sm opacity-80">
                ⭐ Más de 2000 miembros satisfechos • 98% tasa de satisfacción
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* 🔽 FOOTER ELITE */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container-elite">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Logo y descripción */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-elite-gradient rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="font-display font-bold text-xl">
                  {gymInfo.name}
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                El gimnasio más elite de Guatemala. Transformamos vidas a través del fitness, 
                la nutrición y una comunidad excepcional.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Enlaces rápidos */}
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
            
            {/* Servicios */}
            <div>
              <h3 className="font-semibold mb-6 text-lg">Nuestros Servicios</h3>
              <ul className="space-y-3">
                <li><span className="text-gray-400">Entrenamiento Personal</span></li>
                <li><span className="text-gray-400">Clases Grupales</span></li>
                <li><span className="text-gray-400">Nutrición Deportiva</span></li>
                <li><span className="text-gray-400">Competencias</span></li>
                <li><span className="text-gray-400">Área VIP 24/7</span></li>
              </ul>
            </div>
            
            {/* Contacto */}
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contáctanos</h3>
              <ul className="space-y-3">
                <li className="text-gray-400">{gymInfo.phone}</li>
                <li className="text-gray-400">{gymInfo.email}</li>
                <li className="text-gray-400">{gymInfo.address}</li>
                <li className="text-gray-400 text-sm">{gymInfo.hours}</li>
              </ul>
            </div>
            
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 {gymInfo.name}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage;