import { IBasicBlock } from 'common/interfaces';
import * as utils from 'utils';
import { opcodeToHex } from 'utils';
import { Log } from 'utils/log';
import { Graph, GraphNode, IfGraph, LoopGraph } from './graph';

export function split<Node>(graph: Graph<Node>): Array<Graph<Node>> {
  if (graph.nodes.length < 1) {
    return [];
  }
  const headers = [graph.root];
  const intervals: Array<Graph<Node>> = [];
  const visited: boolean[] = [];

  const isCandidateNode = (g: Graph<Node>, n: GraphNode<Node>): boolean => {
    return !visited[graph.getNodeIndex(n)] && !g.hasNode(n);
  };

  const markVisited = (node: GraphNode<Node>): void => {
    visited[graph.getNodeIndex(node)] = true;
  };

  const addNode = (interval: Graph<Node>, node: GraphNode<Node>): void => {
    interval.addNode(node);
    const succ = graph.getImmSuccessors(node);
    for (const s of succ) {
      interval.addEdge(node, s);
    }
    const pred = graph.getImmPredecessors(node);
    for (const p of pred) {
      interval.addEdge(p, node);
    }
  };

  while (headers.length) {
    const header = headers.shift();
    const interval = new Graph<Node>();

    markVisited(header);
    addNode(interval, header);

    for (const node of graph.nodes) {
      if (isCandidateNode(interval, node)) {
        const pred = graph.getImmPredecessors(node);
        if (
          pred.length &&
          utils.checkArrayIncludesArray(interval.nodes, pred)
        ) {
          addNode(interval, node);
          markVisited(node);
        }
      }
    }

    for (const node of graph.nodes) {
      if (isCandidateNode(interval, node)) {
        const pred = graph.getImmPredecessors(node);
        if (
          pred.length &&
          utils.checkArrayIncludeItemFromArray(interval.nodes, pred)
        ) {
          headers.push(node);
          markVisited(node);
        }
      }
    }
    intervals.push(interval);
  }

  return intervals;
}

export function reversePostOrder<Node>(graph: Graph<Node>): Graph<Node> {
  const res = new Graph<Node>();
  const visited: boolean[] = [];
  const traverse = (node: GraphNode<Node>): void => {
    const index = graph.getNodeIndex(node);
    visited[index] = true;

    const successors = graph.getImmSuccessors(node);
    successors.forEach((bb) => {
      const nextIndex = graph.getNodeIndex(bb);
      if (!visited[nextIndex]) {
        traverse(bb);
      }
      res.addEdge(node, bb);
    });
    res.addNode(node);
  };

  traverse(graph.root);
  res.nodes = res.nodes.reverse();
  return res;
}

export function from<Node>(graph: Graph<Node>): Graph<Node> {
  const res = new Graph<Node>();
  for (const node of graph.nodes) {
    res.addNode(node);
  }
  for (const edge of graph.edges) {
    res.addEdge(edge.from, edge.to);
  }
  return res;
}

/**
 * find dominators for each node in the given graph
 */
export function findDom<Node>(
  graph: Graph<Node>
): Array<Array<GraphNode<Node>>> {
  const dom = graph.nodes.map((node) => {
    return node === graph.root ? [graph.root] : graph.nodes;
  });

  let isDirty: boolean;
  do {
    isDirty = false;
    graph.nodes.forEach((node, index) => {
      if (node === graph.root) return;
      const pred = graph.getImmPredecessors(node);
      const newDom = [
        node,
        ...utils
          .getArrayIntersection<GraphNode<Node>>(
            ...pred.map((p) => dom[graph.getNodeIndex(p)])
          )
          .filter((n) => n !== node),
      ];

      isDirty = isDirty || !utils.isEqual(newDom, dom[index]);
      dom[index] = newDom;
    });
  } while (isDirty);
  return dom;
}

/**
 * find strict dominators for each node in the given graph
 */
export function findSDom<Node>(
  graph: Graph<Node>
): Array<Array<GraphNode<Node>>> {
  const sdom = findDom(graph);
  return sdom.map((s) => s.slice(1));
}
/**
 * find immediate dominators for each node in the given graph
 */
export function findIDom<Node>(
  graph: Graph<Node>
): Array<GraphNode<Node> | undefined> {
  const sdom = findSDom(graph);

  const dominates = (a: GraphNode<Node>, b: GraphNode<Node>): boolean => {
    const indexB = graph.getNodeIndex(b);
    return sdom[indexB].includes(a);
  };
  return sdom.map((dominators) => {
    return dominators.find((dominator) => {
      const otherDominators = dominators.filter((d) => d !== dominator);
      return otherDominators.every((d) => dominates(d, dominator));
    });
  });
}

/**
 * find post-dominators for each node in the given graph
 */
export function findPDom<Node>(
  graph: Graph<Node>
): Array<Array<GraphNode<Node>>> {
  const transposed = transpose(graph);
  return findDom(transposed).reverse();
}

/**
 * find strict post-dominators for each node in the given graph
 */
export function findSPDom<Node>(
  graph: Graph<Node>
): Array<Array<GraphNode<Node>>> {
  const sdom = findPDom(graph);
  return sdom.map((s) => s.slice(1));
}

export function findIPDom<Node>(
  graph: Graph<Node>
): Array<GraphNode<Node> | undefined> {
  const sdom = findSPDom(graph);

  const dominates = (a: GraphNode<Node>, b: GraphNode<Node>): boolean => {
    const indexB = graph.getNodeIndex(b);
    return sdom[indexB].includes(a);
  };
  return sdom.map((dominators) => {
    return dominators.find((dominator) => {
      const otherDominators = dominators.filter((d) => d !== dominator);
      return otherDominators.every((d) => dominates(d, dominator));
    });
  });
}

// todo: duplicate of reversePostOrder function
// todo: implement a common traverse method on graph level
// todo: caching? _.memoize?
export function transpose<Node>(graph: Graph<Node>): Graph<Node> {
  const res = new Graph<Node>();
  const visited: boolean[] = [];
  const traverse = (node: GraphNode<Node>): void => {
    const index = graph.getNodeIndex(node);
    visited[index] = true;

    const successors = graph.getImmSuccessors(node);
    successors.forEach((bb) => {
      const nextIndex = graph.getNodeIndex(bb);
      if (nextIndex === -1) {
        return;
      }
      if (!visited[nextIndex]) {
        traverse(bb);
      }
      // res.addEdge(node, bb);
      res.addEdge(bb, node);
    });
    res.addNode(node);
  };

  traverse(graph.root);
  // res.nodes = res.nodes.reverse();
  return res;
}

export function getOffset<T>(node: GraphNode<T>) {
  if (node instanceof Graph) {
    if (node.nodes.length) {
      return getOffset(node.nodes[0]);
    }
    return -1;
  }
  return (node as IBasicBlock).instructions[0]?.offset ?? -1;
}

export function printNode<T>(node: GraphNode<T>, index: number) {
  if (node instanceof Graph) {
    Log.debug(`${index}: [${getOffset(node)}] ${nodeType(node)}`);
  } else {
    const type = nodeType(node);
    const { instructions } = node as IBasicBlock;
    const { offset, opcode } = instructions[0] ?? { offset: -1, opcode: -1 };
    Log.debug(
      `${index}: [${offset}] ${type}. ${opcodeToHex(opcode)}...${opcodeToHex(
        instructions.at(-1)?.opcode ?? -1
      )}`
    );
  }
}

export function nodeType<T>(node: GraphNode<T>): string {
  if (node instanceof LoopGraph) return 'LOOP';
  if (node instanceof IfGraph) return 'IF';
  switch ((node as IBasicBlock).type) {
    case 0:
      return 'UNDEFINED';
    case 1:
      return 'RETURN';
    case 2:
      return 'ONE_WAY';
    case 3:
      return 'TWO_WAY';
    case 4:
      return 'FALL';
    case 5:
      return 'N_WAY';
    case 6:
      return 'BREAK';
    case 7:
      return 'CONTINUE';
    case 8:
      return 'UNSTRUCTURED';
    case 9:
      return 'LOOP_COND';
    default:
      return `UNKNOWN`;
  }
}
