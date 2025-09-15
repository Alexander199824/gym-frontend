// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// Incluye paginación, búsqueda y filtros de historial de pagos

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

export const usePaymentsData = () => {
  // Estados principales de pagos
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 20;

  // Función principal para cargar pagos
  const loadPayments = async () => {
    try {
      console.log('Cargando pagos...');
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: paymentsPerPage,
        search: searchTerm || undefined
      };
      
      const response = await apiService.paymentService.getPayments(params);
      
      if (response?.data) {
        if (response.data.payments && Array.isArray(response.data.payments)) {
          setPayments(response.data.payments);
          setTotalPayments(response.data.pagination?.total || response.data.payments.length);
        } else if (Array.isArray(response.data)) {
          setPayments(response.data);
          setTotalPayments(response.data.length);
        }
        console.log(`${payments.length} pagos cargados exitosamente`);
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
      setPayments([]);
      setTotalPayments(0);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar pagos
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset a primera página al buscar
  };

  // Función para cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Función para obtener icono del método de pago
  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: 'Banknote',
      card: 'CreditCard',
      transfer: 'Building',
      mobile: 'Building'
    };
    return icons[method] || 'CreditCard';
  };

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.completed;
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(totalPayments / paymentsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Efecto para cargar pagos cuando cambien los filtros
  useEffect(() => {
    loadPayments();
  }, [currentPage, searchTerm]);

  // Efecto inicial de carga
  useEffect(() => {
    loadPayments();
  }, []);

  return {
    // Estados principales
    payments,
    loading,
    totalPayments,
    
    // Estados de filtros
    searchTerm,
    currentPage,
    paymentsPerPage,
    
    // Información de paginación
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Funciones principales
    loadPayments,
    handleSearch,
    handlePageChange,
    
    // Utilidades
    getPaymentMethodIcon,
    getStatusColor,
    
    // Función para actualizar búsqueda
    setSearchTerm: handleSearch
  };
};

// Este hook encapsula toda la lógica relacionada con la gestión de pagos
// Maneja la carga de datos, paginación, búsqueda y utilidades de formateo
// Permite reutilizar esta lógica en diferentes componentes si es necesario