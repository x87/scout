module cleojs.common {
    import Log = cleojs.utils.CLog;

    let _game = eGame.GTA3;
    let _inputFile = '';
    const args = process.argv.slice(2);
    const argKeys: Object = {
        "-g": (arg) => {

            const gameMap: Object = {
                "gta3": eGame.GTA3,
                "gtavc": eGame.GTAVC,
                "vc": eGame.GTAVC,
                "gtasa": eGame.GTASA,
                "sa": eGame.GTASA,
            }

            if (!gameMap.hasOwnProperty(arg)) {
                throw Log.error("ERRGAME", arg)
            }

            _game = gameMap[arg];
        },
        "-i": (arg) => {
            _inputFile = arg;
        }
    }

    for (let i = 0; i < args.length; i += 1) {
        let arg = args[i];
        if (argKeys.hasOwnProperty(arg)) {
            if (i + 1 >= args.length) {
                throw Log.error("ERRARGS", arg);
            }
            argKeys[arg](args[i + 1]);
            i++;
        } else {
            if (!_inputFile) {
                _inputFile = arg;
            }
        }
    }

    if (!_inputFile) {
        throw Log.error("ENOINPT");
    }

    export const Arguments: IArguments = {
        game: _game,
        inputFile: _inputFile
    }

}
