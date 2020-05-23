import AppError from 'common/errors';
import Log from '../log';

describe('log spec', () => {
  it('should return errors object with formatted message', () => {
    const error = Log.error('TEST %s STRING' as AppError, 'output');
    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('TEST output STRING');
  });
});
