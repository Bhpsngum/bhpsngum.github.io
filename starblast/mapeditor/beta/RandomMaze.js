(function(){
  var randomMaze = function ()
  {
    'use strict'

    var MAP_SIZE = this.size;

    var CELLS = MAP_SIZE / 2;
    var DIRECTIONS = ['north', 'south', 'east', 'west'];

    function Cell() {
      this.visited = false;
      this.walls = {'north': true, 'south': true, 'east': true, 'west': true};
      this.neighbours = {'north': null, 'south': null, 'east': null, 'west': null};
    }

    Cell.prototype.carveTo = function(direction){
      this.walls[direction] = false;
      this.neighbours[direction].walls[inverseDirection(direction)] = false;
      this.neighbours[direction].visited = true;
    }


    function inverseDirection(direction){
      switch (direction){
        case 'north':
          return 'south';
        case 'south':
          return 'north';
        case 'east':
          return 'west';
        case 'west':
          return 'east';
        default:
          return (undefined);
      }
    }


    function mod(x, n){
      return ((x % n) + n) % n
    }

    function initCellMap(){
      var cellMap = [];

      for (var i = 0; i < CELLS; i++){
        cellMap[i] = []
        for (var j = 0; j < CELLS; j++){
          cellMap[i].push(new Cell());
        }
      }

      for (var i = 0; i < CELLS; i++){
        for (var j = 0; j < CELLS; j++){
          cellMap[i][j].neighbours['north'] = cellMap[mod(i - 1, CELLS)][j];
          cellMap[i][j].neighbours['south'] = cellMap[mod(i + 1, CELLS)][j];
          cellMap[i][j].neighbours['east'] = cellMap[i][mod(j + 1, CELLS)];
          cellMap[i][j].neighbours['west'] = cellMap[i][mod(j - 1, CELLS)];
        }
      }
      return (cellMap);
    }

    function isSurrounded(cell){
      for (var i = 0; i < 4; i++){
        if (!cell.neighbours[DIRECTIONS[i]].visited){
          return (false);
        }
      }
      return (true);
    }

    function selectRandomDirection(cell){

      var i = Math.floor(Math.random() * 4);
      var inc = 1;
      if (Math.random() >= 0.5){
        inc = -1;
      }
      while (cell.neighbours[DIRECTIONS[i]].visited){
        i = mod(i + inc, 4);
      }
      return (DIRECTIONS[i]);
    }

    function walk(start){

      var current = start;
      var direction;
      var count = 0;
      while (!isSurrounded(current) && count < (CELLS * CELLS) / 5){
        direction = selectRandomDirection(current);
        current.carveTo(direction);
        current = current.neighbours[direction];
        count++;
      }
    }

    function selectNewStart(cMap){

      var modeI = Math.floor(Math.random() * 2);
      var modeJ = Math.floor(Math.random() * 2);
      var incI = 1;
      var incJ = 1;
      var limI = CELLS;
      var limJ = CELLS;
      if (modeI){
        incI = -1;
        limI = -1;
      }
      if (modeJ){
        incJ = -1;
        limJ = -1;
      }
      for (var i = modeI * (CELLS - 1); i !== limI; i += incI){
        for (var j = modeJ * (CELLS - 1); j !== limJ; j += incJ){
          if (cMap[i][j].visited && !isSurrounded(cMap[i][j])){
            return (cMap[i][j]);
          }
        }
      }
      return (undefined);
    }

    function generateMaze(){
      var cellMap;
      var maze = "";
      var line1;
      var line2;
      var start;

      cellMap = initCellMap();

      cellMap[Math.floor(CELLS / 2)][Math.floor(CELLS / 2)].visited = true;
      while (true){
        start = selectNewStart(cellMap);
        if (start === undefined){
          break;
        }
        walk(start);
      }

      for (var i = 0; i < CELLS ; i++){
        line1 = "";
        line2 = "";
        for (var j = 0; j < CELLS; j++){
          line1 += " ";
          line1 += cellMap[i][j].walls['east'] ? "9" : " ";
          line2 += cellMap[i][j].walls['south'] ? "9" : " ";
          line2 += "9";
        }
        line1 += "\n";
        if (i < CELLS - 1){
          line2 += "\n";
        }
        maze += line1;
        maze += line2;
      }
      return (maze);
    }

    return generateMaze();
  }
  window.bindRandomMaze = function (object) {
    Object.assign(object, {
      randomMaze: randomMaze
    })
  }
})();
