import * as _ from 'lodash';
import Log from 'utils/log';

import Arguments from 'common/arguments';
import AppError from 'common/errors';
import Graph from './graph';

import { IInstruction, InstructionMap } from 'common/instructions';
import * as Instruction from 'common/instructions';
import { eBasicBlockType, eScriptType, eGame } from 'common/enums';
import { IBasicBlock, IScript } from 'common/interfaces';

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
		[OP_CALL]: eBasicBlockType.CALL,
		[OP_GOSUB]: eBasicBlockType.CALL
	},
	[eGame.GTAVC]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_CALL]: eBasicBlockType.CALL,
		[OP_GOSUB]: eBasicBlockType.CALL
	},
	[eGame.GTASA]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_CALL]: eBasicBlockType.CALL,
		[OP_GOSUB]: eBasicBlockType.CALL
	}
};

export default class CFG {

	getCallGraphs(script: IScript): Array<Graph<IBasicBlock>> {
		const entryOffset = script.instructionMap.keys().next().value;
		const entries = [entryOffset, ...this.findCallOffsets(script.instructionMap)];
		const basicBlocks = this.findBasicBlocks(script.instructionMap, script.type);

		return entries.map(offset => {
			return this.buildGraph(basicBlocks, offset);
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

	private buildGraph(basicBlocks: IBasicBlock[], startOffset: number): Graph<IBasicBlock> {
		const graph = new Graph<IBasicBlock>();

		const visited: boolean[] = [];
		const startIndex = this.findBasicBlockIndex(basicBlocks, startOffset);

		const traverse = (index: number): void => {
			if (visited[index]) return;
			visited[index] = true;

			const bb = basicBlocks[index];
			graph.nodes.push(bb);

			const lastInstruction = _.last(bb.instructions);

			bb.type = this.getBasicBlockType(lastInstruction);

			switch (bb.type) {
				case eBasicBlockType.RETURN:
					break;
				case eBasicBlockType.TWO_WAY:
					graph.addEdge(bb, basicBlocks[index + 1]);
					traverse(index + 1);
				case eBasicBlockType.ONE_WAY:
					const targetOffset = Instruction.getNumericParam(lastInstruction);
					const targetIndex = this.findBasicBlockIndex(basicBlocks, Math.abs(targetOffset));

					if (!targetIndex) {
						Log.warn(AppError.NO_BRANCH, targetOffset);
						return;
					}
					graph.addEdge(bb, basicBlocks[targetIndex]);
					traverse(targetIndex);
					break;
				case eBasicBlockType.CALL:
				case eBasicBlockType.FALL:
					graph.addEdge(bb, basicBlocks[index + 1]);
					traverse(index + 1);
					break;
				default:
					Log.warn(`${bb.type} is not implemented` as AppError);
			}

		};

		traverse(startIndex);
		return graph;
	}

	private findBasicBlocks(instructionMap: InstructionMap, scriptType: eScriptType): IBasicBlock[] {
		let currentLeader = null;
		let instructions = [];
		const result: IBasicBlock[] = [];
		const leaderOffsets = this.findLeaderOffsets(instructionMap, scriptType);
		if (leaderOffsets.length) {
			for (const [offset, instruction] of instructionMap) {
				if (leaderOffsets.includes(offset)) {
					if (currentLeader) {
						result.push(this.createBasicBlock(instructions));
					}
					currentLeader = instruction;
					instructions = [];
				}
				instructions.push(instruction);
			}
		}
		// add last bb in the file
		result.push(this.createBasicBlock(instructions));

		return result;
	}

	private findLeaderOffsets(instructionMap: InstructionMap, fileType: eScriptType): number[] {
		let isThisFollowBranchInstruction = false;
		const offsets: number[] = [];
		for (const [offset, instruction] of instructionMap) {

			if (isThisFollowBranchInstruction || offsets.length === 0) {
				offsets.push(offset);
			}

			if (blockEndOpcodes.includes(instruction.opcode)) {
				isThisFollowBranchInstruction = true;
				continue;
			}

			isThisFollowBranchInstruction = false;

			if (!this.getBranchType(instruction)) {
				continue;
			}

			const targetOffset = Instruction.getNumericParam(instruction);

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
			offsets.push(Math.abs(targetOffset));
			isThisFollowBranchInstruction = true;
		}
		return offsets;
	}

	private createBasicBlock(
		instructions: IInstruction[],
		type: eBasicBlockType = eBasicBlockType.UNDEFINED
	): IBasicBlock {
		return { type, instructions };
	}

	private findBasicBlockIndex(basicBlocks: IBasicBlock[], offset: number): number | undefined {
		return _.findIndex(basicBlocks, ['instructions[0].offset', offset]);
	}

	private getBranchType(instruction: IInstruction): eBasicBlockType | undefined {
		return branchOpcodesMap[Arguments.game][instruction.opcode];
	}

	private getBasicBlockType(instruction: IInstruction): eBasicBlockType {
		const type = this.getBranchType(instruction);
		if (type) return type;
		if (blockEndOpcodes.includes(instruction.opcode)) return eBasicBlockType.RETURN;
		return eBasicBlockType.FALL;
	}

	private findCallOffsets(instructionMap: InstructionMap): number[] {
		const res = [];
		for (const [offset, instruction] of instructionMap) {
			if (callOpcodes.includes(instruction.opcode)) {
				const targetOffset = Instruction.getNumericParam(instruction);
				res.push(Math.abs(targetOffset));
			}
		}
		return res;
	}
}
