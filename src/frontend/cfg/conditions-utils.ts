import * as graphUtils from './graph-utils';
import  { Graph, GraphNode, IfGraph, LoopGraph } from './graph';
import { eIfType } from 'common/enums';
import Log from '../../utils/log';
import AppError from '../../common/errors';


export function getIfType<Node>(
  graph: Graph<Node>,
  ifHeader: Node,
  followNode: GraphNode<Node>
): eIfType {
  const headerSuccessors = graph.getImmSuccessors(ifHeader);
  return headerSuccessors.includes(followNode)
    ? eIfType.IF_THEN
    : eIfType.IF_THEN_ELSE;
}

export function structure<Node>(graph: Graph<Node>): Graph<GraphNode<Node>> {
  const twoWayNodes = graph.nodes.filter((node) => {
    if (node instanceof IfGraph || node instanceof LoopGraph) return false;
    const successors = graph.getImmSuccessors(node);
    return successors.length === 2;
  }) as Node[];

  if (twoWayNodes.length === 0) return graph;

  let res = graphUtils.from(graph);
  const findFollowNode = (header: Node): GraphNode<Node> => {
    const pdom = graphUtils.findIPDom(res);
    const index = res.getNodeIndex(header);

    if (pdom[index]) return pdom[index];

    /*
			once we reach this point we must have found a IF..THEN construct
			and the flow graph has an exit node in its THEN clause

			if (cond) {
				exit
			}

			the follow node must be determined as the target of the JF instruction

			IF..THEN..ELSE.. construct could not be there as
			the compiler must put a JMP instruction between THEN and ELSE clauses
			meaning the flow won't interrupt here

			it could be possible a follow node is not found
			when IF is the last instruction of a script
			but this is a malformed script and not covered by the decompiler yet

		*/

    const succ = res.getImmSuccessors(header);
    return succ[0];
  };
  const replaceIf = (header: Node, followNode: GraphNode<Node>): void => {
    const ifGraph = new IfGraph<Node>();
    ifGraph.followNode = followNode;
    const ifType = getIfType(res, header, followNode);
    const ifHeaderSuccessors = res.getImmSuccessors(header);
    if (ifType === eIfType.IF_THEN) {
      const thenHeader = ifHeaderSuccessors[1];
      ifGraph.thenNode = new Graph<Node>();
      res = graphUtils.replaceNodes(
        res,
        thenHeader,
        followNode,
        ifGraph.thenNode,
        { rightEdge: false }
      ) as Graph<Node>;
    } else {
      const [elseHeader, thenHeader] = ifHeaderSuccessors;
      ifGraph.thenNode = new Graph<Node>();
      ifGraph.elseNode = new Graph<Node>();
      res = graphUtils.replaceNodes(
        res,
        thenHeader,
        elseHeader,
        ifGraph.thenNode,
        { rightEdge: false }
      ) as Graph<Node>;
      res = graphUtils.replaceNodes(
        res,
        elseHeader,
        followNode,
        ifGraph.elseNode,
        { rightEdge: false }
      ) as Graph<Node>;
    }
    res = graphUtils.replaceNodes(res, header, followNode, ifGraph, {
      rightEdge: false,
    });
  };

  const head = twoWayNodes[twoWayNodes.length - 1];
  const tail = findFollowNode(head);
  if (!tail) {
    throw Log.error(AppError.NODE_NOT_FOUND);
  }
  replaceIf(head, tail);

  return twoWayNodes.length > 1 ? structure(res) : res;
}
