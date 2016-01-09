module cleojs.common {
    export enum eParamType {
        EOL,
        IMM32,
        GVAR,
        LVAR,
        IMM8,
        IMM16,
        FLOAT,

        // last one for GTA3, VC
        STR8
    }

    export enum eGame {
        GTA3,
        GTAVC,
        GTASA
    }
}
