import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident, Severity } from '../types';
import { Layers, MapPin, Maximize2, Navigation, AlertCircle } from 'lucide-react';

interface DisasterMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

const HYDERABAD_CENTER: [number, number] = [17.4065, 78.4482];
const DEFAULT_ZOOM = 12;

// Key command-center hotspots
const KEY_ZONES = [
  { name: 'All Hyderabad', coords: HYDERABAD_CENTER, zoom: 12 },
  { name: 'Mehdipatnam', coords: [17.3916, 78.4411] as [number, number], zoom: 14 },
  { name: 'Tolichowki', coords: [17.3986, 78.4069] as [number, number], zoom: 14 },
  { name: 'Banjara Hills', coords: [17.4156, 78.4350] as [number, number], zoom: 14 },
  { name: 'Gachibowli', coords: [17.4401, 78.3489] as [number, number], zoom: 14 },
  { name: 'Charminar', coords: [17.3616, 78.4747] as [number, number], zoom: 14 },
  { name: 'Secunderabad', coords: [17.4399, 78.4983] as [number, number], zoom: 14 },
];

export const DisasterMap: React.FC<DisasterMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: HYDERABAD_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever incidents or selectedIncident changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    incidents.forEach((incident) => {
      const isSelected = selectedIncident?.id === incident.id;
      
      let markerColorBg = '#eab308'; // Low (Yellow)
      let markerColorBorder = '#ca8a04';
      let pulseClass = '';

      if (incident.severity === 'Critical') {
        markerColorBg = '#ef4444'; // Red
        markerColorBorder = '#b91c1c';
        pulseClass = 'custom-pulse-critical';
      } else if (incident.severity === 'High') {
        markerColorBg = '#f97316'; // Orange
        markerColorBorder = '#c2410c';
        pulseClass = 'custom-pulse-high';
      }

      const size = isSelected ? 36 : 28;
      const innerDotSize = isSelected ? 12 : 8;

      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${markerColorBg};
            border: 2px solid ${isSelected ? '#ffffff' : markerColorBorder};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ${isSelected ? 'transform: scale(1.15); border-width: 3px;' : ''}
          " class="${pulseClass}">
            <div style="
              width: ${innerDotSize}px;
              height: ${innerDotSize}px;
              background-color: #ffffff;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      const marker = L.marker(incident.coordinates, { icon: customIcon });

      // Custom popup
      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #0f172a; font-size: 13px;">${incident.location}</span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; color: #fff; background-color: ${markerColorBg};">
              ${incident.severity}
            </span>
          </div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">
            <strong>Type:</strong> ${incident.disasterType} &bull; <strong>AI:</strong> ${incident.aiConfidence}%
          </div>
          <div style="color: #1e293b; font-size: 11px; margin-bottom: 8px; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
            "${incident.originalReport.slice(0, 110)}..."
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 10px; color: #64748b;">
            <span>Status: <strong>${incident.status}</strong></span>
            <span style="color: #2563eb; font-weight: 600; cursor: pointer;">Click to Inspect &rarr;</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectIncident(incident);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [incidents, selectedIncident, onSelectIncident]);

  // Pan to selected incident if any
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(selectedIncident.coordinates, 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedIncident]);

  const handleFlyToZone = (coords: [number, number], zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, {
        animate: true,
        duration: 1.0,
      });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(HYDERABAD_CENTER, DEFAULT_ZOOM, {
        animate: true,
        duration: 1.0,
      });
    }
  };

  return (
    <div className="relative w-full h-[450px] lg:h-[540px] xl:h-[600px] bg-slate-200 rounded-lg overflow-hidden border border-slate-300 shadow-xs flex flex-col">
      {/* Map Control Bar / Quick Location Jumps */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-xs text-white p-1.5 rounded-lg border border-slate-700 shadow-md flex items-center gap-1.5 max-w-[calc(100%-24px)] overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 px-1.5 whitespace-nowrap flex items-center gap-1">
          <Navigation className="w-3 h-3 text-red-400" />
          Hotspots:
        </span>
        <div className="flex items-center gap-1">
          {KEY_ZONES.map((zone) => (
            <button
              key={zone.name}
              onClick={() => handleFlyToZone(zone.coords, zone.zoom)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:bg-red-950 text-slate-200 hover:text-white border border-slate-700/80 text-[11px] font-medium whitespace-nowrap transition cursor-pointer"
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Reset View Button */}
      <button
        onClick={handleResetView}
        title="Reset view to full Hyderabad map"
        className="absolute top-14 left-3 z-[1000] bg-white/95 hover:bg-white text-slate-800 p-2 rounded-md border border-slate-300 shadow-md transition cursor-pointer"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 shadow-md text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" />
          Map Legend
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200"></span>
            <span className="font-medium text-slate-800">Critical (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-200"></span>
            <span className="font-medium text-slate-800">High Priority (Orange)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200"></span>
            <span className="font-medium text-slate-800">Low Priority (Yellow)</span>
          </div>
        </div>
      </div>

      {/* Actual Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
