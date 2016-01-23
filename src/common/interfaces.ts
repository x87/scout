module cleojs.common {
    export interface IArguments {
        game: eGame;
        inputFile: string;
        printAssembly: boolean;
    }

    export interface IOpcodeParamArray {
        offset: number;
        varIndex: number;
        size: number;
        props: number;
    }

    export interface IOpcodeDataParam {
        type: string;
    }

    export interface IOpcodeData {
        name: string;
        params: IOpcodeDataParam[];
    }

    export interface IOpcode {
        id: number;
        offset: number;
        params: IOpcodeParam[];
    }

    export interface IOpcodeParam {
        type: eParamType;
        value: number | string | IOpcodeParamArray;
    }

    export interface IScriptFileHeader {
        modelIds: string[];
        mainSize: number;
        largestMission: number;
        numExclusiveMissions: number;
        missions: number[];
        externals: ExternalScriptHeader[];
    }

    export interface IExternalScriptHeader {
        name: string;
        offset: number;
        size: number;
    }
}
