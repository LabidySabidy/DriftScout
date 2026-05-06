import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
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
      // Insert location
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

      // Upload photos
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm">
          Cancel
        </button>
        <h1 className="text-lg font-semibold">Submit Spot</h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
        {error && (
          <div className="bg-red-900 text-red-200 text-sm p-3 rounded-lg">{error}</div>
        )}

        {/* Name */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Spot Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
            placeholder="e.g. Grapevine Mills Back Lot"
            required
          />
        </div>

        {/* Map picker */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Tap the map to set location</label>
          <div className="h-48 rounded-xl overflow-hidden">
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
          <p className="text-xs text-zinc-500 mt-1">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-zinc-900 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Dallas"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-zinc-900 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              maxLength={2}
            />
          </div>
        </div>

        {/* Access fee */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Access Fee ($)</label>
          <input
            type="number"
            value={accessFee}
            onChange={(e) => setAccessFee(e.target.value)}
            className="w-full bg-zinc-900 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Permission level */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Permission Level</label>
          <div className="flex gap-2">
            {(['none', 'low', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPermissionLevel(level)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  permissionLevel === level
                    ? level === 'none'
                      ? 'bg-green-900 text-green-300'
                      : level === 'low'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {level === 'none' ? 'Public' : level === 'low' ? 'Low' : 'High'}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Photos</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white"
          />
          {files.length > 0 && (
            <p className="text-xs text-zinc-500 mt-1">{files.length} file(s) selected</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full ${
                  tags.includes(tag)
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-900 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-white/20 resize-none"
            rows={3}
            placeholder="Tips about security, best times, surface quality..."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !name.trim() || !city.trim()}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Spot'}
        </button>
      </form>
    </div>
  );
}
