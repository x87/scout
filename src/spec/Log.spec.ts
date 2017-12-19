import AppError from '../common/errors';
import Log from '../utils/Log';

export default function() {

	it('should return formatted string from errors object', () => {
		expect(() => Log.error('TEST %s STRING' as AppError, ['output'])).toThrowError('TEST output STRING');
	});

}
