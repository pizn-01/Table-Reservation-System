/**
 * Convert HH:MM string to total minutes since midnight.
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert total minutes to HH:MM string.
 */
export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Add minutes to a HH:MM time string.
 */
export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const total = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(total);
};

/**
 * Check if two time ranges overlap.
 */
export const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
};

/**
 * Get today's date in YYYY-MM-DD format.
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
