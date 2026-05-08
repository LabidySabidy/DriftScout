import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/compressImage';

export function usePhotoContribution() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (locationId: string, file: File) => {
    setUploading(true);
    setError(null);

    try {
      const compressed = await compressImage(file);
      const path = `${locationId}/community-${Date.now()}-${compressed.name}`;
      const { error: uploadError } = await supabase.storage
        .from('location-photos')
        .upload(path, compressed);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('location_photos')
        .insert({
          location_id: locationId,
          storage_path: path,
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadPhoto, uploading, error };
}
