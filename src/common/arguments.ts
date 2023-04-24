import * as fs from 'fs';
import * as path from 'path';
import { isNode } from 'browser-or-node';
import { Command } from 'commander';

import { AppError } from './errors';
import { eGame } from './enums';
import {Log} from 'utils/log';
import { emptyBuffer, readBinaryStream } from 'utils/file';

const program = new Command();

const gameMap: Record<string, eGame> = {
  gta3: eGame.GTA3,
  gtavc: eGame.GTAVC,
  vc: eGame.GTAVC,
  gtasa: eGame.GTASA,
  sa: eGame.GTASA,
};

let GLOBAL_OPTIONS = {
  inputFile: undefined,
  game: eGame.GTA3,
  printAssembly: false,
  debugMode: false,
  only: ''
};

if (isNode) {
  if (process.env.NODE_ENV !== 'test') {
    program
      .usage('<inputfile> [options]')
      .version(require('../../package.json').version, '-v, --version')
      .option('-d, --debug', 'enable the debug mode')
      .option('-p, --print', 'print the assembly')
      .option('-g, --game <game>', 'target game: gta3, vc, sa', (arg) => {
        if (!gameMap.hasOwnProperty(arg)) {
          throw Log.error(AppError.UNKNOWN_GAME, arg);
        }
        return gameMap[arg];
      })
      .option('-o, --only <only>', 'only decompile a script with the given name')
      .parse(process.argv);

    const cli = program.opts();

    updateArguments({
      game: cli.game,
      inputFile: cli.inputFile,
      printAssembly: cli.print,
      debugMode: cli.debug,
      only: cli.only,
    });

    let stream: fs.ReadStream;
    if (process.stdin instanceof fs.ReadStream && !process.stdin.isTTY) {
      stream = process.stdin;
    } else {
      const args = process.argv.slice(2);
      const fileName = args[0];
      if (!fileName) {
        program.help();
      }
      stream = fs.createReadStream(path.join('./', fileName));
    }
    GLOBAL_OPTIONS.inputFile = readBinaryStream(stream).then((data) => {
      const uint8arr = new Uint8Array(data.byteLength);
      data.copy(uint8arr, 0, 0, data.byteLength);
      return new DataView(uint8arr.buffer);
    });
  } else {
    GLOBAL_OPTIONS.inputFile = emptyBuffer();
  }
}

function updateArguments(args) {
  if (args.game !== undefined) {
    GLOBAL_OPTIONS.game = args.game;
  }
  if (args.inputFile) {
    GLOBAL_OPTIONS.inputFile = args.inputFile;
  }
  if (args.printAssembly) {
    GLOBAL_OPTIONS.printAssembly = args.printAssembly;
  }
  if (args.debugMode) {
    GLOBAL_OPTIONS.debugMode = args.debugMode;
  }
  if (args.only) {
    GLOBAL_OPTIONS.only = args.only.toUpperCase();
  }
}

export { GLOBAL_OPTIONS, updateArguments };
