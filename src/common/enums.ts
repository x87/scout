export enum eParamType {
	EOL,

	// immediate values
	NUM8,
	NUM16,
	NUM32,
	FLOAT,
	STR,
	STR8,
	STR16,
	STR128,

	// variables
	GVARNUM32,
	LVARNUM32,
	GVARSTR8,
	LVARSTR8,
	GVARSTR16,
	LVARSTR16,

	// arrays
	GARRSTR8,
	LARRSTR8,
	GARRSTR16,
	LARRSTR16,
	GARRNUM32,
	LARRNUM32
}

export enum eGame {
	GTA3,
	GTAVC,
	GTASA
}

export enum eScriptFileSegments {
	GLOBAL_VARS,
	MODELS,
	MISSIONS,
	EXTERNALS,
	SASEG5,
	SASEG6,
	MAIN
}

export enum eScriptType {
	HEADLESS,
	MULTIFILE
}

export enum eBasicBlockType {
	UNDEFINED,
	RETURN,
	ONE_WAY, // jump
	TWO_WAY, // jf
	FALL,
	CALL,
	N_WAY // switch
}

export enum eLoopType {
	PRE_TESTED,
	POST_TESTED,
	ENDLESS
}

export enum eIfType {
	IF_THEN,
	IF_THEN_ELSE
}
