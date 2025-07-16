// src/pages/error/ForbiddenPage.js
// UBICACIÓN: /gym-frontend/src/pages/error/ForbiddenPage.js
// FUNCIÓN: Página 403 de acceso denegado con información de permisos
// CONECTA CON: AuthContext para información del usuario y permisos

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Home, ArrowLeft, Lock, User, Mail, Dumbbell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ForbiddenPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // 🏠 Obtener ruta del dashboard según rol
  const getDashboardPath = () => {
    if (!isAuthenticated) return '/login';
    
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
  
  // 🎯 Obtener información del rol
  const getRoleInfo = () => {
    if (!user) return { name: 'Usuario', color: 'gray' };
    
    switch (user.role) {
      case 'admin':
        return { name: 'Administrador', color: 'red' };
      case 'colaborador':
        return { name: 'Personal', color: 'blue' };
      case 'cliente':
        return { name: 'Cliente', color: 'green' };
      default:
        return { name: 'Usuario', color: 'gray' };
    }
  };
  
  const roleInfo = getRoleInfo();
  
  // 📋 Obtener páginas disponibles según rol
  const getAvailablePages = () => {
    if (!isAuthenticated) return [];
    
    const basePages = [
      { name: 'Dashboard', path: getDashboardPath() },
      { name: 'Mi Perfil', path: '/dashboard/profile' }
    ];
    
    if (user?.role === 'admin') {
      basePages.push(
        { name: 'Usuarios', path: '/dashboard/users' },
        { name: 'Membresías', path: '/dashboard/memberships' },
        { name: 'Pagos', path: '/dashboard/payments' },
        { name: 'Reportes', path: '/dashboard/reports' },
        { name: 'Configuración', path: '/dashboard/settings' }
      );
    } else if (user?.role === 'colaborador') {
      basePages.push(
        { name: 'Usuarios', path: '/dashboard/users' },
        { name: 'Membresías', path: '/dashboard/memberships' },
        { name: 'Pagos', path: '/dashboard/payments' }
      );
    }
    
    return basePages;
  };
  
  const availablePages = getAvailablePages();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        {/* 🏋️ Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* 🛡️ Icono de acceso denegado */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        {/* 📝 Mensaje principal */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-4">
            403
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos suficientes para acceder a esta página.
          </p>
        </div>
        
        {/* 👤 Información del usuario */}
        {isAuthenticated && user && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.getFullName()}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user.firstName} {user.lastName}
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              
              <div className="flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-500 mr-2" />
                <span className={`text-sm px-2 py-1 rounded-full bg-${roleInfo.color}-100 text-${roleInfo.color}-800`}>
                  {roleInfo.name}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* 🎯 Botones de acción */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver atrás
          </button>
          
          <Link
            to={getDashboardPath()}
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir al inicio
          </Link>
        </div>
        
        {/* 📋 Páginas disponibles */}
        {availablePages.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Páginas disponibles para tu rol
            </h3>
            <div className="space-y-2">
              {availablePages.map((page) => (
                <Link
                  key={page.path}
                  to={page.path}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* 💡 Ayuda adicional */}
        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">
            Si crees que deberías tener acceso a esta página, contacta al administrador.
          </p>
          <p>
            🏋️‍♂️ Cada rol tiene permisos específicos para mantener la seguridad del sistema.
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default ForbiddenPage;