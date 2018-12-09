import * as _ from 'lodash';
import Log from 'utils/log';

import Arguments from 'common/arguments';
import AppError from 'common/errors';
import Graph from './graph';

import * as Instruction from 'common/instructions';
import { IInstruction } from 'common/instructions';
import * as graphUtils from './graph-utils';
import { eBasicBlockType, eGame, eScriptType } from 'common/enums';
import { IBasicBlock, IScript } from 'common/interfaces';

const OP_JMP = 0x0002;
const OP_JT = 0x004c;
const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
const OP_IF = 0x00d6;
const blockEndOpcodes = [OP_END, OP_RETURN];

const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: any = {
	[eGame.GTA3]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_IF]: eBasicBlockType.FALL,
		[OP_JF]: eBasicBlockType.TWO_WAY,
		[OP_JT]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTAVC]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_IF]: eBasicBlockType.FALL,
		[OP_JF]: eBasicBlockType.TWO_WAY
	},
	[eGame.GTASA]: {
		[OP_JMP]: eBasicBlockType.ONE_WAY,
		[OP_IF]: eBasicBlockType.FALL,
		[OP_JF]: eBasicBlockType.TWO_WAY
	}
};

export default class CFG {

	getCallGraphs(script: IScript): Array<Graph<IBasicBlock>> {
		const entryOffset = script.instructionMap.keys().next().value;

		// extract external calls from child scripts (for ScriptMultifile)
		const functions: number[] = [];
		if (script.innerScripts) {
			for (const innerScript of script.innerScripts) {
				functions.push(...this.findGlobalFunctions(innerScript, script));
			}
			functions.push(...this.findGlobalFunctions(script, script));
		} else {
			functions.push(...this.findLocalFunctions(script));
		}
		const entries = _.chain<number[]>([])
			.concat(entryOffset, functions)
			.uniq()
			.sortBy()
			.value();
		const basicBlocks = this.findBasicBlocks(script, entries);

		return entries.map(offset => {
			return this.buildGraph(basicBlocks, offset);
		});
	}

	private buildGraph(basicBlocks: IBasicBlock[], startOffset: number): Graph<IBasicBlock> {
		const graph = new Graph<IBasicBlock>();

		const visited: boolean[] = [];
		const startIndex = this.findBasicBlockIndex(basicBlocks, startOffset);

		if (startIndex === -1) {
			Log.warn(AppError.NO_BRANCH, startOffset);
			return;
		}

		const traverse = (index: number): void => {
			if (visited[index]) return;
			visited[index] = true;

			const bb = basicBlocks[index];
			graph.addNode(bb);

			const lastInstruction = _.last(bb.instructions);

			bb.type = this.getBasicBlockType(lastInstruction);

			switch (bb.type) {
				case eBasicBlockType.RETURN:
					break;
				case eBasicBlockType.TWO_WAY:
				case eBasicBlockType.ONE_WAY:
					const targetOffset = Instruction.getNumericParam(lastInstruction);
					const targetIndex = this.findBasicBlockIndex(basicBlocks, Math.abs(targetOffset));

					if (targetIndex === -1) {
						Log.warn(AppError.NO_BRANCH, targetOffset);
						return;
					}
					graph.addEdge(bb, basicBlocks[targetIndex]);
					traverse(targetIndex);
					if (bb.type === eBasicBlockType.ONE_WAY) break;
				case eBasicBlockType.FALL:
					graph.addEdge(bb, basicBlocks[index + 1]);
					traverse(index + 1);
					break;
				default:
					Log.warn(`${bb.type} is not implemented` as AppError);
			}

		};

		traverse(startIndex);
		return this.patchSelfLoops(graphUtils.reversePostOrder(graph));
	}

	private findBasicBlocks(script: IScript, entries: number[]): IBasicBlock[] {
		let currentLeader = null;
		let instructions = [];
		const result: IBasicBlock[] = [];
		const leaderOffsets = _.chain([])
			.concat(entries, this.findLeaderOffsets(script))
			.uniq()
			.sortBy()
			.value();

		if (leaderOffsets.length) {
			for (const [offset, instruction] of script.instructionMap) {
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

	private findGlobalFunctions(innerScript: IScript, mainScript: IScript): number[] {
		const res = [];
		for (const [offset, instruction] of innerScript.instructionMap) {
			if (callOpcodes.includes(instruction.opcode)) {
				const targetOffset = Instruction.getNumericParam(instruction);
				if (targetOffset >= 0) {
					const target = mainScript.instructionMap.get(targetOffset);
					if (!target) {
						Log.warn(AppError.NO_TARGET, targetOffset, offset);
						continue;
					}
					res.push(targetOffset);
				}
			}
		}
		return res;
	}

	private findLocalFunctions(script: IScript): number[] {
		const res = [];
		for (const [offset, instruction] of script.instructionMap) {
			if (callOpcodes.includes(instruction.opcode)) {
				const targetOffset = Instruction.getNumericParam(instruction);
				if (targetOffset < 0) {
					const absTargetOffset = Math.abs(targetOffset);
					const target = script.instructionMap.get(absTargetOffset);
					if (!target) {
						Log.warn(AppError.NO_TARGET, targetOffset, offset);
						continue;
					}
					res.push(absTargetOffset);
				}
			}
		}
		return res;
	}

	private findLeaderOffsets(script: IScript): number[] {
		let isThisFollowBranchInstruction = false;
		const offsets: number[] = [];
		for (const [offset, instruction] of script.instructionMap) {

			if (isThisFollowBranchInstruction || offsets.length === 0) {
				offsets.push(offset);
			}

			if (blockEndOpcodes.includes(instruction.opcode)) {
				isThisFollowBranchInstruction = true;
				continue;
			}

			isThisFollowBranchInstruction = false;

			const branchType = this.getBranchType(instruction);
			if (!branchType) {
				continue;
			}

			if (branchType === eBasicBlockType.FALL) {
				offsets.push(offset);
				isThisFollowBranchInstruction = true;
				continue;
			}

			const targetOffset = Instruction.getNumericParam(instruction);
			if (targetOffset < 0 && script.type !== eScriptType.HEADLESS) {
				throw Log.error(AppError.INVALID_REL_OFFSET, offset);
			}

			if (targetOffset >= 0 && script.type === eScriptType.HEADLESS) {
				throw Log.error(AppError.INVALID_ABS_OFFSET, offset);
			}

			const absTargetOffset = Math.abs(targetOffset);
			const target = script.instructionMap.get(absTargetOffset);
			if (!target) {
				Log.warn(AppError.NO_TARGET, targetOffset, offset);
				continue;
			}
			offsets.push(absTargetOffset);
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

	// split self-loop blocks on two blocks to provide better analyze of the CFG
	private patchSelfLoops(graph: Graph<IBasicBlock>): Graph<IBasicBlock> {
		const selfLoopNodes = graph.nodes.filter((node) => {
			const successors = graph.getImmSuccessors(node);
			return successors.includes(node);
		});

		if (!selfLoopNodes.length) return graph;
		const newGraph = graphUtils.from(graph);
		selfLoopNodes.forEach((node: IBasicBlock) => {
			const newNode = this.createBasicBlock(_.drop(node.instructions), node.type);
			node.type = eBasicBlockType.FALL;
			node.instructions = [node.instructions[0]];
			const index = newGraph.getNodeIndex(node);
			newGraph.nodes.splice(index + 1, 0, newNode);
			newGraph.edges.forEach(edge => {
				if (edge.from === node) edge.from = newNode;
			});
			newGraph.addEdge(node, newNode);
		});
		return newGraph;
	}
}
