import Log from 'utils/log';
import Arguments from 'common/arguments';
import Disassembler from 'frontend/disassembler';
import Loader from 'frontend/loader';
import CFG from 'frontend/cfg';
import AppError from 'common/errors';
import SimplePrinter from './utils/simple-printer';

export async function main() {

	try {
		if (!Arguments.inputFile) {
			throw Log.error(AppError.NO_INPUT);
		}

		const disasm = new Disassembler();
		const loader = new Loader();
		const scriptFile = await loader.loadScript(Arguments.inputFile);
		const scripts = await disasm.disassemble(scriptFile);
		const graph = new CFG(scripts);
		scripts.forEach(async script => {
			if (Arguments.printAssembly === true) {
				const definitionMap = await Disassembler.getDefinitions();
				const printer = new SimplePrinter(definitionMap);
				for (const [offset, instruction] of script.instructionMap) {
					printer.print(instruction);
				}
			}
		});
	} catch (e) {
		console.error(e.stack || `[CUSTOM ERROR]: ${e}`);
	}
}
