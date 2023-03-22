import { main } from './main';
import { isBrowser } from 'browser-or-node';
import { GLOBAL_OPTIONS, updateArguments } from './common/arguments';

if (isBrowser) {
  (globalThis as any).decompile = main;
  (globalThis as any).updateArguments = updateArguments;
} else {
  main(GLOBAL_OPTIONS.inputFile).catch((e) => {
    console.error(e.stack || `[CUSTOM ERROR]: ${e}`);
  });
}
