import * as _ from 'lodash';
import Log from 'utils/log';

import Arguments from 'common/arguments';
import AppError from 'common/errors';

import { IBasicBlock, IScript, IInstruction, InstructionMap } from 'common/interfaces';
import { eBasicBlockType, eScriptType, eGame, eParamType } from 'common/enums';
import { IInstructionBranch } from 'common/interfaces';
import Graph from './graph';

const OP_JMP = 0x0002;
const OP_JT = 0x004c;
const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
const blockEndOpcodes = [OP_END, OP_RETURN];

const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: any = {
	[eGame.GTA3]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_JT]: eBasicBlockType.TWO_WAY,
		[OP_CALL]: eBasicBlockType.FALL_THRU,
		[OP_GOSUB]: eBasicBlockType.FALL_THRU
	},
	[eGame.GTAVC]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_CALL]: eBasicBlockType.FALL_THRU,
		[OP_GOSUB]: eBasicBlockType.FALL_THRU
	},
	[eGame.GTASA]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_CALL]: eBasicBlockType.FALL_THRU,
		[OP_GOSUB]: eBasicBlockType.FALL_THRU
	}
};

export default class CFG {

	getGraphs(script: IScript): Array<Graph<IBasicBlock>> {
		const entryOffset = script.instructionMap.keys().next().value;
		const functions = [entryOffset, ...this.findFunctions(script.instructionMap)];
		const basicBlocks = this.findBasicBlocks(script.instructionMap, script.type);
		const graph = this.buildGraph(basicBlocks);

		return functions.map(offset => {
			const root = this.findBasicBlockWithOffset(graph.nodes, offset);
			const subgraph = graph.extractGraph(root);
			return subgraph;
		});
	}

	// private findLoops(interval: IBasicBlock[]): void {
	// 	const head = _.head(interval);
	//
	// 	const latchingNode = _.chain(interval)
	// 		.intersection(head.predecessors)
	// 		.head()
	// 		.value();
	//
	// 	if (latchingNode) {
	// 		const loopType = LoopService.findLoopType(head, latchingNode);
	// 		this.findLoopNodes(interval, head, latchingNode);
	// 	}
	// }

	// private findLoopNodes(interval: IBasicBlock[], head: IBasicBlock, latchingNode: IBasicBlock): void {
	//
	// 	const start = _.findIndex(interval, head);
	// 	const end = _.findIndex(interval, latchingNode);
	// 	const nodes = _.slice(interval, start, end - start + 1);
	//
	// 	_.each(nodes, node => {
	// 		if (node.inLoop) {
	// 			console.log('node already in a loop');
	// 		}
	// 		node.inLoop = true;
	// 	});
	// }

	// private findIntervals(basicBlocks: BasicBlockMap): IBasicBlock[][] {
	//
	// 	if (!basicBlocks.size) {
	// 		return;
	// 	}
	// 	const headers = [basicBlocks.values().next().value];
	// 	const intervals = [];
	// 	while (headers.length) {
	// 		const header: IBasicBlock = headers.shift();
	// 		header.processed = true;
	//
	// 		const interval: IBasicBlock[] = [header];
	//
	// 		basicBlocks.forEach((bb: IBasicBlock) => {
	// 			if (bb.processed) return;
	// 			if (!interval.includes(bb) && utils.checkArrayIncludesArray(interval, bb.prev)) {
	// 				interval.push(bb);
	// 				bb.processed = true;
	// 			}
	// 		});
	// 		basicBlocks.forEach((bb: IBasicBlock) => {
	// 			if (bb.processed) return;
	// 			if (!interval.includes(bb) && utils.checkArrayIncludeItemFromArray(interval, bb.prev)) {
	// 				headers.push(bb);
	// 			}
	// 		});
	// 		intervals.push(interval);
	// 	}
	//
	// 	return intervals;
	// }

	private buildGraph(basicBlocks: IBasicBlock[]): Graph<IBasicBlock> {
		const graph = new Graph<IBasicBlock>(basicBlocks, []);

		let prevBBtoLink = null;
		basicBlocks.forEach(bb => {
			if (prevBBtoLink) {
				graph.addEdge(prevBBtoLink, bb);
				prevBBtoLink = null;
			}

			const lastInstruction = _.last(bb.instructions);

			if (!this.isBranchInstruction(lastInstruction)) {
				if (!blockEndOpcodes.includes(lastInstruction.opcode)) {
					bb.type = eBasicBlockType.FALL_THRU;
					prevBBtoLink = bb;
				}
				return;
			}

			bb.type = this.getBranchType(lastInstruction);

			if (bb.type === eBasicBlockType.FALL_THRU) {
				prevBBtoLink = bb;
				// call opcodes does not create an edge to target offset
				return;
			}

			if (bb.type === eBasicBlockType.TWO_WAY) {
				prevBBtoLink = bb;
			}

			if (bb.type === eBasicBlockType.N_WAY) {
				// todo; set links to switch cases
			}

			let targetOffset;
			targetOffset = this.getTargetOffset(lastInstruction);

			// eliminate jump-to-jump transitions
			/*while (true) {
				targetOffset = this.getOpcodeTargetOffset(lastOpcode);

				// check if we got a number, including 0.
				if (!isFinite(targetOffset)) {
					break;
				}
				lastOpcode = opcodes.get(Math.abs(targetOffset));
				if (!lastOpcode || lastOpcode.id !== OP_JMP) {
					break;
				}
			}*/

			const targetBB = this.findBasicBlockWithOffset(basicBlocks, Math.abs(targetOffset));

			if (!targetBB) {
				Log.warn(AppError.NO_BRANCH, targetOffset);
				return;
			}

			graph.addEdge(bb, targetBB);

		});

		return graph;
	}

	private findBasicBlocks(instructionMap: InstructionMap, scriptType: eScriptType): IBasicBlock[] {
		let currentLeader = null;
		let instructions = [];
		const result: IBasicBlock[] = [];
		const leaders = this.findLeaders(instructionMap, scriptType);
		for (const [offset, instruction] of instructionMap) {
			if (leaders.includes(instruction)) {
				if (currentLeader) {
					result.push(this.createBasicBlock(instructions));
				}
				currentLeader = instruction;
				instructions = [];
			}
			instructions.push(instruction);
		}
		// add last bb in the file
		result.push(this.createBasicBlock(instructions));

		return result;
	}

	private findLeaders(instructionMap: InstructionMap, fileType: eScriptType): IInstruction[] {
		let isThisFollowBranchInstruction = false;
		const leaders: IInstruction[] = [];
		for (const [offset, instruction] of instructionMap) {

			if (isThisFollowBranchInstruction || leaders.length === 0) {
				leaders.push(instruction);
			}

			if (blockEndOpcodes.includes(instruction.opcode)) {
				isThisFollowBranchInstruction = true;
				continue;
			}

			isThisFollowBranchInstruction = false;

			if (!this.isBranchInstruction(instruction)) {
				continue;
			}

			const targetOffset = this.getTargetOffset(instruction);

			if (targetOffset < 0 && fileType !== eScriptType.HEADLESS) {
				throw Log.error(AppError.INVALID_REL_OFFSET, offset);
			}
			if (targetOffset >= 0 && fileType === eScriptType.HEADLESS) {
				// todo: gosubs with positive offsets in headless files are allowed
				throw Log.error(AppError.INVALID_ABS_OFFSET, offset);
			}
			const target = instructionMap.get(Math.abs(targetOffset));
			if (!target) {
				Log.warn(AppError.NO_TARGET, offset);
				continue;
			}
			leaders.push(target);
			isThisFollowBranchInstruction = true;
		}
		return leaders;
	}

	private createBasicBlock(instructions: IInstruction[]): IBasicBlock {
		return {
			type: eBasicBlockType.DEAD_END,
			instructions
		};
	}

	private getTargetOffset(instruction: IInstructionBranch): number {
		return Number(instruction.params[0].value);
	}

	private findBasicBlockWithOffset(basicBlocks: IBasicBlock[], offset: number): IBasicBlock | undefined {
		return _.find(basicBlocks, ['instructions[0].offset', offset]);
	}

	private isBranchInstruction(instruction: IInstruction): instruction is IInstructionBranch {
		return this.getBranchType(instruction) && instruction.params[0].type === eParamType.NUM32;
	}

	private getBranchType(instruction: IInstruction): eBasicBlockType {
		return branchOpcodesMap[Arguments.game][instruction.opcode];
	}

	private findFunctions(instructionMap: InstructionMap): number[] {
		const res = [];
		for (const [offset, instruction] of instructionMap) {
			if (callOpcodes.includes(instruction.opcode) && this.isBranchInstruction(instruction)) {
				res.push(this.getTargetOffset(instruction));
			}
		}
		return res;
	}
}
