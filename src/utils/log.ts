import AppError from 'common/errors';
import * as util from 'util';

export default class {
	static error(error: AppError, ...args: any[]): Error {
		return new Error(util.format(error, ...args));
	}

	static warn(warning: AppError, ...args: any[]): void {
		return this.msg(util.format(warning, ...args));
	}

	static msg(msg: string): void {
		console.log(msg);
	}
}
