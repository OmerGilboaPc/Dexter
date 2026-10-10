import { createContext, useContext } from 'react';

export type Quality = 'low' | 'medium' | 'high';
export const QUALITY = {
  low: { dpr: 1 as number | [number, number], shadows: false, mapSize: 512, pointShadows: false, msaa: 0, bloom: false },
  medium: { dpr: [1, 1.5] as number | [number, number], shadows: true, mapSize: 1024, pointShadows: false, msaa: 2, bloom: true },
  high: { dpr: [1, 2] as number | [number, number], shadows: true, mapSize: 2048, pointShadows: true, msaa: 4, bloom: true },
};
export const QualityCtx = createContext(QUALITY.medium);
export const useQuality = () => useContext(QualityCtx);
