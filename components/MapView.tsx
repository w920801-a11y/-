
import React, { useEffect, useRef } from 'react';
import { Location, Restaurant } from '../types';

interface MapViewProps {
  userLocation: Location;
  restaurants: Restaurant[];
  onMarkerClick: (restaurant: Restaurant) => void;
}

declare const L: any;

const MapView: React.FC<MapViewProps> = ({ userLocation, restaurants, onMarkerClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userElementsRef = useRef<{marker?: any, accuracyCircle?: any, searchCircle?: any}>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(
        [userLocation.latitude, userLocation.longitude],
        15
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }

    // Update user location marker & accuracy circle
    if (userElementsRef.current.marker) userElementsRef.current.marker.remove();
    if (userElementsRef.current.accuracyCircle) userElementsRef.current.accuracyCircle.remove();
    if (userElementsRef.current.searchCircle) userElementsRef.current.searchCircle.remove();

    const userMarkerIcon = L.divIcon({
      html: '<div class="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg pulse-marker"></div>',
      className: 'custom-user-marker',
      iconSize: [16, 16],
    });

    userElementsRef.current.marker = L.marker([userLocation.latitude, userLocation.longitude], { 
      icon: userMarkerIcon,
      zIndexOffset: 1000 
    })
      .addTo(mapInstanceRef.current)
      .bindPopup(`您的當前位置 (誤差約 ${Math.round(userLocation.accuracy || 0)} 公尺)`);

    // 當前定位誤差圈 (Accuracy Circle - 像 Google Maps 一樣的淡藍色背景)
    if (userLocation.accuracy) {
      userElementsRef.current.accuracyCircle = L.circle([userLocation.latitude, userLocation.longitude], {
        radius: userLocation.accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1,
        stroke: true
      }).addTo(mapInstanceRef.current);
    }

    // 2km 搜尋範圍圈
    userElementsRef.current.searchCircle = L.circle([userLocation.latitude, userLocation.longitude], {
      radius: 2000,
      color: '#f97316',
      fillColor: 'transparent',
      dashArray: '5, 10',
      weight: 2
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude]);

    // Update markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    restaurants.forEach(res => {
      if (res.lat && res.lng) {
        const marker = L.marker([res.lat, res.lng])
          .addTo(mapInstanceRef.current)
          .on('click', () => onMarkerClick(res));
          
        marker.bindPopup(`<b>${res.name}</b><br/><span class="text-xs text-slate-500">${res.snippet || '餐廳推薦'}</span>`);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show user and restaurants
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup([...markersRef.current, userElementsRef.current.marker]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [userLocation, restaurants, onMarkerClick]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" />
      <style>{`
        .pulse-marker {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>
    </div>
  );
};

export default MapView;
