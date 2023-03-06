import * as graphUtils from './graph-utils';
import { Graph, GraphNode, LoopGraph } from './graph';
import { eLoopType } from 'common/enums';
import { structure as ifStructure } from './conditions-utils';

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
      // find a closest node that is not in the loop
      graph
        .getImmSuccessors(node)
        .filter((s) => !loop.hasNode(s))
        .forEach((s) => {
          const index = graph.getNodeIndex(s);
          minIndex = Math.min(minIndex, index);
        });
    }
    if (minIndex !== graph.nodes.length) {
      return graph.nodes[minIndex] as Node;
    }
  }
}

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
  const intervals = graphUtils.split(graph);
  // console.log('intervals', intervals.length);
  // for (const interval of intervals) {
  // console.log('\n---------------------------');
  // console.log('has loop', interval.hasLoop);
  // if (interval.hasLoop) {
  //   console.log('latching nodes');
  //   for (const node of interval.latchingNodes) {
  //     console.log(interval.getNodeIndex(node));
  //   }
  // }
  // interval.print();
  // }
  const reducible = intervals.find((i) => i.hasLoop);

  if (!reducible) return graph;

  // there could be multiple Continue statements referencing loop root
  // therefore picking up the last node in the interval
  const lastNode = reducible.latchingNodes[reducible.latchingNodes.length - 1];
  const lastNodeIndex = reducible.getNodeIndex(lastNode);

  // populating loop with inner nodes and
  // replacing nodes in the original graph with a single node
  // producing a new graph for the next iteration
  const loop = new LoopGraph<Node>();
  loop.nodes = reducible.nodes; //.filter((n, i) => i <= lastNodeIndex);
  loop.edges = reducible.edges;//.filter(
    // (e) => loop.hasNode(e.from) && loop.hasNode(e.to)
  // );
  loop.type = getLoopType(graph, loop, reducible.root, lastNode);
  loop.followNode = findFollowNode<Node>(
    graph,
    loop,
    reducible.root as Node,
    lastNode as Node
  );

  // loop.print();

  let reduced = new Graph<Node>();
  for (const node of graph.nodes) {
    if (!loop.hasNode(node)) {
      reduced.addNode(node);
    }
  }
  reduced.addNode(loop);
  for (const edge of graph.edges) {
    if (!loop.hasEdge(edge.from, edge.to)) {
      reduced.addEdge(edge.from, edge.to);
    }
    if (loop.hasNode(edge.from) && !loop.hasNode(edge.to)) {
      reduced.addEdge(loop, edge.to);
    }
    if (!loop.hasNode(edge.from) && loop.hasNode(edge.to)) {
      reduced.addEdge(edge.from, loop);
    }
  }

  // sort nodes in the new graph in topological order
  reduced = graphUtils.reversePostOrder(reduced);

  // reduced.print('Reduced graph');
  // process.exit(0);

  const loopBody = ifStructure(loop);
  loop.nodes = loopBody.nodes as Array<GraphNode<Node>>;

  return structure(reduced);
}
