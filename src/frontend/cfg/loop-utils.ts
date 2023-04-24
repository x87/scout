import * as graphUtils from './graph-utils';
import { Graph, GraphNode, LoopGraph } from './graph';
import { eBasicBlockType, eLoopType } from 'common/enums';
import { findIfs as ifStructure } from './conditions-utils';
import { IBasicBlock } from 'common/interfaces';
import { Log } from 'utils/log';
import { getOffset } from './graph-utils';

export function getLoopType<Node>(
  graph: Graph<Node>,
  loop: LoopGraph<Node>,
  loopHeader: Node,
  latchingNode: Node
): eLoopType {
  const headerSuccessors = graph.getImmSuccessors(loopHeader);
  const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);

  if (latchingNodeSuccessors.length === 2) {
    return eLoopType.POST_TESTED;
  }
  if (headerSuccessors.length === 2) {
    if (
      !loop.hasNode(headerSuccessors[0]) ||
      !loop.hasNode(headerSuccessors[1])
    ) {
      return eLoopType.PRE_TESTED;
    }
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
  }

  if (loop.type === eLoopType.POST_TESTED) {
    const latchingNodeSuccessors = graph.getImmSuccessors(
      latchingNode
    ) as Node[];
    if (loop.hasNode(latchingNodeSuccessors[0])) {
      return latchingNodeSuccessors[1];
    }
    return latchingNodeSuccessors[0];
  }

  if (loop.type === eLoopType.ENDLESS) {
    const loopNodes = loop.nodes as Node[];
    let minIndex = graph.nodes.length;
    const headerIndex = graph.getNodeIndex(loopHeader);
    for (const node of loopNodes) {
      // find a closest node that is not in the loop
      graph
        .getImmSuccessors(node)
        .filter((s) => !loop.hasNode(s))
        .forEach((s) => {
          const index = graph.getNodeIndex(s);
          if (index > headerIndex) {
            minIndex = Math.min(minIndex, index);
          }
        });
    }
    if (minIndex !== graph.nodes.length) {
      return graph.nodes[minIndex] as Node;
    }
  }
}

export function findLoops<Node>(graph: Graph<Node>): Graph<Node> {
  graph.print('Finding loops in this graph:');
  const intervals = graphUtils.split(graph);
  Log.debug(
    `Found ${intervals.filter((i) => i.hasLoop).length} loop(s) in ${
      intervals.length
    } interval(s).`
  );
  // for (let i = 0; i < intervals.length; i++) {
  //   if (intervals[i].hasLoop) {
  //     intervals[i].print(`LOOP INTERVAL ${i}:`);
  //   }
  // }

  const index = intervals.findIndex((i) => i.hasLoop);
  if (index === -1) {
    // todo: should we run ifStructure there?
    return graph;
  }
  const reducible = intervals[index];
  reducible.print(`\nPicked interval ${index} for structuring.`);

  // there could be multiple latching nodes (Continue statements) referencing the loop root
  // therefore picking up the last one
  const lastNode = reducible.latchingNodes.at(-1);
  const lastNodeIndex = reducible.getNodeIndex(lastNode);

  // populating loop with inner nodes and
  // replacing nodes in the original graph with a single node
  // producing a new graph for the next iteration
  const loop = new LoopGraph<Node>();
  loop.nodes = reducible.nodes.filter((n, i) => i <= lastNodeIndex);
  loop.edges = reducible.edges.filter(
    (e) => loop.hasNode(e.from) //&& loop.hasNode(e.to)
  );

  loop.type = getLoopType(graph, loop, reducible.root, lastNode);
  loop.followNode = findFollowNode<Node>(
    graph,
    loop,
    reducible.root as Node,
    lastNode as Node
  );

  // now it is time to find exit nodes and identify them as Break, Continue or Unstructured jumps
  // ONE_WAY -> exit are BREAKs;
  // ONE_WAY -> last node or header are CONTINUEs;
  // TWO_WAY exit nodes:
  // - loop is POST_TESTED && node is last: jf->header; make it the loop condition and delete from the loop
  // - loop is PRE_TESTED && node is first: jf->exit; make it the loop condition and delete from the loop
  // - else: abnormal exit, should not be structured as if block; change to UNSTRUCTURED
  if (loop.type === eLoopType.PRE_TESTED) {
    loop.condition = loop.root as Node;
  }
  if (loop.type === eLoopType.POST_TESTED) {
    loop.condition = lastNode as Node;
  }

  for (const node of loop.nodes) {
    if (node === loop.root || node === lastNode) {
      continue;
    }
    if ((node as IBasicBlock).type !== eBasicBlockType.ONE_WAY) {
      continue;
    }

    const successors = graph.getImmSuccessors(node);
    const next = successors[0];

    if (next === loop.followNode) {
      Log.debug(`Found 'BREAK' at ${getOffset(node)}`);
      (node as IBasicBlock).type = eBasicBlockType.BREAK;
    } else if (next === loop.root || next === lastNode) {
      if (next === loop.root && loop.type === eLoopType.POST_TESTED) {
        Log.debug(`Found 'JUMP' from ${getOffset(node)} to ${getOffset(next)}`);
        (node as IBasicBlock).type = eBasicBlockType.UNSTRUCTURED;
      } else {
        Log.debug(`Found 'CONTINUE' at ${getOffset(node)}`);
        (node as IBasicBlock).type = eBasicBlockType.CONTINUE;
      }
    } else {
      Log.debug(`Found 'JUMP' from ${getOffset(node)} to ${getOffset(next)}`);
      (node as IBasicBlock).type = eBasicBlockType.UNSTRUCTURED;
    }
  }

  // loop.edges = loop.edges.filter(({ to }) => loop.hasNode(to));

  loop.print('Creating a loop node');
  let reduced = new Graph<Node>();
  for (const node of graph.nodes) {
    if (!loop.hasNode(node)) {
      reduced.addNode(node);
    }
    if (node === loop.root) {
      reduced.addNode(loop);
    }
  }
  // follow node could be undefined if the loop is the last node in the graph
  if (loop.followNode) {
    reduced.addEdge(loop, loop.followNode);
  }
  for (const edge of graph.edges) {
    if (loop.hasNode(edge.from) && !loop.hasNode(edge.to)) {
      if ((edge.from as IBasicBlock).type === eBasicBlockType.UNSTRUCTURED) {
        // when there is an unstructured jump from the loop we must add it,
        // otherwise the nodes that the jump is pointing to could become unreachable
        // todo: rethink RPO algo to iterate over all nodes and create multiple disjoint graphs
        // // line below breaks TAXI script
        reduced.addEdge(loop, edge.to);
      }

      // if another edge originates from the loop, it is a BREAK
      // we don't need to add it to the new graph
      continue;
    }

    if (!loop.hasEdge(edge.from, edge.to)) {
      if (edge.to === loop.root) {
        edge.to = loop;
      }
      reduced.addEdge(edge.from, edge.to);
    }
  }

  // sort nodes in the new graph in topological order
  reduced = graphUtils.reversePostOrder(reduced);

  reduced.print('Replacing loop with a single node. New graph:');

  const loopBody = ifStructure(loop);
  loop.nodes = loopBody.nodes as Array<GraphNode<Node>>;

  return findLoops(reduced);
}
