module cleojs.common {
    /**
     *
     * @type {{ERRTYPE: string}}
     */
    export const errors = {

        "ERRTYPE": `invalid type, <%s> was expected`,
        "ERRNOOP": `Opcodes definitions are not found at <%s>, disassembling is impossible`,
        "ERRJSON": "Error occured while trying to parse JSON data: %s",
        "ERRARGS": "Command-line error: value for argument %s not found",
        "ERRGAME": "Command-line error: unknown game alias <%s> passed as argument",
        "EUNKPAR": "Unknown data type found: <%s>",
        "EEOFBUF": "End of buffer unexpectedly reached while reading %d bytes"
    }
}
