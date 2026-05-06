import type { LocationWithSubmitter } from '../types';

interface LocationCardProps {
  location: LocationWithSubmitter;
}

const permissionColors: Record<string, string> = {
  none: 'bg-green-900 text-green-300',
  low: 'bg-yellow-900 text-yellow-300',
  high: 'bg-red-900 text-red-300',
};

const permissionLabels: Record<string, string> = {
  none: 'Public',
  low: 'May need permission',
  high: 'Highly secure',
};

export default function LocationCard({ location }: LocationCardProps) {
  const photoUrl =
    location.photos?.[0]?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
      : null;

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden mb-4">
      {photoUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={photoUrl}
            alt={location.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-white font-semibold text-lg leading-tight">
            {location.name}
          </h3>
        </div>

        <p className="text-zinc-400 text-sm mb-2">
          {location.city}, {location.state}
          {location.distance !== undefined && (
            <span className="ml-2 text-zinc-500">
              · {location.distance} mi
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${permissionColors[location.permission_level] || permissionColors.none}`}
          >
            {permissionLabels[location.permission_level] || location.permission_level}
          </span>

          {location.access_fee != null && location.access_fee > 0 && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
              ${location.access_fee.toFixed(2)} fee
            </span>
          )}

          {location.tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {location.submitter && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-3">
            {location.submitter.avatar_url && (
              <img
                src={location.submitter.avatar_url}
                alt={location.submitter.username}
                className="w-5 h-5 rounded-full"
              />
            )}
            <span>{location.submitter.username}</span>
          </div>
        )}
      </div>
    </div>
  );
}
