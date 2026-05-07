import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

interface AvatarCropModalProps {
  file: File;
  onSave: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      // Output a square at 256px (good for avatars)
      const size = 256;
      canvas.width = size;
      canvas.height = size;

      // Draw the cropped region
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(blob);
        },
        'image/jpeg',
        0.9,
      );
    };
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

export default function AvatarCropModal({ file, onSave, onCancel }: AvatarCropModalProps) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(blob);
    } catch {
      // silently fail — parent handles error
    } finally {
      setSaving(false);
      URL.revokeObjectURL(imageSrc);
    }
  };

  const handleClose = () => {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/70" onClick={handleClose} />
      <div className="fixed inset-0 z-[9999] grid place-items-center p-4 pointer-events-none">
        <div className="w-full max-w-[420px] bg-bg rounded-card border border-chip-border shadow-panel flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-tab-border shrink-0">
            <button onClick={handleClose} className="text-[13px] text-ink-mute font-mono hover:text-ink">
              Cancel
            </button>
            <h2 className="text-[14px] font-semibold text-ink">Edit Photo</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[13px] font-semibold text-accent disabled:text-ink-dim"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Cropper */}
          <div className="relative w-full aspect-square bg-surface-2">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-4 py-3 border-t border-tab-border flex items-center gap-3">
            <span className="text-[11px] text-ink-mute font-mono shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 accent-accent"
            />
          </div>
        </div>
      </div>
    </>
  );
}
