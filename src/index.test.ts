import { describe, expect, it } from 'vitest';

import { greet } from './index';

describe('greet', () => {
  it('addresses the name it is given', () => {
    expect(greet('world')).toBe('Hello, world!');
  });
});
