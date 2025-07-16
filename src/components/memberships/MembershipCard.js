// src/components/memberships/MembershipCard.js
// UBICACIÓN: /gym-frontend/src/components/memberships/MembershipCard.js
// FUNCIÓN: Componente para mostrar información de membresías
// USADO EN: ClientDashboard, páginas de membresías

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const MembershipCard = ({ 
  membership, 
  showActions = false,
  isOwner = false,
  onRenew = null,
  onCancel = null,
  onEdit = null,
  className = ''
}) => {
  const { formatCurrency, formatDate } = useApp();
  
  // 📅 Calcular días hasta vencimiento
  const getDaysUntilExpiry = (endDate) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysUntilExpiry = getDaysUntilExpiry(membership.endDate);
  
  // 🎯 Estado de la membresía
  const getStatusConfig = () => {
    switch (membership.status) {
      case 'active':
        if (daysUntilExpiry < 0) {
          return {
            label: 'Vencida',
            color: 'red',
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: XCircle
          };
        } else if (daysUntilExpiry <= 3) {
          return {
            label: 'Por vencer',
            color: 'yellow',
            bg: 'bg-yellow-50',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            icon: AlertCircle
          };
        } else if (daysUntilExpiry <= 7) {
          return {
            label: 'Vence pronto',
            color: 'orange',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: Clock
          };
        } else {
          return {
            label: 'Activa',
            color: 'green',
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle
          };
        }
      case 'expired':
        return {
          label: 'Vencida',
          color: 'red',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: XCircle
        };
      case 'suspended':
        return {
          label: 'Suspendida',
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: AlertCircle
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: XCircle
        };
      default:
        return {
          label: 'Desconocido',
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: AlertCircle
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  
  // 📊 Progreso de la membresía
  const calculateProgress = () => {
    const start = new Date(membership.startDate);
    const end = new Date(membership.endDate);
    const now = new Date();
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    
    return Math.min((usedDays / totalDays) * 100, 100);
  };
  
  const progress = calculateProgress();

  return (
    <div className={`
      bg-white rounded-lg shadow-lg border ${statusConfig.border} p-6 
      transition-all duration-200 hover:shadow-xl
      ${className}
    `}>
      
      {/* 📊 HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${statusConfig.bg}
          `}>
            <CreditCard className={`w-5 h-5 ${statusConfig.text}`} />
          </div>
          
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Membresía {membership.type === 'monthly' ? 'Mensual' : 'Diaria'}
            </h3>
            <p className="text-sm text-gray-600">
              ID: {membership.id.slice(-8)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <statusConfig.icon className={`w-5 h-5 ${statusConfig.text} mr-2`} />
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${statusConfig.bg} ${statusConfig.text}
          `}>
            {statusConfig.label}
          </span>
        </div>
      </div>
      
      {/* 👤 INFORMACIÓN DEL USUARIO (si no es owner) */}
      {!isOwner && membership.user && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {membership.user.firstName} {membership.user.lastName}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {membership.user.email}
            </span>
          </div>
        </div>
      )}
      
      {/* 📅 INFORMACIÓN DE FECHAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="w-4 h-4 mr-2" />
            Inicio
          </div>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership.startDate)}
          </p>
        </div>
        
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            Vencimiento
          </div>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership.endDate)}
          </p>
        </div>
      </div>
      
      {/* 💰 PRECIO */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Precio:</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(membership.price)}
          </span>
        </div>
      </div>
      
      {/* 📊 PROGRESO */}
      {membership.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progreso:</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                daysUntilExpiry < 0 ? 'bg-red-500' :
                daysUntilExpiry <= 3 ? 'bg-yellow-500' :
                daysUntilExpiry <= 7 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* ⏰ TIEMPO RESTANTE */}
      {membership.status === 'active' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            {daysUntilExpiry < 0 ? (
              <div className="text-red-600">
                <p className="text-sm font-medium">¡Membresía vencida!</p>
                <p className="text-xs">
                  Venció hace {Math.abs(daysUntilExpiry)} día{Math.abs(daysUntilExpiry) !== 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <div className={
                daysUntilExpiry <= 3 ? 'text-red-600' :
                daysUntilExpiry <= 7 ? 'text-yellow-600' :
                'text-green-600'
              }>
                <p className="text-lg font-bold">
                  {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
                <p className="text-xs">
                  restante{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 🔄 RENOVACIÓN AUTOMÁTICA */}
      {membership.autoRenew && (
        <div className="mb-4 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-700">
              Renovación automática activada
            </span>
          </div>
        </div>
      )}
      
      {/* 📝 NOTAS */}
      {membership.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Notas:</strong> {membership.notes}
          </p>
        </div>
      )}
      
      {/* 🎯 ACCIONES */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          
          {/* Ver detalles */}
          <Link
            to={`/dashboard/memberships/${membership.id}`}
            className="btn-secondary btn-sm flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver detalles
          </Link>
          
          {/* Renovar */}
          {(membership.status === 'active' || membership.status === 'expired') && (
            <button
              onClick={onRenew}
              className="btn-success btn-sm flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Renovar
            </button>
          )}
          
          {/* Editar */}
          {onEdit && membership.status !== 'cancelled' && (
            <button
              onClick={onEdit}
              className="btn-secondary btn-sm flex items-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </button>
          )}
          
          {/* Cancelar */}
          {onCancel && membership.status === 'active' && (
            <button
              onClick={onCancel}
              className="btn-danger btn-sm flex items-center"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          )}
        </div>
      )}
      
    </div>
  );
};

// 📊 VARIANTE: Tarjeta compacta
export const CompactMembershipCard = ({ 
  membership, 
  onClick = null,
  showUser = false 
}) => {
  const { formatCurrency, formatDate } = useApp();
  
  const daysUntilExpiry = Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const getStatusColor = () => {
    if (membership.status !== 'active') return 'text-gray-500';
    if (daysUntilExpiry < 0) return 'text-red-500';
    if (daysUntilExpiry <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow border p-4 transition-all duration-200
        ${onClick ? 'hover:shadow-lg cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          {showUser && membership.user && (
            <p className="text-sm font-medium text-gray-900">
              {membership.user.firstName} {membership.user.lastName}
            </p>
          )}
          <p className="text-sm text-gray-600">
            {membership.type === 'monthly' ? 'Mensual' : 'Diaria'}
          </p>
          <p className="text-xs text-gray-500">
            Vence: {formatDate(membership.endDate)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(membership.price)}
          </p>
          <p className={`text-xs font-medium ${getStatusColor()}`}>
            {membership.status === 'active' ? 
              (daysUntilExpiry < 0 ? 'Vencida' : 
               daysUntilExpiry <= 3 ? 'Por vencer' : 
               'Activa') : 
              membership.status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;