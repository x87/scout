import Log from 'utils/Log';
import Arguments from 'common/arguments';
import Disassembler from 'frontend/Disassembler';
import Loader from 'frontend/Loader';
import ControlFlowProcessor from 'frontend/ControlFlowProcessor';
import AppError from 'common/errors';

if (!Arguments.inputFile) {
	throw Log.error(AppError.NO_INPUT);
}

const disasm = new Disassembler();
const loader = new Loader();

loader.loadScript(Arguments.inputFile)
	.then(scriptFile => disasm.disassemble(scriptFile))
	.then(scripts => {
		const CFG = new ControlFlowProcessor();
		CFG.buildCFG(scripts);
		return scripts;
	})
	.then(scripts => {
		scripts.forEach(script => {
			if (Arguments.printAssembly === true) {
				for (const [offset, opcode] of script.opcodes) {
					disasm.printOpcode(opcode);
				}
			}
		});
	})
	.catch(e => { console.error(e.stack || `[CUSTOM ERROR]: ${e}`); });
