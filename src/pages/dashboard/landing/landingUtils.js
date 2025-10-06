// src/pages/dashboard/landing/landingUtils.js
// UTILIDADES COMPARTIDAS PARA LANDING PAGE

import { 
  Dumbbell, Star, Users, Target, Trophy, Clock, MapPin, Phone, Mail,
  Instagram, Facebook, Twitter, Youtube, MessageCircle, Play, Check,
  Shield, Award, ArrowRight, Menu, X, Gift, Zap, Heart, Crown,
  ChevronRight, ShoppingCart, Package, Truck, CreditCard, Eye,
  Filter, Search, Plus, Minus, AlertTriangle, Loader, Wifi, WifiOff,
  Calendar, ChevronLeft, Pause, Volume2, VolumeX, Maximize, PlayCircle,
  Loader2, Coins
} from 'lucide-react';

// 🎨 MAPEO DINÁMICO DE ICONOS DESDE EL BACKEND
export const getIconComponent = (iconName) => {
  const iconMap = {
    // Iconos de usuarios y personas
    'Users': Users,
    'User': Users,
    'UserCheck': Users,
    'UserPlus': Users,
    
    // Iconos de logros y premios
    'Award': Award,
    'Trophy': Trophy,
    'Crown': Crown,
    'Star': Star,
    'Medal': Award,
    
    // Iconos de fitness y deporte
    'Dumbbell': Dumbbell,
    'Activity': Target,
    'TrendingUp': Trophy,
    'Heart': Heart,
    'Zap': Zap,
    
    // Iconos de tiempo y calendario
    'Clock': Clock,
    'Calendar': Calendar,
    'Timer': Clock,
    
    // Iconos de ubicación
    'MapPin': MapPin,
    'Map': MapPin,
    
    // Iconos de contacto
    'Phone': Phone,
    'Mail': Mail,
    'MessageCircle': MessageCircle,
    
    // Iconos genéricos
    'Check': Check,
    'CheckCircle': Check,
    'Shield': Shield,
    'Target': Target,
    'Gift': Gift,
    'ShoppingCart': ShoppingCart,
    'Package': Package,
    'Truck': Truck,
    
    // Fallback por defecto
    'default': Star
  };
  
  return iconMap[iconName] || iconMap['default'];
};

// 🎨 OBTENER ICONO DE RED SOCIAL
export const getSocialIcon = (platform) => {
  const icons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    youtube: Youtube,
    whatsapp: MessageCircle
  };
  return icons[platform] || MessageCircle;
};

// 💰 FORMATEAR EN QUETZALES
export const formatQuetzales = (amount, currencySymbol = 'Q') => {
  if (!amount || isNaN(amount)) return `${currencySymbol} 0.00`;
  return `${currencySymbol} ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// 🎨 MAPEO DE COLORES A CLASES TAILWIND
export const getColorClasses = (color) => {
  const colorClasses = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    secondary: { bg: 'bg-secondary-100', text: 'text-secondary-600' },
    success: { bg: 'bg-green-100', text: 'text-green-600' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    danger: { bg: 'bg-red-100', text: 'text-red-600' },
    info: { bg: 'bg-blue-100', text: 'text-blue-600' }
  };
  
  return colorClasses[color] || colorClasses.primary;
};

// 📊 PROCESAR ESTADÍSTICAS DINÁMICAMENTE
export const processStats = (stats, statsLoaded) => {
  console.group('📊 Procesando estadísticas dinámicas');
  
  if (!statsLoaded || !stats) {
    console.log('❌ Stats no disponibles:', { statsLoaded, hasStats: !!stats });
    console.groupEnd();
    return [];
  }
  
  if (!Array.isArray(stats)) {
    console.warn('⚠️ Stats no es un array:', typeof stats);
    console.groupEnd();
    return [];
  }
  
  console.log(`✅ Procesando ${stats.length} estadísticas del backend`);
  
  const mapped = stats.map((stat, index) => {
    const IconComponent = getIconComponent(stat.icon);
    
    console.log(`  ${index + 1}. ${stat.label}:`, {
      number: stat.number,
      icon: stat.icon,
      hasIcon: !!IconComponent,
      color: stat.color || 'primary'
    });
    
    return {
      number: stat.number,
      label: stat.label,
      icon: IconComponent,
      color: stat.color || 'primary',
      description: stat.description
    };
  });
  
  console.log(`✅ ${mapped.length} estadísticas procesadas correctamente`);
  console.groupEnd();
  
  return mapped;
};

// 🔄 OBTENER ICONO DE SERVICIO
export const getServiceIcon = (iconName) => {
  const iconMap = {
    'user-check': Target,
    'users': Users,
    'heart': Heart,
    'dumbbell': Dumbbell,
    'target': Target,
    'activity': Target,
    'zap': Zap
  };
  
  return iconMap[iconName] || Dumbbell;
};

// 📅 OBTENER ICONO DE PLAN
export const getPlanIcon = (iconName) => {
  const iconMap = {
    'crown': Crown,
    'calendar-days': Calendar,
    'calendar': Calendar,
    'calendar-range': Calendar,
    'shield': Shield,
    'award': Award,
    'trophy': Trophy
  };
  
  return iconMap[iconName] || Shield;
};

// 📦 DATOS POR DEFECTO MÍNIMOS
export const MINIMAL_FALLBACK = {
  name: 'Elite Fitness Club',
  description: 'Tu gimnasio de confianza',
  contact: { 
    address: 'Guatemala', 
    phone: '+502 1234-5678',
    email: 'info@gym.com'
  },
  hours: { 
    full: 'Lunes a Viernes: 6:00 AM - 10:00 PM' 
  },
  social: {}
};

export default {
  getIconComponent,
  getSocialIcon,
  formatQuetzales,
  getColorClasses,
  processStats,
  getServiceIcon,
  getPlanIcon,
  MINIMAL_FALLBACK
};