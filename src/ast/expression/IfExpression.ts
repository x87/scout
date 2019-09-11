import Expression from './Expression';
import { IInstruction } from 'common/instructions';
import { IBasicBlock } from 'common/interfaces';

export default class IfExpression extends Expression {
  thenExpr: Expression[];
  elseExpr: Expression[];
  conditions: Expression[];

  constructor(
    instr: IInstruction,
    bb: IBasicBlock,
    conditions: Expression[],
    thenExpr: Expression[],
    elseExpr?: Expression[]
  ) {
    super(instr, bb);
    this.thenExpr = thenExpr;
    this.elseExpr = elseExpr;
    this.conditions = conditions;
  }
}
