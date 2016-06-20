import Arguments from './arguments';
import { eGame } from './enums';

let path = require('path');

export default {
    inputFile: function () {
        return path.join(__dirname, Arguments.inputFile);
    }(),
    opcodesFile: function () {

        const map = {
            [eGame.GTA3] : 'gta3.json',
            [eGame.GTAVC] : 'gtavc.json',
            [eGame.GTASA] : 'gtasa.json'
        };
        return path.join(__dirname, map[Arguments.game]);
    }()
};
