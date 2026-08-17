import yard2 from 'samples/yard2';
import { decompile } from '../util';

describe(`yard2`, () => {
  it(`does not duplicate M_FAIL block`, async () => {
    expect(await decompile(yard2)).toMatchSnapshot();
  });
});
