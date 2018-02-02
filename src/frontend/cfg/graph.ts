import * as _ from 'lodash';
import * as utils from 'utils';
import * as graphUtils from './graph-utils';

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

	findCommonSuccessor(a: GraphNode<T>, b: GraphNode<T>): GraphNode<T> | undefined {
		const intersection = utils.getArrayIntersection(this.getImmSuccessors(a), this.getImmSuccessors(b));
		return _.head(intersection);
	}

	get hasLoop(): boolean {
		return this.latchingNodes.length > 0;
	}

	get root(): GraphNode<T> {
		return this.nodes[0];
	}

	get rootNode(): T {
		if (!graphUtils.isGraph(this.root)) {
			return this.root;
		}
		let graph = this.root;
		while (graphUtils.isGraph(graph.root)) {
			graph = graph.root;
		}
		return graph.root;
	}

	get latchingNodes(): Array<GraphNode<T>> {
		const header = this.root;
		return this.nodes.filter(node => this.getImmSuccessors(node).includes(header));
	}
}
