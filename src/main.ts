/// <reference path="import.ts"/>

if (!Arguments.inputFile) {
    throw Log.error('ENOINPT');
}

let disasm = new CDisassembler();
disasm.loadOpcodeData()
    .then(
        () => {
            let loader = new Loader();
            return loader.loadScript(Paths.inputFile);
        }
    )
    .then(
        scriptFile => disasm.disassemble(scriptFile)
    ).then(
        files => {
            let CFG = new CCFGProcessor();
            CFG.findBasicBlocks(files);
            return files;
        }
    ).then(
        files => {
            files.forEach(file => {
                if (Arguments.printAssembly === true) {
                    for (let [offset, opcode] of file.opcodes) {
                        disasm.printOpcode(opcode);
                    }
                }
            });

        }
    ).catch(
        e => {
            console.error(e);
        }
    );


