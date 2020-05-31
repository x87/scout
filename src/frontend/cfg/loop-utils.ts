import * as graphUtils from './graph-utils';
import Graph, { GraphNode } from './graph';
import { eLoopType } from 'common/enums';
import { structure as ifStructure } from './conditions-utils';

export class LoopGraph<Node> extends Graph<Node> {
  type: eLoopType;
  followNode?: Node;
}

export function getLoopType<Node>(
  graph: Graph<Node>,
  loop: LoopGraph<Node>,
  loopHeader: Node,
  latchingNode: Node
): eLoopType {
  const headerSuccessors = graph.getImmSuccessors(loopHeader);
  const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);

  if (latchingNodeSuccessors.length === 2) {
    if (headerSuccessors.length === 2) {
      if (
        loop.hasNode(headerSuccessors[0]) &&
        loop.hasNode(headerSuccessors[1])
      ) {
        return eLoopType.POST_TESTED;
      }
      return eLoopType.PRE_TESTED;
    }
    return eLoopType.POST_TESTED;
  }
  if (headerSuccessors.length === 2) {
    return eLoopType.PRE_TESTED;
  }
  return eLoopType.ENDLESS;
}

export function findFollowNode<Node>(
  graph: Graph<Node>,
  loop: LoopGraph<Node>,
  loopHeader: Node,
  latchingNode: Node
): Node | undefined {
  if (loop.type === eLoopType.PRE_TESTED) {
    const headerSuccessors = graph.getImmSuccessors(loopHeader) as Node[];
    if (loop.hasNode(headerSuccessors[0])) {
      return headerSuccessors[1];
    }
    return headerSuccessors[0];
  } else if (loop.type === eLoopType.POST_TESTED) {
    const latchingNodeSuccessors = graph.getImmSuccessors(
      latchingNode
    ) as Node[];
    if (loop.hasNode(latchingNodeSuccessors[0])) {
      return latchingNodeSuccessors[1];
    }
    return latchingNodeSuccessors[0];
  } else {
    const loopNodes = loop.nodes as Node[];
    let minIndex = graph.nodes.length;
    for (const node of loopNodes) {
      const successors = graph.getImmSuccessors(node);
      if (successors.length === 2) {
        if (!loop.hasNode(successors[0])) {
          const index = graph.getNodeIndex(successors[0]);
          minIndex = Math.min(minIndex, index);
        } else if (!loop.hasNode(successors[1])) {
          const index = graph.getNodeIndex(successors[1]);
          minIndex = Math.min(minIndex, index);
        }
      }
    }
    if (minIndex !== graph.nodes.length) {
      return graph.nodes[minIndex] as Node;
    }
  }
}

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
  const intervals = graphUtils.split(graph);
  const reducible = intervals.find((i) => i.hasLoop);

  if (!reducible) return graph;

  // there could be multiple Continue statements referencing loop root
  // therefore picking up the last node in the interval
  const lastNode = reducible.latchingNodes[reducible.latchingNodes.length - 1];
  const loop = new LoopGraph<Node>();

  // populating loop with inner nodes and
  // replacing nodes in the original graph with a single node
  // producing a new graph for the next iteration
  const reduced = graphUtils.replaceNodes(
    graph,
    reducible.root,
    lastNode,
    loop
  );

  loop.type = getLoopType(graph, loop, reducible.root, lastNode);
  loop.followNode = findFollowNode<Node>(
    graph,
    loop,
    reducible.root as Node,
    lastNode as Node
  );

  const loopBody = ifStructure(loop);
  loop.nodes = loopBody.nodes as Array<GraphNode<Node>>;

  return structure(reduced);
}
