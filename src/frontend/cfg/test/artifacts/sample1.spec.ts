import loop3 from 'samples/loop3';
import loop4 from 'samples/loop4';
import { decompile } from '../util';

[loop3, loop4].forEach((sample, i) =>
  describe(`sample input ${i + 1}`, () => {
    it(`has redundant 'continue' statements`, async () => {
      expect(await decompile(sample)).toMatchSnapshot();
    });
  })
);
