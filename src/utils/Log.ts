import errors from '../common/errors';

export default class {
    static error(error: string, ...args) {
        const util = require('util');
        return new Error(util.format(errors[error], ...args));
    }
    static msg(msg: string) {
        console.log(msg);
    }
}
