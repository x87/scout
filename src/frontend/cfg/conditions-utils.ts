import * as _ from 'lodash';
import * as graphUtils from './graph-utils';
import Graph, { GraphNode } from './graph';
import { eIfType } from 'common/enums';

export class IfGraph<Node> extends Graph<Node> {
	thenNode: Graph<Node>;
	elseNode?: Graph<Node>;
	followNode: GraphNode<Node>;
}

export function getIfType<Node>(graph: Graph<Node>, ifHeader: Node, followNode: GraphNode<Node>): eIfType {
	const headerSuccessors = graph.getImmSuccessors(ifHeader);
	return headerSuccessors.includes(followNode)
		? eIfType.IF_THEN
		: eIfType.IF_THEN_ELSE;
}

export function structure<Node>(graph: Graph<GraphNode<Node>>): Graph<GraphNode<Node>> {
	const twoWayNodes = graph.nodes.filter((node) => {
		if (node instanceof IfGraph) return false;
		const successors = graph.getImmSuccessors(node);
		return successors.length === 2;
	}) as Node[];

	if (twoWayNodes.length === 0) return graph;

	let res = graphUtils.from(graph);
	const findFollowNode = (header: Node): Node | undefined => {

		const idom = graphUtils.findIDom(res);
		const candidates = _.reduce(idom, (memo, dom, index) => {
			if (dom === header) {
				const candidate = res.nodes[index];
				const pred = res.getImmPredecessors(candidate);
				if (pred.length >= 2) {
					memo.push(candidate);
				}
			}
			return memo;
		}, []);
		return _.last(candidates);
	};
	const replaceIf = (header: Node, followNode: GraphNode<Node>): void => {

		const ifGraph = new IfGraph<Node>();
		ifGraph.followNode = followNode;
		const ifType = getIfType(res, header, followNode);
		const ifHeaderSuccessors = res.getImmSuccessors(header);
		if (ifType === eIfType.IF_THEN) {
			const thenHeader = ifHeaderSuccessors[1];
			ifGraph.thenNode = new Graph<Node>();
			res = graphUtils.replaceNodes(
				res,
				thenHeader,
				followNode,
				ifGraph.thenNode,
				{ rightEdge: false }
			) as Graph<Node>;
		} else {
			const [elseHeader, thenHeader] = ifHeaderSuccessors;
			ifGraph.thenNode = new Graph<Node>();
			ifGraph.elseNode = new Graph<Node>();
			res = graphUtils.replaceNodes(
				res,
				thenHeader,
				elseHeader,
				ifGraph.thenNode,
				{ rightEdge: false }
			) as Graph<Node>;
			res = graphUtils.replaceNodes(
				res,
				elseHeader,
				followNode,
				ifGraph.elseNode,
				{ rightEdge: false }
			) as Graph<Node>;
		}
		res = graphUtils.replaceNodes(res, header, followNode, ifGraph, { rightEdge: false });

	};
	const unresolved = [];

	_.eachRight(twoWayNodes, ifHeader => {
		const followNode = findFollowNode(ifHeader);

		if (!followNode) {
			unresolved.push(ifHeader);
		} else {
			unresolved.forEach(unresHeader => replaceIf(unresHeader, followNode));
			replaceIf(ifHeader, followNode);
			return false;
		}
	});

	return twoWayNodes.length > 1 ? structure(res) : res;
}
