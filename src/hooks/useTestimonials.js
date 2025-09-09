// src/hooks/useTestimonials.js
// Autor: Alexander Echeverria
// Archivo: src/hooks/useTestimonials.js

// FUNCION: Hook CORREGIDO para cargar testimonios
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('useTestimonials hook initialized');

  const fetchTestimonials = useCallback(async () => {
    console.log('Cargando Testimonios');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Solicitando testimonios...');
      const response = await apiService.getTestimonials();
      
      console.log('Testimonios recibidos:', response);
      
      // ARREGLO CRITICO: Extraer solo la data del response
      let testimonialsData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        testimonialsData = response.data;
        console.log('Datos de testimonios extraídos:');
        console.log('  - Total testimonios:', testimonialsData.length);
        if (Array.isArray(testimonialsData)) {
          testimonialsData.forEach((testimonial, i) => {
            console.log(`  - Testimonio ${i + 1}: ${testimonial.name} (${testimonial.rating} estrellas)`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        testimonialsData = response;
        console.log('Datos de testimonios (array directo):', testimonialsData.length);
      } else {
        console.warn('Estructura de respuesta de testimonios inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      // Filtrar solo testimonios activos y verificados
      const activeTestimonials = Array.isArray(testimonialsData) 
        ? testimonialsData.filter(testimonial => 
            testimonial.active !== false && 
            testimonial.verified !== false
          )
        : [];

      setTestimonials(activeTestimonials); // Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`Testimonios cargados exitosamente! (${activeTestimonials.length} activos)`);

    } catch (err) {
      console.error('Error al cargar testimonios:', err.message);
      setError(err);
      setTestimonials([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchTestimonials();
    
    return () => {
      console.log('useTestimonials hook cleanup');
    };
  }, [fetchTestimonials]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('Recarga manual de testimonios solicitada');
    fetchTestimonials();
  }, [fetchTestimonials]);

  return {
    testimonials,    // Solo la data: [ { id: 1, name: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useTestimonials;

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este hook personalizado (useTestimonials) se encarga de cargar y gestionar los testimonios
de clientes del gimnasio. Incluye una corrección crítica que extrae correctamente la data
del response del backend, evitando problemas de estructura de datos anidados.

FUNCIONALIDAD PRINCIPAL:
- Carga testimonios desde el endpoint del backend
- Extracción inteligente de datos del response (maneja múltiples formatos)
- Filtrado automático de testimonios activos y verificados
- Manejo robusto de errores con fallback a array vacío
- Sistema de recarga manual para actualizar testimonios
- Logging detallado para facilitar el debugging

ARCHIVOS A LOS QUE SE CONECTA:
- ../services/apiService: Servicio que maneja la petición getTestimonials()
- Componentes que muestran testimonios de clientes en la UI
- Secciones de reviews y calificaciones del gimnasio
- Carruseles o grids de testimonios en páginas promocionales

ESTRUCTURA DE DATOS DE TESTIMONIOS:
Cada testimonio contiene típicamente:
- id: Identificador único del testimonio
- name: Nombre del cliente que dio el testimonio
- rating: Calificación en estrellas (número)
- comment/message: Texto del testimonio
- active: Booleano que indica si está activo
- verified: Booleano que indica si está verificado
- date: Fecha del testimonio
- avatar/photo: Imagen del cliente (opcional)

CORRECCION IMPLEMENTADA:
El hook maneja múltiples formatos de respuesta del backend:
1. { success: true, data: [...] } - Formato estándar con wrapper
2. [...] - Array directo de testimonios
3. Respuestas inválidas - Manejo de errores con fallback

FUNCIONES EXPORTADAS:
- testimonials: Array con los testimonios activos y verificados
- isLoaded: Booleano que indica si terminó de cargar (éxito o error)
- isLoading: Booleano que indica si está en proceso de carga
- error: Objeto de error si la carga falló
- reload(): Función para recargar manualmente los testimonios

BENEFICIOS:
- Datos limpios sin wrappers innecesarios del backend
- Filtrado automático de testimonios no válidos
- Logging detallado para facilitar el debugging
- Manejo robusto de diferentes formatos de respuesta
- Interfaz simple y consistente para los componentes

Este hook es esencial para mostrar la credibilidad del gimnasio mediante
testimonios reales de clientes satisfechos, mejorando la confianza y
conversión de nuevos usuarios.
*/