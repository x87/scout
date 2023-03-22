import Log from 'utils/log';

import { GLOBAL_OPTIONS } from 'common/arguments';
import AppError from 'common/errors';
import { Graph } from './graph';

import * as Instruction from 'common/instructions';
import { IInstruction } from 'common/instructions';
import * as graphUtils from './graph-utils';
import { eBasicBlockType, eGame, eScriptType } from 'common/enums';
import { IBasicBlock, IScript } from 'common/interfaces';

export const OP_JMP = 0x0002;
const OP_JT = 0x004c;
export const OP_JF = 0x004d;
const OP_END = 0x004e;
const OP_CLEO_END = 0x0a93;
const OP_CALL = 0x004f;
const OP_GOSUB = 0x0050;
const OP_RETURN = 0x0051;
export const OP_NAME = 0x03a4;
export const OP_IF = 0x00d6;
const blockEndOpcodes = [OP_END, OP_CLEO_END, OP_RETURN];

const callOpcodes = [OP_GOSUB, OP_CALL];

const branchOpcodesMap: any = {
  [eGame.GTA3]: {
    [OP_JMP]: eBasicBlockType.ONE_WAY,
    [OP_IF]: eBasicBlockType.FALL,
    [OP_JF]: eBasicBlockType.TWO_WAY,
    // [OP_JT]: eBasicBlockType.TWO_WAY, // todo: different order of successor nodes
  },
  [eGame.GTAVC]: {
    [OP_JMP]: eBasicBlockType.ONE_WAY,
    [OP_IF]: eBasicBlockType.FALL,
    [OP_JF]: eBasicBlockType.TWO_WAY,
  },
  [eGame.GTASA]: {
    [OP_JMP]: eBasicBlockType.ONE_WAY,
    [OP_IF]: eBasicBlockType.FALL,
    [OP_JF]: eBasicBlockType.TWO_WAY,
  },
};

export default class CFG {
  getCallGraphs(
    script: IScript,
    allScripts: IScript[]
  ): Array<Graph<IBasicBlock>> {
    const functions: number[] = [
      script.instructionMap.keys().next().value,
      ...this.findFunctions(script),
    ];
    if (script.type === eScriptType.MAIN) {
      // some functions in MAIN are referenced only by missions/externals
      allScripts.forEach((s) => {
        if (s.type !== eScriptType.MAIN) {
          functions.push(...this.findGlobalFunctions(s, script));
        }
      });
    }
    const entries = [...new Set(functions)].sort();
    const basicBlocks = this.findBasicBlocks(script, entries);

    return entries.map((offset) => {
      return this.buildGraph(basicBlocks, offset, entries);
    });
  }

  private buildGraph(
    basicBlocks: IBasicBlock[],
    startOffset: number,
    entries: number[]
  ): Graph<IBasicBlock> {
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
      bb.start = startOffset;
      graph.addNode(bb);

      const lastInstruction = bb.instructions[bb.instructions.length - 1];

      bb.type = this.getBasicBlockType(lastInstruction);

      switch (bb.type) {
        case eBasicBlockType.RETURN:
          break;
        case eBasicBlockType.TWO_WAY:
        case eBasicBlockType.ONE_WAY: {
          // todo: argument could be a variable
          const targetOffset = Instruction.getNumericParam(lastInstruction);
          const targetOffsetAbs = Math.abs(targetOffset);
          const targetIndex = this.findBasicBlockIndex(
            basicBlocks,
            targetOffsetAbs
          );

          if (targetIndex === -1) {
            Log.warn(AppError.NO_BRANCH, targetOffset);
            return;
          }
          if (
            entries.includes(targetOffsetAbs) &&
            bb.start !== targetOffsetAbs
          ) {
            bb.type = eBasicBlockType.UNSTRUCTURED; // jump into another function
            break;
          }
          graph.addEdge(bb, basicBlocks[targetIndex]);
          traverse(targetIndex);
          if (bb.type === eBasicBlockType.ONE_WAY) break; // else fallthrough
        }
        case eBasicBlockType.FALL:
          graph.addEdge(bb, basicBlocks[index + 1]);
          traverse(index + 1);
          break;
        default:
          Log.warn(`${bb.type} is not implemented` as AppError);
      }
    };

    traverse(startIndex);
    // todo: add unvisited nodes as separate entries

    return this.patchSelfLoops(graphUtils.reversePostOrder(graph));
  }

  private findBasicBlocks(script: IScript, entries: number[]): IBasicBlock[] {
    let currentLeader = null;
    let instructions = [];
    const result: IBasicBlock[] = [];
    const leaderOffsets = [
      ...new Set(entries.concat(this.findLeaderOffsets(script))),
    ].sort((a, b) => a - b);

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

  private findGlobalFunctions(
    innerScript: IScript,
    mainScript: IScript
  ): number[] {
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

  private findFunctions(script: IScript): number[] {
    const res = [];
    for (const [offset, instruction] of script.instructionMap) {
      if (callOpcodes.includes(instruction.opcode)) {
        const targetOffset = Instruction.getNumericParam(instruction);
        if (targetOffset >= 0) {
          if (script.type !== eScriptType.MAIN) {
            continue;
          }
        } else {
          if (script.type === eScriptType.MAIN) {
            Log.warn(AppError.INVALID_REL_OFFSET, offset);
            continue;
          }
        }

        const absTargetOffset = Math.abs(targetOffset);
        const target = script.instructionMap.get(absTargetOffset);
        if (!target) {
          Log.warn(AppError.NO_TARGET, targetOffset, offset);
          continue;
        }
        res.push(absTargetOffset);
      }
    }
    return res;
  }

  private findLeaderOffsets(script: IScript): number[] {
    let doesThisFollowBranchInstruction = false;
    const offsets: number[] = [];
    for (const [offset, instruction] of script.instructionMap) {
      if (doesThisFollowBranchInstruction || offsets.length === 0) {
        offsets.push(offset);
      }

      if (blockEndOpcodes.includes(instruction.opcode)) {
        doesThisFollowBranchInstruction = true;
        continue;
      }

      doesThisFollowBranchInstruction = false;

      const branchType = this.getBranchType(instruction);
      if (!branchType) {
        continue;
      }

      if (branchType === eBasicBlockType.FALL) {
        offsets.push(offset);
        // doesThisFollowBranchInstruction = true;
        continue;
      }

      const targetOffset = Instruction.getNumericParam(instruction);
      const absTargetOffset = Math.abs(targetOffset);
      const target = script.instructionMap.get(absTargetOffset);

      if (!target) {
        Log.warn(AppError.NO_TARGET, targetOffset, offset);
        continue;
      }
      offsets.push(absTargetOffset);
      doesThisFollowBranchInstruction = true;
    }
    return offsets;
  }

  private createBasicBlock(
    instructions: IInstruction[],
    type: eBasicBlockType = eBasicBlockType.UNDEFINED
  ): IBasicBlock {
    return { type, instructions, start: undefined };
  }

  private findBasicBlockIndex(
    basicBlocks: IBasicBlock[],
    offset: number
  ): number | undefined {
    return basicBlocks.findIndex((bb) => bb.instructions[0].offset === offset);
  }

  private getBranchType(
    instruction: IInstruction
  ): eBasicBlockType | undefined {
    return branchOpcodesMap[GLOBAL_OPTIONS.game][instruction.opcode];
  }

  private getBasicBlockType(instruction: IInstruction): eBasicBlockType {
    const type = this.getBranchType(instruction);
    if (type) {
      return type;
    }
    if (blockEndOpcodes.includes(instruction.opcode)) {
      return eBasicBlockType.RETURN;
    }
    return eBasicBlockType.FALL;
  }

  // split self-loop blocks on two blocks to provide better analysis of the CFG
  private patchSelfLoops(graph: Graph<IBasicBlock>): Graph<IBasicBlock> {
    const selfLoopNodes = graph.nodes.filter((node) => {
      const successors = graph.getImmSuccessors(node);
      return successors.includes(node);
    });

    if (!selfLoopNodes.length) return graph;
    const newGraph = graphUtils.from(graph);
    selfLoopNodes.forEach((node: IBasicBlock) => {
      const newNode = this.createBasicBlock(
        node.instructions.slice(1),
        node.type
      );
      node.type = eBasicBlockType.FALL;
      node.instructions = [node.instructions[0]];
      const index = newGraph.getNodeIndex(node);
      newGraph.nodes.splice(index + 1, 0, newNode);
      newGraph.edges.forEach((edge) => {
        if (edge.from === node) edge.from = newNode;
      });
      newGraph.addEdge(node, newNode);
    });
    return newGraph;
  }
}
