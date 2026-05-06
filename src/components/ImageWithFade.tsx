import { useState } from 'react';

interface ImageWithFadeProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

export default function ImageWithFade({ src, alt, className = '', loading = 'lazy', style }: ImageWithFadeProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`} style={style}>
      {/* Shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-shimmer" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-400 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
