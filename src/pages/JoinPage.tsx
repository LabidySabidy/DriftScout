import { useSearchParams, Navigate } from 'react-router-dom';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (error) params.set('error', error);

  return <Navigate to={`/login?${params.toString()}`} replace />;
}
