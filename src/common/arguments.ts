module cleojs.common {
    import Log = cleojs.utils.CLog;

    let game = eGame.GTA3;
    let inputFile = '';
    let printAssembly: boolean = false;

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

            game = gameMap[arg];
        },
        "-i": (arg) => {
            inputFile = arg;
        }
    }

    const singleArgs: Object = {
        "-p": () => {
            printAssembly = true;
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
        } if (singleArgs.hasOwnProperty(arg)) {
            singleArgs[arg]();
        } else {
            if (!inputFile) {
                inputFile = arg;
            }
        }
    }

    if (!inputFile) {
        throw Log.error("ENOINPT");
    }

    export const Arguments: IArguments = {
        game,
        inputFile,
        printAssembly
    }

}
