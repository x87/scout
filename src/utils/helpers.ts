module scout.utils {
    export class Helpers {
        public static isGameGTA3 = () => Arguments.game == eGame.GTA3
        public static isGameVC = () => Arguments.game == eGame.GTAVC
        public static isGameSA = () => Arguments.game == eGame.GTASA
        public static isArrayParam = (param) => ~[
            eParamType.GARRSTR8,
            eParamType.LARRSTR8,
            eParamType.GARRSTR16,
            eParamType.LARRSTR16,
            eParamType.GARRNUM32,
            eParamType.LARRNUM32
        ].indexOf(param)
    }
}
