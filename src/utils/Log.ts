import errors from '../common/errors';

const util = require('util');

export default class {
    static error(error: string, ...args) {
        return new Error(util.format(errors[error], ...args));
    }
    static warn(warning: string, ...args) {
        return this.msg(util.format(errors[warning], ...args));
    }
    static msg(msg: string) {
        console.log(msg);
    }
}
