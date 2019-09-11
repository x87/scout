import Graph from 'frontend/cfg/graph';
import FunctionExpression from './expression/FunctionExpression';

interface IAST {
  functions: FunctionExpression[];
}

export default class AST {
  program: IAST;

  constructor(private programGraph: Graph<any>) {}
}
