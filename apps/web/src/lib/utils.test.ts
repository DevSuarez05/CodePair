import { cn, formatRelativeTime } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4 py-2', 'bg-blue-500', { 'text-white': true, 'hidden': false });
      expect(result).toBe('px-4 py-2 bg-blue-500 text-white');
    });

    it('should resolve tailwind conflict classes by prioritizing the last class', () => {
      const result = cn('p-4', 'p-6');
      expect(result).toBe('p-6');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "hace unos segundos" for timestamps within the last minute', () => {
      const recent = new Date(Date.now() - 1000 * 30);
      expect(formatRelativeTime(recent)).toBe('hace unos segundos');
    });

    it('should return minutes for recent past timestamps', () => {
      const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('hace 5 min');
    });

    it('should return hours for timestamps older than an hour', () => {
      const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2);
      expect(formatRelativeTime(twoHoursAgo)).toBe('hace 2 h');
    });
  });
});
