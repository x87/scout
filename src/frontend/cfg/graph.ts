import * as _ from 'lodash';

interface IEdge<T> {
	from: T;
	to: T;
}

interface IGraph<T> {
	nodes: T[];
	edges: Array<IEdge<T>>;
}

interface INodeVisitor<T> {
	node: T;
	visited: boolean;
}

export default class Graph<Node> implements IGraph<Node> {
	nodes: Node[];
	edges: Array<IEdge<Node>>;

	constructor(nodes: Node[] = [], edges: Array<IEdge<Node>> = []) {
		this.nodes = nodes;
		this.edges = edges;
	}

	addEdge(from: Node, to: Node): void {
		this.edges.push({ from, to });
	}

	extractFrom(root: Node): Graph<Node> {
		if (this.nodes.length < 2) return this;

		const visited = this.DFS(this, root);

		const nodes = _.chain(visited).filter('visited').map('node').value();
		const edges = this.edges.filter(edge => nodes.includes(edge.from));
		return new Graph<Node>(nodes, edges);
	}

	DFS(graph: IGraph<Node>, root: Node): Array<INodeVisitor<Node>> {
		const visited: Array<INodeVisitor<Node>> = this.nodes.map(node => ({
			node,
			visited: node === root
		}));
		this._DFS(root, visited);
		return visited;
	}

	_DFS(node: Node, visited: Array<INodeVisitor<Node>>): void {
		for (const edge of this.getIncidentEdges(node)) {
			const toNode = _.find(visited, ['node', edge.to]);
			if (!toNode.visited) {
				toNode.visited = true;
				this._DFS(toNode.node, visited);
			}
		}
	}

	getIncidentEdges(node: Node): Array<IEdge<Node>> {
		return _.filter(this.edges, { from: node });
	}

}
