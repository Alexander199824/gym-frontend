// src/components/dashboard/PaymentChart.js
// UBICACIÓN: /gym-frontend/src/components/dashboard/PaymentChart.js
// FUNCIÓN: Gráfico de ingresos diarios usando Chart.js CORREGIDO
// CAMBIOS: Eliminado uso incorrecto de ChartJS como componente React

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react'; // ✅ Importar íconos correctos
import { useApp } from '../../contexts/AppContext';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PaymentChart = ({ 
  data = [], 
  type = 'line', 
  title = 'Ingresos Diarios',
  height = 300,
  showLegend = true,
  animate = true
}) => {
  const { formatCurrency } = useApp();
  
  // 🎨 Configuración de colores
  const colors = {
    primary: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
  };
  
  // 📊 Procesar datos para el gráfico
  const processedData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    }),
    amount: parseFloat(item.total || item.amount || 0),
    count: parseInt(item.count || 0)
  }));
  
  // 📈 Configuración del gráfico de líneas
  const lineChartData = {
    labels: processedData.map(item => item.date),
    datasets: [
      {
        label: 'Ingresos',
        data: processedData.map(item => item.amount),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
  
  // 📊 Configuración del gráfico de barras
  const barChartData = {
    labels: processedData.map(item => item.date),
    datasets: [
      {
        label: 'Ingresos',
        data: processedData.map(item => item.amount),
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };
  
  // 🍩 Configuración del gráfico de dona (para métodos de pago)
  const doughnutData = {
    labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
    datasets: [
      {
        data: [65, 25, 10], // Datos de ejemplo
        backgroundColor: [
          colors.success,
          colors.info,
          colors.warning
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };
  
  // ⚙️ Opciones comunes del gráfico
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value) => formatCurrency(value),
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  
  // ⚙️ Opciones específicas para gráfico de dona
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    },
    cutout: '60%'
  };
  
  // 📊 Renderizar gráfico según tipo
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <Bar 
            data={barChartData} 
            options={commonOptions} 
            height={height}
          />
        );
      case 'doughnut':
        return (
          <Doughnut 
            data={doughnutData} 
            options={doughnutOptions} 
            height={height}
          />
        );
      case 'line':
      default:
        return (
          <Line 
            data={lineChartData} 
            options={commonOptions} 
            height={height}
          />
        );
    }
  };
  
  // 🎨 Función para obtener el ícono correcto según el tipo
  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-8 h-8 text-gray-400" />;
      case 'doughnut':
        return <PieChart className="w-8 h-8 text-gray-400" />;
      case 'line':
      default:
        return <TrendingUp className="w-8 h-8 text-gray-400" />;
    }
  };
  
  // 📊 Mostrar mensaje si no hay datos
  if (processedData.length === 0 && type !== 'doughnut') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* ✅ CORREGIDO: Usar ícono correcto en lugar de ChartJS */}
            {getChartIcon()}
          </div>
          <p className="text-sm">No hay datos para mostrar</p>
          <p className="text-xs text-gray-400 mt-1">
            Los datos aparecerán cuando haya información disponible
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      
      {/* 📈 Estadísticas rápidas */}
      {processedData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(processedData.reduce((sum, item) => sum + item.amount, 0))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Promedio</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(processedData.reduce((sum, item) => sum + item.amount, 0) / processedData.length)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Máximo</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(Math.max(...processedData.map(item => item.amount)))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Mínimo</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(Math.min(...processedData.map(item => item.amount)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 📊 Componente de gráfico simple para tarjetas
export const MiniPaymentChart = ({ data = [], color = '#ef4444' }) => {
  const processedData = data.slice(-7); // Últimos 7 días
  
  const chartData = {
    labels: processedData.map(item => ''),
    datasets: [
      {
        data: processedData.map(item => parseFloat(item.total || item.amount || 0)),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      line: { borderWidth: 1 },
      point: { radius: 0 }
    }
  };
  
  return (
    <div className="w-full h-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PaymentChart;