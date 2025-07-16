// src/components/dashboard/RecentActivity.js
// UBICACIÓN: /gym-frontend/src/components/dashboard/RecentActivity.js
// FUNCIÓN: Actividad reciente del sistema

import React from 'react';
import { Clock, User, CreditCard, DollarSign } from 'lucide-react';

const RecentActivity = ({ activities = [], isLoading = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'membership_created':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;