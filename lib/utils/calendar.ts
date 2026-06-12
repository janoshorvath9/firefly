export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(dateKey: string, now = new Date()): boolean {
  return dateKey === toDateKey(now);
}

export function monthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function buildEventsByDate<T extends { startsAt: string }>(
  events: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const event of events) {
    const key = event.startsAt.slice(0, 10);
    const existing = map.get(key) ?? [];
    existing.push(event);
    map.set(key, existing);
  }

  return map;
}
