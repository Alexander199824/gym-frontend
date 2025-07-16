// src/components/dashboard/QuickStats.js
// UBICACIÓN: /gym-frontend/src/components/dashboard/QuickStats.js
// FUNCIÓN: Estadísticas rápidas para el dashboard admin

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const QuickStats = ({ stats = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            {stat.change && (
              <div className={`flex items-center ${
                stat.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">{Math.abs(stat.change)}%</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;