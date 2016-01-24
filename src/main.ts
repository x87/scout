let disasm = new TheDisasm();

disasm.disassembler.loadOpcodeData()
    .then(
        () => disasm.loader.loadScript(Paths.inputFile)
    )
    .then(
        scriptFile => disasm.disassembler.disassemble(scriptFile)
    ).then(
        files => disasm.cfg.findLeaderInstructions(files)
    ).then(
        files => {
            files.forEach(file => {
                if (Arguments.printAssembly === true) {
                    for (let [offset, opcode] of file.opcodes) {
                        disasm.printOpcode(opcode);
                    }
                }
            })

        }
    ).catch(
        e => {
            console.error(e)
        }
    );


