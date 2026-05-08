import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useIsDesktop } from '../hooks/useIsDesktop';
import 'leaflet/dist/leaflet.css';

const AVAILABLE_TAGS = [
  'night', 'day', 'beginner', 'intermediate', 'advanced',
  'large-lot', 'small-lot', 'parking-garage', 'industrial',
  'clean', 'abandoned', 'legal', 'community', 'gravel',
];

// Custom marker icon for submit map (avoids Leaflet default icon bundler issue)
const pickerIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#4A9EFF;border:3px solid #fff;box-shadow:0 0 0 4px rgba(74,158,255,0.18),0 4px 12px rgba(0,0,0,0.5);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function SubmitLocationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('TX');
  const [lat, setLat] = useState(32.7767);
  const [lng, setLng] = useState(-96.7970);
  const [latInput, setLatInput] = useState('32.77670');
  const [lngInput, setLngInput] = useState('-96.79700');
  const [permissionLevel, setPermissionLevel] = useState('none');
  const [tags, setTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [error, setError] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const pageTitle = editId ? 'Edit Spot' : 'Submit Spot';
  const saveLabel = editId ? 'Update' : 'Save';
  const submittingLabel = editId ? 'Updating...' : 'Submitting...';

  // Fetch existing location when editing
  useEffect(() => {
    if (!editId) return;
    supabase
      .from('locations')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || '');
          setDescription(data.description || '');
          setAddress(data.city || '');
          setState(data.state || 'TX');
          setLat(data.latitude);
          setLng(data.longitude);
          setLatInput(data.latitude.toFixed(5));
          setLngInput(data.longitude.toFixed(5));
          setPermissionLevel(data.permission_level || 'none');
          const allTags: string[] = data.tags || [];
          setTags(allTags.filter((t) => AVAILABLE_TAGS.includes(t)));
          setCustomTags(allTags.filter((t) => !AVAILABLE_TAGS.includes(t)));
        }
        setLoadingEdit(false);
      });
  }, [editId]);

  // Escape key to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleMapPick = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setLatInput(newLat.toFixed(5));
    setLngInput(newLng.toFixed(5));
  };

  const handleLatChange = (val: string) => {
    setLatInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) setLat(parsed);
  };

  const handleLngChange = (val: string) => {
    setLngInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) setLng(parsed);
  };

  const handleLatPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    // Match Google Maps style: (lat, lng) or lat, lng
    const m = text.match(/^\s*\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?\s*$/);
    if (!m) return; // normal paste
    e.preventDefault();
    const parsedLat = parseFloat(m[1]);
    const parsedLng = parseFloat(m[2]);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;
    setLat(parsedLat);
    setLng(parsedLng);
    setLatInput(parsedLat.toFixed(5));
    setLngInput(parsedLng.toFixed(5));
  };

  const geocodeAddress = async (query: string) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DriftScout/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const handleGeocode = async () => {
    const query = address.trim();
    if (!query) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setLat(result.lat);
        setLng(result.lng);
        setLatInput(result.lat.toFixed(5));
        setLngInput(result.lng.toFixed(5));
      } else {
        setGeoError('No results for that address');
      }
    } catch {
      setGeoError('Could not search — check your connection');
    } finally {
      setGeocoding(false);
    }
  };

  // Reverse geocode: lat/lng → city + state via Nominatim
  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'DriftScout/1.0' } });
      if (!res.ok) return;
      const data = await res.json();
      const addr = data?.address;
      if (!addr) return;
      const city = addr.city || addr.town || addr.village || addr.hamlet || '';
      const st = addr.state || '';
      if (city) setAddress(city);
      if (st) setState(st);
    } catch {
      // silently fail — address is optional
    }
  }, []);

  // Debounced reverse geocode when lat/lng change (skip initial mount)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timer = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 600);
    return () => clearTimeout(timer);
  }, [lat, lng, reverseGeocode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      if (editId) {
        // Update existing location
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            name: name.trim(),
            description: description.trim(),
            latitude: lat,
            longitude: lng,
            city: address.trim() || 'Unknown',
            state: state.trim(),
            permission_level: permissionLevel,
            tags: [...new Set([...tags, ...customTags])],
          })
          .eq('id', editId);

        if (updateError) throw updateError;
        navigate(`/location/${editId}`, { replace: true });
      } else {
        // Create new location
        const { data: location, error: locError } = await supabase
        .from('locations')
        .insert({
          name: name.trim(),
          description: description.trim(),
          latitude: lat,
          longitude: lng,
          city: address.trim() || 'Unknown',
          state: state.trim(),
          access_fee: null,
          permission_level: permissionLevel,
          tags: [...new Set([...tags, ...customTags])],
          submitter_id: user.id,
        })
        .select('id')
        .single();

        if (locError || !location) throw locError || new Error('Failed to create location');

        for (const file of files) {
          const path = `${location.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('location-photos')
            .upload(path, file);

          if (uploadError) throw uploadError;

          await supabase.from('location_photos').insert({
            location_id: location.id,
            storage_path: path,
          });
        }

        navigate(`/location/${location.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
    <>
    {loadingEdit ? (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    ) : (
    <form id="submit-form" onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-danger/20 text-danger text-sm p-3 rounded-card">{error}</div>
      )}

      {/* Name */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Spot Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent"
          placeholder="e.g. Grapevine Mills Back Lot"
          required
        />
      </div>

      {/* Address */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Address</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setGeoError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGeocode(); } }}
            className="flex-1 h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent"
            placeholder="e.g. 123 Main St, Dallas, TX"
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={geocoding || !address.trim()}
            className="h-11 px-4 rounded-card bg-surface border border-chip-border text-[13px] text-accent font-semibold hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-transform duration-100 whitespace-nowrap"
          >
            {geocoding ? 'Searching...' : 'Search'}
          </button>
        </div>
        {geoError && (
          <p className="text-[12px] text-danger mt-1">{geoError}</p>
        )}
      </div>

      {/* Map picker */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Tap the map to set location</label>
        <div className={`rounded-card overflow-hidden border border-chip-border ${isDesktop ? 'h-[300px]' : 'h-48'}`}>
          <MapContainer
            center={[lat, lng]}
            zoom={10}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://api.maptiler.com/maps/hybrid-v4-dark/256/{z}/{x}/{y}.jpg?key=wT95FNHoOtr68B17GSfk"
              maxZoom={20}
            />
            <LocationPicker onPick={handleMapPick} />
            <RecenterMap center={[lat, lng]} />
            <Marker position={[lat, lng]} icon={pickerIcon} />
          </MapContainer>
        </div>
      </div>

      {/* Lat / Lng inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Latitude</label>
          <input
            type="text"
            value={latInput}
            onChange={(e) => handleLatChange(e.target.value)}
            onPaste={handleLatPaste}
            className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink font-mono focus:outline-none focus:border-accent"
            placeholder="Paste coords like (33.02, -96.65)"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Longitude</label>
          <input
            type="text"
            value={lngInput}
            onChange={(e) => handleLngChange(e.target.value)}
            className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink font-mono focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* State */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">State</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
          maxLength={2}
        />
      </div>

      {/* Permission level */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Permission Level</label>
        <div className="flex p-0.5 rounded-card bg-surface border border-chip-border">
          {(['none', 'low', 'high'] as const).map((level) => {
            const active = permissionLevel === level;
            const colors: Record<string, string> = {
              none: 'bg-perm-pub text-ink',
              low: 'bg-perm-mid text-ink',
              high: 'bg-perm-sec text-ink',
            };
            return (
              <button
                key={level}
                type="button"
                onClick={() => setPermissionLevel(level)}
                className={`flex-1 py-2 rounded-[6px] text-[12px] font-mono font-bold transition-colors ${
                  active ? colors[level] : 'text-ink-mute'
                }`}
              >
                {level === 'none' ? 'Public' : level === 'low' ? 'Low' : 'High'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Photos</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full text-sm text-ink-mute file:mr-3 file:py-2 file:px-4 file:rounded-card file:border-0 file:bg-surface file:text-ink"
        />
        {files.length > 0 && (
          <p className="text-xs text-ink-mute mt-1">{files.length} file(s) selected</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1 rounded-pill border px-3 py-1.5 text-[12px] transition-colors active:scale-[.97] transition-transform duration-100 ${
                tags.includes(tag)
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-chip-border text-ink-mute'
              }`}
            >
              #{tag}
            </button>
          ))}
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-pill border border-accent bg-accent/15 text-accent px-3 py-1.5 text-[12px]"
            >
              #{tag}
              <button
                type="button"
                onClick={() => setCustomTags((prev) => prev.filter((t) => t !== tag))}
                className="ml-0.5 text-[10px] hover:text-ink active:scale-[.97] transition-transform duration-100"
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value.replace(/\s/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = customTagInput.trim().toLowerCase();
                if (val && !tags.includes(val) && !customTags.includes(val)) {
                  setCustomTags((prev) => [...prev, val]);
                }
                setCustomTagInput('');
              }
            }}
            placeholder="+ custom"
            className="h-[30px] w-[100px] rounded-pill border border-dashed border-chip-border bg-transparent px-3 text-[12px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Notes</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[96px] rounded-card bg-surface border border-chip-border p-3 text-[14px] text-ink resize-none focus:outline-none focus:border-accent"
          rows={3}
          placeholder="Tips about security, best times, surface quality..."
        />
      </div>
    </form>
    )}
    </>
  );

  // ── Desktop: centered modal ──
  if (isDesktop) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/55" onClick={() => navigate(-1)} />
        <div className="fixed inset-0 z-50 grid place-items-center p-6 pointer-events-none" onClick={() => navigate(-1)}>
          <div className="w-[600px] max-h-[88vh] rounded-card bg-bg border border-chip-border shadow-panel flex flex-col pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="h-12 px-4 flex items-center border-b border-tab-border shrink-0">
              <button onClick={() => navigate(-1)} className="text-[14px] text-ink-mute font-mono hover:text-ink active:scale-[.97] transition-transform duration-100">
                Cancel
              </button>
              <h1 className="mx-auto font-semibold text-[15px] text-ink">{pageTitle}</h1>
              <button
                type="submit"
                form="submit-form"
                disabled={submitting || !name.trim()}
                className="text-[14px] font-semibold text-accent disabled:text-ink-dim active:scale-[.97] transition-transform duration-100"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : saveLabel}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-7">
              {formBody}
            </div>
            <div className="border-t border-tab-border p-4 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="h-11 px-6 rounded-card border border-chip-border text-ink-mute hover:bg-surface active:scale-[.97] transition-transform duration-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="submit-form"
                disabled={submitting || !name.trim()}
                className="h-11 px-6 rounded-card bg-accent text-ink font-semibold disabled:opacity-40 active:scale-[.97] transition-transform duration-100"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {submittingLabel}
                  </span>
                ) : saveLabel}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Mobile: full-screen sheet ──
  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tab-border">
        <button onClick={() => navigate(-1)} className="text-[14px] text-ink-mute font-mono active:scale-[.97] transition-transform duration-100">
          Cancel
        </button>
        <h1 className="font-semibold text-[15px]">{pageTitle}</h1>
        <button
          type="submit"
          form="submit-form"
          disabled={submitting || !name.trim()}
          className="text-[14px] font-semibold text-accent disabled:text-ink-dim active:scale-[.97] transition-transform duration-100"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : saveLabel}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8">
        {formBody}
        <button
          type="submit"
          form="submit-form"
          disabled={submitting || !name.trim()}
          className="w-full bg-ink text-bg font-semibold py-3 rounded-card mt-5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-transform duration-100"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {submittingLabel}
            </span>
          ) : saveLabel}
        </button>
      </div>
    </div>
  );
}
