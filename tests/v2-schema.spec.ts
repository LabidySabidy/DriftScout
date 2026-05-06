import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://ixncaswdwpxfazhzagqu.supabase.co';
const ANON_KEY = 'sb_publishable_0OyPi7C54jH4mHPY8YOGXQ_TShnKLOw';

test('comments table exists and is queryable', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/comments?select=id,body,user_id,location_id,created_at&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
});

test('comments RLS blocks unauthenticated inserts', async ({ request }) => {
  const resp = await request.post(
    `${SUPABASE_URL}/rest/v1/comments`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        location_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        body: 'test',
      },
    }
  );
  expect(resp.status()).not.toBe(201);
});

test('photo_votes table exists and is queryable', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/photo_votes?select=user_id,photo_id&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
});

test('locations have status column', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/locations?select=id,status,moderation_status&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
  const data = await resp.json();
  expect(data[0]).toHaveProperty('status');
  expect(data[0]).toHaveProperty('moderation_status');
});

test('reports table exists and is queryable', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/reports?select=id,reason&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
});

test('follows table exists and is queryable', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/follows?select=follower_id,following_id&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
});

test('notifications table exists and is queryable', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/notifications?select=id,type,read&limit=1`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    }
  );
  expect(resp.status()).toBe(200);
});
