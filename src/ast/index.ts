import Graph from 'frontend/cfg/graph';
import FunctionExpression from './expression/FunctionExpression';
import { IBasicBlock } from 'common/interfaces';

interface IAST {
	functions: FunctionExpression[];
}

export default class AST {
	program: IAST;

	constructor(private graphs: Array<Graph<IBasicBlock>>) {
		this.program = {
			functions: graphs.map(graph => new FunctionExpression(graph))
		};

	}
}
