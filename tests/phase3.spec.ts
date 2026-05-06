import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://ixncaswdwpxfazhzagqu.supabase.co';
const ANON_KEY = 'sb_publishable_0OyPi7C54jH4mHPY8YOGXQ_TShnKLOw';

test('leaderboard RPC returns top scouts', async ({ request }) => {
  const resp = await request.post(
    `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  expect(resp.status()).toBe(200);
  const entries = await resp.json();
  expect(entries.length).toBeGreaterThanOrEqual(1);
  expect(entries[0].submitter).toBeTruthy();
  expect(entries[0].submitter.username).toBeTruthy();
  expect(typeof entries[0].spot_count).toBe('number');
  expect(entries[0].spot_count).toBeGreaterThan(0);
});

test('leaderboard is sorted by spot count descending', async ({ request }) => {
  const resp = await request.post(
    `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const entries = await resp.json();
  for (let i = 1; i < entries.length; i++) {
    expect(entries[i - 1].spot_count).toBeGreaterThanOrEqual(entries[i].spot_count);
  }
});

test('leaderboard max 10 entries', async ({ request }) => {
  const resp = await request.post(
    `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const entries = await resp.json();
  expect(entries.length).toBeLessThanOrEqual(10);
});

test('locations can be filtered by tag', async ({ request }) => {
  const resp = await request.get(
    `${SUPABASE_URL}/rest/v1/locations?select=id,name,tags&tags=cs.%7Bnight%7D`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );

  expect(resp.status()).toBe(200);
  const locations = await resp.json();
  expect(locations.length).toBeGreaterThan(0);
  for (const loc of locations) {
    expect(loc.tags).toContain('night');
  }
});
