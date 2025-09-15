// src/pages/dashboard/components/PaymentsManager/components/TransferProofViewer.js
// Author: Alexander Echeverria
// Componente para mostrar comprobantes de transferencias inline
// Maneja imágenes, PDFs y otros tipos de archivos de comprobantes

import React, { useState } from 'react';
import { 
  Eye, EyeOff, ExternalLink, Download, FileText, 
  Image as ImageIcon, AlertCircle, Loader2, X 
} from 'lucide-react';

const TransferProofViewer = ({ 
  proofUrl, 
  transferId, 
  clientName = 'Cliente',
  amount = 0,
  formatCurrency,
  isExpanded = false,
  onToggleExpand 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (!proofUrl) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Sin comprobante subido</p>
        <p className="text-xs text-gray-400 mt-1">
          El cliente debe subir su comprobante de transferencia
        </p>
      </div>
    );
  }

  // Determinar tipo de archivo por extensión
  const getFileType = (url) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else {
      return 'unknown';
    }
  };

  const fileType = getFileType(proofUrl);

  // Manejar error de carga de imagen
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Manejar carga exitosa de imagen
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Renderizar preview según tipo de archivo
  const renderFilePreview = () => {
    if (fileType === 'image') {
      if (imageError) {
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">Error cargando imagen</p>
            <a 
              href={proofUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Abrir enlace directo
            </a>
          </div>
        );
      }

      return (
        <div className="relative">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}
          <img
            src={proofUrl}
            alt={`Comprobante de transferencia - ${clientName}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={() => setShowFullscreen(true)}
            loading="lazy"
          />
          {!imageLoading && !imageError && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
              <Eye className="w-4 h-4" />
            </div>
          )}
        </div>
      );
    } else if (fileType === 'pdf') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-900 mb-2">Comprobante PDF</p>
          <p className="text-xs text-red-600 mb-3">
            Clic para abrir en nueva pestaña
          </p>
          <a 
            href={proofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Abrir PDF
          </a>
        </div>
      );
    } else {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-blue-900 mb-2">Archivo de comprobante</p>
          <p className="text-xs text-blue-600 mb-3">
            Clic para descargar o ver
          </p>
          <a 
            href={proofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Abrir archivo
          </a>
        </div>
      );
    }
  };

  // Modal fullscreen para imágenes
  const FullscreenModal = () => {
    if (!showFullscreen || fileType !== 'image' || imageError) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img
            src={proofUrl}
            alt={`Comprobante completo - ${clientName}`}
            className="max-w-full max-h-full object-contain"
          />
          
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
            <p className="text-sm font-medium">{clientName}</p>
            <p className="text-xs opacity-75">
              {formatCurrency && formatCurrency(amount)}
            </p>
          </div>
          
          <div className="absolute bottom-4 right-4">
            <a 
              href={proofUrl} 
              download={`comprobante-${transferId}-${clientName}.jpg`}
              className="bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors inline-flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      
      {/* Header del comprobante */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-gray-900">
            Comprobante de transferencia
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botón de expandir/contraer */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          
          {/* Enlace externo */}
          <a 
            href={proofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Preview del archivo (solo si está expandido) */}
      {isExpanded && (
        <div className="mt-3">
          {renderFilePreview()}
        </div>
      )}

      {/* Info del archivo cuando está contraído */}
      {!isExpanded && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800">
                Comprobante disponible ({fileType.toUpperCase()})
              </span>
            </div>
            <span className="text-xs text-green-600">
              Clic en el ojo para ver
            </span>
          </div>
        </div>
      )}

      {/* Modal fullscreen */}
      <FullscreenModal />
    </div>
  );
};

export default TransferProofViewer;