let disasm = new TheDisasm();

    disasm.disassembler.loadOpcodeData()
        .then(
            () => disasm.loader.loadScript(Paths.inputFile)
        )
        .then(
            scriptFile => disasm.disassembler.disassemble(scriptFile)
        )
        .catch(
            e => { console.error(e) }
        )

