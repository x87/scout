import AppError from 'common/errors';
import { vsprintf } from 'format';
import { isBrowser } from 'browser-or-node';
import { GLOBAL_OPTIONS } from 'common/arguments';

export default class {
  static error(error: AppError, ...args: any[]): Error {
    return new Error(vsprintf(error, ...args));
  }

  static warn(warning: AppError, ...args: any[]): void {
    return this.msg(vsprintf(warning, ...args));
  }

  static msg(...msg: string[]): void {
    if (isBrowser) {
      const text = document.getElementById('text') as HTMLTextAreaElement;
      text.value += msg.join('\n') + '\n';
    } else {
      console.log(...msg);
    }
  }

  static debug(...msg: string[]): void {
    if (GLOBAL_OPTIONS.debugMode) {
      console.log(...msg);
    }
  }

  static format(format: string, ...args: any[]): string {
    return vsprintf(format, ...args);
  }
}
