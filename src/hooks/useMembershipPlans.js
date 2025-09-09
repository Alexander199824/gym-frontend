// Autor: Alexander Echeverria
// Dirección: src/hooks/useMembershipPlans.js

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useMembershipPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('Hook useMembershipPlans inicializado');

  const fetchPlans = useCallback(async () => {
    console.log('Obteniendo planes de membresía');
    console.log('Realizando solicitud API a /api/gym/membership-plans');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getMembershipPlans();
      console.log('Respuesta de planes recibida:', response);
      
      // CORRECCIÓN CRÍTICA: Extraer solo la data del response
      let plansData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        plansData = response.data;
        console.log('Datos de planes extraídos:');
        console.log('  - Total de planes:', plansData.length);
        if (Array.isArray(plansData)) {
          plansData.forEach((plan, i) => {
            console.log(`  - Plan ${i + 1}: ${plan.name} - Q${plan.price} (Popular: ${plan.popular})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        plansData = response;
        console.log('Datos de planes (array directo):', plansData.length);
      } else {
        console.warn('Estructura de respuesta de planes inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      // Filtrar solo planes activos y ordenar por orden
      const activePlans = Array.isArray(plansData) 
        ? plansData
            .filter(plan => plan.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];

      setPlans(activePlans); // Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`Planes de membresía cargados exitosamente! (${activePlans.length} activos)`);

    } catch (err) {
      console.error('Error al cargar planes:', err.message);
      setError(err);
      setPlans([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchPlans();
    
    return () => {
      console.log('Limpieza del hook useMembershipPlans');
    };
  }, [fetchPlans]);

  // Función manual de recarga
  const reload = useCallback(() => {
    console.log('Recarga manual de planes solicitada');
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,           // Solo la data: [ { id: 1, name: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useMembershipPlans;

/**
 * DOCUMENTACIÓN DEL HOOK useMembershipPlans
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona la carga y manejo de los planes de
 * membresía del gimnasio desde el backend. Proporciona una interfaz limpia para
 * obtener la lista de planes activos disponibles, con sus precios, características
 * y configuraciones para mostrar en páginas de precios y suscripciones.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene planes de membresía desde la API backend
 * - Filtra automáticamente solo los planes activos (active !== false)
 * - Ordena los planes según el campo 'order' para presentación consistente
 * - Extrae correctamente los datos del wrapper de respuesta del backend
 * - Maneja estados de carga y errores de forma robusta
 * - Proporciona función de recarga manual para actualizar datos
 * - Implementa limpieza automática de recursos
 * - Logs detallados para debugging y monitoreo
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/apiService': Servicio principal para comunicación con el backend
 *   └── Función específica: getMembershipPlans()
 * - Backend API endpoint: '/api/gym/membership-plans'
 * - Componentes de precios que muestran planes de membresía
 * - Páginas de suscripción y registro de membresías
 * - Secciones comparativas de planes en landing pages
 * - Modales de selección de plan
 * - Formularios de pago y checkout
 * 
 * ESTRUCTURA DE DATOS ESPERADA DEL BACKEND:
 * Respuesta del API: { success: true, data: [...] }
 * 
 * Cada plan de membresía: {
 *   id: number,                 // Identificador único del plan
 *   name: string,               // Nombre del plan (ej: "Básico", "Premium")
 *   price: number,              // Precio mensual en quetzales
 *   currency: "GTQ",            // Moneda (quetzales guatemaltecos)
 *   duration: string,           // Duración ("monthly", "yearly", etc.)
 *   description?: string,       // Descripción corta del plan
 *   features: Array<string>,    // Lista de características incluidas
 *   popular?: boolean,          // Si es el plan más popular/recomendado
 *   active: boolean,            // Si el plan está activo/disponible
 *   order?: number,             // Orden de presentación (0 = primero)
 *   discount?: {                // Descuentos aplicables
 *     type: "percentage"|"fixed",
 *     value: number,
 *     validUntil?: string
 *   },
 *   benefits?: Array<string>,   // Beneficios adicionales
 *   restrictions?: Array<string>, // Limitaciones del plan
 *   color?: string,             // Color de tema para el plan
 *   buttonText?: string,        // Texto personalizado del botón
 *   ...otros campos
 * }
 * 
 * USO TÍPICO EN COMPONENTES:
 * const { plans, isLoading, error, reload } = useMembershipPlans();
 * 
 * if (isLoading) return <div>Cargando planes...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!plans.length) return <div>No hay planes disponibles</div>;
 * 
 * return (
 *   <div className="plans-grid">
 *     {plans.map(plan => (
 *       <PlanCard 
 *         key={plan.id} 
 *         plan={plan}
 *         isPopular={plan.popular}
 *         onSelect={() => handlePlanSelect(plan)}
 *       />
 *     ))}
 *   </div>
 * );
 * 
 * // Ejemplo de PlanCard:
 * function PlanCard({ plan, isPopular, onSelect }) {
 *   return (
 *     <div className={`plan-card ${isPopular ? 'popular' : ''}`}>
 *       {isPopular && <div className="popular-badge">Más Popular</div>}
 *       <h3>{plan.name}</h3>
 *       <div className="price">Q{plan.price}/mes</div>
 *       <p>{plan.description}</p>
 *       <ul className="features">
 *         {plan.features.map(feature => (
 *           <li key={feature}>{feature}</li>
 *         ))}
 *       </ul>
 *       <button onClick={onSelect}>
 *         {plan.buttonText || 'Seleccionar Plan'}
 *       </button>
 *     </div>
 *   );
 * }
 * 
 * ESTADOS RETORNADOS:
 * - plans: Array de objetos con los planes de membresía activos
 * - isLoaded: Boolean que indica si ya terminó el proceso de carga
 * - isLoading: Boolean que indica si está actualmente cargando datos
 * - error: Objeto Error si ocurrió algún problema, null si todo está bien
 * 
 * FUNCIONES DISPONIBLES:
 * - reload(): Fuerza una nueva carga de planes desde el backend
 * 
 * FILTRADO Y ORDENAMIENTO AUTOMÁTICO:
 * - Solo retorna planes donde 'active' no sea false
 * - Planes sin campo 'active' se consideran activos por defecto
 * - Ordenamiento automático por campo 'order' (ascendente)
 * - Planes sin 'order' se ubican al final (order = 0)
 * 
 * MANEJO DE ERRORES:
 * - Si falla la carga, plans se establece como array vacío
 * - isLoaded se marca como true incluso en caso de error
 * - El error se almacena en el estado 'error' para manejo por el componente
 * - La aplicación puede continuar funcionando sin planes
 * 
 * CASOS DE USO COMUNES:
 * 1. Página de precios: Mostrar todos los planes disponibles en formato grid
 * 2. Landing page: Sección de planes con el más popular destacado
 * 3. Modal de suscripción: Selección rápida de plan durante registro
 * 4. Dashboard de usuario: Comparar plan actual con otros disponibles
 * 5. Admin panel: Gestión y edición de planes de membresía
 * 6. Página de upgrade: Mostrar planes superiores al actual
 * 
 * CONSIDERACIONES DE PRECIOS EN QUETZALES:
 * - Todos los precios se manejan en quetzales guatemaltecos (GTQ)
 * - Formatear precios con símbolo Q (ej: Q150, Q350)
 * - Considerar separadores de miles para precios altos (Q1,500)
 * - Los descuentos también se calculan en quetzales
 * - Manejar conversiones si se requiere mostrar en otras monedas
 * 
 * OPTIMIZACIONES:
 * - Uso de useCallback para evitar re-renders innecesarios
 * - Cleanup automático en el desmontaje del componente
 * - Logs detallados para debugging en desarrollo
 * - Filtrado y ordenamiento eficiente en memoria
 * - Estructura de datos optimizada para renderizado
 * 
 * INTEGRACIONES COMUNES:
 * - Sistemas de pago (Stripe, PayPal, bancos locales)
 * - Gestores de suscripciones
 * - Sistemas de descuentos y cupones
 * - Analytics de conversión de planes
 * - CRM para seguimiento de clientes potenciales
 * 
 * CONSIDERACIONES DE UX:
 * - Destacar el plan más popular o recomendado
 * - Mostrar claramente lo que incluye cada plan
 * - Facilitar comparación entre planes
 * - CTAs claros y diferenciados por plan
 * - Información de cancelación y cambios de plan
 * 
 * SEGURIDAD Y VALIDACIONES:
 * - Validar precios del lado del servidor antes de procesar pagos
 * - Verificar disponibilidad del plan antes de suscripción
 * - Manejar cambios de precios de forma transparente
 * - Logs de auditoria para cambios en planes
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es crítico para la monetización del gimnasio. Cualquier cambio
 * debe probarse exhaustivamente, especialmente la integración con sistemas
 * de pago. Los precios mostrados deben coincidir exactamente con los del
 * sistema de facturación. Mantener consistencia en el formato de precios
 * en quetzales a lo largo de toda la aplicación.
 */