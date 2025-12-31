
import React from 'react';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{restaurant.name}</h3>
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
            {restaurant.snippet || "Explore the menu and reviews for this local favorite."}
          </p>
        </div>
        <div className="ml-4">
          <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
            <i className="fas fa-utensils"></i>
          </div>
        </div>
      </div>
      
      <a 
        href={restaurant.uri} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        View on Google Maps
        <i className="fas fa-external-link-alt ml-2 text-xs"></i>
      </a>
    </div>
  );
};

export default RestaurantCard;
