import * as _ from 'lodash';
import * as graphUtils from './graph-utils';
import Graph from './graph';
import { eLoopType } from 'common/enums';

export class LoopGraph<Node> extends Graph<Node> {
	type: eLoopType;
	followNode?: Node;
}

export function getLoopType<Node>(
	graph: Graph<Node>,
	loop: LoopGraph<Node>,
	loopHeader: Node,
	latchingNode: Node
): eLoopType {
	const headerSuccessors = graph.getImmSuccessors(loopHeader);
	const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode);

	if (latchingNodeSuccessors.length === 2) {
		if (headerSuccessors.length === 2) {
			if (loop.hasNode(headerSuccessors[0]) && loop.hasNode(headerSuccessors[1])) {
				return eLoopType.POST_TESTED;
			}
			return eLoopType.PRE_TESTED;
		}
		return eLoopType.POST_TESTED;
	}
	if (headerSuccessors.length === 2) {
		return eLoopType.PRE_TESTED;
	}
	return eLoopType.ENDLESS;
}

export function findFollowNode<Node>(
	graph: Graph<Node>,
	loop: LoopGraph<Node>,
	loopHeader: Node,
	latchingNode: Node
): Node | undefined {
	if (loop.type === eLoopType.PRE_TESTED) {
		const headerSuccessors = graph.getImmSuccessors(loopHeader) as Node[];
		if (loop.hasNode(headerSuccessors[0])) {
			return headerSuccessors[1];
		}
		return headerSuccessors[0];
	} else if (loop.type === eLoopType.POST_TESTED) {
		const latchingNodeSuccessors = graph.getImmSuccessors(latchingNode) as Node[];
		if (loop.hasNode(latchingNodeSuccessors[0])) {
			return latchingNodeSuccessors[1];
		}
		return latchingNodeSuccessors[0];
	} else {
		const loopNodes = loop.nodes as Node[];
		let minIndex = graph.nodes.length;
		for (const node of loopNodes) {
			const successors = graph.getImmSuccessors(node);
			if (successors.length === 2) {
				if (!loop.hasNode(successors[0])) {
					const index = graph.getNodeIndex(successors[0]);
					minIndex = Math.min(minIndex, index);
				} else if (!loop.hasNode(successors[1])) {
					const index = graph.getNodeIndex(successors[1]);
					minIndex = Math.min(minIndex, index);
				}
			}
		}
		if (minIndex !== graph.nodes.length) {
			return graph.nodes[minIndex] as Node;
		}
	}
}

export function structure<Node>(graph: Graph<Node>): Graph<Node> {
	const intervals = graphUtils.split(graph);
	const reducibleInterval =_.find(intervals, 'hasLoop');

	if (reducibleInterval) {
		const latchingNode = reducibleInterval.latchingNodes[0];
		const loop = new LoopGraph<Node>();

		for (const node of reducibleInterval.nodes) {
			loop.addNode(node);
			if (node === latchingNode) {
				break;
			}
		}
		loop.type = getLoopType(graph, loop, reducibleInterval.root, latchingNode);
		loop.followNode = findFollowNode<Node>(graph, loop, reducibleInterval.root as Node, latchingNode as Node);
		return structure(
			graphUtils.replaceNodes(graph, reducibleInterval.root, latchingNode, loop) as Graph<Node>
		);
	}

	return graph;
}
