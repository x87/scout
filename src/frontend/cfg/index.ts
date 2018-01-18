import * as _ from 'lodash';
import * as utils from 'utils';
import Log from 'utils/log';

import Arguments from 'common/arguments';
import AppError from 'common/errors';
import LoopService from 'frontend/loops/service';

import { IBasicBlock, IScript, IInstruction, BasicBlockMap, InstructionMap } from 'common/interfaces';
import { eBasicBlockType, eScriptType, eGame } from 'common/enums';

const OP_JMP = 0x0002;
const OP_JT = 0x004c;
const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
const blockEndOpcodes = [OP_END, OP_RETURN];

// https://github.com/x87/scout.js/issues/3
// todo: refactor building flow graph on per-function basic, not per-file
// each call opcode must create a new subgraph
// isHeaderBlock is true for the first bb in each subgraph
// file start with main function and first subgraph

const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: any = {
	// 'call' opcodes (gosub, start_new_script, etc, is not included as they always have to return back
	[eGame.GTA3]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_JT]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTAVC]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTASA]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_JF]: eBasicBlockType.TWO_WAY
	}
};

export default class CFG {

	constructor(files: IScript[]) {
		// https://github.com/x87/scout.js/issues/3
		// todo: split by functions
		files.map(file => {
			const intervals = this.findIntervalsInFile(file);
			intervals.forEach(interval => this.findLoops(interval));
		});
	}

	findIntervalsInFile(file: IScript): IBasicBlock[][] {
		const opcodes = this.findLeadersForFile(file.instructionMap, file.type);
		const basicBlocks = this.findUnreachableBlocks(
			this.linkBasicBlocks(
				this.findBasicBlocksForFile(opcodes)
			)
		);
		return this.findIntervals(basicBlocks);
	}

	private findLoops(interval: IBasicBlock[]): void {
		const head = _.head(interval);

		const latchingNode = _.chain(interval)
			.intersection(head.predecessors)
			.head()
			.value();

		if (latchingNode) {
			const loopType = LoopService.findLoopType(head, latchingNode);
			this.findLoopNodes(interval, head, latchingNode);
		}
	}

	private findLoopNodes(interval: IBasicBlock[], head: IBasicBlock, latchingNode: IBasicBlock): void {

		const start = _.findIndex(interval, head);
		const end = _.findIndex(interval, latchingNode);
		const nodes = _.slice(interval, start, end - start + 1);

		_.each(nodes, node => {
			if (node.inLoop) {
				console.log('node already in a loop');
			}
			node.inLoop = true;
		});
	}

	private findIntervals(basicBlocks: BasicBlockMap): IBasicBlock[][] {

		if (!basicBlocks.size) {
			return;
		}
		const headers = [basicBlocks.values().next().value];
		const intervals = [];
		while (headers.length) {
			const header: IBasicBlock = headers.shift();
			header.processed = true;

			const interval: IBasicBlock[] = [header];

			basicBlocks.forEach((bb: IBasicBlock) => {
				if (bb.processed) return;
				if (!_.includes(interval, bb) && utils.checkArrayIncludesArray(interval, bb.predecessors)) {
					interval.push(bb);
					bb.processed = true;
				}
			});
			basicBlocks.forEach((bb: IBasicBlock) => {
				if (bb.processed) return;
				if (!_.includes(interval, bb) && utils.checkArrayIncludeItemFromArray(interval, bb.predecessors)) {
					headers.push(bb);
				}
			});
			intervals.push(interval);
		}

		return intervals;
	}

	private findUnreachableBlocks(basicBlocks: BasicBlockMap): BasicBlockMap {
		let unreachableFound;
		do {
			unreachableFound = false;
			basicBlocks.forEach((bb: IBasicBlock, key) => {
				if (bb.isHeaderBlock) {
					return;
				}

				if (bb.predecessors.length > 0) {
					return;
				}

				bb.successors.forEach((successor: IBasicBlock) => {
					successor.predecessors.splice(successor.predecessors.indexOf(bb), 1);
				});

				basicBlocks.delete(key);
				unreachableFound = true;

				Log.warn(AppError.UNREACHABLE_BRANCH, bb.instructions[0].offset);
			});
		} while (unreachableFound);

		return basicBlocks;
	}

	private linkBasicBlocks(basicBlocks: BasicBlockMap): BasicBlockMap {
		let prevBBtoLink = null;
		for (const [offset, bb] of basicBlocks) {

			if (prevBBtoLink) {
				this.setBasicBlockSuccessor(prevBBtoLink, bb);
				prevBBtoLink = null;
			}

			const lastOpcode = _.last(bb.instructions);
			const branchType = branchOpcodesMap[Arguments.game][lastOpcode.opcode];

			if (!branchType) {
				bb.type = eBasicBlockType.FALL_THRU;
				prevBBtoLink = bb;
				continue;
			}

			bb.type = branchType;

			if (bb.type === eBasicBlockType.TWO_WAY) {
				prevBBtoLink = bb;
			}

			if (bb.type === eBasicBlockType.N_WAY) {
				// todo; set links to switch cases
			}

			let targetOffset;
			targetOffset = this.getInstructionTargetOffset(lastOpcode);

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

			const targetBB = basicBlocks.get(Math.abs(targetOffset));

			if (!targetBB) {
				Log.warn(AppError.NO_BRANCH, targetOffset);
				break;
			}
			this.setBasicBlockSuccessor(bb, targetBB);

		}

		return basicBlocks;
	}

	private findBasicBlocksForFile(instructionMap: InstructionMap): BasicBlockMap {
		let currentLeader = null;
		let bbOpcodes = [];
		const basicBlocks = new Map();
		for (const [offset, instruction] of instructionMap) {
			if (instruction.isLeader) {
				if (currentLeader) {
					basicBlocks.set(currentLeader.offset, this.createBasicBlock(bbOpcodes));
				}
				currentLeader = instruction;
				bbOpcodes = [];
			}
			bbOpcodes[bbOpcodes.length] = instruction;
		}
		// add last bb in the file
		basicBlocks.set(currentLeader.offset, this.createBasicBlock(bbOpcodes));

		return basicBlocks;
	}

	private findLeadersForFile(instructionMap: InstructionMap, fileType: eScriptType): InstructionMap {
		let isThisFollowBranchInstruction = false;
		for (const [offset, instruction] of instructionMap) {

			instruction.isLeader = instruction.isLeader || isThisFollowBranchInstruction;

			if (blockEndOpcodes.indexOf(instruction.opcode) !== -1) {
				isThisFollowBranchInstruction = true;
				continue;
			}

			isThisFollowBranchInstruction = false;

			const branchType = branchOpcodesMap[Arguments.game][instruction.opcode];
			if (!branchType) {
				continue;
			}

			const targetOffset = this.getInstructionTargetOffset(instruction);

			if (targetOffset < 0 && fileType !== eScriptType.HEADLESS) {
				throw Log.error(AppError.INVALID_REL_OFFSET, offset);
			}
			if (targetOffset >= 0 && fileType === eScriptType.HEADLESS) {
				// todo: gosubs with positive offsets in headless files are allowed
				throw Log.error(AppError.INVALID_ABS_OFFSET, offset);
			}
			const target: IInstruction = instructionMap.get(Math.abs(targetOffset));
			if (!target) {
				Log.warn(AppError.NO_TARGET, offset);
				continue;
			}
			target.isLeader = true;

			// https://github.com/x87/scout.js/issues/3
			// todo: refactor graphs on per-function and remove this
			target.isHeader = callOpcodes.indexOf(instruction.opcode) !== -1;

			isThisFollowBranchInstruction = callOpcodes.indexOf(instruction.opcode) === -1;
		}
		return instructionMap;
	}

	private createBasicBlock(instructions: IInstruction[]): IBasicBlock {
		return {
			type: eBasicBlockType.UNDEFINED,
			instructions,
			predecessors: [],
			successors: [],
			processed: false,
			inLoop: false,

			// https://github.com/x87/scout.js/issues/3
			// todo: true for the first bb in subgraph
			isHeaderBlock: instructions[0].isHeader
		};
	}

	private getInstructionTargetOffset(instruction: IInstruction): number {
		return Number(instruction.params[0].value);
	}

	private setBasicBlockSuccessor(bb: IBasicBlock, target: IBasicBlock): void {
		bb.successors.push(target);
		target.predecessors.push(bb);
	}

}
