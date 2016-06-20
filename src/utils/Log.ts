import errors from '../common/errors';

export default class {
    static error(error: string, ...args) {
        let util = require('util');
        return util.format(errors[error], (args.length ? args : ''));
    }
    static msg(msg: string) {
        console.log(msg);
    }
}
