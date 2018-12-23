import * as _ from 'lodash';

interface IEdge<T> {
	from: T;
	to: T;
}

export type GraphNode<T> = T | Graph<T>;

export default class Graph<T> {
	nodes: Array<GraphNode<T>>;
	edges: Array<IEdge<GraphNode<T>>>;

	constructor() {
		this.nodes = [];
		this.edges = [];
	}

	addNode(...nodes: Array<GraphNode<T>>): void {
		nodes.forEach(node => {
			if (!this.hasNode(node)) this.nodes.push(node);
		});
	}

	hasNode(node: GraphNode<T>): boolean {
		return this.nodes.includes(node);
	}

	hasEdge(from: GraphNode<T>, to: GraphNode<T>): boolean {
		return !!_.find(this.edges, edge => edge.from === from && edge.to === to);
	}

	addEdge(from: GraphNode<T>, to: GraphNode<T>): void {
		if (!this.hasEdge(from, to)) this.edges.push({ from, to });
	}

	getImmPredecessors(to: GraphNode<T>): Array<GraphNode<T>> {
		const edges = _.filter(this.edges, edge => edge.to === to);
		return _.map(edges, edge => edge.from);
	}

	getImmSuccessors(from: GraphNode<T>): Array<GraphNode<T>> {
		const edges = _.filter(this.edges, edge => edge.from === from);
		return _.map(edges, edge => edge.to);
	}

	getNodeIndex(node: GraphNode<T>): number {
		return _.findIndex(this.nodes, n => n === node );
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
		return this.nodes.filter(node => this.getImmSuccessors(node).includes(header));
	}
}
