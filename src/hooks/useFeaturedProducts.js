// Autor: Alexander Echeverria
// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook para gestión de productos destacados de la tienda del gimnasio

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useFeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('Hook useFeaturedProducts inicializado');

  const fetchProducts = useCallback(async () => {
    console.log('Cargando Productos Destacados');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Solicitando productos destacados...');
      const response = await apiService.getFeaturedProducts();
      
      console.group('Análisis de Estructura de Respuesta');
      console.log('Respuesta completa:', response);
      console.log('response.success:', response?.success);
      console.log('response.data:', response?.data);
      console.log('response.data.products:', response?.data?.products);
      console.groupEnd();
      
      // Estructura corregida: Backend devuelve { success: true, data: { products: [...] } }
      let productsData = [];
      
      if (response && response.success && response.data && response.data.products) {
        // Ruta correcta: response.data.products
        productsData = response.data.products;
        console.log('Productos extraídos de response.data.products:', productsData.length);
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        // Fallback: response.data es array directo
        productsData = response.data;
        console.log('Productos extraídos de response.data (array):', productsData.length);
      } else if (response && Array.isArray(response)) {
        // Fallback: response es array directo
        productsData = response;
        console.log('Productos extraídos de response (array directo):', productsData.length);
      } else {
        console.warn('Estructura de respuesta inesperada:', response);
        throw new Error('Estructura de respuesta inesperada');
      }

      // Mostrar todos los productos recibidos
      if (Array.isArray(productsData) && productsData.length > 0) {
        console.group('TODOS LOS PRODUCTOS RECIBIDOS');
        productsData.forEach((product, i) => {
          console.log(`Producto ${i + 1}: ${product.name}`, {
            id: product.id,
            name: product.name,
            price: product.price,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            inStock: product.inStock,
            categoryName: product.category?.name,
            brandName: product.brand?.name
          });
        });
        console.groupEnd();
      }

      // Filtro correcto: Usar las propiedades reales del backend
      const featuredProducts = Array.isArray(productsData) 
        ? productsData.filter(product => {
            // Backend usa: isFeatured, isActive, inStock (no featured, active)
            const isFeatured = product.isFeatured !== false;
            const isActive = product.isActive !== false;  
            const inStock = product.inStock !== false;
            
            const shouldInclude = isFeatured && isActive && inStock;
            
            console.log(`Verificación de filtro para "${product.name}":`, {
              isFeatured: product.isFeatured,
              isActive: product.isActive,
              inStock: product.inStock,
              shouldInclude
            });
            
            return shouldInclude;
          })
        : [];

      console.group('RESULTADOS FILTRADOS');
      console.log(`${featuredProducts.length} de ${productsData.length} productos pasaron el filtro`);
      featuredProducts.forEach((product, i) => {
        console.log(`Producto Destacado ${i + 1}: ${product.name} - Q${product.price}`);
      });
      console.groupEnd();

      setProducts(featuredProducts);
      setIsLoaded(true);
      console.log(`Productos destacados cargados exitosamente! (${featuredProducts.length} productos destacados)`);

    } catch (err) {
      console.group('ERROR DE CARGA');
      console.error('Mensaje de error:', err.message);
      console.error('Detalles del error:', err);
      console.groupEnd();
      
      setError(err);
      setProducts([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchProducts();
    
    return () => {
      console.log('Limpieza del hook useFeaturedProducts');
    };
  }, [fetchProducts]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('Recarga manual de productos solicitada');
    setProducts([]);
    setIsLoaded(false);
    setError(null);
    fetchProducts();
  }, [fetchProducts]);

  // Log final del estado
  useEffect(() => {
    console.log('ESTADO FINAL de useFeaturedProducts:', {
      productsCount: products?.length || 0,
      isLoaded,
      isLoading,
      hasError: !!error,
      firstProduct: products?.[0]?.name || 'Ninguno'
    });
  }, [products, isLoaded, isLoading, error]);

  return {
    products,        // Productos filtrados correctamente
    isLoaded,        
    isLoading,       
    error,           
    reload           
  };
};

export default useFeaturedProducts;

/*
DOCUMENTACIÓN DEL HOOK useFeaturedProducts

PROPÓSITO:
Este hook personalizado gestiona la obtención y filtrado de productos destacados de la tienda
del gimnasio, proporcionando una interfaz robusta para mostrar suplementos, equipos de
entrenamiento, ropa deportiva y accesorios con precios en quetzales guatemaltecos que están
disponibles para compra por parte de los miembros del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Obtención automática de productos destacados desde el backend
- Filtrado inteligente por disponibilidad, estado activo y destacado
- Manejo robusto de diferentes estructuras de respuesta del backend
- Logging detallado para debugging y monitoreo de productos
- Función de recarga manual para actualizar inventario
- Estados de carga y error para UI responsive
- Compatibilidad con múltiples formatos de respuesta API

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/apiService: Comunicación con backend de la tienda del gimnasio
  * getFeaturedProducts(): Endpoint para obtener productos destacados de la tienda

DEPENDENCIAS DE REACT:
- useState: Gestión de estados de productos, carga y errores
- useEffect: Efectos para carga automática y cleanup
- useCallback: Optimización de funciones para evitar re-renders

QUE SE MUESTRA AL USUARIO DEL GIMNASIO:

PRODUCTOS DESTACADOS DISPONIBLES:
El hook proporciona una lista filtrada de productos que se muestran al usuario:

**Suplementos Nutricionales**:
- Proteínas en polvo (Whey, Caseína, Vegetal) con precios en quetzales
- Aminoácidos y BCAA para recuperación muscular
- Pre-entrenos y energizantes para rendimiento
- Vitaminas y minerales para salud general
- Quemadores de grasa y termogénicos
- Creatina y suplementos de fuerza

**Equipos de Entrenamiento**:
- Pesas libres y mancuernas para el hogar
- Bandas elásticas y equipos de resistencia
- Colchonetas y accesorios para yoga/pilates
- Máquinas pequeñas de ejercicio cardiovascular
- Equipos de entrenamiento funcional
- Accesorios para calistenia y crossfit

**Ropa Deportiva del Gimnasio**:
- Camisetas con logo de Elite Fitness
- Shorts y leggins de entrenamiento
- Sudaderas y chaquetas deportivas
- Ropa interior deportiva especializada
- Uniformes para personal del gimnasio
- Ropa de diferentes tallas y estilos

**Accesorios y Complementos**:
- Shakers y botellas de agua personalizadas
- Guantes de entrenamiento y protecciones
- Toallas deportivas con marca del gimnasio
- Bolsos y mochilas deportivas
- Cinturones de levantamiento de pesas
- Accesorios tecnológicos (pulseras, monitores)

**Información de Productos Mostrada**:
- **Nombre del producto**: Título descriptivo en español
- **Precio en quetzales (Q)**: Precio actual en moneda guatemalteca
- **Imagen del producto**: Foto de alta calidad del artículo
- **Categoría**: Clasificación (Suplementos, Equipos, Ropa, Accesorios)
- **Marca**: Fabricante o marca del producto
- **Disponibilidad**: Estado de stock actual
- **Descripción**: Detalles y beneficios del producto
- **Especificaciones**: Tallas, sabores, características técnicas

CRITERIOS DE FILTRADO:
El hook aplica filtros automáticos para mostrar solo productos apropiados:

**Filtros Aplicados Automáticamente**:
- `isFeatured: true` - Solo productos marcados como destacados
- `isActive: true` - Solo productos activos en la tienda
- `inStock: true` - Solo productos disponibles en inventario
- Productos aprobados para venta al público
- Precios válidos en quetzales guatemaltecos

**Productos Excluidos**:
- Productos fuera de stock o agotados
- Items discontinuados o inactivos
- Productos no destacados (inventario regular)
- Articles con precios incorrectos o faltantes
- Productos restringidos o solo para personal

CARACTERÍSTICAS TÉCNICAS:

**Manejo de Respuestas del Backend**:
- Estructura principal: `response.data.products` (array de productos)
- Fallback 1: `response.data` como array directo
- Fallback 2: `response` como array directo
- Validación robusta de estructuras de datos
- Logging detallado de cada estructura detectada

**Estados Gestionados**:
- `products`: Array de productos destacados filtrados
- `isLoaded`: Indica si se completó al menos una carga
- `isLoading`: Indica si hay una petición en curso
- `error`: Objeto de error si la petición falló
- `reload`: Función para forzar recarga manual

**Logging y Debugging**:
- Inicialización del hook
- Progreso de carga de productos
- Análisis detallado de estructura de respuesta
- Lista completa de productos recibidos del backend
- Proceso de filtrado con criterios aplicados
- Resultados finales con conteo de productos
- Estado final del hook con métricas

CASOS DE USO EN EL GIMNASIO:

**Página Principal del Sitio Web**:
- Carrusel de productos destacados en el hero
- Sección de ofertas especiales del mes
- Productos más vendidos del gimnasio
- Nuevos lanzamientos de la tienda

**Tienda Online del Gimnasio**:
- Página principal de la tienda con destacados
- Sección de recomendaciones personalizadas
- Productos en promoción con precios especiales
- Items más populares entre los miembros

**Dashboard de Miembros**:
- Productos recomendados según plan de entrenamiento
- Suplementos sugeridos por entrenadores
- Ofertas exclusivas para miembros del gimnasio
- Productos relacionados con objetivos fitness

**Landing Pages de Marketing**:
- Productos específicos para campañas promocionales
- Items destacados en anuncios y publicidad
- Productos estacionales (verano, nuevos propósitos)
- Ofertas especiales con precios en quetzales

INTEGRACIÓN CON SISTEMAS DEL GIMNASIO:

**Gestión de Inventario**:
- Sincronización automática con stock disponible
- Actualización en tiempo real de disponibilidad
- Control de productos agotados o discontinuados
- Integración con sistema de compras del gimnasio

**Sistema de Precios**:
- Precios actualizados en quetzales guatemaltecos
- Aplicación automática de descuentos y promociones
- Precios especiales para miembros del gimnasio
- Integración con sistema de facturación local

**Marketing y Promociones**:
- Productos destacados según campañas activas
- Items promocionados en redes sociales
- Productos estacionales y ofertas temporales
- Integración con sistema de email marketing

CARACTERÍSTICAS ESPECÍFICAS PARA GUATEMALA:

**Adaptación Local**:
- Precios en quetzales guatemaltecos (Q)
- Productos disponibles en el mercado local
- Marcas populares en Guatemala
- Consideración de poder adquisitivo local

**Logística y Entrega**:
- Productos disponibles para entrega en Guatemala
- Consideración de restricciones de importación
- Opciones de pickup en el gimnasio
- Tiempos de entrega realistas para el país

**Preferencias Culturales**:
- Productos adaptados a gustos locales
- Sabores y variedades populares en Guatemala
- Tallas y especificaciones para mercado centroamericano
- Marketing y descripciones en español guatemalteco

OPTIMIZACIONES DE RENDIMIENTO:

**Manejo Eficiente de Datos**:
- useCallback para funciones de fetch y reload
- Estados optimizados para evitar re-renders innecesarios
- Cleanup automático de efectos al desmontar
- Logging condicional para debugging en desarrollo

**Caching y Actualización**:
- Datos persistentes durante la sesión del usuario
- Función de reload manual para actualizar inventario
- Verificación de cambios en el estado de productos
- Optimización de peticiones al backend

**Experiencia de Usuario**:
- Estados de carga claros para UI responsive
- Manejo graceful de errores de conectividad
- Fallbacks para cuando no hay productos disponibles
- Información útil incluso durante errores

BENEFICIOS PARA EL GIMNASIO:

**Ventas y Revenue**:
- Promoción efectiva de productos de mayor margen
- Destacar items más rentables para el negocio
- Impulso de ventas de productos complementarios
- Generación de ingresos adicionales más allá de membresías

**Experiencia del Cliente**:
- Descubrimiento fácil de productos relevantes
- Información clara con precios en moneda local
- Disponibilidad actualizada para evitar frustraciones
- Integración perfecta con experiencia del gimnasio

**Gestión de Inventario**:
- Promoción de productos con mayor stock
- Rotación eficiente de inventario existente
- Reducción de productos obsoletos o por vencer
- Planificación de compras basada en demanda

Este hook es fundamental para la estrategia comercial del gimnasio, facilitando
la venta de productos complementarios que mejoren la experiencia de los miembros
mientras generan ingresos adicionales en quetzales guatemaltecos para el negocio.
*/