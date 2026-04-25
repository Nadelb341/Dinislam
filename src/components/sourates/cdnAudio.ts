// Numéro du premier verset global pour chaque sourate (index = numéro de sourate)
// index 0 = inutilisé, index 1 = sourate 1 commence au verset global 1, etc.
const SOURATE_VERSE_START = [
  0, 1, 8, 294, 494, 670, 790, 955, 1161, 1236,
  1365, 1474, 1597, 1708, 1751, 1803, 1902, 2030, 2141, 2251,
  2349, 2484, 2596, 2674, 2792, 2856, 2933, 3160, 3253, 3341,
  3410, 3470, 3504, 3534, 3607, 3661, 3706, 3789, 3971, 4059,
  4134, 4219, 4273, 4326, 4415, 4474, 4511, 4546, 4584, 4613,
  4631, 4658, 4691, 4735, 4753, 4790, 4831, 4868, 4887, 4931,
  4955, 4971, 4982, 4993, 5004, 5011, 5017, 5022, 5061, 5104,
  5113, 5158, 5172, 5177, 5188, 5211, 5227, 5242, 5270, 5280,
  5290, 5301, 5316, 5349, 5374, 5389, 5417, 5431, 5457, 5475,
  5495, 5503, 5512, 5517, 5521, 5524, 5527, 5530, 5537, 5542,
  5544, 5549, 5558, 5561, 5566, 5568, 5571, 5574, 5577, 5580,
  5582, 5585, 5587, 5590, 5596, 5601, 5606, 5610, 5613, 5621,
  5625, 5627, 5630, 5634, 5637,
];

const CDN_BASE = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy';

export function getCdnAudioUrl(sourateNum: number, verseNum: number): string {
  if (sourateNum === 1000) return ''; // Ayat Al-Kursi = cas spécial
  const start = SOURATE_VERSE_START[sourateNum];
  if (!start) return '';
  return `${CDN_BASE}/${start + verseNum - 1}.mp3`;
}
