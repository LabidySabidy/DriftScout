import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://ixncaswdwpxfazhzagqu.supabase.co';
const ANON_KEY = 'sb_publishable_0OyPi7C54jH4mHPY8YOGXQ_TShnKLOw';

test('locations API returns expected shape', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/locations?select=id,name,description,latitude,longitude,city,state,access_fee,permission_level,tags,submitter_id,created_at,submitter:profiles!locations_submitter_id_fkey(id,username,avatar_url),photos:location_photos(id,storage_path)`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );

  expect(resp.status()).toBe(200);
  const locations = await resp.json();
  expect(locations.length).toBeGreaterThanOrEqual(10);

  const first = locations[0];
  // Required fields
  expect(first.id).toBeTruthy();
  expect(first.name).toBeTruthy();
  expect(typeof first.latitude).toBe('number');
  expect(typeof first.longitude).toBe('number');
  expect(first.city).toBeTruthy();
  expect(first.state).toBeTruthy();
  expect(['none', 'low', 'high']).toContain(first.permission_level);
  expect(Array.isArray(first.tags)).toBe(true);
  // Joined relations
  expect(first.submitter).toBeTruthy();
  expect(first.submitter.id).toBeTruthy();
  expect(first.submitter.username).toBeTruthy();
  expect(Array.isArray(first.photos)).toBe(true);
});

test('profiles table has auto-created profile', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,username,avatar_url`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );

  expect(resp.status()).toBe(200);
  const profiles = await resp.json();
  expect(profiles.length).toBeGreaterThanOrEqual(1);

  const k = profiles.find((p: { username: string }) => p.username === 'Kasim Alam');
  expect(k).toBeTruthy();
  expect(k.avatar_url).toBeTruthy();
});

test('locations RLS allows public read but blocks unauthenticated writes', async ({ request }) => {
  // Read should work with anon key
  const readResp = await request.get(
    `${SUPABASE_URL}/rest/v1/locations?select=id&limit=1`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );
  expect(readResp.status()).toBe(200);

  // Insert without auth should fail
  const insertResp = await request.post(
    `${SUPABASE_URL}/rest/v1/locations`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        name: 'test',
        latitude: 0,
        longitude: 0,
        city: 'test',
        state: 'TX',
        submitter_id: '00000000-0000-0000-0000-000000000000',
      },
    }
  );
  // Should fail — either 401 unauthorized or 400 from RLS
  expect(insertResp.status()).not.toBe(201);
});
