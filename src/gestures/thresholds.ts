/**
 * Limites dos gestos (seção 7), em dp.
 * Horizontais dentro de áreas com rolagem vertical usam `activeOffsetX` + `failOffsetY`.
 */
export const GESTURES = {
  /** A alça ≡ começa a arrastar depois de mover isto na vertical. */
  dragActivate: [-4, 4] as [number, number],
  /** Deslizar na horizontal começa depois disto… */
  swipeActivateX: [-16, 16] as [number, number],
  /** …e desiste se o dedo for antes para cima ou para baixo (era rolagem). */
  swipeFailY: [-12, 12] as [number, number],
  /** Quanto precisa deslizar para a ação valer. */
  swipeCommit: 96,
};
