module scout.test {

    export function LogTest () {

        it("should return formatted string from errors object", () => {
            errors['test'] = "TEST %s STRING";
            expect(Log.error('test', ['output'])).toBe('TEST output STRING');
        });

    }

}

