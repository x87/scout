module cleojs.utils {
    export class Helpers {
        public static isGameGTA3 = () => Arguments.game == eGame.GTA3
        public static isGameVC = () => Arguments.game == eGame.GTAVC
        public static isGameSA = () => Arguments.game == eGame.GTASA
    }
}
