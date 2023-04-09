import { eBasicBlockType } from 'common/enums';
import { IBasicBlock } from 'common/interfaces';
import { Graph } from '../graph';

export function complexGraph(): Graph<IBasicBlock> {
  const graph = new Graph<IBasicBlock>();
  const blocks = nodes(15);
  const [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15] =
    blocks;
  graph.addNode(...blocks);

  graph.addEdge(b1, b2);
  graph.addEdge(b1, b5);

  graph.addEdge(b2, b3);
  graph.addEdge(b2, b4);
  graph.addEdge(b3, b5);
  graph.addEdge(b4, b5);

  graph.addEdge(b5, b6);

  graph.addEdge(b6, b7);
  graph.addEdge(b6, b12);

  graph.addEdge(b7, b8);
  graph.addEdge(b7, b9);
  graph.addEdge(b8, b9);
  graph.addEdge(b8, b10);
  graph.addEdge(b9, b10);
  graph.addEdge(b10, b11);

  graph.addEdge(b12, b13);
  graph.addEdge(b13, b14);
  graph.addEdge(b14, b13);
  graph.addEdge(b14, b15);
  graph.addEdge(b15, b6);

  return graph;
}

export function endlessLoop(): Graph<IBasicBlock> {
  const graph = new Graph<IBasicBlock>();
  const [n1, n2, n3, n4, n5] = nodes(5);

  graph.addNode(n1, n2, n3, n4, n5);
  graph.addEdge(n1, n2);
  graph.addEdge(n2, n3);
  graph.addEdge(n2, n4);
  graph.addEdge(n3, n4);
  graph.addEdge(n4, n5);
  graph.addEdge(n5, n1);

  return graph;
}

export function ifNestedInLoop(): Graph<IBasicBlock> {
  const graph = new Graph<IBasicBlock>();

  const [n1, n2, n3, n4, n5, n6, n7] = nodes(7);

  graph.addNode(n1, n2, n3, n4, n5, n6, n7);
  n1.type = eBasicBlockType.FALL;
  n2.type = eBasicBlockType.TWO_WAY;
  n3.type = eBasicBlockType.FALL;
  n4.type = eBasicBlockType.TWO_WAY;
  n5.type = eBasicBlockType.FALL;
  n6.type = eBasicBlockType.ONE_WAY;
  n5.type = eBasicBlockType.RETURN;

  graph.addEdge(n2, n7);
  graph.addEdge(n6, n2);
  graph.addEdge(n4, n6);
  graph.addEdge(n5, n6);
  graph.addEdge(n4, n5);
  graph.addEdge(n3, n4);
  graph.addEdge(n2, n3);
  graph.addEdge(n1, n2);

  return graph;

  /*
      [1]
       |
   .->[2]----.
   |   |     |
   |  [3]    |
   |   |     |
   |  [4]--. |
   |   |   | |
   |  [5]  | |
   |   |   | |
    --[6]<-  |
             |
      [7]<---
  */
}

function nodes(n: number) {
  const blocks: IBasicBlock[] = [];
  for (let i = 0; i < n; i++) {
    blocks.push({
      type: eBasicBlockType.ONE_WAY,
      instructions: [
        {
          offset: i + 1,
          params: [],
          opcode: i + 1,
        },
      ],
      start: 0
    });
  }
  return blocks;
}
