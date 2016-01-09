module cleojs.common {

    let _game = eGame.GTA3;
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
                throw logger.error("ERRGAME", arg)
            }

            _game = gameMap[arg];
        }
    }

    for (let i = 0; i < args.length; i += 1) {
        let arg = args[i];
        if (argKeys.hasOwnProperty(arg)) {
            if (i + 1 >= args.length) {
                throw logger.error("ERRARGS", arg);
            }
            argKeys[arg](args[i + 1]);
            i++;
        }
    }

    export const Arguments: IArguments = {
        game: _game
    }

}
