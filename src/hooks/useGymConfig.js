// src/hooks/useGymConfig.js
// FUNCIÓN: Hook CORREGIDO para configuración del gimnasio

import { useMemo } from 'react';

export const useGymConfig = () => {
  const gymConfig = useMemo(() => {
    // 🔍 Debug para ver las variables de entorno
    console.log('🔧 Variables de entorno cargadas:');
    console.log('  LOGO:', process.env.REACT_APP_LOGO_URL);
    console.log('  NOMBRE:', process.env.REACT_APP_GYM_NAME);
    console.log('  DIRECCIÓN:', process.env.REACT_APP_GYM_ADDRESS);
    console.log('  TELÉFONO:', process.env.REACT_APP_GYM_PHONE);
    
    return {
      // Información básica
      name: process.env.REACT_APP_GYM_NAME || 'Elite Fitness Club',
      tagline: process.env.REACT_APP_GYM_TAGLINE || 'Transforma tu cuerpo, eleva tu mente',
      description: process.env.REACT_APP_GYM_DESCRIPTION || 'El mejor gimnasio de la ciudad',
      
      // Logo y branding
      logo: {
        url: process.env.REACT_APP_LOGO_URL || null,
        alt: `${process.env.REACT_APP_GYM_NAME || 'Gym'} Logo`
      },
      
      // Contacto - CORREGIDO
      contact: {
        phone: process.env.REACT_APP_GYM_PHONE || '+502 2345-6789',
        email: process.env.REACT_APP_GYM_EMAIL || 'info@gym.com',
        address: process.env.REACT_APP_GYM_ADDRESS || 'Ciudad de Guatemala',
        addressFull: process.env.REACT_APP_GYM_ADDRESS_FULL || process.env.REACT_APP_GYM_ADDRESS || 'Ciudad de Guatemala',
        whatsapp: process.env.REACT_APP_SOCIAL_WHATSAPP || null
      },
      
      // Horarios - CORREGIDO
      hours: {
        weekday: process.env.REACT_APP_GYM_HOURS_WEEKDAY || 'Lunes a Viernes: 6:00 AM - 10:00 PM',
        weekend: process.env.REACT_APP_GYM_HOURS_WEEKEND || 'Sábados y Domingos: 7:00 AM - 9:00 PM',
        full: process.env.REACT_APP_GYM_HOURS_FULL || 'Lun-Vie: 6AM-10PM | Sáb-Dom: 7AM-9PM'
      },
      
      // Redes sociales - CORREGIDO
      social: {
        instagram: {
          url: process.env.REACT_APP_SOCIAL_INSTAGRAM || null,
          handle: process.env.REACT_APP_SOCIAL_INSTAGRAM_HANDLE || '@gym'
        },
        facebook: {
          url: process.env.REACT_APP_SOCIAL_FACEBOOK || null,
          handle: process.env.REACT_APP_SOCIAL_FACEBOOK_HANDLE || 'Gym Page'
        },
        twitter: {
          url: process.env.REACT_APP_SOCIAL_TWITTER || null,
          handle: process.env.REACT_APP_SOCIAL_TWITTER_HANDLE || '@gym'
        },
        youtube: {
          url: process.env.REACT_APP_SOCIAL_YOUTUBE || null,
          handle: 'YouTube'
        },
        tiktok: {
          url: process.env.REACT_APP_SOCIAL_TIKTOK || null,
          handle: 'TikTok'
        },
        whatsapp: {
          url: process.env.REACT_APP_SOCIAL_WHATSAPP || null,
          handle: 'WhatsApp'
        }
      },
      
      // Estadísticas
      stats: {
        members: process.env.REACT_APP_GYM_MEMBERS_COUNT || '1000+',
        trainers: process.env.REACT_APP_GYM_TRAINERS_COUNT || '20+',
        experience: process.env.REACT_APP_GYM_EXPERIENCE_YEARS || '10+',
        satisfaction: process.env.REACT_APP_GYM_SATISFACTION_RATE || '95%'
      },
      
      // Ubicación
      location: {
        city: process.env.REACT_APP_GYM_CITY || 'Guatemala',
        country: process.env.REACT_APP_GYM_COUNTRY || 'Guatemala',
        mapsUrl: process.env.REACT_APP_GYM_MAPS_URL || null,
        coordinates: {
          lat: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LAT) || 14.599512,
          lng: parseFloat(process.env.REACT_APP_GYM_COORDINATES_LNG) || -90.513843
        }
      },
      
      // Servicios
      services: {
        parking: process.env.REACT_APP_GYM_PARKING === 'true',
        lockers: process.env.REACT_APP_GYM_LOCKERS === 'true',
        showers: process.env.REACT_APP_GYM_SHOWERS === 'true',
        wifi: process.env.REACT_APP_GYM_WIFI === 'true',
        ac: process.env.REACT_APP_GYM_AC === 'true',
        security: process.env.REACT_APP_GYM_SECURITY || 'Horario normal'
      }
    };
  }, []);
  
  return gymConfig;
};

export default useGymConfig;