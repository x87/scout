import { IInstruction } from 'common/instructions';
import Graph, { GraphNode } from 'frontend/cfg/graph';
import { IBasicBlock } from 'common/interfaces';
import { LoopGraph } from 'frontend/cfg/loop-utils';
import { IfGraph } from 'frontend/cfg/conditions-utils';
import { eLoopType } from 'common/enums';
import { OP_JF, OP_IF } from 'frontend/cfg';

type Statement = IfStatement | LoopStatement | InstructionStatement;

interface InstructionStatement {
  type: 'instruction';
  body: IInstruction;
}

type LoopStatement = PreTestedLoop | PostTestedLoop | EndlessLoop;

interface PreTestedLoop {
  type: 'pre_tested';
  condition: LogicalExpr;
  body: Statement[];
}

interface PostTestedLoop {
  type: 'post_tested';
  condition: LogicalExpr;
  body: Statement[];
}

interface EndlessLoop {
  type: 'endless';
  body: Statement[];
}

interface IfStatement {
  type: 'if_statement';
  condition: LogicalExpr;
  then: Statement[];
  else?: Statement[];
}

interface LogicalExpr {
  type: 'and_expr' | 'or_expr' | 'single';
  body: InstructionStatement[];
}

interface FnExpression {
  type: 'function';
  name: string;
  body: Statement[];
}

interface Program {
  name: string;
  body: FnExpression[];
}

export class AST {
  constructor(public program: Program) {}

  static transform(graph: Graph<GraphNode<IBasicBlock>>): Statement[] {
    return graph.nodes.flatMap((bb) => {
      if (bb instanceof LoopGraph) {
        const body = AST.transform(bb);
        switch (bb.type) {
          case eLoopType.PRE_TESTED: {
            const condition = [];
            for (const inst of body) {
              if (inst.type !== 'instruction' || inst.body.opcode === OP_JF) {
                break;
              }
              condition.push(inst);
            }
            return {
              type: 'pre_tested',
              condition: {
                type: 'single', // todo
                body: condition,
              },
              body,
            };
          }
          case eLoopType.POST_TESTED: {
            const condition: LogicalExpr = { type: 'single', body: [] };
            const lastInst = body[body.length - 1];

            if (
              lastInst.type === 'instruction' &&
              lastInst.body.opcode === OP_JF
            ) {
              // Max conditions
              let n = body.length - 1;
              let maxCondition = 8;
              let hasIf = false;
              while (n > 0 && maxCondition) {
                const inst = body[n - 1];
                if (inst.type !== 'instruction') {
                  break;
                }
                if (inst.body.opcode === OP_IF) {
                  const numCond = inst.body.params[0].value;
                  condition.type =
                    numCond > 20
                      ? 'or_expr'
                      : numCond > 0
                      ? 'and_expr'
                      : 'single';
                  hasIf = true;
                  break;
                }
                if (inst.body.opcode === OP_JF) {
                  break;
                }

                condition.body.push(inst);
                n--;
                maxCondition--;
              }
              // if no 00d6 found within 8 instructions range consider this a single if-less statement
              if (!hasIf) {
                condition.body.length = Math.min(condition.body.length, 1);
              }
              // remove loop condition from loop body
              body.splice(
                body.length - 1 - condition.body.length - (hasIf ? 1 : 0),
                body.length
              );
            }

            return {
              type: 'post_tested',
              condition,
              body,
            };
          }
          case eLoopType.ENDLESS: {
            return {
              type: 'endless',
              body,
            };
          }
        }
      } else if (bb instanceof IfGraph) {
        return {
          type: 'if_statement',
          condition: {
            type: 'single', // todo
            body: bb.nodes[0],
          },
          then: AST.transform(bb.thenNode),
          else: bb.elseNode ? AST.transform(bb.elseNode) : undefined,
        };
      }
      return (bb as IBasicBlock).instructions.map((i) => ({
        type: 'instruction',
        body: i,
      })) as Statement[];
    });
  }
}
