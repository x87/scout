import errors from  '../common/errors';
import Log from '../utils/Log';

export default function () {

    it('should return formatted string from errors object', () => {
        errors['test'] = 'TEST %s STRING';
        expect(Log.error('test', ['output'])).toBe('TEST output STRING');
    });

}

