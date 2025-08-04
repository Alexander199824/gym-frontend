// src/pages/dashboard/components/UsersManager.js
// FUNCIÓN: Gestión completa de usuarios - Crear, listar, editar, estadísticas
// CONECTA CON: Backend API /api/users/*

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Eye, UserCheck, UserX,
  Calendar, Phone, Mail, MapPin, AlertCircle, CheckCircle, Loader,
  Download, Upload, RefreshCw, MoreHorizontal, Settings, Star,
  TrendingUp, TrendingDown, Activity, X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const UsersManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // 📊 Estados principales
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🔍 Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // 📄 Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(isMobile ? 10 : 20);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // 🆕 Estados para crear/editar usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'cliente',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: ''
    },
    isActive: true
  });
  
  // 📊 Roles disponibles
  const userRoles = [
    { value: 'cliente', label: 'Cliente', color: 'bg-green-100 text-green-800' },
    { value: 'colaborador', label: 'Personal', color: 'bg-blue-100 text-blue-800' },
    { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-800' }
  ];
  
  // 🔄 CARGAR DATOS
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined,
        sortBy,
        sortOrder
      };
      
      console.log('🔄 Loading users with params:', params);
      
      const response = await apiService.get('/users', { params });
      const userData = response.data || response;
      
      if (userData.users && Array.isArray(userData.users)) {
        setUsers(userData.users);
        setTotalUsers(userData.pagination?.total || userData.users.length);
      } else if (Array.isArray(userData)) {
        setUsers(userData);
        setTotalUsers(userData.length);
      } else {
        console.warn('⚠️ Users data format unexpected:', userData);
        setUsers([]);
        setTotalUsers(0);
      }
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showError('Error al cargar usuarios');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 📊 CARGAR ESTADÍSTICAS - CORREGIDO
  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      console.log('📊 User stats loaded:', stats);
      setUserStats(stats);
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
      // Calcular estadísticas localmente si falla la API
      const totalUsersCount = totalUsers || users.length;
      const activeUsersCount = users.filter(user => user.isActive).length;
      const inactiveUsersCount = totalUsersCount - activeUsersCount;
      const thisMonth = new Date();
      const newUsersThisMonth = users.filter(user => {
        const userDate = new Date(user.createdAt || user.created_at);
        return userDate.getMonth() === thisMonth.getMonth() && 
               userDate.getFullYear() === thisMonth.getFullYear();
      }).length;
      
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      setUserStats({
        totalUsers: totalUsersCount,
        totalActiveUsers: activeUsersCount,
        totalInactiveUsers: inactiveUsersCount,
        roleStats,
        newUsersThisMonth
      });
    }
  };
  
  // ⏰ Cargar datos al montar y cuando cambien filtros
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, selectedRole, selectedStatus, sortBy, sortOrder]);
  
  useEffect(() => {
    if (users.length > 0 || totalUsers > 0) {
      loadUserStats();
    }
  }, [users, totalUsers]);
  
  // 🔍 FILTRAR USUARIOS (para datos locales)
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // 📊 FUNCIONES DE USUARIO
  
  // Crear usuario
  const handleCreateUser = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (!userFormData.firstName.trim() || !userFormData.lastName.trim()) {
        showError('Nombre y apellido son obligatorios');
        return;
      }
      
      if (!userFormData.email.trim()) {
        showError('Email es obligatorio');
        return;
      }
      
      if (!editingUser && !userFormData.password.trim()) {
        showError('Contraseña es obligatoria para usuarios nuevos');
        return;
      }
      
      const userData = {
        ...userFormData,
        emergencyContact: userFormData.emergencyContact.name ? userFormData.emergencyContact : undefined
      };
      
      let response;
      if (editingUser) {
        response = await apiService.put(`/users/${editingUser.id}`, userData);
        showSuccess('Usuario actualizado exitosamente');
      } else {
        response = await apiService.post('/users', userData);
        showSuccess('Usuario creado exitosamente');
      }
      
      // Recargar lista
      await loadUsers();
      await loadUserStats();
      
      // Cerrar modal
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      
      // Notificar cambios guardados
      if (onSave) {
        onSave({ type: 'user', action: editingUser ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('❌ Error saving user:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar usuario';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await apiService.delete(`/users/${userId}`);
      showSuccess('Usuario eliminado exitosamente');
      
      await loadUsers();
      await loadUserStats();
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      showError('Error al eliminar usuario');
    }
  };
  
  // Toggle estado activo
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await apiService.put(`/users/${userId}`, { isActive: !currentStatus });
      showSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      
      await loadUsers();
      await loadUserStats();
      
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      showError('Error al cambiar estado del usuario');
    }
  };
  
  // Reset form
  const resetUserForm = () => {
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'cliente',
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        phone: ''
      },
      isActive: true
    });
  };
  
  // Abrir modal para editar
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '', // No cargar password existente
      phone: user.phone || '',
      role: user.role || 'cliente',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || ''
      },
      isActive: user.isActive !== false
    });
    setShowUserModal(true);
  };
  
  // Abrir modal para crear
  const handleNewUser = () => {
    setEditingUser(null);
    resetUserForm();
    setShowUserModal(true);
  };
  
  // 📊 Obtener color de rol
  const getRoleInfo = (role) => {
    return userRoles.find(r => r.value === role) || userRoles[0];
  };
  
  // 📄 Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));

  // 🎨 Función para truncar texto
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Gestión de Usuarios
          </h3>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => loadUsers()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {hasPermission('create_users') && (
            <button
              onClick={handleNewUser}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>
      
      {/* 📊 ESTADÍSTICAS RÁPIDAS - CORREGIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">
                {userStats.totalUsers || totalUsers || users.length || 0}
              </div>
              <div className="text-sm text-blue-600">Total Usuarios</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">
                {userStats.totalActiveUsers || users.filter(u => u.isActive).length || 0}
              </div>
              <div className="text-sm text-green-600">Activos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-purple-900">
                {userStats.newUsersThisMonth || 0}
              </div>
              <div className="text-sm text-purple-600">Nuevos Este Mes</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-gray-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-gray-900">
                {userStats.totalInactiveUsers || users.filter(u => !u.isActive).length || 0}
              </div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔍 FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filtro por rol */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los roles</option>
            {userRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          
          {/* Filtro por estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          {/* Ordenamiento */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt-desc">Más recientes</option>
            <option value="createdAt-asc">Más antiguos</option>
            <option value="firstName-asc">Nombre A-Z</option>
            <option value="firstName-desc">Nombre Z-A</option>
            <option value="role-asc">Rol A-Z</option>
          </select>
          
        </div>
      </div>
      
      {/* 📋 TABLA DE USUARIOS - SIN SCROLL HORIZONTAL */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando usuarios...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' 
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'Comienza creando tu primer usuario'
              }
            </p>
            {hasPermission('create_users') && (
              <button onClick={handleNewUser} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table - OPTIMIZADA PARA NO SCROLL HORIZONTAL */}
            <div className="hidden md:block">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profileImage ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profileImage}
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-800">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={`${user.firstName} ${user.lastName}`}>
                                {truncateText(`${user.firstName} ${user.lastName}`, 15)}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="truncate" title={user.email}>
                                {truncateText(user.email, 18)}
                              </span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="truncate" title={user.phone}>
                                  {truncateText(user.phone, 12)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              user.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </button>
                        </td>
                        
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {hasPermission('edit_users') && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all hover:scale-105"
                                title="Editar usuario"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                            
                            {hasPermission('delete_users') && user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all hover:scale-105"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                
                return (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {user.profileImage ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={user.profileImage}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-lg font-medium text-blue-800">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                          <div className="flex items-center mt-1 flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {hasPermission('edit_users') && (
                          <button
                            onClick={() => handleEditUser(user)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {hasPermission('delete_users') && user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 📄 PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Mostrando {((currentPage - 1) * usersPerPage) + 1} a {Math.min(currentPage * usersPerPage, totalUsers)} de {totalUsers} usuarios
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      {currentPage} de {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 🆕 MODAL PARA CREAR/EDITAR USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Información básica */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Juan"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Contraseña segura'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+502 1234-5678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {userRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={userFormData.dateOfBirth}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={userFormData.isActive}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>
                
                {/* Contacto de emergencia */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">
                    Contacto de Emergencia
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={userFormData.emergencyContact.name}
                        onChange={(e) => setUserFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="María Pérez"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={userFormData.emergencyContact.phone}
                        onChange={(e) => setUserFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+502 1234-5678"
                      />
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default UsersManager;