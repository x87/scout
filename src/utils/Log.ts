import errors = scout.common.errors;
namespace scout.utils {

    export class Log {
        static error(error: string, ...args) {
            let util = require('util');
            return util.format(errors[error], (args.length ? args : ''));
        }
    }
}
