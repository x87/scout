import * as utils from 'utils';
import Graph from './graph';
import Arguments from 'common/arguments';

import { IBasicBlock } from 'common/interfaces';
import { eBasicBlockType } from 'common/enums';

function reduce<Node>(graph: Graph<Node | Interval<Node>>): Graph<Interval<Node>> {
	const intervals = findIntervals(graph);
	const g = new Graph<Interval<any>>();
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
	return g.nodes.length > 1 ? reduce(g) : g;
}

export function findIntervals<Node>(graph: Graph<Node>): Array<Interval<Node>> {
	if (graph.nodes.length < 1) {
		return [];
	}
	const headers: Node[] = [graph.root];
	const intervals: Array<Interval<Node>> = [];
	const visited: boolean[] = [];

	const isCandidateNode = (g: Graph<Node>, n: Node): boolean => {
		return !visited[graph.getNodeIndex(n)] && !g.nodes.includes(n);
	};

	const markVisited = (node: Node): void => {
		visited[graph.getNodeIndex(node)] = true;
	};

	const addNode = (interval: Interval<Node>, node: Node): void => {
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
		const interval = new Interval<Node>();

		markVisited(header);
		addNode(interval, header);
		let found;
		do {
			found = false;
			graph.nodes.forEach((node: Node) => {
				if (isCandidateNode(interval, node)) {
					const pred = graph.getImmPredecessors(node);
					if (pred.length && utils.checkArrayIncludesArray(interval.nodes, pred)) {
						addNode(interval, node);
						markVisited(node);
						found = true;
					}
				}
			});
		} while(found);

		graph.nodes.forEach((node: Node) => {
			if (isCandidateNode(interval, node)) {
				const pred = graph.getImmPredecessors(node);
				if (pred.length && utils.checkArrayIncludeItemFromArray(interval.nodes, pred)) {
					headers.push(node);
				}
			}
		});
		intervals.push(interval);
	}

	return intervals;
}

export default class Interval<Node> extends Graph<Node> {

	get latchingNodes(): Node[] {
		const header = this.root;
		return this.nodes.filter(node => this.getImmSuccessors(node).includes(header));
	}

}

if (Arguments.debugMode) {
	const g1: Graph<IBasicBlock> = new Graph<IBasicBlock>();
	const a: IBasicBlock = { type: eBasicBlockType.UNDEFINED, instructions: [] };
	const b: IBasicBlock = { type: eBasicBlockType.RETURN, instructions: [] };
	const c: IBasicBlock = { type: eBasicBlockType.ONE_WAY, instructions: [] };
	const d: IBasicBlock = { type: eBasicBlockType.TWO_WAY, instructions: [] };
	const e: IBasicBlock = { type: eBasicBlockType.FALL, instructions: [] };
	const f: IBasicBlock = { type: eBasicBlockType.CALL, instructions: [] };

	g1.addNode(a, f, d, c, b, e);
	g1.addEdge(a, b);
	g1.addEdge(b, c);
	g1.addEdge(c, d);
	g1.addEdge(d, b);
	g1.addEdge(b, e);
	g1.addEdge(e, f);
	g1.addEdge(e, a);

	console.log(JSON.stringify(reduce(g1), null, 4));
}
