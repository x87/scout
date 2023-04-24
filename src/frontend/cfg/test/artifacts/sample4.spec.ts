import cat1 from 'samples/cat1';
import { decompile } from '../util';

describe(`cat1`, () => {
  it(`does not find the (end credits) while loop because of GOTO -7180 in the middle of the loop`, async () => {
    expect(await decompile(cat1)).toMatchSnapshot();
  });
});
