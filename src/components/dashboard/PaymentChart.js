// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/PaymentChart.js

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
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
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
  
  // Configuración de colores
  const colors = {
    primary: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
  };
  
  // Procesar datos para el gráfico
  const processedData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('es-GT', { 
      month: 'short', 
      day: 'numeric' 
    }),
    amount: parseFloat(item.total || item.amount || 0),
    count: parseInt(item.count || 0)
  }));
  
  // Configuración del gráfico de líneas
  const lineChartData = {
    labels: processedData.map(item => item.date),
    datasets: [
      {
        label: 'Ingresos en Quetzales',
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
  
  // Configuración del gráfico de barras
  const barChartData = {
    labels: processedData.map(item => item.date),
    datasets: [
      {
        label: 'Ingresos en Quetzales',
        data: processedData.map(item => item.amount),
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };
  
  // Configuración del gráfico de dona (para métodos de pago)
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
  
  // Opciones comunes del gráfico
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
  
  // Opciones específicas para gráfico de dona
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
  
  // Renderizar gráfico según tipo
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
  
  // Función para obtener el ícono correcto según el tipo
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
  
  // Mostrar mensaje si no hay datos
  if (processedData.length === 0 && type !== 'doughnut') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
      
      {/* Estadísticas rápidas */}
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

// Componente de gráfico simple para tarjetas
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

/*
FUNCIONALIDAD:
Este componente se encarga de mostrar gráficos de ingresos y pagos en el dashboard del gimnasio.
Utiliza Chart.js y react-chartjs-2 para crear visualizaciones interactivas de datos financieros.
Maneja el formateo de moneda en quetzales guatemaltecos y fechas en formato local.

CARACTERÍSTICAS:
- Soporta múltiples tipos de gráficos: líneas, barras y dona
- Procesa datos de ingresos y los formatea para visualización
- Incluye configuraciones personalizables (altura, leyenda, animaciones)
- Muestra estadísticas rápidas (total, promedio, máximo, mínimo)
- Maneja casos sin datos con mensajes informativos
- Incluye componente mini gráfico (MiniPaymentChart) para tarjetas del dashboard
- Formatea fechas en español guatemalteco
- Muestra todos los valores monetarios en quetzales

TIPOS DE GRÁFICOS DISPONIBLES:
- Line (líneas): Muestra tendencias de ingresos a lo largo del tiempo
- Bar (barras): Visualiza ingresos por períodos específicos comparativamente
- Doughnut (dona): Representa distribución porcentual de métodos de pago

CONEXIONES CON OTROS ARCHIVOS:
- Importa desde 'react' para funcionalidad del componente
- Importa Chart.js y react-chartjs-2 para renderizado de gráficos
- Importa iconos desde 'lucide-react' (BarChart3, TrendingUp, PieChart)
- Utiliza useApp desde '../../contexts/AppContext' para formateo de moneda en quetzales
- Recibe datos de componentes padre que consultan APIs de pagos e ingresos del backend
- Se integra con el sistema de dashboard principal para mostrar métricas financieras
- Conecta con rutas de la aplicación que manejan datos de transacciones y pagos

LO QUE VE EL USUARIO:
- Gráficos interactivos con datos de ingresos en tiempo real
- Tooltips informativos al pasar el mouse sobre los puntos de datos
- Leyendas explicativas para cada serie de datos
- Estadísticas resumidas: Total, Promedio, Máximo y Mínimo en quetzales
- Fechas formateadas en español (ej: "15 ene", "20 feb")
- Mensajes informativos cuando no hay datos: "No hay datos para mostrar"
- Gráficos de dona con porcentajes de métodos de pago (Efectivo, Tarjeta, Transferencia)
- Mini gráficos en tarjetas del dashboard mostrando tendencias de los últimos 7 días
- Colores diferenciados: rojo para datos principales, verde para efectivo, azul para tarjetas

PROPÓSITO:
Proporcionar visualizaciones claras y atractivas de los ingresos del gimnasio en quetzales guatemaltecos,
permitiendo al personal administrativo analizar tendencias financieras, identificar patrones de pago,
comparar períodos de tiempo y tomar decisiones informadas sobre la gestión financiera del negocio.
Facilita el seguimiento del rendimiento económico y la identificación de oportunidades de mejora.
*/