enum AppError {
	UNKNOWN_FILE_EXTENSION = 'file extension %s is not supported',
	INVALID_TYPE = 'invalid type, <%s> was expected',
	NO_OPCODE = 'Opcodes definitions are not found at <%s>, disassembling is impossible',
	JSON = 'Error occured while trying to parse JSON data: %s',
	NO_ARG_VALUE = 'Command-line error: value for argument %s not found',
	UNKNOWN_GAME = 'Command-line error: unknown game alias <%s> passed as argument',
	UNKNOWN_PARAM = 'Unknown data type found %s at offset %s',
	NO_PARAM = 'No parameters found for opcode %s at %s',
	END_OF_BUFFER = 'End of buffer unexpectedly reached while reading %s bytes',
	NO_INPUT = 'No input file is provided.\
\
    Usage: node scout.js [ -i script.cs | script.cs ] [arguments]\
    node scout.js script.cs -g gta3',
	INVALID_REL_OFFSET = 'Relative offset found in main section at %s',
	INVALID_ABS_OFFSET = 'Absolute offset found in an external file at %s',
	NO_TARGET = 'WARNING: No target instruction found for branch at %s',
	NO_BRANCH = 'WARNING: Branch at %s not found during linkage',
	UNREACHABLE_BRANCH = 'WARNING: Unreachable branch found at %s',
	UNKNOWN_LOOP_TYPE = 'WARNING: Unknown loop type with header %s and latching node %s'
}
export default AppError;
