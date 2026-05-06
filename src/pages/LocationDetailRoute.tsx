import { useParams } from 'react-router-dom';
import LocationDetailPage from './LocationDetailPage';

/** Wrapper that keys LocationDetailPage by route param so state resets on navigation */
export default function LocationDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <LocationDetailPage key={id} />;
}
