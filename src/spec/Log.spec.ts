import AppError from '../common/errors';
import Log from '../utils/Log';

export default function() {

	it('should return errors object with formatted message', () => {
		const error = Log.error('TEST %s STRING' as AppError, ['output']);
		expect(error instanceof Error).toBe(true);
		expect(error.message).toBe('TEST output STRING');
	});

}
