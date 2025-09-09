// src/pages/error/NotFoundPage.js
// Autor: Alexander Echeverria
// Archivo: src/pages/error/NotFoundPage.js

// FUNCION: Página 404 personalizada para Elite Fitness Club
// CONECTA CON: Navegación general del sitio

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Dumbbell,
  MapPin,
  Clock,
  Users,
  Star,
  Compass,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Obtener ruta del dashboard según rol
  const getDashboardPath = () => {
    if (!isAuthenticated) return '/';
    
    switch (user?.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'colaborador':
        return '/dashboard/staff';
      case 'cliente':
        return '/dashboard/client';
      default:
        return '/dashboard';
    }
  };
  
  // Páginas sugeridas según el estado del usuario
  const getSuggestedPages = () => {
    const baseSuggestions = [
      { 
        name: 'Inicio', 
        path: '/', 
        icon: Home,
        description: 'Volver a la página principal'
      }
    ];
    
    if (isAuthenticated) {
      baseSuggestions.push(
        { 
          name: 'Mi Dashboard', 
          path: getDashboardPath(), 
          icon: Users,
          description: 'Tu panel personal'
        }
      );
      
      if (user?.role === 'admin') {
        baseSuggestions.push(
          { 
            name: 'Gestión de Usuarios', 
            path: '/dashboard/users', 
            icon: Users,
            description: 'Administrar usuarios'
          },
          { 
            name: 'Reportes', 
            path: '/dashboard/reports', 
            icon: Star,
            description: 'Ver estadísticas'
          }
        );
      } else if (user?.role === 'colaborador') {
        baseSuggestions.push(
          { 
            name: 'Membresías', 
            path: '/dashboard/memberships', 
            icon: Star,
            description: 'Gestionar membresías'
          },
          { 
            name: 'Pagos', 
            path: '/dashboard/payments', 
            icon: Star,
            description: 'Procesar pagos'
          }
        );
      }
    } else {
      baseSuggestions.push(
        { 
          name: 'Iniciar Sesión', 
          path: '/login', 
          icon: Users,
          description: 'Acceder a tu cuenta'
        },
        { 
          name: 'Registrarse', 
          path: '/register', 
          icon: Star,
          description: 'Crear cuenta nueva'
        }
      );
    }
    
    return baseSuggestions;
  };
  
  const suggestedPages = getSuggestedPages();
  
  // Simulación de búsqueda
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simular búsqueda
    setTimeout(() => {
      setIsSearching(false);
      // Aquí podrías implementar búsqueda real
      console.log('Búsqueda:', searchQuery);
    }, 1500);
  };
  
  // Elementos animados
  const [floatingElements, setFloatingElements] = useState([]);
  
  useEffect(() => {
    // Generar elementos flotantes decorativos
    const elements = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 10 + 5
    }));
    setFloatingElements(elements);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* Elementos decorativos flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute bg-primary-500 bg-opacity-10 rounded-full animate-pulse"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              animationDuration: `${element.duration}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl w-full text-center relative z-10">
        
        {/* Logo Elite Fitness */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-elite-gradient rounded-3xl flex items-center justify-center shadow-elite animate-pulse-elite">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
        </div>
        
        {/* Error 404 */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-display font-bold text-gradient-elite mb-4">
            404
          </h1>
          <div className="flex items-center justify-center mb-6">
            <Compass className="w-8 h-8 text-gray-400 mr-3" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-800">
              Página no encontrada
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Parece que te has perdido en el gimnasio. Esta página no existe o ha sido movida a otro lugar.
          </p>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="mb-12 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar páginas, usuarios, membresías..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isSearching}
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="mt-4 w-full btn-primary"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>
        
        {/* Botones de acción principales */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline btn-lg hover-scale"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver atrás
          </button>
          
          <Link
            to={getDashboardPath()}
            className="btn-primary btn-lg hover-scale"
          >
            <Home className="w-5 h-5 mr-2" />
            {isAuthenticated ? 'Ir al Dashboard' : 'Ir al Inicio'}
          </Link>
        </div>
        
        {/* Páginas sugeridas */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8">
            Páginas que podrían interesarte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedPages.map((page, index) => (
              <Link
                key={index}
                to={page.path}
                className="card hover-lift hover-glow p-6 group transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <page.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {page.name}
                    </h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 group-hover:text-gray-700">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Información del gimnasio */}
        <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white border-opacity-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Ubicación</h4>
              <p className="text-sm text-gray-600">Zona 10, Ciudad de Guatemala</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-secondary-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Horarios</h4>
              <p className="text-sm text-gray-600">Lun-Vie: 5AM-11PM<br />Sáb-Dom: 6AM-10PM</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Miembros</h4>
              <p className="text-sm text-gray-600">2000+ miembros activos</p>
            </div>
          </div>
        </div>
        
        {/* Ayuda adicional */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿Necesitas ayuda? Nuestro equipo está aquí para apoyarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+50223456789" 
              className="btn-ghost hover-scale"
            >
              +502 2345-6789
            </a>
            <a 
              href="mailto:info@elitefitness.com" 
              className="btn-ghost hover-scale"
            >
              info@elitefitness.com
            </a>
          </div>
        </div>
        
        {/* Enlaces útiles del footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              Inicio
            </Link>
            {!isAuthenticated && (
              <>
                <Link to="/login" className="hover:text-primary-600 transition-colors">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="hover:text-primary-600 transition-colors">
                  Registrarse
                </Link>
              </>
            )}
            <a href="#" className="hover:text-primary-600 transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-primary-600 transition-colors">
              Soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Esta página de error NotFoundPage proporciona una experiencia elegante y útil cuando los usuarios
acceden a URLs que no existen (Error 404). Está diseñada específicamente para Elite Fitness Club
con elementos visuales atractivos, navegación contextual y información útil del gimnasio.

FUNCIONALIDAD PRINCIPAL:
- Página 404 personalizada con diseño moderno y elementos animados
- Navegación contextual basada en el estado de autenticación del usuario
- Barra de búsqueda integrada para ayudar a encontrar contenido
- Páginas sugeridas específicas según el rol del usuario
- Información del gimnasio (ubicación, horarios, miembros)
- Enlaces de contacto y navegación útiles
- Elementos decorativos flotantes para mejorar la experiencia visual

ARCHIVOS A LOS QUE SE CONECTA:
- ../../contexts/AuthContext: Contexto de autenticación para determinar estado del usuario
- react-router-dom: Para navegación y enlaces entre páginas
- lucide-react: Biblioteca de iconos para elementos visuales
- Sistema de rutas de la aplicación (dashboard, login, register, etc.)

EXPERIENCIA POR TIPO DE USUARIO:
- Usuario no autenticado: Sugerencias para inicio, login y registro
- Cliente: Acceso a dashboard personal y perfil
- Colaborador: Acceso a gestión de membresías y pagos
- Administrador: Acceso a gestión de usuarios y reportes

ELEMENTOS VISUALES:
- Logo animado del gimnasio con icono de pesas
- Número 404 grande con gradiente elegante
- Elementos flotantes decorativos con animaciones
- Tarjetas de páginas sugeridas con efectos hover
- Sección de información del gimnasio con iconos
- Barra de búsqueda funcional con indicador de carga

FUNCIONALIDAD DE BUSQUEDA:
- Búsqueda simulada con indicador de carga
- Placeholder que sugiere tipos de contenido buscable
- Validación de entrada y estados de carga
- Preparado para implementar búsqueda real

INFORMACION DEL GIMNASIO:
- Ubicación: Zona 10, Ciudad de Guatemala
- Horarios detallados de operación
- Cantidad de miembros activos
- Información de contacto (teléfono y email)

NAVEGACION Y ACCESIBILIDAD:
- Botones claramente etiquetados para volver atrás
- Enlaces contextuales según permisos del usuario
- Footer con enlaces útiles y legales
- Diseño responsivo para diferentes dispositivos
- Efectos hover y transiciones suaves

Esta página transforma un error común en una oportunidad de engagement,
proporcionando valor al usuario incluso cuando no encuentra lo que buscaba,
y mantiene la imagen profesional y moderna de Elite Fitness Club.
*/