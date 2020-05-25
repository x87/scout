import Graph from '../graph';

export function complexGraph(): Graph<number> {
  const graph = new Graph<number>();
  const blocks = [];
  for (let i = 0; i < 15; i++) {
    blocks.push(i + 1);
  }
  const [
    b1,
    b2,
    b3,
    b4,
    b5,
    b6,
    b7,
    b8,
    b9,
    b10,
    b11,
    b12,
    b13,
    b14,
    b15,
  ] = blocks;
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

export function endlessLoop(): Graph<number> {
  const graph = new Graph<number>();
  const n1 = 1;
  const n2 = 2;
  const n3 = 3;
  const n4 = 4;
  const n5 = 5;

  graph.addNode(n1, n2, n3, n4, n5);
  graph.addEdge(n1, n2);
  graph.addEdge(n2, n3);
  graph.addEdge(n2, n4);
  graph.addEdge(n3, n4);
  graph.addEdge(n4, n5);
  graph.addEdge(n5, n1);

  return graph;
}

export function ifNestedInLoop(): Graph<number> {
  const graph = new Graph<number>();
  const n1 = 1;
  const n2 = 2;
  const n3 = 3;
  const n4 = 4;
  const n5 = 5;
  const n6 = 6;
  const n7 = 7;

  graph.addNode(n1, n2, n3, n4, n5, n6, n7);

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
