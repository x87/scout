let disasm = new TheDisasm();

disasm.disassembler.loadOpcodeData()
    .then(
        () => disasm.loader.loadScript(Paths.inputFile)
    )
    .then(
        scriptFile => disasm.disassembler.disassemble(scriptFile)
    ).then(
        map => {
            if (Arguments.printAssembly === true) {
                for (let [offset, opcode] of map) {
                    disasm.printOpcode(opcode);
                }
            }
        }
    ).catch(
        e => {
            console.error(e)
        }
    );


