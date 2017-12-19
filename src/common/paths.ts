import Arguments from './arguments';
import { eGame } from './enums';

const inputFile = Arguments.inputFile;
const map = {
	[eGame.GTA3]: 'gta3.json',
	[eGame.GTAVC]: 'gtavc.json',
	[eGame.GTASA]: 'gtasa.json'
};
const opcodesFile = map[Arguments.game];

export default {
	inputFile,
	opcodesFile
};
