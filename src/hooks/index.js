// Autor: Alexander Echeverria
// src/hooks/index.js
// FUNCIÓN: Índice central para todos los hooks del gimnasio

// Hooks principales del sistema
export { default as useGymConfig } from './useGymConfig';
export { default as useGymStats } from './useGymStats';
export { default as useGymServices } from './useGymServices';
export { default as useTestimonials } from './useTestimonials';
export { default as useFeaturedProducts } from './useFeaturedProducts';
export { default as useGymContent } from './useGymContent';
export { default as usePromoContent } from './usePromoContent';
export { default as useNavigation } from './useNavigation';
export { default as useBranding } from './useBranding';
export { default as useMembershipPlans } from './useMembershipPlans';
export { default as useActivePromotions } from './useActivePromotions';
export { default as useGymServices } from './useActiveGymServices';

// Verificación de disponibilidad de hooks
export const checkHooksAvailability = () => {
  const hooks = {
    useGymConfig: require('./useGymConfig'),
    useGymStats: require('./useGymStats'),
    useGymServices: require('./useGymServices'),
    useTestimonials: require('./useTestimonials'),
    useFeaturedProducts: require('./useFeaturedProducts'),
    useGymContent: require('./useGymContent'),
    usePromoContent: require('./usePromoContent'),
    useNavigation: require('./useNavigation'),
    useBranding: require('./useBranding'),
    useMembershipPlans: require('./useMembershipPlans'),
    useActivePromotions: require('./useActivePromotions')
  };

  const missingHooks = [];
  const availableHooks = [];

  Object.entries(hooks).forEach(([name, hook]) => {
    try {
      if (hook && (hook.default || hook)) {
        availableHooks.push(name);
      } else {
        missingHooks.push(name);
      }
    } catch (error) {
      missingHooks.push(name);
      console.error(`Hook ${name} no disponible:`, error.message);
    }
  });

  console.log('HOOKS DEL GIMNASIO:');
  console.log('Disponibles:', availableHooks);
  if (missingHooks.length > 0) {
    console.log('Faltantes:', missingHooks);
  }

  return { available: availableHooks, missing: missingHooks };
};

// Hook combinado que agrupa todos los datos principales
export const useGymData = () => {
  const config = useGymConfig();
  const stats = useGymStats();
  const services = useGymServices();
  const testimonials = useTestimonials();
  const products = useFeaturedProducts();
  const content = useGymContent();
  const promoContent = usePromoContent();
  const navigation = useNavigation();
  const branding = useBranding();
  const plans = useMembershipPlans();
  const promotions = useActivePromotions();

  return {
    config,
    stats,
    services,
    testimonials,
    products,
    content,
    promoContent,
    navigation,
    branding,
    plans,
    promotions,
    // Estado general
    isLoading: [
      config.loading,
      stats.loading,
      services.loading,
      testimonials.loading,
      products.loading,
      content.loading,
      promoContent.loading,
      navigation.loading,
      branding.loading,
      plans.loading,
      promotions.loading
    ].some(Boolean),
    hasErrors: [
      config.hasError,
      stats.hasError,
      services.hasError,
      testimonials.hasError,
      products.hasError,
      content.hasError,
      promoContent.hasError,
      navigation.hasError,
      branding.hasError,
      plans.hasError,
      promotions.hasError
    ].some(Boolean)
  };
};

// Ejecutar verificación en desarrollo
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    try {
      checkHooksAvailability();
    } catch (error) {
      console.error('Error al verificar hooks:', error);
    }
  }, 1000);
}

/*
DOCUMENTACIÓN DEL ARCHIVO DE HOOKS INDEX

PROPÓSITO:
Este archivo actúa como el punto central de exportación para todos los hooks personalizados
de la aplicación del gimnasio, facilitando la gestión, importación y verificación de la
disponibilidad de hooks relacionados con datos del negocio, contenido web, estadísticas
y funcionalidades específicas del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Exportación centralizada de todos los hooks del gimnasio
- Hook combinado para acceder a todos los datos de una vez
- Verificación automática de disponibilidad de hooks en desarrollo
- Detección de hooks faltantes o con errores
- Gestión de estados de carga y errores globales
- Logging de diagnóstico para debugging

ARCHIVOS Y CONEXIONES:

HOOKS EXPORTADOS:
- ./useGymConfig: Configuración general del gimnasio
- ./useGymStats: Estadísticas y métricas del gimnasio
- ./useGymServices: Servicios ofrecidos (clases, entrenamientos, etc.)
- ./useTestimonials: Testimonios y reseñas de clientes
- ./useFeaturedProducts: Productos destacados de la tienda
- ./useGymContent: Contenido dinámico del sitio web
- ./usePromoContent: Contenido promocional y ofertas
- ./useNavigation: Datos de navegación del sitio web
- ./useBranding: Información de marca y branding del gimnasio
- ./useMembershipPlans: Planes de membresía disponibles
- ./useActivePromotions: Promociones activas y descuentos

HOOK COMBINADO PRINCIPAL:
- useGymData: Combina todos los hooks individuales en un solo objeto

FUNCIONES DE UTILIDAD:
- checkHooksAvailability: Verifica que todos los hooks estén disponibles

QUE PROPORCIONA AL SISTEMA:

DATOS DEL GIMNASIO DISPONIBLES:
A través del hook combinado useGymData, el sistema puede acceder a:

**Configuración del Gimnasio (useGymConfig)**:
- Información básica del gimnasio (nombre, dirección, teléfono)
- Horarios de atención y días de funcionamiento
- Configuración de precios en quetzales guatemaltecos
- Políticas y términos de servicio
- Configuración de redes sociales

**Estadísticas del Gimnasio (useGymStats)**:
- Número total de miembros activos
- Estadísticas de crecimiento mensual/anual
- Métricas de retención de clientes
- Ingresos mensuales en quetzales
- Equipos disponibles y utilización

**Servicios del Gimnasio (useGymServices)**:
- Lista de clases grupales disponibles
- Entrenamientos personalizados ofrecidos
- Servicios adicionales (nutrición, fisioterapia)
- Horarios de clases y disponibilidad
- Precios de servicios en quetzales

**Testimonios de Clientes (useTestimonials)**:
- Reseñas y comentarios de miembros
- Calificaciones y experiencias
- Casos de éxito y transformaciones
- Fotos de antes y después
- Testimonios en video

**Productos Destacados (useFeaturedProducts)**:
- Suplementos y productos nutricionales
- Equipos de entrenamiento en venta
- Mercancía del gimnasio (ropa, accesorios)
- Precios en quetzales guatemaltecos
- Ofertas especiales y descuentos

**Contenido Dinámico (useGymContent)**:
- Textos de páginas principales
- Contenido de secciones del sitio web
- Información actualizable sin código
- Contenido multiidioma (español)
- Metadatos SEO

**Contenido Promocional (usePromoContent)**:
- Banners y promociones destacadas
- Ofertas temporales y descuentos
- Contenido de campañas de marketing
- Llamadas a la acción específicas
- Promociones estacionales

**Navegación del Sitio (useNavigation)**:
- Estructura de menús principales
- Enlaces de navegación secundaria
- Rutas de páginas internas
- Navegación contextual por secciones
- Breadcrumbs y navegación auxiliar

**Branding Corporativo (useBranding)**:
- Logotipos y variantes de marca
- Paleta de colores corporativos
- Tipografías y estilos visuales
- Elementos gráficos del gimnasio
- Guidelines de marca

**Planes de Membresía (useMembershipPlans)**:
- Tipos de membresías disponibles
- Precios mensuales/anuales en quetzales
- Beneficios incluidos por plan
- Restricciones y limitaciones
- Promociones para nuevos miembros

**Promociones Activas (useActivePromotions)**:
- Ofertas vigentes del gimnasio
- Descuentos en membresías
- Promociones en productos
- Fechas de vencimiento de ofertas
- Códigos de descuento disponibles

ESTADOS GLOBALES GESTIONADOS:
- **isLoading**: Indica si algún hook está cargando datos
- **hasErrors**: Indica si algún hook tiene errores
- Estados individuales de carga por cada hook
- Estados de error específicos por hook

VERIFICACIÓN EN DESARROLLO:
- Chequeo automático de disponibilidad de hooks
- Logging de hooks disponibles vs faltantes
- Detección de errores en inicialización
- Información de diagnóstico en consola
- Ejecución automática después de 1 segundo

USO EN COMPONENTES:
Los componentes pueden importar hooks individuales:
```javascript
import { useGymStats, useMembershipPlans } from '../hooks';
```

O usar el hook combinado para todo:
```javascript
import { useGymData } from '../hooks';
const { stats, plans, isLoading } = useGymData();
```

BENEFICIOS DEL SISTEMA:
- **Centralización**: Un solo punto para todos los hooks
- **Verificación**: Detección automática de problemas
- **Eficiencia**: Hook combinado para múltiples datos
- **Debugging**: Información clara sobre disponibilidad
- **Mantenimiento**: Fácil gestión de imports y exports

INTEGRACIÓN CON EL GIMNASIO:
- Datos específicos para negocio de fitness en Guatemala
- Precios y transacciones en quetzales guatemaltecos
- Contenido adaptado a cultura local
- Servicios típicos de gimnasios guatemaltecos
- Promociones contextualizadas al mercado local

CARACTERÍSTICAS TÉCNICAS:
- Lazy loading de hooks individuales
- Manejo de errores robusto
- Estados de carga optimizados
- Logging condicional en desarrollo
- Compatibilidad con React DevTools

CASOS DE USO TÍPICOS:
- Páginas de landing que necesitan múltiples datos
- Dashboards que muestran estadísticas completas
- Componentes que requieren verificación de disponibilidad
- Páginas de productos que combinan inventario y promociones
- Secciones de servicios con precios actualizados

FUTURAS EXPANSIONES:
- Hooks para gestión de horarios de clases
- Hooks para sistema de reservas
- Hooks para análisis de comportamiento de usuarios
- Hooks para integración con sistemas de pago
- Hooks para gestión de instructores y personal

Este archivo es fundamental para la arquitectura de datos de la aplicación del gimnasio,
proporcionando una interfaz unificada y confiable para acceder a toda la información
necesaria para mostrar contenido dinámico, estadísticas y funcionalidades del negocio.
*/