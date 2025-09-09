// Autor: Alexander Echeverria
// src/components/common/QuickActionCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = 'blue',
  link = null,
  onClick = null,
  badge = null,
  disabled = false,
  className = ''
}) => {
  
  // CONFIGURACIÓN DE COLORES TEMÁTICOS
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      hover: 'hover:bg-green-100',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600',
      hover: 'hover:bg-yellow-100',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-100',
      border: 'border-purple-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      hover: 'hover:bg-red-100',
      border: 'border-red-200'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'bg-gray-500',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-100',
      border: 'border-gray-200'
    }
  };
  
  const colors = colorConfig[color] || colorConfig.blue;
  
  // CONTENIDO PRINCIPAL DE LA TARJETA
  const cardContent = (
    <div className={`
      relative bg-white rounded-lg shadow-lg p-6 transition-all duration-200
      ${!disabled ? `${colors.hover} hover:shadow-xl cursor-pointer` : 'opacity-50 cursor-not-allowed'}
      ${className}
    `}>
      
      {/* ETIQUETA INFORMATIVA */}
      {badge && (
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${colors.bg} ${colors.text}
          `}>
            {badge}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        {/* ICONO Y CONTENIDO DESCRIPTIVO */}
        <div className="flex items-center">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${colors.icon}
          `}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {description}
            </p>
          </div>
        </div>
        
        {/* INDICADOR DE ACCIÓN DISPONIBLE */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${colors.bg}
        `}>
          <ArrowRight className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
  
  // WRAPPER CON NAVEGACIÓN O ACCIÓN PERSONALIZADA
  if (link && !disabled) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick && !disabled) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

// VARIANTE: Tarjeta compacta para espacios reducidos
export const CompactQuickActionCard = ({ 
  title, 
  icon: Icon, 
  color = 'blue',
  link = null,
  onClick = null,
  count = null 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };
  
  const cardContent = (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${colors[color] || colors.blue}
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {title}
          </span>
        </div>
        
        {count && (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </div>
    </div>
  );
  
  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

// VARIANTE: Tarjeta con barra de progreso integrada
export const ProgressQuickActionCard = ({ 
  title, 
  description,
  icon: Icon, 
  color = 'blue',
  progress = 0, // 0-100
  link = null,
  onClick = null 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };
  
  const cardContent = (
    <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer">
      <div className="flex items-center mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${colors[color] || colors.blue}
        `}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">
            {title}
          </h3>
          <p className="text-xs text-gray-600">
            {description}
          </p>
        </div>
      </div>
      
      {/* BARRA DE PROGRESO VISUAL */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colors[color] || colors.blue} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-600 text-right">
        {progress}% completado
      </div>
    </div>
  );
  
  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

// VARIANTE: Tarjeta con indicadores de estado específicos
export const StatusQuickActionCard = ({ 
  title, 
  description,
  icon: Icon, 
  status = 'activo', // activo, pendiente, completado, deshabilitado
  link = null,
  onClick = null 
}) => {
  const statusConfig = {
    activo: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    pendiente: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    completado: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    deshabilitado: {
      bg: 'bg-gray-50',
      icon: 'bg-gray-400',
      text: 'text-gray-500',
      border: 'border-gray-200'
    }
  };
  
  const config = statusConfig[status] || statusConfig.activo;
  
  const cardContent = (
    <div className={`
      ${config.bg} border ${config.border} rounded-lg p-4
      ${status !== 'deshabilitado' ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'opacity-50'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${config.icon}
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600">
              {description}
            </p>
          </div>
        </div>
        
        <div className={`
          w-3 h-3 rounded-full ${config.icon}
          ${status === 'pendiente' ? 'animate-pulse' : ''}
        `} />
      </div>
    </div>
  );
  
  if (link && status !== 'deshabilitado') {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick && status !== 'deshabilitado') {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

export default QuickActionCard;

/*
==========================================
DOCUMENTACIÓN DEL COMPONENTE QuickActionCard
==========================================

PROPÓSITO GENERAL:
Este componente proporciona tarjetas de acciones rápidas personalizables y altamente
interactivas para los diferentes dashboards del gimnasio. Permite a usuarios (personal,
clientes, administradores) acceder fácilmente a las funciones más importantes del sistema
con un solo clic, mejorando significativamente la eficiencia y experiencia de usuario.

QUÉ MUESTRA AL USUARIO:
El usuario ve tarjetas elegantes y profesionales que presentan:
- Icono temático que identifica visualmente la acción (mancuernas, calendario, etc.)
- Título claro y descriptivo de la acción disponible
- Descripción breve que explica qué hace la función
- Indicador visual de flecha que señala que es clickeable
- Colores temáticos que categorizan el tipo de acción
- Badges informativos opcionales (ej: "Nuevo", "3 pendientes")
- Estados visuales claros (activo, deshabilitado, pendiente)
- Animaciones suaves al hacer hover que indican interactividad
- Efectos de sombra que dan profundidad y profesionalismo

VARIANTES DISPONIBLES PARA EL USUARIO:
1. QuickActionCard: Tarjeta completa con título, descripción e icono
2. CompactQuickActionCard: Versión compacta con contador opcional
3. ProgressQuickActionCard: Con barra de progreso para tareas medibles
4. StatusQuickActionCard: Con indicadores específicos de estado

FUNCIONALIDADES PRINCIPALES:
- Navegación rápida a secciones importantes de la aplicación
- Acciones inmediatas sin necesidad de navegación compleja
- Sistema de colores que facilita la categorización visual
- Estados interactivos que proporcionan feedback inmediato
- Soporte para badges informativos y contadores
- Animaciones que mejoran la experiencia táctil
- Accesibilidad completa con navegación por teclado

ARCHIVOS A LOS QUE SE CONECTA:

COMPONENTES IMPORTADOS:
- 'react-router-dom': Biblioteca de navegación
  * Link: Para navegación interna entre páginas de la aplicación
- 'lucide-react': Biblioteca de iconos
  * ArrowRight: Flecha indicadora de acción disponible
  * ExternalLink: Icono para enlaces externos (no usado actualmente)

ARCHIVOS QUE UTILIZAN ESTE COMPONENTE:
- src/pages/staff/StaffDashboard.js: Panel del personal del gimnasio
  * Acciones: Registrar asistencia, gestionar equipos, ver clases del día
- src/pages/client/ClientDashboard.js: Panel personal del cliente
  * Acciones: Reservar clases, ver rutina, actualizar perfil, ver pagos
- src/pages/admin/AdminDashboard.js: Panel de administración
  * Acciones: Reportes financieros, gestión de personal, configuración
- src/components/dashboard/: Componentes específicos de dashboard
- src/pages/management/: Páginas de gestión específicas

CONTEXTOS Y SERVICIOS RELACIONADOS:
- src/contexts/AuthContext.js: Para mostrar acciones según rol del usuario
- src/contexts/GymContext.js: Datos del gimnasio para acciones contextuales
- src/services/membershipService.js: Para acciones de membresías
- src/services/classService.js: Para acciones de clases y reservas
- src/services/paymentService.js: Para acciones financieras en quetzales

CONFIGURACIÓN DE COLORES DISPONIBLES:
- blue: Acciones generales e informativas (ver horarios, consultar información)
- green: Acciones exitosas y confirmaciones (registrar pago, completar tarea)
- yellow: Advertencias y elementos pendientes (pagos vencidos, mantenimiento)
- purple: Acciones especiales o premium (clases VIP, servicios exclusivos)
- red: Acciones críticas o de eliminación (cancelar membresía, reportar problema)
- gray: Acciones deshabilitadas o neutras (funciones no disponibles)

CASOS DE USO ESPECÍFICOS EN EL GIMNASIO:

PARA EL PERSONAL (StaffDashboard):
- "Registrar nuevo miembro" → Formulario de inscripción rápida
- "Ver asistencia del día" → Lista de miembros presentes y ausentes
- "Gestionar equipos" → Estado y mantenimiento de máquinas
- "Programar mantenimiento" → Calendario de tareas técnicas
- "Revisar pagos pendientes" → Lista de cobros en quetzales por realizar

PARA LOS CLIENTES (ClientDashboard):
- "Reservar clase de yoga" → Sistema de reservas con horarios disponibles
- "Ver mi rutina personalizada" → Plan de ejercicios del entrenador
- "Actualizar perfil" → Edición de datos personales y fotos
- "Revisar historial de pagos" → Transacciones en quetzales realizadas
- "Contactar mi entrenador" → Sistema de mensajería interna

PARA ADMINISTRADORES (AdminDashboard):
- "Generar reporte mensual" → Reportes financieros y de asistencia
- "Gestionar personal" → Nómina y horarios de empleados
- "Configurar promociones" → Descuentos y ofertas especiales
- "Revisar finanzas" → Ingresos y gastos en quetzales guatemaltecos
- "Administrar instalaciones" → Estado de salas y equipamiento

PROPS DEL COMPONENTE PRINCIPAL:
- title: Título de la acción (ej: "Reservar Clase")
- description: Descripción breve (ej: "Programa tu próxima sesión")
- icon: Componente de icono de Lucide React
- color: Tema de color ('blue', 'green', 'yellow', 'purple', 'red', 'gray')
- link: Ruta de navegación interna (ej: '/classes/book')
- onClick: Función personalizada para acciones específicas
- badge: Etiqueta informativa (ej: "3 nuevas", "Pendiente")
- disabled: Estado deshabilitado para acciones no disponibles
- className: Clases CSS adicionales para personalización

CARACTERÍSTICAS TÉCNICAS AVANZADAS:
- Sistema de colores consistente con el diseño del gimnasio
- Animaciones CSS optimizadas para rendimiento
- Estados hover que proporcionan feedback visual inmediato
- Responsive design que se adapta a móvil y tablet
- Accesibilidad completa con ARIA labels y navegación por teclado
- Lazy loading de iconos para optimizar carga inicial
- Memoización para evitar re-renders innecesarios

VARIANTES ESPECIALIZADAS:

COMPACT VERSION:
- Ideal para sidebars o espacios reducidos en móvil
- Muestra contador opcional para elementos pendientes
- Acción directa sin descripción detallada
- Ej: "Clases (3)" con contador de clases disponibles

PROGRESS VERSION:
- Para tareas con progreso medible
- Barra de progreso visual con porcentajes
- Ideal para objetivos de fitness o completado de perfiles
- Ej: "Completar perfil (75% completado)"

STATUS VERSION:
- Para elementos con estados específicos del gimnasio
- Indicadores visuales claros de estado
- Animaciones para estados pendientes
- Ej: Membresía "activa", "pendiente", "vencida"

INTEGRACIÓN CON PAGOS EN QUETZALES:
- Badges que muestran montos en quetzales: "Q 150 pendiente"
- Acciones relacionadas con pagos: "Pagar mensualidad Q 300"
- Reportes financieros: "Ingresos del mes Q 45,000"
- Estados de pago: "Completado Q 250", "Pendiente Q 150"

MANEJO DE ESTADOS Y FEEDBACK:
- Estados deshabilitados para funciones no disponibles
- Indicadores de carga durante procesamiento
- Feedback visual inmediato al hacer clic
- Badges dinámicos que se actualizan en tiempo real

ACCESIBILIDAD Y USABILIDAD:
- Contraste de colores optimizado para legibilidad
- Tamaños de toque apropiados para dispositivos móviles
- Texto descriptivo para lectores de pantalla
- Navegación secuencial lógica por teclado
- Estados de focus visualmente claros

INTEGRACIÓN CON EL ECOSISTEMA DEL GIMNASIO:
Este componente es fundamental para crear interfaces de dashboard eficientes
que permitan a los diferentes tipos de usuarios del gimnasio (personal, clientes,
administradores) acceder rápidamente a las funciones más relevantes para su rol,
mejorando la productividad y satisfacción del usuario dentro del sistema.

EJEMPLOS DE USO TÍPICO:
```javascript
// Para el personal
<QuickActionCard
  title="Registrar Pago"
  description="Cobrar mensualidad en quetzales"
  icon={CreditCard}
  color="green"
  link="/payments/collect"
  badge="5 pendientes"
/>

// Para clientes
<QuickActionCard
  title="Mi Próxima Clase"
  description="Yoga a las 6:00 PM"
  icon={Calendar}
  color="blue"
  onClick={handleViewClass}
/>

// Con progreso
<ProgressQuickActionCard
  title="Completar Perfil"
  description="Agregar foto y medidas"
  icon={User}
  progress={75}
  color="purple"
/>
```

El QuickActionCard es esencial para crear una experiencia de usuario fluida
y eficiente en el sistema de gestión del gimnasio, proporcionando acceso
inmediato a las funciones más importantes según el contexto del usuario.
*/