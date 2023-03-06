import { eLoopType } from 'common/enums';
import { IBasicBlock } from 'common/interfaces';
import { opcodeToHex } from 'utils';
// import { IfGraph } from './conditions-utils';

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
    return this.nodes.filter((node) =>
      this.getImmSuccessors(node).includes(header)
    );
  }

  print(header: string = '', level = 0) {
    console.log(''.padStart(level, ' '), header);
    if (this instanceof LoopGraph) {
      console.log(''.padStart(level, ' '), 'Type: ', this.type);
      console.log(''.padStart(level, ' '), 'Follow: ', this.followNode);
    }
    console.log(''.padStart(level, ' '), 'Nodes: ');
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node instanceof Graph) {
        console.log('---------------------');
        console.log(
          ''.padStart(level, ' '),
          `${i}: [${getOffset(node)}] ${nodeType(node)}`
        );
        node.print('', level + 4);
        console.log('---------------------');
      } else {
        const type = nodeType(node);
        console.log(type);
        const first_instr = (node as IBasicBlock).instructions[0];
        const last_instr = (node as IBasicBlock).instructions[
          (node as IBasicBlock).instructions.length - 1
        ];
        console.log(
          ''.padStart(level, ' '),
          `${i}: [${first_instr.offset}] ${type}. ${opcodeToHex(
            first_instr.opcode
          )}...${opcodeToHex(last_instr.opcode)}`
        );
      }
    }
    console.log(''.padStart(level, ' '), 'Edges: ');
    const edgesSorted = this.edges.sort((a, b) => {
      const aFrom = this.getNodeIndex(a.from);
      const bFrom = this.getNodeIndex(b.from);
      const aTo = this.getNodeIndex(a.to);
      const bTo = this.getNodeIndex(b.to);
      if (aFrom === bFrom) return aTo - bTo;
      return aFrom - bFrom;
    });
    for (let i = 0; i < edgesSorted.length; i++) {
      const edge = edgesSorted[i];
      console.log(
        ''.padStart(level, ' '),
        `${i}: [${nodeType(edge.from)}] ${this.getNodeIndex(
          edge.from
        )} -> ${this.getNodeIndex(edge.to)}`
      );
    }
  }
}

function nodeType<T>(node: GraphNode<T>): string {
  if (node instanceof LoopGraph) return 'LOOP';
  // if (i instanceof IfGraph) return 'IF';
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
    default:
      return 'UNKNOWN';
  }
}

function getOffset<T>(node: GraphNode<T>) {
  // console.log(node);
  if (node instanceof Graph) {
    if (node.nodes.length) {
    return getOffset(node.nodes[0]);
    }
  }
  // if (node instanceof IfGraph) {
  //   return getOffset(node.nodes[0]);
  // }
  return (node as IBasicBlock).instructions[0].offset;
}




export class IfGraph<Node> extends Graph<Node> {
  thenNode: Graph<Node>;
  elseNode?: Graph<Node>;
  followNode: GraphNode<Node>;
}

export class LoopGraph<Node> extends Graph<Node> {
  type: eLoopType;
  followNode?: Node;
}
