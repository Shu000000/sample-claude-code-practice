import { describe, test, expect } from 'vitest';
import { calcWorkHours, getDayOfWeek, formatDate, getDaysInMonth, formatDateISO } from './dateUtils';

describe('calcWorkHours', () => {
  test('9:00〜18:00 = 9時間', () => {
    expect(calcWorkHours('09:00', '18:00')).toBe(9);
  });

  test('9:30〜18:00 = 8.5時間', () => {
    expect(calcWorkHours('09:30', '18:00')).toBe(8.5);
  });

  test('10:00〜17:00 = 7時間', () => {
    expect(calcWorkHours('10:00', '17:00')).toBe(7);
  });
});

describe('getDayOfWeek', () => {
  test('2026-03-04(水曜日)', () => {
    expect(getDayOfWeek('2026-03-04')).toBe('水');
  });

  test('2026-03-01(日曜日)', () => {
    expect(getDayOfWeek('2026-03-01')).toBe('日');
  });

  test('2026-03-07(土曜日)', () => {
    expect(getDayOfWeek('2026-03-07')).toBe('土');
  });
});

describe('formatDate', () => {
  test('YYYY-MM-DD → YYYY/MM/DD', () => {
    expect(formatDate('2026-03-04')).toBe('2026/03/04');
  });
});

describe('getDaysInMonth', () => {
  test('2026年3月 = 31日', () => {
    const days = getDaysInMonth(2026, 3);
    expect(days).toHaveLength(31);
  });

  test('2026年2月 = 28日（平年）', () => {
    const days = getDaysInMonth(2026, 2);
    expect(days).toHaveLength(28);
  });

  test('最初の日が1日', () => {
    const days = getDaysInMonth(2026, 3);
    expect(days[0].getDate()).toBe(1);
  });

  test('最後の日が31日', () => {
    const days = getDaysInMonth(2026, 3);
    expect(days[days.length - 1].getDate()).toBe(31);
  });
});

describe('formatDateISO', () => {
  test('Date → YYYY-MM-DD', () => {
    expect(formatDateISO(new Date(2026, 2, 4))).toBe('2026-03-04');
  });
});
