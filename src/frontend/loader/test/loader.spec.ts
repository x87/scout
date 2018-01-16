import Loader from '../';

describe('loader spec', () => {

	let loader;
	beforeEach(() => {
		loader = new Loader();
	});

	it('should be true for files with .scm extension only', () => {
		expect(loader.isHeaderPresent('main.scm')).toBe(true);
		expect(loader.isHeaderPresent('test.cs')).toBe(false);
		expect(loader.isHeaderPresent('src.txt')).toBe(false);
	});

	it('should be true for .scm and .cs extensions', () => {
		expect(loader.isFileTypeSupported('test.cs')).toBe(true);
		expect(loader.isFileTypeSupported('main.scm')).toBe(true);
		expect(loader.isFileTypeSupported('src.txt')).toBe(false);
	});

});
