import * as _ from 'lodash';
import * as graphUtils from './graph-utils';
import Graph from './graph';
import { eIfType } from 'common/enums';

export class IfGraph<Node> extends Graph<Node> {
	thenNode: Graph<Node>;
	elseNode?: Graph<Node>;
	followNode: Node;
}

export function getIfType<Node>(graph: Graph<Node>, ifHeader: Node, followNode: Node): eIfType {
	const headerSuccessors = graph.getImmSuccessors(ifHeader);
	return headerSuccessors.includes(followNode)
		? eIfType.IF_THEN
		: eIfType.IF_THEN_ELSE;
}

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
	const twoWayNodes = graph.nodes.reduce((memo, node) => {
		const successors = graph.getImmSuccessors(node);
		if (successors.length === 2) memo.push(node);
		return memo;
	}, []);

	if (twoWayNodes.length === 0) return graph;

	const idom = graphUtils.findIDom(graph);

	const findFollowNode = (ifHeader: Node): Node | undefined => {
		const candidates = _.reduce(idom, (memo, dom, index) => {
			if (dom === ifHeader) {
				const candidate = graph.nodes[index];
				const pred = graph.getImmPredecessors(candidate);
				if (pred.length >= 2) {
					memo.push(candidate);
				}
			}
			return memo;
		}, []);
		return _.last(candidates);
	};

	let res = graphUtils.from(graph);
	const unresolved = [];

	const replaceIf = (ifHeader: Node, followNode: Node): void => {
		const ifGraph = new IfGraph<Node>();
		ifGraph.followNode = followNode;
		const ifType = getIfType(res, ifHeader, followNode);
		const ifHeaderSuccessors = res.getImmSuccessors(ifHeader);

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

		res = graphUtils.replaceNodes(res, ifHeader, followNode, ifGraph, { rightEdge: false });
	};

	_.eachRight(twoWayNodes, ifHeader => {
		const followNode = findFollowNode(ifHeader);

		if (!followNode) {
			unresolved.push(ifHeader);
		} else {
			unresolved.forEach(unresHeader => replaceIf(unresHeader, followNode));
			replaceIf(ifHeader, followNode);
		}
	});

	return res;
}
