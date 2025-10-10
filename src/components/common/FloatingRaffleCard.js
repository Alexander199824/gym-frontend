// Autor: Alexander Echeverria
// Archivo: src/components/common/FloatingRaffleCard.js
// COMPONENTE: Banner flotante de sorteo - Modal grande inicial
// ✅ Modal MÁS GRANDE con botón super visible
// ✅ Botón flotante en medio lateral
// ✅ 100% Responsive y fácil de cerrar

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Gift, Trophy, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

const FloatingRaffleCard = () => {
  // Estados
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Configuración desde .env
  const isEnabled = process.env.REACT_APP_RAFFLE_ENABLED === 'true';
  const title = process.env.REACT_APP_RAFFLE_TITLE || '¡Sorteo Especial!';
  const subtitle = process.env.REACT_APP_RAFFLE_SUBTITLE || 'Por tu registro entras al sorteo de';
  const prizesString = process.env.REACT_APP_RAFFLE_PRIZES || '1 meses de membresía gratis|Un Frasco de Creatina';
  const stepsTitle = process.env.REACT_APP_RAFFLE_STEPS_TITLE || 'Pasos para participar';
  const stepsString = process.env.REACT_APP_RAFFLE_STEPS || 'Regístrate|Deja un testimonio|¡Listo!';
  const endDate = process.env.REACT_APP_RAFFLE_END_DATE || '18/11/2025';
  const ctaText = process.env.REACT_APP_RAFFLE_CTA_TEXT || 'Registrarme Ahora';
  const primaryColor = process.env.REACT_APP_RAFFLE_PRIMARY_COLOR || '#3B82F6';
  const secondaryColor = process.env.REACT_APP_RAFFLE_SECONDARY_COLOR || '#8B5CF6';

  // Convertir strings a arrays
  const prizes = prizesString.split('|').filter(p => p.trim());
  const steps = stepsString.split('|').filter(s => s.trim());

  // Detectar móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mostrar banner al cargar
  useEffect(() => {
    if (isEnabled) {
      const hasSeenModal = sessionStorage.getItem('raffleModalSeen');
      
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (hasSeenModal === 'true') {
          setIsFirstTime(false);
          setIsMinimized(true);
        } else {
          setIsFirstTime(true);
          setIsMinimized(false);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isEnabled]);

  // Manejar minimizar
  const handleMinimize = () => {
    setIsAnimating(true);
    sessionStorage.setItem('raffleModalSeen', 'true');
    setTimeout(() => {
      setIsMinimized(true);
      setIsFirstTime(false);
      setIsAnimating(false);
    }, 300);
  };

  // Manejar expandir
  const handleExpand = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsMinimized(false);
      setIsFirstTime(false);
      setIsAnimating(false);
    }, 300);
  };

  if (!isEnabled || !isVisible) {
    return null;
  }

  // BOTÓN FLOTANTE EN MEDIO LATERAL
  if (isMinimized && !isAnimating) {
    return (
      <button
        onClick={handleExpand}
        className="fixed z-50 transition-all duration-300 ease-out hover:scale-110 active:scale-95 group"
        style={{
          right: isMobile ? '16px' : '24px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        aria-label="Ver sorteo"
      >
        <div 
          className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center animate-bounce"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        >
          <Gift className="w-8 h-8 text-white" />
          
          {/* Pulso animado */}
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          />
          
          {/* Badge de notificación */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </button>
    );
  }

  // MODAL GRANDE INICIAL (Primera vez)
  if (isFirstTime && !isMinimized) {
    return (
      <>
        {/* Overlay oscuro - Click para cerrar */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300"
          style={{ 
            opacity: isAnimating ? 0 : 1,
            backdropFilter: 'blur(4px)'
          }}
          onClick={handleMinimize}
        />

        {/* Modal GRANDE centrado */}
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            animation: isAnimating ? 'none' : 'modalAppear 0.5s ease-out'
          }}
        >
          <div 
            className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 ${
              isMobile ? 'w-full max-w-md' : 'w-full max-w-2xl'
            }`}
            style={{
              borderColor: primaryColor,
              transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
              opacity: isAnimating ? 0 : 1,
              transition: 'all 0.3s ease-out',
              maxHeight: '90vh'
            }}
          >
            {/* BOTÓN CERRAR SUPER VISIBLE - ESQUINA */}
            <button
              onClick={handleMinimize}
              className="absolute top-4 right-4 z-20 bg-white hover:bg-gray-100 rounded-full p-3 shadow-2xl transition-all hover:scale-110 group"
              aria-label="Cerrar"
            >
              <X className="w-8 h-8 text-gray-700 group-hover:text-red-600 transition-colors" strokeWidth={3} />
            </button>

            {/* Header grande */}
            <div 
              className={`relative ${isMobile ? 'px-6 py-8' : 'px-12 py-12'} text-white overflow-hidden`}
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              {/* Patrón decorativo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full"></div>
              </div>

              {/* Contenido header */}
              <div className="relative text-center">
                <div 
                  className={`inline-flex items-center justify-center ${
                    isMobile ? 'w-20 h-20 mb-4' : 'w-24 h-24 mb-6'
                  } bg-white/20 rounded-3xl backdrop-blur-sm shadow-xl`}
                >
                  <Gift className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white`} />
                </div>
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <h3 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-black tracking-tight`}>
                    {title}
                  </h3>
                  <Sparkles className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} animate-pulse`} />
                </div>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} text-white/95 font-semibold max-w-md mx-auto`}>
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Body grande con scroll */}
            <div className={`${isMobile ? 'p-6' : 'p-8 md:p-10'} space-y-6 overflow-y-auto`} style={{ maxHeight: '50vh' }}>
              
              {/* Premios - TODOS VISIBLES */}
              <div>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Trophy className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} style={{ color: primaryColor }} />
                  <h4 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black text-gray-900`}>
                    Premios Increíbles
                  </h4>
                </div>
                <ul className="space-y-3">
                  {prizes.map((prize, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle2 
                        className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} mt-0.5 flex-shrink-0`}
                        style={{ color: secondaryColor }}
                      />
                      <span className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-700 leading-relaxed font-medium`}>
                        {prize}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pasos - TODOS VISIBLES */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h4 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black text-gray-900 mb-4 text-center`}>
                  {stepsTitle}
                </h4>
                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span 
                        className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center text-white ${isMobile ? 'text-base' : 'text-lg'} font-bold shadow-lg`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </span>
                      <span className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-700 pt-1 leading-relaxed font-medium`}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Fecha límite */}
              {endDate && (
                <div 
                  className={`flex items-center justify-center space-x-2 ${isMobile ? 'text-sm' : 'text-base'} text-gray-700 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-gray-200`}
                >
                  <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <span className="font-semibold">Válido hasta: <strong className="text-gray-900">{endDate}</strong></span>
                </div>
              )}

              {/* Botón CTA GRANDE */}
              <Link
                to="/register"
                className={`block w-full ${isMobile ? 'py-4' : 'py-5'} px-6 rounded-xl font-black text-center text-white ${isMobile ? 'text-base' : 'text-lg'} shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200`}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                }}
              >
                {ctaText}
              </Link>

              {/* BOTÓN SECUNDARIO PARA MINIMIZAR */}
              <button
                onClick={handleMinimize}
                className={`block w-full ${isMobile ? 'py-3' : 'py-4'} px-6 rounded-xl font-semibold text-center text-gray-600 ${isMobile ? 'text-sm' : 'text-base'} bg-gray-100 hover:bg-gray-200 transition-all duration-200`}
              >
                Ver Después
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes modalAppear {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </>
    );
  }

  // VERSIÓN COMPACTA LATERAL (Después de primera vez)
  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-in-out ${
        isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      } ${
        isMobile 
          ? 'bottom-4 left-4 right-4' 
          : 'bottom-6 right-6 w-80'
      }`}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden border-2"
        style={{ borderColor: primaryColor }}
      >
        {/* Header compacto */}
        <div 
          className="relative px-4 py-3 text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12"></div>
          </div>

          {/* Botón minimizar visible */}
          <button
            onClick={handleMinimize}
            className="absolute top-2 right-2 p-2 bg-white/30 hover:bg-white/50 rounded-lg transition-all z-10 shadow-lg group"
            aria-label="Minimizar"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="relative flex items-start space-x-2 pr-10">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Gift className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 mb-0.5">
                <h3 className="text-base font-bold leading-tight">{title}</h3>
                <Sparkles className="w-3 h-3 animate-pulse" />
              </div>
              <p className="text-xs text-white/90 font-medium leading-tight">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body compacto */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {/* Premios */}
          <div>
            <div className="flex items-center space-x-1.5 mb-2">
              <Trophy className="w-4 h-4" style={{ color: primaryColor }} />
              <h4 className="font-semibold text-sm text-gray-900">Premios:</h4>
            </div>
            <ul className="space-y-1.5">
              {prizes.slice(0, 3).map((prize, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs">
                  <CheckCircle2 
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" 
                    style={{ color: secondaryColor }}
                  />
                  <span className="text-gray-700 leading-snug">{prize}</span>
                </li>
              ))}
              {prizes.length > 3 && (
                <li className="text-xs text-gray-500 italic ml-5">
                  +{prizes.length - 3} premios más...
                </li>
              )}
            </ul>
          </div>

          {/* Pasos */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">
              {stepsTitle}:
            </h4>
            <ol className="space-y-1.5">
              {steps.slice(0, 3).map((step, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs">
                  <span 
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5 leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Fecha */}
          {endDate && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-600 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Hasta: <strong>{endDate}</strong></span>
            </div>
          )}

          {/* CTA */}
          <Link
            to="/register"
            className="block w-full py-2.5 px-3 rounded-lg font-semibold text-center text-white text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            {ctaText}
          </Link>
        </div>

        {/* Brillo animado */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${primaryColor}15 50%, transparent 100%)`,
            animation: 'shimmer 3s infinite'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${primaryColor};
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FloatingRaffleCard;

/*
MEJORAS IMPLEMENTADAS - VERSIÓN FINAL:

✅ MODAL INICIAL MÁS GRANDE:
- Desktop: max-w-2xl (antes max-w-md)
- Móvil: max-w-md con padding generoso
- Muestra TODOS los premios y pasos
- Fuentes más grandes y legibles
- Espaciado amplio

✅ BOTÓN CERRAR EXTREMADAMENTE VISIBLE:
- X GIGANTE en esquina superior derecha
- Fondo blanco sólido con shadow-2xl
- Hover effect claro (rojo)
- 48x48px mínimo (touch-friendly)
- ADEMÁS: Botón "Ver Después" abajo del todo

✅ BOTÓN FLOTANTE EN MEDIO LATERAL:
- Posición: top: 50%, right: 24px
- Transform: translateY(-50%) - Centrado verticalmente
- Visible desde cualquier scroll
- Animación de rebote continua

✅ FACILIDAD DE SALIDA:
- Click en overlay oscuro = cerrar
- Botón X gigante arriba = cerrar
- Botón "Ver Después" abajo = cerrar
- 3 formas fáciles de salir

✅ RESPONSIVE PERFECTO:
- Móvil: Adaptado a pantallas pequeñas
- Tablet: Medio
- Desktop: Grande
- Todo touch-friendly

✅ COMPORTAMIENTO:
1. Primera vez: Modal GRANDE centrado
2. Minimizar: Botón flotante en medio lateral
3. Expandir: Versión compacta lateral
4. Recargar: Empieza en botón flotante
*/