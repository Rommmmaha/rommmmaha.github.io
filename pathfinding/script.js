class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.isAnimating = false;
    }
    generateGrid() {
        if (this.isAnimating) return;
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.grid[0][0] = 1;
        this.grid[this.rows - 1][this.cols - 1] = 2;
    }
    clearVisited() {
        if (this.isAnimating) return;
        const table = document.getElementById("board");
        if (!table) return;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] === 4 || this.grid[i][j] === 5) {
                    this.grid[i][j] = 0;
                    table.rows[i].cells[j].classList.remove('visited', 'path');
                }
            }
        }
    }
    invertGrid() {
        if (this.isAnimating) return;
        this.clearVisited();
        const table = document.getElementById("board");
        if (!table) return;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] === 3) {
                    this.grid[i][j] = 0;
                    table.rows[i].cells[j].classList.remove('wall');
                } else if (this.grid[i][j] === 0) {
                    this.grid[i][j] = 3;
                    table.rows[i].cells[j].classList.add('wall');
                }
            }
        }
    }
    async dijkstra() {
        this.clearVisited();
        if (this.isAnimating) return;
        this.isAnimating = true;
        const start = [0, 0];
        const end = [this.rows - 1, this.cols - 1];
        const visited = new Set();
        const queue = [[start]];
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        const table = document.getElementById("board");
        while (queue.length > 0) {
            const path = queue.shift();
            const [x, y] = path[path.length - 1];
            const nodeKey = `${x},${y}`;
            if (x === end[0] && y === end[1]) {
                for (const [pathX, pathY] of path) {
                    this.grid[pathX][pathY] = 5;
                    table.rows[pathX].cells[pathY].classList.add('path');
                    await this.delay(50);
                }
                break;
            }
            if (!visited.has(nodeKey)) {
                visited.add(nodeKey);
                if (this.grid[x][y] !== 1 && this.grid[x][y] !== 2) {
                    this.grid[x][y] = 4;
                    table.rows[x].cells[y].classList.add('visited');
                    await this.delay(10);
                }
                for (const [dx, dy] of directions) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < this.rows &&
                        newY >= 0 && newY < this.cols &&
                        !visited.has(`${newX},${newY}`) &&
                        this.grid[newX][newY] !== 3) {
                        queue.push([...path, [newX, newY]]);
                    }
                }
            }
        }
        this.isAnimating = false;
    }
    async aStar() {
        this.clearVisited();
        if (this.isAnimating) return;
        this.isAnimating = true;
        const start = [0, 0];
        const end = [this.rows - 1, this.cols - 1];
        const openSet = [[start, 0]];
        const cameFrom = new Map();
        const gScore = new Map([[start.toString(), 0]]);
        const fScore = new Map([[start.toString(), this.heuristic(start, end)]]);
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        const table = document.getElementById("board");
        while (openSet.length > 0) {
            let lowestFScoreIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i][1] < openSet[lowestFScoreIndex][1]) {
                    lowestFScoreIndex = i;
                }
            }
            const [current] = openSet.splice(lowestFScoreIndex, 1)[0];
            if (current[0] === end[0] && current[1] === end[1]) {
                this.isAnimating = false;
                this.reconstructPath(cameFrom, current, table);
                return;
            }
            if (this.grid[current[0]][current[1]] !== 1 && this.grid[current[0]][current[1]] !== 2) {
                this.grid[current[0]][current[1]] = 4;
                table.rows[current[0]].cells[current[1]].classList.add('visited');
                await this.delay(10);
            }
            for (const [dx, dy] of directions) {
                const neighbor = [current[0] + dx, current[1] + dy];
                if (neighbor[0] >= 0 && neighbor[0] < this.rows &&
                    neighbor[1] >= 0 && neighbor[1] < this.cols &&
                    this.grid[neighbor[0]][neighbor[1]] !== 3) {
                    const tentativeGScore = gScore.get(current.toString()) + 1;
                    if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
                        cameFrom.set(neighbor.toString(), current);
                        gScore.set(neighbor.toString(), tentativeGScore);
                        const neighborFScore = tentativeGScore + this.heuristic(neighbor, end);
                        fScore.set(neighbor.toString(), neighborFScore);
                        let addedToOpenSet = false;
                        for (let i = 0; i < openSet.length; i++) {
                            if (openSet[i][0].toString() === neighbor.toString()) {
                                openSet[i][1] = neighborFScore;
                                addedToOpenSet = true;
                                break;
                            }
                        }
                        if (!addedToOpenSet) {
                            openSet.push([neighbor, neighborFScore]);
                        }
                    }
                }
            }
        }
        this.isAnimating = false;
    }
    heuristic(node, goal) {
        return Math.abs(node[0] - goal[0]) + Math.abs(node[1] - goal[1]);
    }
    async reconstructPath(cameFrom, current, table) {
        this.isAnimating = true;
        const path = [current];
        while (cameFrom.has(current.toString())) {
            current = cameFrom.get(current.toString());
            path.unshift(current);
        }
        for (const [pathX, pathY] of path) {
            this.grid[pathX][pathY] = 5;
            table.rows[pathX].cells[pathY].classList.add('path');
            await this.delay(50);
        }
        this.isAnimating = false;
    }
    async delay(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
    writeGrid() {
        const table = document.getElementById("board");
        if (!table) return;
        if (!table.firstChild) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < this.rows; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < this.cols; j++) {
                    const cell = document.createElement('td');
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    if (this.grid[i][j] === 1) cell.classList.add('start');
                    else if (this.grid[i][j] === 2) cell.classList.add('end');
                    row.appendChild(cell);
                }
                fragment.appendChild(row);
            }
            table.appendChild(fragment);
        } else {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.updateCellClasses(table.rows[i].cells[j], this.grid[i][j]);
                }
            }
        }
    }
    updateCellClasses(cell, value) {
        cell.classList.remove('visited', 'path', 'wall');
        switch (value) {
            case 3:
                cell.classList.add('wall');
                break;
            case 4:
                cell.classList.add('visited');
                break;
            case 5:
                cell.classList.add('path');
                break;
        }
    }
}
let isMouseDown = false;
const board = new Grid(
    Math.floor(window.innerHeight / 32 - 2),
    Math.floor(window.innerWidth / 32 - 2)
);
board.generateGrid();
board.writeGrid();
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) isMouseDown = true;
});
document.addEventListener('mouseup', (event) => {
    if (event.button === 0) isMouseDown = false;
});
document.getElementById('board').addEventListener('mouseover', handleBoardInteraction);
document.getElementById('board').addEventListener('mousedown', handleBoardInteraction);
function handleBoardInteraction(event) {
    if (board.isAnimating) return;
    if (event.type === 'mouseover' && !isMouseDown || !event.target.matches('td')) return;
    const cell = event.target;
    const i = parseInt(cell.dataset.row);
    const j = parseInt(cell.dataset.col);
    if (board.grid[i][j] !== 1 && board.grid[i][j] !== 2) {
        cell.classList.remove('visited', 'path');
        cell.classList.toggle('wall');
        board.grid[i][j] = cell.classList.contains('wall') ? 3 : 0;
    }
}
const startButton1 = document.querySelector("body > nav > ul.left > li:nth-child(1)");
const startButton2 = document.querySelector("body > nav > ul.left > li:nth-child(2)");
const invertButton = document.querySelector("body > nav > ul.right > li:nth-child(1)");
const clearPathButton = document.querySelector("body > nav > ul.right > li:nth-child(2)");
const clearBoardButton = document.querySelector("body > nav > ul.right > li:nth-child(3)");
startButton1.addEventListener('click', () => board.dijkstra());
startButton2.addEventListener('click', () => board.aStar());
invertButton.addEventListener('click', () => board.invertGrid());
clearPathButton.addEventListener('click', () => board.clearVisited());
clearBoardButton.addEventListener('click', () => { board.generateGrid(); board.writeGrid(); });