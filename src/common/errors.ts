module scout.common {
    /**
     *
     * @type {{ERRTYPE: string}}
     */
    export const errors = {

        "ERRIEXT": `file extension %s is not supported`,
        "ERRTYPE": `invalid type, <%s> was expected`,
        "ERRNOOP": `Opcodes definitions are not found at <%s>, disassembling is impossible`,
        "ERRJSON": "Error occured while trying to parse JSON data: %s",
        "ERRARGS": "Command-line error: value for argument %s not found",
        "ERRGAME": "Command-line error: unknown game alias <%s> passed as argument",
        "EUNKPAR": "Unknown data type found: <%s>",
        "EEOFBUF": "End of buffer unexpectedly reached while reading %d bytes",
        "ENOINPT": `No input file is provided.

        Usage: node cleo.js [ -i script.cs | script.cs ] [arguments]
        node cleo.js script.cs -g gta3
        `,
        "ERROFFS": `Relative offset found in main section at %d`,
        "ENOTARG": `No target instruction found for branch at %d`,
    }
}
