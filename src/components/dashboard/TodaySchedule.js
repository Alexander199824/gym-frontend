// src/components/dashboard/TodaySchedule.js
// UBICACIÓN: /gym-frontend/src/components/dashboard/TodaySchedule.js
// FUNCIÓN: Horarios del día actual

import React from 'react';
import { Clock, Calendar } from 'lucide-react';

const TodaySchedule = ({ schedule = [], isLoading = false }) => {
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Horarios de {today}</h3>
      </div>
      
      {schedule.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p>No hay horarios programados para hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((slot, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{slot.activity}</p>
                  <p className="text-xs text-gray-600">{slot.instructor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-700">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  <p className="text-xs text-gray-500">{slot.participants} participantes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaySchedule;