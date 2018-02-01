import * as _ from 'lodash';
import Graph from 'frontend/cfg/graph';
import AppError from 'common/errors';
import Log from 'utils/log';

import Expression from './Expression';
import IfExpression from './IfExpression';
import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

const ifOp = 0x00D6;

export default class FunctionExpression {
	expressions: Expression[];
	name: string;

	constructor(graph: Graph<IBasicBlock>) {
		// this.name = this.getName(graph.nodes);
		// this.expressions = [];
		// const visited: boolean[] = [];
		// const exitStack = [];
		//
		// const traverse = (from: IBasicBlock): Expression[] => {
		// 	const index = graph.getNodeIndex(from);
		// 	if (visited[index]) return [];
		// 	const bb = graph.nodes[index];
		// 	if (_.last(exitStack) === bb) {
		// 		exitStack.pop();
		// 		return [];
		// 	}
		// 	visited[index] = true;
		//
		// 	const exprMap = instr => new Expression(instr, bb);
		//
		// 	switch (bb.type) {
		// 		case eBasicBlockType.ONE_WAY: {
		// 			const [nextNode] = graph.getImmSuccessors(bb);
		// 			return traverse(nextNode);
		// 		}
		// 		case eBasicBlockType.TWO_WAY: {
		// 			const ifOpIndex = _.findIndex(bb.instructions, ['opcode', ifOp]);
		//
		// 			const expressions = bb.instructions.slice(0, ifOpIndex).map(exprMap);
		// 			const ifPart = bb.instructions.slice(ifOpIndex, -1);
		//
		// 			const ifInstr = ifPart[0];
		// 			const conditions = ifPart.slice(1).map(exprMap);
		//
		// 			const [thenNode, elseNode] = graph.getImmSuccessors(bb);
		//
		// 			exitStack.push(elseNode);
		// 			const thenExpr = traverse(thenNode);
		// 			const elseExpr = traverse(elseNode);
		//
		// 			const lastThen = _.last(thenExpr);
		// 			const lastElse = _.last(elseExpr);
		//
		// 			console.log(lastThen, lastElse);
		// 			const commonNode = graph.findCommonSuccessor(lastThen.bb, lastElse.bb);
		// 			if (commonNode) {
		// 				const ifExpr = new IfExpression(ifInstr, bb, conditions, thenExpr, elseExpr);
		// 				return [...expressions, ifExpr, ...traverse(commonNode)];
		// 			} else {
		// 				const ifExpr = new IfExpression(ifInstr, bb, conditions, thenExpr);
		// 				return [...expressions, ifExpr, ...traverse(elseNode)];
		// 			}
		//
		// 		}
		// 		case eBasicBlockType.CALL:
		// 		case eBasicBlockType.FALL: {
		// 			const expressions = bb.instructions.map(exprMap);
		// 			const [targetBB] = graph.getImmSuccessors(bb);
		// 			return [...expressions, ...traverse(targetBB)];
		// 		}
		// 		case eBasicBlockType.RETURN:
		// 			return bb.instructions.map(exprMap);
		// 		default:
		// 			throw Log.error(AppError.INVALID_BB_TYPE, bb.type);
		// 	}
		// };
		// this.expressions = traverse(graph.root);
	}

	private getName(content: IBasicBlock[]): string {
		return `fn_${content[0].instructions[0].offset}`;
	}

}
