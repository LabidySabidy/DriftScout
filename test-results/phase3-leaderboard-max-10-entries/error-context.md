# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase3.spec.ts >> leaderboard max 10 entries
- Location: tests\phase3.spec.ts:45:1

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Matcher error: received value must be a number or bigint

Received has value: undefined
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const SUPABASE_URL = 'https://ixncaswdwpxfazhzagqu.supabase.co';
  4  | const ANON_KEY = 'sb_publishable_0OyPi7C54jH4mHPY8YOGXQ_TShnKLOw';
  5  | 
  6  | test('leaderboard RPC returns top scouts', async ({ request }) => {
  7  |   const resp = await request.post(
  8  |     `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
  9  |     {
  10 |       headers: {
  11 |         apikey: ANON_KEY,
  12 |         Authorization: `Bearer ${ANON_KEY}`,
  13 |         'Content-Type': 'application/json',
  14 |       },
  15 |     }
  16 |   );
  17 | 
  18 |   expect(resp.status()).toBe(200);
  19 |   const entries = await resp.json();
  20 |   expect(entries.length).toBeGreaterThanOrEqual(1);
  21 |   expect(entries[0].submitter).toBeTruthy();
  22 |   expect(entries[0].submitter.username).toBeTruthy();
  23 |   expect(typeof entries[0].spot_count).toBe('number');
  24 |   expect(entries[0].spot_count).toBeGreaterThan(0);
  25 | });
  26 | 
  27 | test('leaderboard is sorted by spot count descending', async ({ request }) => {
  28 |   const resp = await request.post(
  29 |     `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
  30 |     {
  31 |       headers: {
  32 |         apikey: ANON_KEY,
  33 |         Authorization: `Bearer ${ANON_KEY}`,
  34 |         'Content-Type': 'application/json',
  35 |       },
  36 |     }
  37 |   );
  38 | 
  39 |   const entries = await resp.json();
  40 |   for (let i = 1; i < entries.length; i++) {
  41 |     expect(entries[i - 1].spot_count).toBeGreaterThanOrEqual(entries[i].spot_count);
  42 |   }
  43 | });
  44 | 
  45 | test('leaderboard max 10 entries', async ({ request }) => {
  46 |   const resp = await request.post(
  47 |     `${SUPABASE_URL}/rest/v1/rpc/leaderboard`,
  48 |     {
  49 |       headers: {
  50 |         apikey: ANON_KEY,
  51 |         Authorization: `Bearer ${ANON_KEY}`,
  52 |         'Content-Type': 'application/json',
  53 |       },
  54 |     }
  55 |   );
  56 | 
  57 |   const entries = await resp.json();
> 58 |   expect(entries.length).toBeLessThanOrEqual(10);
     |                          ^ Error: expect(received).toBeLessThanOrEqual(expected)
  59 | });
  60 | 
  61 | test('locations can be filtered by tag', async ({ request }) => {
  62 |   const resp = await request.get(
  63 |     `${SUPABASE_URL}/rest/v1/locations?select=id,name,tags&tags=cs.%7Bnight%7D`,
  64 |     {
  65 |       headers: {
  66 |         apikey: ANON_KEY,
  67 |         Authorization: `Bearer ${ANON_KEY}`,
  68 |       },
  69 |     }
  70 |   );
  71 | 
  72 |   expect(resp.status()).toBe(200);
  73 |   const locations = await resp.json();
  74 |   expect(locations.length).toBeGreaterThan(0);
  75 |   for (const loc of locations) {
  76 |     expect(loc.tags).toContain('night');
  77 |   }
  78 | });
  79 | 
```