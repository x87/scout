import { Loader } from '../index';
import { ScriptFile } from 'frontend/script/ScriptFile';
import { ScriptMultifile } from 'frontend/script/ScriptMultifile';
import { bufferFromHex } from 'utils/file';

import sample1 from 'samples/1_wait';

describe(Loader.name, () => {
  let loader: Loader;
  beforeEach(() => {
    loader = new Loader();
  });

  it('should create a ScriptFile from input headless file', async () => {
    const stream = Promise.resolve(bufferFromHex('4e00'));
    const script = await loader.loadScript(stream);
    expect(script instanceof ScriptFile).toBe(true);
  });

  it('should create a ScriptMultiFile from input header file', async () => {
    const view = bufferFromHex(sample1);
    const stream = Promise.resolve(view);
    const script = await loader.loadScript(stream);
    expect(script instanceof ScriptMultifile).toBe(true);
  });
});
