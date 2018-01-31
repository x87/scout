import * as _ from 'lodash';
import * as utils from 'utils';

interface IEdge<T> {
	from: T;
	to: T;
}

export type IGraphNode<T> = IGraph<T> | T;

export interface IGraph<T> {
	nodes: Array<IGraphNode<T>>;
	edges: Array<IEdge<IGraphNode<T>>>;
}

export default class Graph<T, Node = IGraphNode<T>> implements IGraph<Node> {
	nodes: Node[];
	edges: Array<IEdge<Node>>;

	constructor() {
		this.nodes = [];
		this.edges = [];
	}

	addNode(...nodes: Node[]): void {
		nodes.forEach(node => {
			if (!this.hasNode(node)) this.nodes.push(node);
		});
	}

	hasNode(node: Node): boolean {
		return this.nodes.includes(node);
	}

	hasEdge(from: Node, to: Node): boolean {
		return !!_.find(this.edges, edge => edge.from === from && edge.to === to);
	}

	addEdge(from: Node, to: Node): void {
		if (!this.hasEdge(from, to)) this.edges.push({ from, to });
	}

	getImmPredecessors(to: Node): Node[] {
		const edges = _.filter(this.edges, edge => edge.to === to);
		return _.map(edges, edge => edge.from);
	}

	getImmSuccessors(from: Node): Node[] {
		const edges = _.filter(this.edges, edge => edge.from === from);
		return _.map(edges, edge => edge.to);
	}

	getNodeIndex(node: Node): number {
		return _.findIndex(this.nodes, n => n === node );
	}

	findCommonSuccessor(a: Node, b: Node): Node | undefined {
		const intersection = utils.getArrayIntersection(this.getImmSuccessors(a), this.getImmSuccessors(b));
		return _.head(intersection);
	}

	isNested(): boolean {
		return this.root instanceof Graph;
	}

	get root(): Node {
		return this.nodes[0];
	}

	get latchingNodes(): Node[] {
		const header = this.root;
		return this.nodes.filter(node => this.getImmSuccessors(node).includes(header));
	}
}
