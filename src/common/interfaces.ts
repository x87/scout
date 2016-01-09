module cleojs.common {
    export interface IArguments {
        game: eGame
    }

    export interface IOpcodeDataParam {
        type: string
    }

    export interface IOpcodeData {
        name: string,
        params: IOpcodeDataParam[]
    }

    export interface IOpcode {
        id: number;
        params: IOpcodeParam[]
    }

    export interface IOpcodeParam {
        type: eParamType;
        value: number | string;
    }

}
