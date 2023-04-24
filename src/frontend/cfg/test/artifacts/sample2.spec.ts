import wrong1 from 'samples/wrong';
import { decompile } from '../util';

`
{$CLEO}

0000:
0002: jump @1
wait 0

:1
end_thread
`;

describe(`wrong 1`, () => {
  it(`loses an unreachable node`, async () => {
    expect(await decompile(wrong1)).toMatchSnapshot();
  });
});
