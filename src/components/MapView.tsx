import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useCallback } from 'react';
import type { LocationWithSubmitter } from '../types';
import { useIsDesktop } from '../hooks/useIsDesktop';
import PinPreviewSheet from './PinPreviewSheet';
import PinPreviewPopover from './PinPreviewPopover';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  locations: LocationWithSubmitter[];
  center: [number, number];
  fullHeight?: boolean;
}

// ── Custom marker icons ──
function createDefaultIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #0D0D0F;box-shadow:0 0 0 4px rgba(74,158,255,0.18),0 4px 12px rgba(0,0,0,0.5);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createSelectedIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:#4A9EFF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:monospace;font-weight:bold;box-shadow:0 0 0 4px rgba(74,158,255,0.18),0 4px 12px rgba(0,0,0,0.5);animation:pin-pop 220ms ease-out;"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const defaultIcon = createDefaultIcon();
const selectedIcon = createSelectedIcon();

// ── Recenter ──
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 11);
  }, [center, map]);
  return null;
}

// ── Pin click handler (sits inside MapContainer) ──
function PinClickHandler({
  locations,
  onPinClick,
}: {
  locations: LocationWithSubmitter[];
  onPinClick: (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      // Find nearest location within a small radius of click
      const clickLatLng = e.latlng;
      const threshold = 0.002; // ~200m at equator
      const nearest = locations.find((loc) => {
        const dlat = loc.latitude - clickLatLng.lat;
        const dlng = loc.longitude - clickLatLng.lng;
        return Math.sqrt(dlat * dlat + dlng * dlng) < threshold;
      });

      if (nearest) {
        // Fly to pin
        map.flyTo([nearest.latitude, nearest.longitude], map.getZoom(), { duration: 0.5 });

        // Get container position
        const containerPoint = map.latLngToContainerPoint([nearest.latitude, nearest.longitude]);
        const containerEl = map.getContainer();
        const rect = containerEl.getBoundingClientRect();
        onPinClick(nearest, {
          x: rect.left + containerPoint.x,
          y: rect.top + containerPoint.y,
        });
      }
    },
  });

  return null;
}

export default function MapView({ locations, center, fullHeight }: MapViewProps) {
  const isDesktop = useIsDesktop();
  const [selected, setSelected] = useState<LocationWithSubmitter | null>(null);
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePinClick = useCallback(
    (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => {
      setSelected(loc);
      setPinPosition(screenPos);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <div className={`${fullHeight ? 'h-full' : 'h-[45vh]'} w-full rounded-xl overflow-hidden relative`}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        <PinClickHandler locations={locations} onPinClick={handlePinClick} />

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={selected?.id === loc.id ? selectedIcon : defaultIcon}
          />
        ))}
      </MapContainer>

      {/* Pin preview */}
      {selected && (
        isDesktop ? (
          <PinPreviewPopover
            location={selected}
            position={pinPosition}
            onClose={handleClose}
          />
        ) : (
          <PinPreviewSheet
            location={selected}
            onClose={handleClose}
          />
        )
      )}
    </div>
  );
}
