// src/hooks/index.js
// FUNCIÓN: Índice central para todos los hooks del gimnasio
// FACILITA: Importaciones y detección de hooks faltantes

// ===== HOOKS PRINCIPALES =====
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

// ===== VERIFICACIÓN DE HOOKS =====
// Esta función ayuda a detectar hooks faltantes en desarrollo
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
      console.error(`❌ Hook ${name} no disponible:`, error.message);
    }
  });

  console.log('🎣 HOOKS DEL GIMNASIO:');
  console.log('✅ Disponibles:', availableHooks);
  if (missingHooks.length > 0) {
    console.log('❌ Faltantes:', missingHooks);
  }

  return { available: availableHooks, missing: missingHooks };
};

// ===== HOOKS COMBINADOS =====
// Hook que combina todos los datos principales
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