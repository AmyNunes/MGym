import { dropIndex } from '../DraggableList';

describe('dropIndex', () => {
  it('arredonda pelo tamanho da linha e não sai da lista', () => {
    expect(dropIndex(0, 70, 72, 4)).toBe(1);
    expect(dropIndex(2, -150, 72, 4)).toBe(0);
    expect(dropIndex(1, 30, 72, 4)).toBe(1);
    expect(dropIndex(3, 500, 72, 4)).toBe(3);
  });
});
