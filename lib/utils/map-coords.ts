const BUCHAREST_BOUNDS = {
  minLat: 44.415,
  maxLat: 44.475,
  minLng: 26.045,
  maxLng: 26.125,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function latLngToMapPercent(lat: number, lng: number) {
  const x =
    ((lng - BUCHAREST_BOUNDS.minLng) /
      (BUCHAREST_BOUNDS.maxLng - BUCHAREST_BOUNDS.minLng)) *
    100;
  const y =
    ((BUCHAREST_BOUNDS.maxLat - lat) /
      (BUCHAREST_BOUNDS.maxLat - BUCHAREST_BOUNDS.minLat)) *
    100;

  return {
    x: clamp(x, 8, 92),
    y: clamp(y, 8, 92),
  };
}
