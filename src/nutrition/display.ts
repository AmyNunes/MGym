/** "Frango, peito, sem pele, grelhado" → "Frango (peito, sem pele, grelhado)". */
export function friendlyName(tacoName: string): string {
  const [first, ...rest] = tacoName.split(', ');
  return rest.length ? `${first} (${rest.join(', ')})` : first;
}

/** Nome curto para listas apertadas: só a primeira parte ("Frango"). */
export const shortFoodName = (tacoName: string) => tacoName.split(', ')[0];
