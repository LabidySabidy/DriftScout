import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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
  selectedId?: string | null;
  onSelect?: (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => void;
  onClose?: () => void;
  onViewMore?: (loc: LocationWithSubmitter) => void;
}

// ── Custom marker icons ──
function createDefaultIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #0D0D0F;box-shadow:0 0 0 4px rgba(74,158,255,0.18),0 4px 12px rgba(0,0,0,0.5);cursor:pointer;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createSelectedIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;border-radius:50%;background:#4A9EFF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:monospace;font-weight:bold;box-shadow:0 0 0 4px rgba(74,158,255,0.18),0 4px 12px rgba(0,0,0,0.5);animation:pin-pop 220ms ease-out;cursor:pointer;"></div>',
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

// ── Handles fly-to when selectedId changes externally ──
function FlyToSelected({ selectedId, locations }: { selectedId: string | null | undefined; locations: LocationWithSubmitter[] }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const loc = locations.find((l) => l.id === selectedId);
    if (loc) {
      map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 });
    }
  }, [selectedId, locations, map]);
  return null;
}

// ── Individual marker with click handler (needs map access) ──
function LocationMarker({
  loc,
  isSelected,
  onClick,
}: {
  loc: LocationWithSubmitter;
  isSelected: boolean;
  onClick: (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => void;
}) {
  const map = useMap();

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      // Fly to pin
      map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 });

      // Get screen position from the native DOM event
      const screenPos = {
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      };
      onClick(loc, screenPos);
    },
    [loc, map, onClick],
  );

  return (
    <Marker
      position={[loc.latitude, loc.longitude]}
      icon={isSelected ? selectedIcon : defaultIcon}
      eventHandlers={{ click: handleClick }}
    />
  );
}

export default function MapView({ locations, center, fullHeight, selectedId, onSelect, onClose, onViewMore }: MapViewProps) {
  const isDesktop = useIsDesktop();
  const [internalSelected, setInternalSelected] = useState<LocationWithSubmitter | null>(null);
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selected = selectedId ? locations.find((l) => l.id === selectedId) ?? null : internalSelected;

  const handleMarkerClick = useCallback(
    (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => {
      setPinPosition(screenPos);
      if (onSelect) {
        onSelect(loc, screenPos);
      } else {
        setInternalSelected(loc);
      }
    },
    [onSelect],
  );

  const handleClose = useCallback(() => {
    setInternalSelected(null);
    onClose?.();
  }, [onClose]);

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
        <FlyToSelected selectedId={selectedId} locations={locations} />

        {locations.map((loc) => (
          <LocationMarker
            key={loc.id}
            loc={loc}
            isSelected={selected?.id === loc.id}
            onClick={handleMarkerClick}
          />
        ))}
      </MapContainer>

      {/* Pin preview — positioned near the pin */}
      {selected && (
        isDesktop ? (
          <PinPreviewPopover
            location={selected}
            position={pinPosition}
            onClose={handleClose}
            onViewMore={onViewMore ? () => onViewMore(selected) : undefined}
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
