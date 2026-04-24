let grid, ai, bgColor;
let dropdown, resetBtn;

let { Engine, World, Bodies, Body, Events, Sleeping } = Matter;
let engine, world, tokens = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(25, 150, 255).toString("#rrggbb");

  document.addEventListener("mousedown", e => grid.clicked(e));
  document.addEventListener("contextmenu", e => e.preventDefault());
  
  ai = new AI(2, 2);
  elements();
}

function draw() {
  background(bgColor);
  
  grid.display();
  grid.checkWin();
  
  grid.highlight();
  Engine.update(engine);
  
  for (let token of tokens) {
    token.display();
  }
}

function elements() {
  dropdown = createSelect();
  let el = dropdown;
  
  el.size(150, 35);
  el.position(width / 2 - el.width / 2 - 80, height / 2 - el.height / 2 - 145);
  
  el.style("background-color", "rgb(0, 225, 100)");
  el.style("border-color", "black");
  
  el.style("border-width", "2px");
  el.style("border-radius", "5px");
  
  el.style("color", "black");
  el.style("text-align", "center");
  
  el.style("font-size", "20px");
   el.style("font-family", "monospace");
  
  let options = ["Easy", "Medium (Default)", "Hard", "Play Friend"];
  
  for (let option of options) {
    el.option(option);
  }
  
  el.value("Medium (Default)");
  
  el.input(() => {
    let tx = dropdown.value().toLowerCase();
    
    if (tx === "easy") ai = new AI(2, 1);
    else if (tx === "medium (default)") ai = new AI(2, 2);
    else if (tx === "hard") ai = new AI(2, 3);
    else if (tx === "play friend") ai = null;
    else ai = new AI(2, 2);
    
    grid.init();
  });
  
  resetBtn = createButton("New Game");
  el = resetBtn;
  
  el.size(150, 37);
  el.position(width / 2 - el.width / 2 + 80, height / 2 - el.height / 2 - 145);
  
  el.style("background-color", "rgb(255, 75, 50)");
  el.style("border-color", "black");
  
  el.style("border-width", "2px");
  el.style("border-radius", "5px");
  
  el.style("color", "black");
  el.style("text-align", "center");
  
  el.style("font-size", "20px");
  el.style("font-family", "monospace");
  
  el.mouseClicked(() => grid.init());
  
  engine = Engine.create();
  
  engine.world.gravity.y = 1;
  engine.timing.timeScale = 0.9;
  
  engine.constraintIterations = 10;
  engine.positionIterations = 10;
  
  world = engine.world;
  
  grid = new Grid(1);
  grid.init();
}

class Grid {
  constructor(player) {
    this.grid = [];
    this.won = 0;
    
    this.rows = 7;
    this.cols = this.rows - 1;
    
    this.player = player;
    this.edges = [];
    
    this.lastMove = null;
  }
  
  init() {
    for (let x = 0; x < this.rows; x++) {
      this.grid[x] = [];

      for (let y = 0; y < this.cols; y++) {
        this.grid[x][y] = 0;
      }
    }
    
    if (tokens.length > 0) {
      World.clear(engine.world);
    }
    
    this.player = 1;
    this.edges = [];
    
    tokens = []; 
    
    let offset = 1.25
    
    let rscl = 300;
    let scl = round(rscl / this.rows, rscl / this.cols) - 6;
    
    let w = this.rows * scl;
    let h = 6;
    
    let y = height / 2 + (this.cols * scl) / 2 + 8;
    this.edges.push(Bodies.rectangle(width / 2, y, w, h, {isStatic: true, isSensor: false}));
    
    for (let col = 0; col < this.rows; col++) {
      let w = this.rows * scl;
      let h = this.cols * scl;

      let xoff = (width - w) / 2;
      let yoff = (height - h) / 2;

      let colStart = xoff + col * scl;
      let colEnd = colStart + scl;
      
      let startY = yoff;
      let endY = yoff + h;
      
      let x = colStart;
      let y = startY;
      
      let rw = 2;
      let rh = endY - startY;
      
      this.edges.push(
        Bodies.rectangle(
          x, 
          y + h / 2, 
          rw, 
          rh, 
          {isStatic: true, isSensor: true}
        )
      )
    }
    
    World.add(world, [...this.edges]);
    
    if (ai) ai.transpositionTable = new Map();
  }
  
  display() {
    let rscl = 300;
    let scl = round(rscl / this.rows, rscl / this.cols) - 6;
    
    let board = this.grid;
    let offset = 1.25;

    fill(0, 50, 255);
    noStroke();

    rectMode("center");
    rect(width / 2, height / 2, rscl - 30, rscl - 70, 10);

    for (let x = 0; x < board.length; x++) {
      for (let y = 0; y < board[x].length; y++) {
        let v = board[x][y];
        
        let w = this.rows * scl;
        let h = this.cols * scl;
        
        let xoff = (width - w) / 2;
        let yoff = (height - h) / 2;

        let cx = xoff + x * scl + scl / 2;
        let cy = yoff + y * scl + scl / 2;

        fill(bgColor);

        noStroke();
        circle(cx, cy, scl * 0.8);
      }
    }
    
    fill(0);
    noStroke();

    textSize(40);
    textAlign("center");
    
    if (this.won === 1) {
      text("Red has Won!", width / 2, height / 2 + 150);
    } else if (this.won === 2) {
      text("Yellow has Won!", width / 2, height / 2 + 150);
    } else if (this.won === 3) {
      text("It's a draw!", width / 2, height / 2 + 150);
    }
  }
  
  async clicked(e) {
    if (this.won > 0) return;

    let rscl = 300;
    let scl = round(rscl / this.rows, rscl / this.cols) - 6;
    
    let board = this.grid;
    let offset = 1.25;

    for (let col = 0; col < 7; col++) {
      let w = this.rows * scl;
      let h = this.cols * scl;

      let xoff = (width - w) / 2;
      let yoff = (height - h) / 2;

      let colStart = xoff + col * scl;
      let colEnd = colStart + scl;
      
      let startY = yoff;
      let endY = yoff + h;
      
      if (mouseX > colStart && mouseX < colEnd && mouseY > startY && mouseY < endY) {
        if (this.isValid(col) && this.won <= 0) {
          if (ai) {
            if (!ai.moving) {
              ai.moving = true;
              tokens.push(new Token((colEnd - colStart) - (scl / 2) + colStart, startY, scl * 0.8, 1));

              this.place(col, 1);
              this.lastMove = col;
          
              await setTimeout(async () => {
                let y = tokens[tokens.length - 1].body.position.y - 20;
                let move = await ai.getMove();

                if (ai) this.place(move, 2);
                else grid.player = this.player < 2 ? 1 : 2;

                colStart = xoff + move * scl;
                colEnd = colStart + scl;

                tokens.push(new Token((colEnd - colStart) - (scl / 2) + colStart, startY, scl * 0.8, 2));
              }, 1000);

              setTimeout(() => {ai.moving = false}, 1200);
            }
          } else {
            if (tokens.length === 0 || tokens[tokens.length - 1].body.velocity.y <= 0) {
              this.place(col, this.player);
              tokens.push(new Token((colEnd - colStart) - (scl / 2) + colStart, startY, scl * 0.8, this.player));

              this.player = this.player === 1 ? 2 : 1;
            }
          }
        }
        
        return;
      }
    }
  }
  
  highlight() {
    if (this.won > 0) return;
    
    let rscl = 300;
    let scl = round(rscl / this.rows, rscl / this.cols) - 6;
    
    let board = this.grid;
    let offset = 1.25;

    let startX = width / 2 - (scl * this.rows * offset) / 2;
    let startY = height / 2 - (scl * this.cols * offset) / 2, endY = startY + (scl * this.cols * offset);

    for (let col = 0; col < this.rows; col++) {
      let w = this.rows * scl;
      let h = this.cols * scl;

      let xoff = (width - w) / 2;
      let yoff = (height - h) / 2;

      let colStart = xoff + col * scl;
      let colEnd = colStart + scl;
      
      let startY = yoff;
      let endY = yoff + h;

      if (mouseX > colStart && mouseX < colEnd && mouseY > startY && mouseY < endY) {
        let y = this.findEmptyY(col);

        if (y !== null) {
          let cx = xoff + col * scl + scl / 2;
          let cy = yoff + this.findEmptyY(col) * scl + scl / 2;

          fill(0, 50, 100, 150);
          noStroke();

          circle(cx, cy, scl * 0.8);
        }
      }
    }
  }

  fix(x) {
    if (x <= 0) return 0.4125;
    return 1;
  }

  isValid(x) {
    for (let y = this.grid[x].length - 1; y >= 0; y--) {
      if (this.valid(x, y) && this.grid[x][y] === 0) {
        return true;
      }
    }
    
    return false;
  }
  
  place(x, player) {
    if (this.won > 0) return;
    
    if (x !== null) {
      let y = this.findEmptyY(x);

      if (y !== null) {
        this.grid[x][y] = player;
      }
    }
  }

  findEmptyY(x) {
    if (this.won === null) {
      let board = this.grid;

      for (let y = board[0].length - 1; y >= 0; y--) {
        if (board[x] !== undefined && board[x][y] === 0) return y;
      }

      return 0;
    }
  }
  
  checkWin() {
    this.won = null;
    let directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 1, c: -1 },
    ];

    let isInBounds = (x, y) => x >= 0 && x < this.rows && y >= 0 && y < this.cols;
    
    let cells = [];
    
    for (let x = 0; x < this.rows; x++) {
      for (let y = 0; y < this.cols; y++) {
        if (this.grid[x][y] === 0) {
          cells.push(createVector(x, y));
        }
      }
    }
    
    if (cells.length <= 0) return 3;

    for (let x = 0; x < this.rows; x++) {
      for (let y = 0; y < this.cols; y++) {
        let player = this.grid[x][y];
        if (player === 0) continue;

        for (let dir of directions) {
          let count = 1;

          for (let step = 1; step < 4; step++) {
            let newX = x + dir.c * step;
            let newY = y + dir.r * step;
            
            if (isInBounds(newX, newY) && this.grid[newX][newY] === player) count++;
            else break;
          }

          if (count === 4) {
            this.won = player;
            return;
          }
        }
      }
    }
  }
  
  valid(x, y) {
    return (
      this.grid !== undefined &&
      this.grid[x] !== undefined &&
      this.grid[x][y] !== undefined
    );
  }
  
  show(board) {
    let tx = "";
    
    for (let x = 0; x < board[0].length; x++) {
      for (let y = 0; y < board.length; y++) {
        tx += board[y][x] + " ";
      }
      
      tx += "\n";
    }
    
    console.log(tx);
  }
}

class AI {
  constructor(player, difficulty) {
    this.player = player;
    this.difficulty = difficulty;
    
    this.transpositionTable = new Map();
    this.moving = false;
  }

  async getMove() {
    let result = await this.minimax(grid.grid, this.getDepth());
    
    console.log(result);
    return result.move;
  }

  
  getDepth() {
    let keys = {
      1: 1,
      2: 5,
      3: 8
    };
    
    let d = this.difficulty;
    return keys[d] ? keys[d] : keys[2];
  }

  async minimax(board, depth, a = -Infinity, b = Infinity, maxing = true) {
    let hash = this.hashBoard(board);
    let terminal = this.checkTerminal(board);
    
    if (this.transpositionTable.has(hash)) {
      let v = this.transpositionTable.get(hash);
      return {move: v.move, score: v.score};
    }
    
    if (terminal) return { score: terminal.score };
    if (depth === 0) return { score: this.evaluate(board) };

    let moves = this.getMoves(board, depth);
    let bestMove = null;

    if (maxing) {
      for (let move of moves) {
        let y = this.getY(board, move);
        let newBoard = this.simulate(1, move, y);
        
        let { score } = await this.minimax(newBoard, depth - 1, a, b, false);

        if (score > a) {
          a = score;
          bestMove = move;
        }

        if (a >= b) break;
      }
      
      this.transpositionTable.set(hash, {move: bestMove, score: a});
      return {move: bestMove, score: this.evaluate(board)};
    } else {
      for (let move of moves) {
        let y = this.getY(board, move);
        let newBoard = this.simulate(2, move, y);
        
        let { score } = await this.minimax(newBoard, depth - 1, a, b, true);

        if (score < b) {
          b = score;
          bestMove = move;
        }
        
        if (a >= b) break;
      }
      
      this.transpositionTable.set(hash, {move: bestMove, score: b});
      return {move: bestMove, score: this.evaluate(board)};
    }
  }
  
  getMoves(board, depth) {
    let moves = [];
    let score = 0, last = grid.lastMove;

    for (let x = 0; x < board.length; x++) {
      let y = this.getY(board, x);
      
      if (board[x][y] === 0) {
        moves.push(x);
        score = this.move(x, y, board);
      }
    }
    
    let sorted = moves.sort((a, b) => {
      let weight = 1e-2;
      
      let distanceA = abs(a - last);
      let distanceB = abs(b - last);

      let sortValueA = distanceA + weight * score;
      let sortValueB = distanceB + weight * score;

      return sortValueA - sortValueB;
  });
    
    console.log(sorted, score);
    return sorted;
  }
  
  move(x, y, board) {
    let score = {};
    
    for (let i = 1; i <= 2; i++) {
      let temp = board.map(row => row.slice());
      
      if (temp[x] !== undefined) temp[x][y] = i;
      score[i] = this.evaluate(temp);
    }
    
    return (
      Object.values(score)[0] + Object.values(score)[1]
    ) / 2;
  }
  
  add(board) {
    let count = 0;
    let directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 0, c: -1 },
      { r: -1, c: 0 },
      { r: 1, c: -1 },
    ];

    let isInBounds = (x, y) => x >= 0 && x < grid.rows && y >= 0 && y < grid.cols;
    let cells = [];
    
    for (let x = 0; x < grid.rows; x++) {
      for (let y = 0; y < grid.cols; y++) {
        if (board[x][y] === 0) {
          cells.push(createVector(x, y));
        }
      }
    }
    
    if (cells.length <= 0) return 0;

    for (let x = 0; x < grid.rows; x++) {
      for (let y = 0; y < grid.cols; y++) {
        let player = board[x][y];

        for (let dir of directions) {
          for (let step = -3; step <= 4; step++) {
            let newX = x + dir.c * step;
            let newY = y + dir.r * step;
            
            if (isInBounds(newX, newY)) {
              if (player === 1) count++;
            }
          }
        }
      }
    }
    
    return count;
  }
  
  hashBoard(board) {
    return board.map(row => row.join("")).join("|");
  }
  
  evaluate(board) {
    let p = this.player;
    let o = p === 1 ? 2 : 1;

    let c = board.length;
    let r = board[0] ? board[0].length : 0;

    let clone = (b) => b.map(col => col.slice());

    let pi = 0;
    let oi = 0;
    
    for (let x = 0; x < c; x++) {
      let y = this.getY(board, x);
      if (y === null) continue;

      let tb = clone(board);
      
      if (tb[x] !== undefined) tb[x][y] = p;
      if (this.checkState(tb, p)) pi++;

      let to = clone(board);
      
      if (to[x] !== undefined) to[x][y] = o;
      if (this.checkState(to, o)) oi++;
    }

    let near = pl => {
      let n = 0;
      
      for (let x = 0; x < c; x++) {
        let y = this.getY(board, x);
        if (y === null) continue;
        
        let t = clone(board);
        t[x][y] = pl;
        
        for (let cx = 0; cx < c; cx++) {
          for (let cy = 0; cy < r; cy++) {
            if (t[cx][cy] !== pl) continue;
            let dirs = [
              { dx: 1, dy: 0 },
              { dx: 0, dy: 1 },
              { dx: 1, dy: 1 },
              { dx: 1, dy: -1 }
            ];
            
            for (let { dx, dy } of dirs) {
              let cnt = 1;
              let emp = 0;
              
              for (let s = 1; s < 4; s++) {
                let nx = cx + dx * s;
                let ny = cy + dy * s;
                
                if (nx < 0 || nx >= c || ny < 0 || ny >= r) break;
                if (t[nx][ny] === pl) cnt++;
                
                else if (t[nx][ny] === 0) emp++;
                else { emp = 10; break; }
              }
              for (let s = 1; s < 4; s++) {
                let nx = cx - dx * s;
                let ny = cy - dy * s;
                
                if (nx < 0 || nx >= c || ny < 0 || ny >= r) break;
                if (t[nx][ny] === pl) cnt++;
                
                else if (t[nx][ny] === 0) emp++;
                else { emp = 10; break; }
              }
              
              if (cnt === 3 && emp >= 1 && emp <= 2) n++;
            }
          }
        }
      }
      
      return n;
    };

    let pn = near(p);
    let on = near(o);

    let pp = this.countPotential(board, p);
    let op = this.countPotential(board, o);

    let cc = Math.floor(c / 2);
    let ctr = 0;
    
    for (let y = 0; y < r; y++) {
      if (board[cc] && board[cc][y] === p) ctr++;
      if (board[cc] && board[cc][y] === o) ctr--;
    }

    let pc = 0;
    let oc = 0;
    
    for (let x = 0; x < c; x++) {
      for (let y = 0; y < r; y++) {
        if (board[x][y] === p) pc++;
        else if (board[x][y] === o) oc++;
      }
    }
    
    let pd = pc - oc;
    let wi = 10000;
    
    let wn = 200;
    let wp = 2;
    
    let wc = 6;
    let wpc = 1;

    let s =
      (pi - oi) * wi +
      (pn - on) * wn +
      (pp - op) * wp +
      ctr * wc +
      pd * wpc;

    if (!isFinite(s)) s = 0;
    return s;
  }

  simulate(player, x, y, board = grid.grid) {
    let temp = board.map(row => row.slice());

    if (grid.valid(x, y)) {
      temp[x][y] = player;
      return temp;
    }

    return temp;
  }
  
  countPotential(board, player) {
    let count = 0;
    let directions = [
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 0, c: -1 },
      { r: -1, c: 0 },
      { r: 1, c: -1 },
    ];

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        for (let { r: dr, c: dc } of directions) {
          let potential = 1;

          for (let step = -3; step <= 4; step++) {
            let newRow = r + dr * step;
            let newCol = c + dc * step;

            if (
              newRow >= 0 &&
              newRow < board.length &&
              newCol >= 0 &&
              newCol < board[0].length &&
              (board[newRow][newCol] === player || board[newRow][newCol] === 0)
            ) {
              potential++;
            } else break;
          }

          count += potential;
        }
      }
    }
    
    return count;
  }

  getY(board, x) {
    for (let y = board[0].length - 1; y >= 0; y--) {
      if (board[x] && board[x][y] === 0) return y;
    }
    
    return null;
  }

  checkTerminal(board) {
    if (this.checkState(board, 2)) return { score: 1000 };
    if (this.checkState(board, 1)) return { score: -1000 };

    return 0;
  }

  checkState(state, player) {
    let directions = [
      {r: 0, c: 1},
      {r: 1, c: 0},
      {r: 1, c: 1},
      {r: 1, c: -1}
    ];

    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[0].length; c++) {
        if (state[r][c] !== player) continue;

        for (let { r: dr, c: dc } of directions) {
          let count = 1;

          for (let step = 1; step < 4; step++) {
            let newRow = r + dr * step;
            let newCol = c + dc * step;

            if (
              newRow >= 0 &&
              newRow < state.length &&
              newCol >= 0 &&
              newCol < state[0].length &&
              state[newRow][newCol] === player
            ) {
              count++;
            } else break;
          }

          if (count === 4) return true;
        }
      }
    }

    return false;
  }

  isValidMove(board, x, y) {
    return (
      board[x] !== undefined &&
      board[x][y] !== undefined &&
      board[x][y] === 0
    );
  }
}

class Token {
  constructor(x, y, radius, player) {
    let rscl = 300;
    let scl = round(rscl / grid.rows, rscl / grid.cols) - 10;
    
    let c = Bodies.circle(x, y, radius / 2, {
      isSensor: false,
      isStatic: false,
      render: {visible: false}
    });
    let r = Bodies.rectangle(
      x, 
      y - 14.4, 
      scl / 2, 
      scl / 2, 
    {
      isStatic: true,
      isSensor: false,
      render: {visible: false}
    });
    
    this.radius = radius;
    this.body = Body.create({
      parts: [c, r],
      restitution: 0.5
    });
    
    this.player = player;
    this.initX = x;

    this.timer = 0;
    World.add(world, this.body);
  }

  display() {
    Body.setPosition(this.body, {x: this.initX, y: this.body.position.y});
    let pos = this.body.position;
    
    if (this.body.velocity.y <= 0) {
      this.timer++;
      
      if (this.timer > 60) {
        Sleeping.set(this.body, true);
        Body.setStatic(this.body, true);
      }
    }
    
    if (this.player === 1) fill(255, 50, 50);
    else if (this.player === 2) fill(255, 255, 50);
    
    noStroke();
    circle(pos.x, pos.y, this.radius);
  }
}