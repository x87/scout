import { eIfType, eLoopType } from 'common/enums';
import { GLOBAL_OPTIONS } from 'common/arguments';
import { Log } from 'utils/log';
import { getOffset, nodeType, printNode } from './graph-utils';

interface IEdge<T> {
  from: T;
  to: T;
}

export type GraphNode<T> = T | Graph<T>;

export class Graph<T> {
  nodes: Array<GraphNode<T>>;
  edges: Array<IEdge<GraphNode<T>>>;
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addNode(...nodes: Array<GraphNode<T>>): void {
    nodes.forEach((node) => {
      if (!this.hasNode(node)) this.nodes.push(node);
    });
  }

  removeNode(node: GraphNode<T>): void {
    this.nodes = this.nodes.filter((n) => n !== node);
    this.edges = this.edges.filter(
      (edge) => edge.from !== node && edge.to !== node
    );
  }

  hasNode(node: GraphNode<T>): boolean {
    return this.nodes.includes(node);
  }

  hasEdge(from: GraphNode<T>, to: GraphNode<T>): boolean {
    return this.edges.some((edge) => edge.from === from && edge.to === to);
  }

  addEdge(from: GraphNode<T>, to: GraphNode<T>): void {
    if (!this.hasEdge(from, to)) this.edges.push({ from, to });
  }

  getImmPredecessors(to: GraphNode<T>): Array<GraphNode<T>> {
    const edges = this.edges.filter((edge) => edge.to === to);
    return edges.map((edge) => edge.from);
  }

  getImmSuccessors(from: GraphNode<T>): Array<GraphNode<T>> {
    const edges = this.edges.filter((edge) => edge.from === from);
    return edges.map((edge) => edge.to);
  }

  getNodeIndex(node: GraphNode<T>): number {
    return this.nodes.findIndex((n) => n === node);
  }

  get hasLoop(): boolean {
    return this.latchingNodes.length > 0;
  }

  get root(): GraphNode<T> {
    // todo: think of a definition of the root node
    // given graph G(N), root(G) = n in N && getImmPredecessors(n) = []
    // or given graph G(N), root(G) = n in N && n.offset = 0
    return this.nodes[0];
  }

  get latchingNodes(): Array<GraphNode<T>> {
    const header = this.root;
    return this.nodes.filter((node) => {
      return (
        !(node instanceof Graph) && this.getImmSuccessors(node).includes(header)
      );
    });
  }

  print(header: string = '') {
    if (!GLOBAL_OPTIONS.debugMode) {
      return;
    }
    console.group(header);
    try {
      if (this instanceof LoopGraph) {
        Log.debug('Loop type:', this.type);
        Log.debug('Follow node:');
        if (this.followNode) {
          printNode(this.followNode, 0);
        } else {
          Log.debug('undefined');
        }
        if (this.condition) {
          Log.debug('Condition:');
          printNode(this.condition, 0);
        }
      }
      if (this instanceof IfGraph) {
        Log.debug(
          `${this.type} with follow node at ${getOffset(this.followNode)}`
        );

        // this.thenNode.print('thenNode:');
        // this.elseNode?.print('elseNode:');
      }
      if (this.nodes.length) {
        console.group('Nodes: ');
      }

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        printNode(node, i);
      }
      if (this.nodes.length) {
        console.groupEnd();
      }
      if (this.edges.length) {
        console.group('Edges: ');
      }
      const edgesSorted = [...this.edges].sort((a, b) => {
        const aFrom = this.getNodeIndex(a.from);
        const bFrom = this.getNodeIndex(b.from);
        const aTo = this.getNodeIndex(a.to);
        const bTo = this.getNodeIndex(b.to);
        if (aFrom === bFrom) return aTo - bTo;
        return aFrom - bFrom;
      });
      for (let i = 0; i < edgesSorted.length; i++) {
        const edge = edgesSorted[i];
        Log.debug(
          `${i}: [${nodeType(edge.from)}] ${this.getNodeIndex(
            edge.from
          )} -> ${this.getNodeIndex(edge.to)}`
        );
      }
      if (this.edges.length) {
        console.groupEnd();
      }
    } catch (e) {
      console.error(e);
    }
    console.groupEnd();
  }
}

export class IfGraph<Node> extends Graph<Node> {
  type: eIfType;
  thenNode: Graph<Node>;
  elseNode?: Graph<Node>;
  followNode: GraphNode<Node>;
  ifNumber: number = 0;
}

export class LoopGraph<Node> extends Graph<Node> {
  type: eLoopType;
  followNode?: Node;
  condition?: Node;
}
