import { Loader } from '../frontend/Loader';

export default function () {

    let loader;
    beforeEach(() => {
        loader = new Loader();
    });

    it('should be true for files with .scm extension only', () => {
        expect(loader.isScriptFileWithHeader('main.scm')).toBe(true);
        expect(loader.isScriptFileWithHeader('test.cs')).toBe(false);
        expect(loader.isScriptFileWithHeader('src.txt')).toBe(false);
    });

    it('should be true for .scm and .cs extensions', () => {
        expect(loader.isScriptFileValidExtension('test.cs')).toBe(true);
        expect(loader.isScriptFileValidExtension('main.scm')).toBe(true);
        expect(loader.isScriptFileValidExtension('src.txt')).toBe(false);
    });


}
