// src/pages/dashboard/landing/LandingHero.js
// SECCIÓN HERO CON VIDEO Y ESTADÍSTICAS DINÁMICAS

import React, { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Gift, ShoppingCart } from 'lucide-react';
import { getColorClasses, processStats } from './landingUtils';

const LandingHero = ({ 
  gymConfig, 
  videoData, 
  stats, 
  statsLoaded, 
  isMobile,
  hasProducts 
}) => {
  // Estados de video
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Procesar estadísticas dinámicamente
  const formattedStats = useMemo(() => 
    processStats(stats, statsLoaded), 
    [stats, statsLoaded]
  );

  // Control de video
  const handleVideoLoad = () => {
    console.log('Video cargado exitosamente');
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = (error) => {
    console.error('Error de video:', error);
    setVideoError(true);
    setVideoLoaded(false);
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;

    try {
      if (isVideoPlaying) {
        console.log('Pausando video');
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        console.log('Reproduciendo video');
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsVideoPlaying(true))
            .catch((error) => {
              console.error('Fallo al reproducir:', error);
              setVideoError(true);
            });
        } else {
          setIsVideoPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error al alternar reproducción:', error);
      setVideoError(true);
    }
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;

    try {
      const newMutedState = !isVideoMuted;
      videoRef.current.muted = newMutedState;
      setIsVideoMuted(newMutedState);
      console.log('Video silenciado:', newMutedState);
    } catch (error) {
      console.error('Error al alternar silencio:', error);
    }
  };

  return (
    <section id="inicio" className="relative pt-20 pb-16 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
      
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute bg-primary-500 bg-opacity-5 rounded-full blur-3xl ${
          isMobile ? 'top-10 right-5 w-48 h-48' : 'top-20 right-10 w-72 h-72'
        }`}></div>
        <div className={`absolute bg-secondary-500 bg-opacity-5 rounded-full blur-3xl ${
          isMobile ? 'bottom-10 left-5 w-64 h-64' : 'bottom-20 left-10 w-96 h-96'
        }`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`${isMobile ? 'space-y-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-16'} items-center`}>
          
          {/* Contenido Hero */}
          <div className={`space-y-6 ${isMobile ? 'text-center' : ''}`}>
            <h1 className={`font-bold text-gray-900 leading-tight ${
              isMobile ? 'text-3xl sm:text-4xl' : 'text-4xl md:text-6xl lg:text-7xl'
            }`}>
              Bienvenido a{' '}
              <span className="text-primary-600">{gymConfig.name}</span>
            </h1>

            <p className={`text-gray-600 leading-relaxed max-w-2xl ${
              isMobile ? 'text-lg mx-auto' : 'text-xl md:text-2xl'
            }`}>
              {gymConfig.description}
            </p>

            {gymConfig.tagline && (
              <p className={`text-primary-600 font-medium ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>
                {gymConfig.tagline}
              </p>
            )}

            {/* CTAs */}
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <Link to="/register" className={`btn-primary font-semibold hover:scale-105 transition-all ${
                isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
              }`}>
                <Gift className="w-5 h-5 mr-2" />
                Únete Ahora
              </Link>
              {hasProducts && (
                <a href="#tienda" className={`btn-secondary hover:scale-105 transition-all ${
                  isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
                }`}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ver Tienda
                </a>
              )}
            </div>
          </div>

          {/* Video/Imagen Hero */}
          <div className="relative">
            {videoData?.hasVideo ? (
              <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${
                isMobile ? 'aspect-[16/9]' : 'aspect-[16/9]'
              }`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster={videoData.imageUrl || "/api/placeholder/800/450"}
                  muted={isVideoMuted}
                  loop
                  playsInline
                  onLoadedMetadata={handleVideoLoad}
                  onError={handleVideoError}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onMouseEnter={() => setShowVideoControls(true)}
                  onMouseLeave={() => setShowVideoControls(false)}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                >
                  <source src={videoData.videoUrl} type="video/mp4" />
                  Tu navegador no soporta video HTML5.
                </video>

                {/* Controles de video */}
                <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${
                  showVideoControls || !isVideoPlaying || videoError ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="flex space-x-4">
                    <button
                      onClick={toggleVideoPlay}
                      className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
                      disabled={videoError}
                    >
                      {isVideoPlaying ? 
                        <Pause className="w-8 h-8 text-gray-900" /> : 
                        <Play className="w-8 h-8 text-gray-900 ml-1" />
                      }
                    </button>

                    <button
                      onClick={toggleVideoMute}
                      className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
                      disabled={videoError}
                    >
                      {isVideoMuted ? 
                        <VolumeX className="w-5 h-5 text-gray-900" /> : 
                        <Volume2 className="w-5 h-5 text-gray-900" />
                      }
                    </button>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

                {videoError && (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Error al cargar el video</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl relative">
                <img 
                  src={videoData?.imageUrl || "/api/placeholder/800/450"}
                  alt={`${gymConfig.name} - Instalaciones`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas dinámicas */}
        {formattedStats.length > 0 && (
          <div className={`mt-12 pt-8 border-t border-gray-200 ${
            isMobile 
              ? 'grid grid-cols-2 gap-4' 
              : formattedStats.length === 1 ? 'grid grid-cols-1 justify-center max-w-xs mx-auto' :
                formattedStats.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-8' :
                formattedStats.length === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-8' :
                'grid grid-cols-2 md:grid-cols-4 gap-8'
          }`}>
            {formattedStats.map((stat, index) => {
              const colorClass = getColorClasses(stat.color);
              
              return (
                <div key={`stat-${index}`} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className={`${colorClass.bg} rounded-2xl flex items-center justify-center ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <stat.icon className={`${colorClass.text} ${
                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
                    </div>
                  </div>
                  <div className={`font-bold text-gray-900 mb-1 ${
                    isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
                  }`}>
                    {stat.number}
                  </div>
                  <div className={`text-gray-600 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {stat.label}
                  </div>
                  {stat.description && !isMobile && (
                    <div className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingHero;