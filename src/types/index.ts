export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  access_fee: number | null;
  permission_level: 'none' | 'low' | 'high';
  tags: string[];
  submitter_id: string;
  created_at: string;
}

export interface LocationWithSubmitter extends Location {
  submitter: Profile;
  photos: LocationPhoto[];
  distance?: number;
  liked?: boolean;
}

export interface LocationPhoto {
  id: string;
  location_id: string;
  storage_path: string;
  created_at: string;
}
