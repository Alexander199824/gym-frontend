// src/components/layout/Header.js
// UBICACIÓN: /gym-frontend/src/components/layout/Header.js
// FUNCIÓN: Barra superior del dashboard con navegación y acciones del usuario
// CONECTA CON: AuthContext, AppContext, componentes de notificación
// MEJORAS: ✅ Logout mejorado sin errores ✅ Manejo robusto de errores

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo'; // 🔧 USAR EL COMPONENTE CORRECTO

const Header = ({ onToggleMobileMenu, onToggleNotifications }) => {
  const { user, logout } = useAuth();
  const { 
    isMobile, 
    toggleSidebar, 
    notifications, 
    theme, 
    setTheme,
    formatDate,
    showSuccess,
    showError
  } = useApp();
  
  const navigate = useNavigate();
  
  // 📱 Estados locales
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ Estado para logout
  
  // 🎯 Referencias
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  
  // 🔄 Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 🔍 Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      searchRef.current?.blur();
    }
  };
  
  // 🎨 Cambiar tema
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  // ✅ FUNCIÓN MEJORADA: Manejar logout robusto sin errores
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      console.log('🔐 Header: Iniciando logout...');
      
      // ✅ Limpiar datos locales ANTES del logout
      try {
        localStorage.removeItem('elite_fitness_cart');
        localStorage.removeItem('elite_fitness_session_id');
        localStorage.removeItem('elite_fitness_wishlist');
        console.log('🧹 Header: Datos locales limpiados');
      } catch (localStorageError) {
        console.warn('⚠️ Header: Error limpiando localStorage:', localStorageError);
      }
      
      // ✅ Llamar al logout del contexto con timeout
      const logoutPromise = logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Header logout timeout')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('✅ Header: Logout exitoso');
      showSuccess && showSuccess('Sesión cerrada correctamente');
      
      // ✅ Redireccionar después de logout exitoso
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ Header: Error durante logout:', error);
      
      // ✅ FALLBACK ROBUSTO: Forzar limpieza y redirección
      try {
        // Limpiar todo el localStorage y sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('🔄 Header: Forzando redirección después de error...');
        showError && showError('Cerrando sesión...');
        
        // Forzar redirección inmediata
        window.location.href = '/login';
        
      } catch (fallbackError) {
        console.error('❌ Header: Error en fallback:', fallbackError);
        // Último recurso: recargar página
        window.location.reload();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // 🔔 Notificaciones no leídas
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // 👤 Información del usuario
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  
  // 🎯 Rol del usuario con colores
  const getRoleConfig = (role) => {
    const configs = {
      admin: { label: 'Administrador', color: 'bg-secondary-100 text-secondary-800' },
      colaborador: { label: 'Personal', color: 'bg-primary-100 text-primary-800' },
      cliente: { label: 'Cliente', color: 'bg-success-100 text-success-800' }
    };
    return configs[role] || configs.cliente;
  };
  
  const roleConfig = getRoleConfig(user?.role);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
      
      {/* 🏠 LADO IZQUIERDO - Logo y navegación */}
      <div className="flex items-center space-x-4">
        
        {/* 📱 Botón de menú móvil */}
        {isMobile ? (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* 🏋️ Logo del gimnasio - CORREGIDO */}
        <GymLogo size="md" variant="professional" showText={true} />
        
      </div>
      
      {/* 🔍 CENTRO - Barra de búsqueda */}
      <div className="flex-1 max-w-lg mx-4 hidden md:block">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar usuarios, membresías, pagos..."
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl border transition-all duration-200
                ${searchFocused 
                  ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                focus:outline-none
              `}
            />
          </div>
          
          {/* 🔍 Sugerencias de búsqueda (futuro) */}
          {searchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-elite mt-1 z-50">
              <div className="p-3 text-sm text-gray-500">
                Presiona Enter para buscar "{searchQuery}"
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* 👤 LADO DERECHO - Acciones del usuario */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {/* 🎨 Botón de tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {/* 🔔 Notificaciones */}
        <div className="relative">
          <button
            onClick={onToggleNotifications}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
        
        {/* 👤 Menú de usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 bg-elite-gradient rounded-full flex items-center justify-center shadow-sm">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={userDisplayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {userInitials}
                </span>
              )}
            </div>
            
            {/* Información del usuario */}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900">
                {userDisplayName}
              </div>
              <div className="text-xs text-gray-500">
                {roleConfig.label}
              </div>
            </div>
            
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* 📋 Dropdown del menú de usuario */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-elite z-50">
              
              {/* 📊 Información del usuario */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-elite-gradient rounded-full flex items-center justify-center">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={userDisplayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {userDisplayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.color} mt-1`}>
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 🔗 Enlaces del menú */}
              <div className="py-2">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Mi Perfil
                </Link>
                
                <Link
                  to="/dashboard/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Configuración
                </Link>
                
                <div className="border-t border-gray-200 my-2" />
                
                {/* ✅ BOTÓN DE LOGOUT MEJORADO */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 mr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      </div>
                      Cerrando sesión...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
      
    </header>
  );
};

export default Header;