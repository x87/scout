enum AppError {
	INVALID_INPUT_FILE = 'Can\'t read from input file, file is either broken or its format is not supported',
	EMPTY_SCM = 'SCM file can not be empty',
	NO_OPCODE = 'Can\'t read opcode definitions from <%s>, disassembling is impossible',
	UNKNOWN_GAME = 'Unknown game alias <%s> passed as command-line argument',
	UNKNOWN_PARAM = 'Unknown data type %s found at offset %s',
	NO_PARAM = 'No parameters found for opcode %s at %s',
	END_OF_BUFFER = 'End of buffer unexpectedly reached while reading %s bytes',
	INVALID_REL_OFFSET = 'Relative offset found in the main section at %s',
	INVALID_ABS_OFFSET = 'Absolute offset found in an external file at %s',
	NO_TARGET = 'WARNING: No target instruction found for branch %s at %s',
	NO_BRANCH = 'WARNING: No branch found at offset %s during linkage',
	NOT_NUMERIC_INSTRUCTION = 'Expected numeric value for parameter in instruction at %s',
	UNKNOWN_LOOP_TYPE = 'WARNING: Unknown loop type with header nodes %s and latching nodes %s',
	INVALID_BB_TYPE = 'Invalid block type %s',
	NODE_NOT_FOUND = 'Internal error: node not found'
}
export default AppError;
