// import ErrorHandler from './utils/ErrorHandler';

import Log from 'utils/Log';
import Paths from 'common/paths';
import Arguments from 'common/arguments';
import { CDisassembler } from 'frontend/Disassembler';
import { Loader } from 'frontend/Loader';
import { CControlFlowProcessor } from 'frontend/ControlFlowProcessor';
import AppError from 'common/errors';

if (!Arguments.inputFile) {
	throw Log.error(AppError.ENOINPT);
}

const disasm = new CDisassembler();
disasm.loadOpcodeData()
	.then(() => {
		const loader = new Loader();
		return loader.loadScript(Paths.inputFile);
	})
	.then(scriptFile => disasm.disassemble(scriptFile))
	.then(files => {
		const CFG = new CControlFlowProcessor();
		CFG.buildCFG(files);
		return files;
	})
	.then(files => {
		files.forEach(file => {
			if (Arguments.printAssembly === true) {
				for (const [offset, opcode] of file.opcodes) {
					disasm.printOpcode(opcode);
				}
			}
		});
	})
	.catch(e => { console.error(e.stack || `[CUSTOM ERROR]: ${e}`); });
