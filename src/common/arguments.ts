import Log from '../utils/Log';
import AppError from '../common/errors';
import { eGame } from './enums';

let game = eGame.GTA3;
let inputFile = '';
let printAssembly: boolean = false;

const args = process.argv.slice(2);
const argKeys: any = {
	'-g': (arg) => {

		const gameMap: any = {
			gta3: eGame.GTA3,
			gtavc: eGame.GTAVC,
			vc: eGame.GTAVC,
			gtasa: eGame.GTASA,
			sa: eGame.GTASA
		};

		if (!gameMap.hasOwnProperty(arg)) {
			throw Log.error(AppError.ERRGAME, arg);
		}

		game = gameMap[arg];
	},
	'-i': (arg) => {
		inputFile = arg;
	}
};

const singleArgs: any = {
	'-p': () => {
		printAssembly = true;
	}
};

for (let i = 0; i < args.length; i += 1) {
	const arg = args[i];
	if (argKeys.hasOwnProperty(arg)) {
		if (i + 1 >= args.length) {
			throw Log.error(AppError.ERRARGS, arg);
		}
		argKeys[arg](args[i + 1]);
		i++;
	}
	if (singleArgs.hasOwnProperty(arg)) {
		singleArgs[arg]();
	} else {
		if (!inputFile) {
			inputFile = arg;
		}
	}
}

export default {
	game,
	inputFile,
	printAssembly
};
