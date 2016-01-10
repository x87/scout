import errors = cleojs.common.errors;
module cleojs.utils {

    export class CLog {
        static error(error: string, ...args) {
            let util = require('util');
            return util.format(errors[error], (args.length ? args : ""));
        }
    }
}
