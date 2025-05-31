"use client";

import React, { useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "300px" };

export default function MapAddressPicker({ onPick }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY,
    libraries: ["places"],
  });

  const [marker, setMarker] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  // Drop pin & reverse-geocode
  const handleMapClick = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          onPick({
            formatted: results[0].formatted_address,
            lat,
            lng,
          });
        } else {
          console.error("Geocode failed:", status);
        }
      });
    },
    [onPick]
  );

  // Locate Me: pan, set marker, reverse-geocode
  const locateUser = useCallback(() => {
    if (!mapRef || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const userLoc = { lat, lng };

        // Move map and marker
        mapRef.panTo(userLoc);
        mapRef.setZoom(16);
        setMarker(userLoc);

        // Reverse-geocode
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: userLoc }, (results, status) => {
          if (status === "OK" && results[0]) {
            onPick({
              formatted: results[0].formatted_address,
              lat,
              lng,
            });
          } else {
            console.error("Geocode failed:", status);
          }
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
  }, [mapRef, onPick]);

  if (loadError) return <p>Failed to load map</p>;
  if (!isLoaded) return <p>Loading map…</p>;

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={marker || DEFAULT_CENTER}
        zoom={marker ? 16 : 12}
        onClick={handleMapClick}
        onLoad={onMapLoad}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>

      <button
        onClick={locateUser}
        style={{
          position: "absolute",
          bottom: 50,
          left: 10,
          zIndex: 5,
          background: "#2c6449",
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: "6px 8px",
          fontSize: 14,
          cursor: "pointer",
          color: "white",
        }}
      >
        Locate Me
      </button>

      <p className='mt-2 text-sm text-gray-600'>
        Click on the map or hit “Locate Me” to pick your exact address.
      </p>
    </div>
  );
}
