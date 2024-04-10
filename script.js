let cv, ctx;
let grid;
let w;
let start;
let stop;
let openSet = [];
let closedSet = [];
let path = [];
let done = false;
let frameRate = 30;
let time = {};
let openElem;
let closedElem;
let distElem;
let distMax;
let slowMode = window.confirm('Ok para um caminho mais curto e cancelar para um caminho mais rápido.') ? 'f' : 'h';

window.onload = () => setup();

const setup = function() {
  cv = document.querySelector('canvas');
  ctx = cv.getContext('2d');
  background(cv, 'white');
  openElem = document.getElementById('open');
  closedElem = document.getElementById('close');
  distElem = document.getElementById('dist');

  let n = Number(window.prompt('Queres uma grid de quanto por quanto?')) || 100;
  // frameRate = 2 * n * 10 / 1000;
  w = cv.width / n;
  //Build The Grid
  grid = new Matrix(n, n, w);
  grid.map((val, i, j) => new Spot(Math.random() < 0.35, i, j, val));
  let top = false;
  let is = Math.randInt(grid.rows - 1) * !top;
  let js = Math.randInt(grid.cols - 1) * !top;
  let ie = Math.randInt(grid.rows - 1) * !top + top * (grid.rows - 1);
  let je = Math.randInt(grid.cols - 1) * !top + top * (grid.cols - 1);
  grid.data[is][js].blocked = false;
  grid.data[ie][je].blocked = false;
  grid.start = grid.data[is][js];
  grid.end = grid.data[ie][je];
  //Adding the Neighbors (Diagonals Optional)
  let diagonal = window.confirm('Um Caminho Pelas Diagonais é Válido');
  grid.forEach(spot => spot.addNeighbors(grid, diagonal));

  //Starting the open set with the start location
  openSet.push(grid.start);

  //Show The Grid
  showGrid();
  // console.log(grid.data);
  // console.log(w);
  // console.log(grid.start, grid.end);
  // console.log(openSet);
  // console.log(closedSet);
  openSet.forEach(spot => spot.show(ctx, rgb(10, 200, 10)));
  closedSet.forEach(spot => spot.show(ctx, rgb(200, 10, 10)));
  time.start = window.performance.now();
  distMax = Math.dist(grid.start.j, grid.start.i, grid.end.j, grid.end.i);
  draw();
  // setInterval(drawSpots, 100);
};

const showGrid = function() {
  ctx.strokeStyle = 'white';
  grid.forEach((spot, i, j) => {
    if (i == grid.start.i && j == grid.start.j) ctx.fillStyle = 'green';
    else if (i == grid.end.i && j == grid.end.j) ctx.fillStyle = 'red';
    else if (spot.blocked == true) ctx.fillStyle = 'black';
    else if (spot.blocked == false) ctx.fillStyle = 'white';
    spot.show(ctx);
  });
};

const drawSpots = function() {
  // background(cv, 'white');
  openSet.forEach(spot => spot.show(ctx, rgb(10, 200, 10), true));
  closedSet.forEach(spot => spot.show(ctx, rgb(200, 10, 10), true));
  // path.forEach(spot => spot.show(ctx, rgb(10, 10, 200),false));
  // showGrid();
  ctx.strokeStyle = rgb(237, 153, 18)
  ctx.lineWidth = 5;
  for (let i = 1; i < path.length; i++) {
    let v = createVector(path[i].j, path[i].i).add(0.5).mult(w);
    let vp = createVector(path[i - 1].j, path[i - 1].i).add(0.5).mult(w);
    ctx.line(vp.x, vp.y, v.x, v.y);
  }

  openElem.innerHTML = 'Open Set: ' + openSet.length;
  closedElem.innerHTML = 'Closed Set: ' + closedSet.length;
  // if (path.length > 1) distElem.innerHTML = 'Distância: ' + map(Math.dist(path[0].j, path[0].i, grid.end.j, grid.end.i), 0, distMax, 100, 0) + '%.';

}

const draw = function() {
  drawSpots();
  if (openSet.length > 0 && !done) {
    //Keep Going
    let lowestIndex = openSet.min(true, slowMode);
    let current = openSet[lowestIndex];
    //  Find The Path from start to current
    let temp = current;
    path = [temp];
    if (temp.previous) {
      do {
        path.push(temp.previous);
        temp = temp.previous;
      } while (temp.previous);
    }
    //If we found the path to the goal end the loop
    if (current === grid.end) done = true;
    openSet.splice(lowestIndex, 1);
    closedSet.push(current);
    current.closed = true;
    for (let neighbor of current.neighbors) {
      if (neighbor.blocked || neighbor.closed) continue; // if it is a wall or it is included in the closedSet then skip
      let tempGScore = current.g + Math.dist(current.j, current.i, neighbor.j, neighbor.i);
      let newPath = false;
      if (openSet.includes(neighbor)) {
        if (tempGScore < neighbor.g) {
          neighbor.g = tempGScore;
          newPath = true;
        }
      } else {
        neighbor.g = tempGScore;
        newPath = true;
        openSet.push(neighbor);
      }

      if (newPath) {
        let heuristic = (a, b, type = 1) => type == 1 ? Math.dist(a.j, a.i, b.j, b.i) : Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
        neighbor.h = heuristic(neighbor, grid.end);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previous = current;
      }
    }
    setTimeout(draw, frameRate + map(closedSet.length, 2000, 16000, 10, 150));
  } else {
    if (!done) console.log('Done!!!', 'No Solutions!');
    time.stop = window.performance.now();
    console.log('Done!!!', parseInt(time.stop - time.start, 10) / 1000 + ' seconds.');
    // path.forEach(spot => spot.show(ctx, rgb(10, 10, 200),false));
    ctx.strokeStyle = rgb(237, 153, 18);
    ctx.lineWidth = 5;
    for (let i = 1; i < path.length; i++) {
      let v = createVector(path[i].j, path[i].i).add(0.5).mult(w);
      let vp = createVector(path[i - 1].j, path[i - 1].i).add(0.5).mult(w);
      ctx.line(vp.x, vp.y, v.x, v.y);
    }
  };
}

class Spot {
  constructor(block, i, j, w) {
    this.blocked = block;
    this.i = i;
    this.j = j;
    this.w = w;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.n = i * grid.rows + j;
    this.neighbors = [];
    this.previous = undefined;
    this.closed = false;
  }

  show(context = document.querySelector('canvas').getContext('2d'), cor = context.fillStyle, drawRect = false) {
    context.fillStyle = 'white';
    if (drawRect) context.fillRect(this.j * this.w, this.i * this.w, this.w, this.w);
    context.fillStyle = cor;
    context.ellipse((this.j + 0.5) * this.w, (this.i + 0.5) * this.w, this.w * 0.5, this.w * 0.5, true);
  }

  addNeighbors(grid, diagonals = true) {
    if (this.i > 0) this.neighbors.push(grid.data[this.i - 1][this.j]); //Cima
    if (this.j > 0) this.neighbors.push(grid.data[this.i][this.j - 1]); //Esquerda
    if (this.j < grid.cols - 1) this.neighbors.push(grid.data[this.i][this.j + 1]); //Direita
    if (this.i < grid.rows - 1) this.neighbors.push(grid.data[this.i + 1][this.j]); //Baixo
    if (!diagonals) return;
    if (this.i > 0 && this.j > 0) this.neighbors.push(grid.data[this.i - 1][this.j - 1]); //Superior Esquerdo
    if (this.i > 0 && this.j < grid.rows - 1) this.neighbors.push(grid.data[this.i - 1][this.j + 1]); //Superior Direito
    if (this.i < grid.rows - 1 && this.j > 0) this.neighbors.push(grid.data[this.i + 1][this.j - 1]); //Inferior Esquerdo
    if (this.i < grid.rows - 1 && this.j < grid.rows - 1) this.neighbors.push(grid.data[this.i + 1][this.j + 1]); //Inferior Direito
  }
}
