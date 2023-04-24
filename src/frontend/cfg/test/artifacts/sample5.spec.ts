import loop5 from 'samples/loop5';
import { decompile } from '../util';

`
{$CLEO}

// this demonstrates a problem from CAT1 script

0000:

jump @middle


while 0@ > 1

    wait 1
    
    :middle
    wait 2


end

end_thread
`;

describe(`loop5`, () => {
  it(`does not detect loop correctly as there is a jump in the middle of the loop`, async () => {
    expect(await decompile(loop5)).toMatchSnapshot();
  });
});
