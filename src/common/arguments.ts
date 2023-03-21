import * as fs from 'fs';
import * as path from 'path';

import Log from 'utils/log';
import AppError from './errors';
import { eGame } from './enums';
import { readBinaryStream } from 'utils/file';

import { Command } from 'commander';
const program = new Command();

interface IGameDictionary {
  [key: string]: eGame;
}

const gameMap: IGameDictionary = {
  gta3: eGame.GTA3,
  gtavc: eGame.GTAVC,
  vc: eGame.GTAVC,
  gtasa: eGame.GTASA,
  sa: eGame.GTASA,
};

const definitionMap = {
  [eGame.GTA3]: 'gta3.json',
  [eGame.GTAVC]: 'gtavc.json',
  [eGame.GTASA]: 'gtasa.json',
};

program
  .usage('<inputfile> [options]')
  .version(require('../../package.json').version, '-v, --version')
  .option('-d, --debug', 'enable the debug mode')
  .option('-p, --print', 'print the assembly')
  .option(
    '-g, --game <game>',
    'target game: gta3, vc, sa',
    (arg) => {
      if (!gameMap.hasOwnProperty(arg)) {
        throw Log.error(AppError.UNKNOWN_GAME, arg);
      }
      return arg;
    },
    'gta3'
  )
  .parse(process.argv);

const options = program.opts();

const game = gameMap[options.game];
const definitionFile = definitionMap[game];
let inputFile: Promise<Buffer>;

if (process.env.NODE_ENV === 'test') {
  inputFile = Promise.resolve(Buffer.from([]));
} else {
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
  inputFile = readBinaryStream(stream);
}

export default {
  inputFile,
  definitionFile,
  game,
  printAssembly: options.print,
  debugMode: options.debug,
};
