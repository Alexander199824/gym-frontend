// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/ExpiredMemberships.js

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, RefreshCw } from 'lucide-react';

const ExpiredMemberships = ({ memberships = [], showActions = false }) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p>Excelente! No hay membresías vencidas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memberships.map((membership) => (
        <div key={membership.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {membership.user?.firstName} {membership.user?.lastName}
              </h4>
              <p className="text-xs text-gray-600">
                {membership.type === 'monthly' ? 'Membresía Mensual' : 'Pago Diario'}
              </p>
              <p className="text-xs text-red-600">
                Venció: {new Date(membership.endDate).toLocaleDateString()}
              </p>
            </div>
            
            {showActions && (
              <div className="flex space-x-2">
                <Link
                  to={`/dashboard/memberships/${membership.id}`}
                  className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                >
                  <Eye className="w-3 h-3" />
                </Link>
                <Link
                  to={`/dashboard/memberships/${membership.id}/renew`}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  <RefreshCw className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpiredMemberships;

/*
FUNCIONALIDAD:
Este componente se encarga de mostrar una lista de membresías vencidas en el dashboard del gimnasio.
Recibe como props un array de membresías y un booleano para mostrar acciones adicionales.

CARACTERÍSTICAS:
- Muestra mensaje positivo cuando no hay membresías vencidas
- Lista las membresías vencidas con información del usuario (nombre, apellido)
- Indica el tipo de membresía (mensual o diario)
- Muestra la fecha de vencimiento
- Incluye acciones opcionales para ver detalles y renovar membresía

CONEXIONES:
- Importa desde 'react' para la funcionalidad del componente
- Importa 'Link' desde 'react-router-dom' para navegación entre rutas
- Importa iconos desde 'lucide-react' (AlertCircle, Eye, RefreshCw)
- Se conecta con rutas del dashboard: /dashboard/memberships/{id} y /dashboard/memberships/{id}/renew
- Utilizado en componentes padre del dashboard que manejan el estado de las membresías
- Recibe datos de membresías desde componentes superiores que consultan la API del backend

PROPÓSITO:
Facilitar la gestión y visualización de membresías vencidas para que el personal del gimnasio 
pueda identificar rápidamente clientes que necesitan renovar su membresía y tomar acciones correspondientes.
*/