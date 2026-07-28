import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { userPinIcon, storePinIcon } from './ShoppingHelpers';

function FlyToLocation({ center }) {
  const map = useMap();
  const lat = center?.[0];
  const lng = center?.[1];

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14);
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [lat, lng, map]);
  return null;
}

function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect && e && e.latlng) {
        console.log('📍 Leaflet map clicked:', e.latlng.lat, e.latlng.lng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
    contextmenu(e) {
      if (onLocationSelect && e && e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function ShoppingMapWidget({
  userLat,
  userLng,
  stores = [],
  selectedShop,
  onSelectStore,
  onLocationSelect,
  onEnableGps,
  trackingGps = false,
  savedAddressLabel = '',
  heightClass = 'h-56 sm:h-64',
}) {
  const currentLat = userLat || 9.7833;
  const currentLng = userLng || 80.0167;

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-white/15 h-56 w-full relative shadow-inner">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          tap={false}
        >
          <FlyToLocation center={[currentLat, currentLng]} />
          <MapEventsHandler onLocationSelect={onLocationSelect} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {userPinIcon && (
            <Marker position={[currentLat, currentLng]} icon={userPinIcon}>
              <Popup>
                <div className="p-1 text-slate-900">
                  <strong>📍 Your Marked Home Location</strong>
                  <br />
                  {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                  {savedAddressLabel && (
                    <div className="text-xs text-slate-600 mt-1">{savedAddressLabel}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {stores.map((shop) => {
            const isSelected = selectedShop && selectedShop._id === shop._id;
            return storePinIcon ? (
              <Marker
                key={shop._id || shop.shopName}
                position={shop.coords || [currentLat + 0.005, currentLng + 0.005]}
                icon={storePinIcon}
                eventHandlers={{
                  click: () => onSelectStore && onSelectStore(shop),
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-900">
                    <strong>🏪 {shop.shopName}</strong>
                    <br />
                    {shop.distanceKm} km away · {shop.deliveryTimeMinutes}
                    <br />
                    Fee: ${shop.deliveryFee === 0 ? 'Free' : shop.deliveryFee?.toFixed(2)}
                    {isSelected && (
                      <div className="text-xs font-bold text-emerald-600 mt-1">✓ Currently Selected</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null;
          })}
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] glass px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold text-cyan-300 flex items-center gap-1 shadow-lg border border-cyan-500/30">
          <span>📍</span> Tap anywhere on map to move home pin
        </div>
      </div>
    </div>
  );
}
