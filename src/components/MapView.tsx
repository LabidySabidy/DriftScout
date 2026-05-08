import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  /** Suppress the pin preview popover/sheet (parent handles detail display) */
  suppressPreview?: boolean;
}

// ── Custom marker icons ──
function createDefaultIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 12px rgba(0,0,0,0.6);cursor:pointer;"></div>',
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

const MAP_POS_KEY = 'map_position';

// ── Persist map center + zoom to sessionStorage ──
function PersistMapPosition() {
  const map = useMap();
  useEffect(() => {
    const save = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      try {
        sessionStorage.setItem(MAP_POS_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: z }));
      } catch { /* ignore */ }
    };
    map.on('moveend', save);
    map.on('zoomend', save);
    return () => {
      map.off('moveend', save);
      map.off('zoomend', save);
    };
  }, [map]);
  return null;
}

// ── Restore saved position on every mount, fall back to default center ──
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    // Always try to restore saved position first
    try {
      const raw = sessionStorage.getItem(MAP_POS_KEY);
      if (raw) {
        const { lat, lng, zoom } = JSON.parse(raw);
        map.setView([lat, lng], zoom, { animate: false });
        return;
      }
    } catch { /* ignore */ }
    map.setView(center, 11, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, map]);
  return null;
}

// ── Handles fly-to only when user actively clicks a pin (not on mount/restore) ──
function FlyToSelected({ selectedId, locations, onPosition }: { selectedId: string | null | undefined; locations: LocationWithSubmitter[]; onPosition: (pos: { x: number; y: number }) => void }) {
  const map = useMap();
  const initialId = useRef(selectedId);
  const prevId = useRef(selectedId);
  useEffect(() => {
    // Skip if this is the initial selectedId (from mount/restore) or no change
    if (!selectedId || selectedId === initialId.current) return;
    // Only fly when selectedId actually changed from a previous value (user click)
    if (selectedId === prevId.current) return;
    prevId.current = selectedId;
    const loc = locations.find((l) => l.id === selectedId);
    if (loc) {
      map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 });
      const containerEl = map.getContainer();
      const rect = containerEl.getBoundingClientRect();
      onPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [selectedId, locations, map, onPosition]);
  return null;
}

// ── Filters markers to only those within the current map viewport ──
function ViewportFilteredMarkers({
  locations,
  selectedId,
  onSelect,
}: {
  locations: LocationWithSubmitter[];
  selectedId: string | null | undefined;
  onSelect: (loc: LocationWithSubmitter, screenPos: { x: number; y: number }) => void;
}) {
  const map = useMap();
  const [visibleLocations, setVisibleLocations] = useState<LocationWithSubmitter[]>([]);

  useEffect(() => {
    const update = () => {
      const bounds = map.getBounds();
      const filtered = locations.filter((loc) =>
        bounds.contains([loc.latitude, loc.longitude])
      );
      setVisibleLocations(filtered);
    };
    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map, locations]);

  return (
    <>
      {visibleLocations.map((loc) => (
        <LocationMarker
          key={loc.id}
          loc={loc}
          isSelected={selectedId === loc.id}
          onClick={onSelect}
        />
      ))}
    </>
  );
}

// ── Handles click on empty map space to deselect ──
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click() {
      onMapClick();
    },
  });
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
    () => {
      // Fly to pin
      map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 });

      // Position popover at map center (where the pin will be after flyTo)
      const containerEl = map.getContainer();
      const rect = containerEl.getBoundingClientRect();
      const screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
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

export default function MapView({ locations, center, fullHeight, selectedId, onSelect, onClose, onViewMore, suppressPreview }: MapViewProps) {
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
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://api.maptiler.com/maps/hybrid-v4-dark/256/{z}/{x}/{y}.jpg?key=wT95FNHoOtr68B17GSfk"
          maxZoom={20}
        />
        <RecenterMap center={center} />
        <PersistMapPosition />
        <FlyToSelected selectedId={selectedId} locations={locations} onPosition={setPinPosition} />
        <MapClickHandler onMapClick={handleClose} />

        <ViewportFilteredMarkers
          locations={locations}
          selectedId={selected?.id}
          onSelect={handleMarkerClick}
        />
      </MapContainer>

      {/* Pin preview — portaled to document.body to escape overflow-hidden parents */}
      {!suppressPreview && selected && createPortal(
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
        ),
        document.body
      )}
    </div>
  );
}
