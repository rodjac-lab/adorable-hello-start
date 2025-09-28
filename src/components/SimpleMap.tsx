import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';

// Simple predefined locations for Jordan trip
const jordanLocations = [
  { name: "Amman", day: 1, coords: [35.9106, 31.9539], description: "Capitale de la Jordanie" },
  { name: "Jerash", day: 2, coords: [35.8998, 32.2811], description: "Ruines romaines" },
  { name: "Ajloun", day: 2, coords: [35.7519, 32.3326], description: "Château d'Ajloun" },
  { name: "Petra", day: 5, coords: [35.4444, 30.3285], description: "Cité rose nabatéenne" },
  { name: "Wadi Rum", day: 7, coords: [35.4155, 29.5324], description: "Désert lunaire" },
  { name: "Aqaba", day: 9, coords: [35.005, 29.5262], description: "Mer Rouge" },
  { name: "Mer Morte", day: 11, coords: [35.5883, 31.559], description: "Point le plus bas du monde" },
  { name: "Madaba", day: 12, coords: [35.7933, 31.7169], description: "Ville des mosaïques" },
  { name: "Mont Nebo", day: 12, coords: [35.7269, 31.7687], description: "Vue sur la Terre Promise" }
];

// Mapbox public token - get yours free at https://mapbox.com
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

const SimpleMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [35.9106, 31.9539], // Centered on Amman
      zoom: 7
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Calculate bounds to fit all locations
      const bounds = new mapboxgl.LngLatBounds();
      jordanLocations.forEach(location => {
        bounds.extend(location.coords as [number, number]);
      });

      // Fit map to show all locations
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10
      });

      // Add markers for each location
      jordanLocations.forEach((location) => {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.style.cssText = `
          width: 30px;
          height: 30px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        `;

        markerElement.textContent = location.day.toString();

        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.1)';
        });
        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
        });

        // Create popup with location info and link to journal
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(`
          <div style="padding: 12px; max-width: 200px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;">
              ${location.name}
            </h3>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">
              ${location.description}
            </p>
            <div style="margin-bottom: 12px; padding: 4px 8px; background: #3b82f6; color: white; border-radius: 12px; font-size: 12px; display: inline-block;">
              Jour ${location.day}
            </div>
            <button
              onclick="window.navigateToJournal()"
              style="
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                width: 100%;
                transition: background 0.2s ease;
              "
              onmouseover="this.style.background='#059669'"
              onmouseout="this.style.background='#10b981'"
            >
              📖 Voir dans le journal
            </button>
          </div>
        `);

        // Add marker to map
        new mapboxgl.Marker(markerElement)
          .setLngLat(location.coords as [number, number])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Add navigation function to window for popup buttons
      (window as any).navigateToJournal = () => {
        navigate('/journal');
      };
    });

    // Cleanup function
    return () => {
      map.current?.remove();
    };
  }, [navigate]);

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Itinéraire du voyage en Jordanie</h2>
        <p className="text-muted-foreground">
          Cliquez sur les marqueurs pour découvrir chaque étape du voyage
        </p>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-lg shadow-lg border"
      />

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>🗺️ Carte interactive • 📍 {jordanLocations.length} lieux visités • 📖 Cliquez pour plus de détails</p>
      </div>
    </div>
  );
};

export default SimpleMap;