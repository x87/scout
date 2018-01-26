import * as _ from 'lodash';
import * as utils from 'utils';

interface IEdge<T> {
	from: T;
	to: T;
}

interface IGraph<T> {
	nodes: T[];
	edges: Array<IEdge<T>>;
}

export default class Graph<Node> implements IGraph<Node> {
	nodes: Node[];
	edges: Array<IEdge<Node>>;

	constructor() {
		this.nodes = [];
		this.edges = [];
	}

	addEdge(from: Node, to: Node): void {
		this.edges.push({ from, to });
	}

	getNodeSuccessors(from: Node): Node[] {
		const incidentEdges = _.filter(this.edges, { from });
		return _.map(incidentEdges, edge => edge.to);
	}

	getNodeIndex(node: Node): number {
		return _.findIndex(this.nodes, node);
	}

	findCommonSuccessor(a: Node, b: Node): Node | undefined {
		const intersection = utils.getArrayIntersection(this.getNodeSuccessors(a), this.getNodeSuccessors(b));
		return _.head(intersection);
	}

	get root(): Node {
		return this.nodes[0];
	}
}
