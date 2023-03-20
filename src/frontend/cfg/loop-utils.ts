import * as graphUtils from './graph-utils';
import { getOffset, Graph, GraphNode, LoopGraph } from './graph';
import { eBasicBlockType, eLoopType } from 'common/enums';
import { structure as ifStructure } from './conditions-utils';
import { IBasicBlock } from 'common/interfaces';
import Arguments from 'common/arguments';
import { OP_IF } from '.';

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
        !loop.hasNode(headerSuccessors[0]) ||
        !loop.hasNode(headerSuccessors[1])
      ) {
        return eLoopType.PRE_TESTED;
      }
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

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
  graph.print('Finding loops in this graph:');
  const intervals = graphUtils.split(graph);
  if (Arguments.debugMode) {
    console.log(
      `Found ${intervals.filter((i) => i.hasLoop).length} loop(s) in ${
        intervals.length
      } interval(s).`
    );
    // for (let i = 0; i < intervals.length; i++) {
    //   if (intervals[i].hasLoop) {
    //     intervals[i].print(`LOOP INTERVAL ${i}:`);
    //   }
    // }
  }

  const index = intervals.findIndex((i) => i.hasLoop);
  if (index === -1) {
    // todo: should we run ifStructure there?
    return graph;
  }
  const reducible = intervals[index];
  if (Arguments.debugMode) {
    reducible.print(`\nPicked interval ${index} for structuring.`)
  }

  // there could be multiple Continue statements referencing loop root
  // therefore picking up the last latching node in the interval
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
  // todo: Continue is not implemented yet

  // ONE_WAY exit nodes are BREAKs;
  // TWO_WAY exit nodes depend on the type of the loop:
  // - POST_TESTED && node is last: jf->header; make it the loop condition and delete from the loop
  // - PRE_TESTED && node is first: jf->exit; make it the loop condition and delete from the loop
  // - else: abnormal exit, should not be structured as if block; change to UNSTRUCTURED
  for (const node of loop.nodes) {
    const successors = graph.getImmSuccessors(node);

    if (successors.includes(loop.followNode)) {
      if ((node as IBasicBlock).type === eBasicBlockType.ONE_WAY) {
        (node as IBasicBlock).type = eBasicBlockType.BREAK;
        continue;
      }
      if (node === loop.root && loop.type === eLoopType.PRE_TESTED) {
        loop.condition = node as Node;
        (node as IBasicBlock).type = eBasicBlockType.LOOP_COND;
        continue;
      }
      if (node === lastNode && loop.type === eLoopType.POST_TESTED) {
        loop.condition = node as Node;
        (node as IBasicBlock).type = eBasicBlockType.LOOP_COND;
        continue;
      }
      (node as IBasicBlock).type = eBasicBlockType.UNSTRUCTURED;
    }
  }

  // todo: refactor this mess
  loop.edges = loop.edges.filter((edge) => {
    const from = edge.from as IBasicBlock;
    if (
      from.type === eBasicBlockType.ONE_WAY ||
      from.type === eBasicBlockType.TWO_WAY ||
      from.type === eBasicBlockType.UNSTRUCTURED ||
      from.type === eBasicBlockType.BREAK ||
      from.type === eBasicBlockType.LOOP_COND
    ) {
      if (!loop.hasNode(edge.to)) {
        const fromOffset = getOffset(edge.from);
        const toOffset = getOffset(edge.to);
        if (edge.to === loop.followNode) {
          if (Arguments.debugMode) {
            console.log(`Found 'BREAK' at ${fromOffset}`);
          }
          if (
            from.type === eBasicBlockType.ONE_WAY ||
            from.type === eBasicBlockType.TWO_WAY
          ) {
            from.type = eBasicBlockType.UNSTRUCTURED;
          }
          return false;
        } else {
          if (Arguments.debugMode) {
            console.log(`Found 'JUMP' from ${fromOffset} to ${toOffset}`);
          }
          from.type = eBasicBlockType.UNSTRUCTURED;
          return false;
        }
      }
    }
    return true;
  });

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
    if (loop.hasNode(edge.from)) {
      if ((edge.from as IBasicBlock).type === eBasicBlockType.UNSTRUCTURED) {
        // when there is an unstructured jump from the loop we must add it,
        // otherwise the nodes that the jump is pointing to could become unreachable

        // todo: rethink RPO algo to iterate over all nodes and create multiple disjoint graphs
        // reduced.addEdge(loop, edge.to);
      }

      // if another edge originates from the loop, it is either BREAK or CONTINUE
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

  return structure(reduced);
}
