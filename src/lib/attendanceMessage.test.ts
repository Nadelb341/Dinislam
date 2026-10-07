import { describe, expect, it } from 'vitest';
import { attendanceStreak, buildAttendanceMessage } from '@/lib/attendanceMessage';

describe('Message après le dernier cours', () => {
  it('accorde au féminin', () => {
    expect(buildAttendanceMessage('present', true)).toMatch(/^Présente au dernier cours/);
    expect(buildAttendanceMessage('late', false)).toContain("d'être venu au");
    expect(buildAttendanceMessage('absent', true)).toContain('absente');
  });
  it('compte les cours suivis d’affilée', () => {
    expect(attendanceStreak(['present', 'late', 'present', 'absent', 'present'])).toBe(3);
    expect(attendanceStreak(['absent', 'present'])).toBe(0);
  });
});
