import * as utils from 'utils';
import * as _ from 'lodash';
import Graph, { GraphNode } from './graph';

export function reduce<Node>(graph: Graph<Node>): Graph<Node> {
	const g = new Graph<Node>();
	const intervals: Array<Graph<Node>> = split(graph);

	for (const interval of intervals) {
		g.addNode(interval);

		const header = interval.root;
		const pred = interval.getImmPredecessors(header);

		for (const p of pred) {
			if (interval.hasNode(p)) continue;

			for (const i of intervals) {
				if (i.hasNode(p)) {
					g.addEdge(i, interval);
					break;
				}
			}
		}
	}
	const nodesLen = g.nodes.length;
	return nodesLen > 1 && nodesLen < graph.nodes.length
		? reduce(g)
		: g;
}

export function split<Node>(graph: Graph<Node>): Array<Graph<Node>> {
	if (graph.nodes.length < 1) {
		return [];
	}
	const headers = [graph.root];
	const intervals: Array<Graph<Node>> = [];
	const visited: boolean[] = [];

	const isCandidateNode = (g: Graph<Node>, n: GraphNode<Node>): boolean => {
		return !visited[graph.getNodeIndex(n)] && !g.nodes.includes(n);
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
				if (pred.length && utils.checkArrayIncludesArray(interval.nodes, pred)) {
					addNode(interval, node);
					markVisited(node);
				}
			}
		}

		for (const node of graph.nodes) {
			if (isCandidateNode(interval, node)) {
				const pred = graph.getImmPredecessors(node);
				if (pred.length && utils.checkArrayIncludeItemFromArray(interval.nodes, pred)) {
					headers.push(node);
					markVisited(node);
				}
			}
		}
		intervals.push(interval);
	}

	return intervals;
}

export function isGraph<T>(node: GraphNode<T>): node is Graph<T> {
	return node instanceof Graph;
}

export function reversePostOrder<Node>(graph: Graph<Node>): Graph<Node> {
	const res = new Graph<Node>();
	const visited: boolean[] = [];
	const traverse = (node: GraphNode<Node>): void => {
		const index = graph.getNodeIndex(node);
		visited[index] = true;

		const successors = graph.getImmSuccessors(node);
		successors.forEach(bb => {
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

export function replaceNodes<Node>(
	rpoGraph: Graph<Node>,
	startNode: Node,
	endNode: Node,
	newNode: Node
): Graph<Node> {
	const res = from(rpoGraph);

	const startIndex = res.getNodeIndex(startNode);
	const endIndex = res.getNodeIndex(endNode);

	const removed = res.nodes.splice(startIndex, endIndex - startIndex + 1, newNode);
	_.remove(res.edges, (edge) => {
		return removed.includes(edge.from) && removed.includes(edge.to);
	});

	for (const edge of res.edges) {
		if (removed.includes(edge.from)) edge.from = newNode;
		if (removed.includes(edge.to)) edge.to = newNode;
	}

	return res;
}
