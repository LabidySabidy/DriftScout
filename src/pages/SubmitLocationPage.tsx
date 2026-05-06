import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useIsDesktop } from '../hooks/useIsDesktop';
import 'leaflet/dist/leaflet.css';

const AVAILABLE_TAGS = [
  'night', 'day', 'beginner', 'intermediate', 'advanced',
  'large-lot', 'small-lot', 'parking-garage', 'industrial',
  'clean', 'abandoned', 'legal', 'community', 'gravel',
];

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SubmitLocationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [lat, setLat] = useState(32.7767);
  const [lng, setLng] = useState(-96.7970);
  const [accessFee, setAccessFee] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('none');
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !city.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const { data: location, error: locError } = await supabase
        .from('locations')
        .insert({
          name: name.trim(),
          description: description.trim(),
          latitude: lat,
          longitude: lng,
          city: city.trim(),
          state: state.trim(),
          access_fee: accessFee ? parseFloat(accessFee) : null,
          permission_level: permissionLevel,
          tags,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
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

      {/* Map picker */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Tap the map to set location</label>
        <div className={`rounded-card overflow-hidden border border-chip-border ${isDesktop ? 'h-[400px]' : 'h-48'}`}>
          <MapContainer
            center={[lat, lng]}
            zoom={10}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onPick={(la, ln) => { setLat(la); setLng(ln); }} />
            <Marker position={[lat, lng]} />
          </MapContainer>
        </div>
        <p className="text-xs text-ink-mute font-mono mt-1">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">City *</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent"
            placeholder="Dallas"
            required
          />
        </div>
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
      </div>

      {/* Access fee */}
      <div>
        <label className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-1.5 block">Access Fee ($)</label>
        <input
          type="number"
          value={accessFee}
          onChange={(e) => setAccessFee(e.target.value)}
          className="w-full h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent"
          placeholder="0.00"
          step="0.01"
          min="0"
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
  );

  // ── Desktop: centered modal ──
  if (isDesktop) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/55" onClick={() => navigate(-1)} />
        {/* Modal */}
        <div className="fixed inset-0 z-50 grid place-items-center p-6">
          <div className="w-[600px] max-h-[88vh] rounded-card bg-bg border border-chip-border shadow-panel flex flex-col">
            {/* Header */}
            <div className="h-12 px-4 flex items-center border-b border-tab-border shrink-0">
              <button onClick={() => navigate(-1)} className="text-[14px] text-ink-mute font-mono hover:text-ink active:scale-[.97] transition-transform duration-100">
                Cancel
              </button>
              <h1 className="mx-auto font-semibold text-[15px] text-ink">Submit Spot</h1>
              <button
                type="submit"
                form="submit-form"
                disabled={submitting || !name.trim() || !city.trim()}
                className="text-[14px] font-semibold text-accent disabled:text-ink-dim active:scale-[.97] transition-transform duration-100"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-7">
              {formBody}
            </div>
            {/* Footer */}
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
                disabled={submitting || !name.trim() || !city.trim()}
                className="h-11 px-6 rounded-card bg-accent text-ink font-semibold disabled:opacity-40 active:scale-[.97] transition-transform duration-100"
              >
                {submitting ? 'Submitting...' : 'Submit Spot'}
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
        <h1 className="font-semibold text-[15px]">Submit Spot</h1>
        <button
          type="submit"
          form="submit-form"
          disabled={submitting || !name.trim() || !city.trim()}
          className="text-[14px] font-semibold text-accent disabled:text-ink-dim active:scale-[.97] transition-transform duration-100"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8">
        {formBody}
        <button
          type="submit"
          form="submit-form"
          disabled={submitting || !name.trim() || !city.trim()}
          className="w-full bg-ink text-bg font-semibold py-3 rounded-card mt-5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.97] transition-transform duration-100"
        >
          {submitting ? 'Submitting...' : 'Submit Spot'}
        </button>
      </div>
    </div>
  );
}
