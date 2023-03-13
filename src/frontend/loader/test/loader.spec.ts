import Loader from '../';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';
import sample1 from 'samples/1_wait';

describe(Loader.name, () => {
  let loader: Loader;
  beforeEach(() => {
    loader = new Loader();
  });

  it('should create a ScriptFile from input headless file', async () => {
    const stream: Promise<Buffer> = Promise.resolve(Buffer.from('4e00', 'hex'));
    const script = await loader.loadScript(stream);
    expect(script instanceof ScriptFile).toBe(true);
  });

  it('should create a ScriptMultiFile from input header file', async () => {
    const buf = Buffer.from(sample1, 'hex');
    const stream: Promise<Buffer> = Promise.resolve(buf);
    const script = await loader.loadScript(stream);
    expect(script instanceof ScriptMultifile).toBe(true);
  });
});
