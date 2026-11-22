import { describe, expect, it } from 'vitest';
import { idYoutube } from './youtube';

describe('idYoutube', () => {
  it('reconnaît les liens courants', () => {
    expect(idYoutube('https://www.youtube.com/watch?v=apnmAIK5M0Y&t=3')).toBe('apnmAIK5M0Y');
    expect(idYoutube('https://youtu.be/1-RWHAAvGxw?si=x')).toBe('1-RWHAAvGxw');
    expect(idYoutube('https://youtube.com/shorts/x-Ali7545U8')).toBe('x-Ali7545U8');
    expect(idYoutube('https://www.youtube.com/embed/I2quAWgsnDo')).toBe('I2quAWgsnDo');
    expect(idYoutube('D9-HGwXTT2k')).toBe('D9-HGwXTT2k');
  });
  it('refuse le reste', () => {
    expect(idYoutube('https://vimeo.com/123')).toBeNull();
    expect(idYoutube('bonjour')).toBeNull();
  });
});
