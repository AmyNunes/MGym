import type { Muscle } from '@/training/exerciseModel';

/**
 * Desenho do corpo (frente e costas) para o mapa muscular, feito por nós (seção 2.1).
 * Coordenadas num quadro de 120 × 250. As formas são do lado esquerdo da figura e
 * são espelhadas para o direito; as do centro (`center`) aparecem uma vez só.
 */

export const BODY_WIDTH = 120;
export const BODY_HEIGHT = 250;

export type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number; center?: boolean }
  | { kind: 'path'; d: string; center?: boolean };

export type View = 'front' | 'back';

/** Espessura do contorno dos músculos secundários, nas unidades do desenho. */
export const OUTLINE_WIDTH = 0.8;

/** Silhueta (igual de frente e de costas). */
export const SILHOUETTE: Shape[] = [
  { kind: 'ellipse', cx: 60, cy: 20, rx: 11, ry: 13, center: true },
  { kind: 'path', d: 'M54,30 H66 V44 H54 Z', center: true },
  {
    kind: 'path',
    d: 'M38,44 Q60,38 82,44 L85,58 Q83,80 77,104 Q85,120 87,136 Q60,150 33,136 Q35,120 43,104 Q37,80 35,58 Z',
    center: true,
  },
  { kind: 'ellipse', cx: 37, cy: 52, rx: 8, ry: 9 },
  { kind: 'ellipse', cx: 30, cy: 75, rx: 6, ry: 17, rot: 10 },
  { kind: 'ellipse', cx: 24, cy: 109, rx: 5, ry: 17, rot: 8 },
  { kind: 'ellipse', cx: 20, cy: 133, rx: 4.5, ry: 6.5 },
  { kind: 'ellipse', cx: 48, cy: 168, rx: 13, ry: 32, rot: -4 },
  { kind: 'ellipse', cx: 47, cy: 214, rx: 8, ry: 21 },
  { kind: 'ellipse', cx: 46, cy: 238, rx: 7, ry: 5 },
];

const forearm: Shape = { kind: 'ellipse', cx: 24, cy: 107, rx: 4, ry: 13, rot: 8 };
const sideDelt: Shape = { kind: 'ellipse', cx: 31.5, cy: 53, rx: 3.2, ry: 7, rot: 12 };

export const MUSCLE_SHAPES: Record<View, Partial<Record<Muscle, Shape[]>>> = {
  front: {
    frontDelts: [{ kind: 'ellipse', cx: 39, cy: 52, rx: 5.5, ry: 7.5, rot: -15 }],
    sideDelts: [sideDelt],
    chest: [{ kind: 'path', d: 'M59,50 Q49,47 42,53 Q40,62 45,67 Q52,70 59,67 Z' }],
    biceps: [{ kind: 'ellipse', cx: 30, cy: 77, rx: 4.5, ry: 11, rot: 10 }],
    forearms: [forearm],
    abs: [
      { kind: 'path', d: 'M53,74 Q53,72 55,72 H59 V83 H53 Z', center: true },
      { kind: 'path', d: 'M67,74 Q67,72 65,72 H61 V83 H67 Z', center: true },
      { kind: 'path', d: 'M53,85 H59 V95 H53 Z', center: true },
      { kind: 'path', d: 'M61,85 H67 V95 H61 Z', center: true },
      { kind: 'path', d: 'M53,97 H59 V108 Q55,108 53,105 Z', center: true },
      { kind: 'path', d: 'M61,97 H67 V105 Q65,108 61,108 Z', center: true },
    ],
    obliques: [{ kind: 'path', d: 'M51,74 Q46,82 45,94 Q46,102 51,106 Z' }],
    quads: [{ kind: 'ellipse', cx: 47, cy: 166, rx: 9, ry: 24, rot: -5 }],
    adductors: [{ kind: 'ellipse', cx: 57, cy: 152, rx: 3.5, ry: 14, rot: -6 }],
    calves: [{ kind: 'ellipse', cx: 45, cy: 212, rx: 5, ry: 14 }],
  },
  back: {
    upperBack: [{ kind: 'path', d: 'M60,42 L73,49 L67,74 L60,80 L53,74 L47,49 Z', center: true }],
    rearDelts: [{ kind: 'ellipse', cx: 38, cy: 53, rx: 5.5, ry: 7.5, rot: 15 }],
    sideDelts: [sideDelt],
    lats: [{ kind: 'path', d: 'M48,58 Q41,68 44,90 Q49,98 55,95 Q52,78 52,64 Z' }],
    lowerBack: [{ kind: 'path', d: 'M54,90 Q54,86 57,86 H63 Q66,86 66,90 V110 H54 Z', center: true }],
    triceps: [{ kind: 'ellipse', cx: 30, cy: 75, rx: 4.5, ry: 11, rot: 10 }],
    forearms: [forearm],
    gluteMed: [{ kind: 'ellipse', cx: 42, cy: 120, rx: 6, ry: 5.5, rot: -25 }],
    gluteMax: [{ kind: 'ellipse', cx: 50, cy: 132, rx: 10.5, ry: 11 }],
    hamstrings: [{ kind: 'ellipse', cx: 48, cy: 170, rx: 8, ry: 21, rot: -4 }],
    calves: [{ kind: 'ellipse', cx: 48, cy: 210, rx: 6.5, ry: 14 }],
  },
};
