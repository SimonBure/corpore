import { NextResponse } from 'next/server';

jest.mock('../src/app/api/exercises/route', () => ({
  GET: jest.fn(async () =>
    NextResponse.json([
      { id: 1, name: 'Push-up', defaultSets: 3, defaultReps: 10, defaultRestBetweenSets: 60, defaultRestAfter: 120 },
    ])
  ),
}));

const { GET } = require('../src/app/api/exercises/route');

describe('GET /api/exercises', () => {
  it('should return a list of exercises', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual([
      { id: 1, name: 'Push-up', defaultSets: 3, defaultReps: 10, defaultRestBetweenSets: 60, defaultRestAfter: 120 },
    ]);
  });
});
