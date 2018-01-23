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

	constructor(nodes: Node[] = [], edges: Array<IEdge<Node>> = []) {
		this.nodes = nodes;
		this.edges = edges;
	}

	addEdge(from: Node, to: Node): void {
		this.edges.push({ from, to });
	}

}
