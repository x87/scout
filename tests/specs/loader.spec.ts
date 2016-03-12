module scout.test {

    export function loader () {

        let loader;
        beforeEach(() => {
            loader = new CLoader();
        })

        it("should be true for files with .scm extension only", () => {
            expect(loader.isScriptFileWithHeader('main.scm')).toBe(true);
            expect(loader.isScriptFileWithHeader('test.cs')).toBe(false);
            expect(loader.isScriptFileWithHeader('src.txt')).toBe(false);
        });

        it("should be true for .scm and .cs extensions", () => {
            expect(loader.isScriptFileValidExtension('test.cs')).toBe(true);
            expect(loader.isScriptFileValidExtension('main.scm')).toBe(true);
            expect(loader.isScriptFileValidExtension('src.txt')).toBe(false);
        });


    }
}

