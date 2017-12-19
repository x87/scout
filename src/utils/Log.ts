import AppError from '../common/errors';
import * as util from 'util';

export default class {
	static error(error: AppError, ...args) {
		return new Error(util.format(error, ...args));
	}

	static warn(warning: AppError, ...args) {
		return this.msg(util.format(warning, ...args));
	}

	static msg(msg: string) {
		console.log(msg);
	}
}
