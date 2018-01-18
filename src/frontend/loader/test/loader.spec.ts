import Loader from '../';
import ScriptFile from 'frontend/script/ScriptFile';
import ScriptMultifile from 'frontend/script/ScriptMultifile';

describe(Loader.name, () => {

	let loader: Loader;
	beforeEach(() => {
		loader = new Loader();
	});

	it('should be true for files with .scm extension only', () => {
		expect((loader as any).isHeaderPresent('main.scm')).toBe(true);
		expect((loader as any).isHeaderPresent('test.cs')).toBe(false);
		expect((loader as any).isHeaderPresent('src.txt')).toBe(false);
	});

	it('should be true for .scm and .cs extensions', () => {
		expect((loader as any).isFileTypeSupported('test.cs')).toBe(true);
		expect((loader as any).isFileTypeSupported('main.scm')).toBe(true);
		expect((loader as any).isFileTypeSupported('src.txt')).toBe(false);
	});

	it('should create a ScriptFile from input cs file', async (done) => {
		try {
			const script = await loader.loadScript('samples/0.cs');
			expect(script instanceof ScriptFile).toBe(true);
			done();
		} catch (e) {
			done.fail(e);
		}
	});

	it('should create a ScriptMultiFile from input scm file', async (done) => {
		try {
			const script = await loader.loadScript('samples/1_wait.scm');
			expect(script instanceof ScriptMultifile).toBe(true);
			done();
		} catch (e) {
			done.fail(e);
		}
	});

	it('should throw an error on empty input scm file', async (done) => {
		try {
			const script = await loader.loadScript('samples/0.scm');
			done.fail();
		} catch {
			done();
		}
	});
});
