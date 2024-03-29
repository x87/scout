import * as graphUtils from './graph-utils';
import { Graph, GraphNode, IfGraph } from './graph';
import { eBasicBlockType, eIfType } from 'common/enums';
import { Log } from '../../utils/log';
import { AppError } from '../../common/errors';
import { IBasicBlock } from 'common/interfaces';
import { OP_IF } from './cfg';
import { getNumericParam } from 'common/instructions';
import { getOffset } from './graph-utils';

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

export function findIfs<Node>(graph: Graph<Node>): Graph<GraphNode<Node>> {
  const twoWayNodes = graph.nodes.filter((node) => {
    if (node instanceof Graph) return false;
    // const successors = graph.getImmSuccessors(node);
    // return successors.length === 2;
    return (node as IBasicBlock).type === eBasicBlockType.TWO_WAY;
  }) as Node[];

  if (twoWayNodes.length === 0) {
    Log.debug('No 2-way nodes found. Stopping.');
    return graph;
  }

  const findFollowNode = (header: Node): GraphNode<Node> => {
    const pdom = graphUtils.findIPDom(graph);
    const index = graph.getNodeIndex(header);

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

    const succ = graph.getImmSuccessors(header);
    return succ[0];
  };
  const replaceIf = (
    header: Node,
    followNode: GraphNode<Node>
  ): Graph<Node> => {
    const ifHeaderSuccessors = graph.getImmSuccessors(header);
    const ifGraph = new IfGraph<Node>();
    ifGraph.followNode = followNode;
    const followIndex = graph.getNodeIndex(followNode);
    const ifType = getIfType(graph, header, followNode);
    ifGraph.type = ifType;
    ifGraph.ifNumber = getIfCondNumber(header);

    ifGraph.print(`New IF graph`);

    if (ifType === eIfType.IF_THEN) {
      const thenHeader = ifHeaderSuccessors.at(-1);
      const thenIndex = graph.getNodeIndex(thenHeader);

      ifGraph.thenNode = new Graph<Node>();
      for (let i = thenIndex; i < followIndex; i++) {
        ifGraph.thenNode.addNode(graph.nodes[i]);
      }
      if (ifGraph.thenNode.nodes.length === 0) {
        Log.debug(`IF..THEN construct without THEN clause` as AppError);
      }
    } else {
      const [elseHeader, thenHeader] = ifHeaderSuccessors;
      ifGraph.thenNode = new Graph<Node>();
      ifGraph.elseNode = new Graph<Node>();
      const thenIndex = graph.getNodeIndex(thenHeader);
      const elseIndex = graph.getNodeIndex(elseHeader);

      for (let i = thenIndex; i < elseIndex; i++) {
        ifGraph.thenNode.addNode(graph.nodes[i]);
      }
      for (let i = elseIndex; i < followIndex; i++) {
        ifGraph.elseNode.addNode(graph.nodes[i]);
      }
      if (ifGraph.thenNode.nodes.length === 0) {
        Log.debug(`IF..THEN construct without THEN clause` as AppError);
      }
      if (ifGraph.elseNode.nodes.length === 0) {
        Log.warn(`IF..THEN construct without ELSE clause` as AppError);
      }
    }
    ifGraph.addNode(header);
    const reduced = new Graph<Node>();

    for (const node of graph.nodes) {
      if (
        !ifGraph.thenNode.hasNode(node) &&
        !ifGraph.elseNode?.hasNode(node) &&
        node !== header
      ) {
        reduced.addNode(node);
      }
      if (node == header) {
        reduced.addNode(ifGraph);
      }
    }
    reduced.addEdge(ifGraph, ifGraph.followNode);
    for (const edge of graph.edges) {
      if (
        ifGraph.thenNode.hasNode(edge.from) ||
        ifGraph.elseNode?.hasNode(edge.from)
      ) {
        if ((edge.from as IBasicBlock).type === eBasicBlockType.UNSTRUCTURED) {
          reduced.addEdge(ifGraph, edge.to);
        }

        // if another edge originates from the loop, it is either BREAK or CONTINUE
        // we don't need to add it to the new graph
        continue;
      }

      if (
        !ifGraph.thenNode.hasEdge(edge.from, edge.to) &&
        !ifGraph.elseNode?.hasEdge(edge.from, edge.to) &&
        edge.from !== header
      ) {
        if (edge.to === header) {
          edge.to = ifGraph;
        }
        reduced.addEdge(edge.from, edge.to);
      }
    }

    return reduced;
  };

  const head = twoWayNodes.at(-1);
  Log.debug("Finding follow node for node at " + getOffset(head));
  const tail = findFollowNode(head);
  if (!tail) {
    throw Log.error(AppError.NODE_NOT_FOUND);
  }
  let res = replaceIf(head, tail);
  res.print(
    `New graph after replacing IF node (${twoWayNodes.length - 1} left)`
  );

  // recursively structure until no more 2-way nodes are found
  return findIfs(res);
}

function getIfCondNumber<Node>(header: Node) {
  // const pred = res.getImmPredecessors(header);
  // if (
  //   pred.length === 1 &&
  //   (pred[0] as IBasicBlock).type === eBasicBlockType.FALL
  // ) {
  //   const { instructions } = pred[0] as IBasicBlock;
  //   if (instructions.length === 1 && instructions[0].opcode === OP_IF) {
  //     return getNumericParam(instructions[0]);
  //   }
  // }
  const { instructions } = header as IBasicBlock;
  if (instructions.length > 1 && instructions[0].opcode === OP_IF) {
    return getNumericParam(instructions[0]);
  }
  Log.debug(AppError.NO_IF_PREDICATE, getOffset(header));
  return 0;
}
