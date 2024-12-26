// Class representing the grid for the pathfinding visualization
class Grid {
    // Constructor initializes the grid with given rows and columns
    constructor(rows, cols) {
        this.rows = rows;   // Number of rows in the grid
        this.cols = cols;   // Number of columns in the grid
        this.grid = [];     // 2D array representing the grid, initialized as empty
        this.isAnimating = false; // Flag to indicate if an animation is in progress
    }

    // Generates the grid with start (1) and end (2) points
    generateGrid() {
        // Create a 2D array filled with 0s (empty cells)
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        // Set the start point at the top-left corner (1)
        this.grid[0][0] = 1;
        // Set the end point at the bottom-right corner (2)
        this.grid[this.rows - 1][this.cols - 1] = 2;
    }

    // Clears the visited and path cells from the grid, visually and in data
    clearVisited() {
        const table = document.getElementById("board"); // Get the HTML table element
        if (!table) return; // If table doesn't exist, exit the function

        // Iterate through all cells in the grid
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // Check if the cell is visited (4) or part of a path (5)
                if (this.grid[i][j] === 4 || this.grid[i][j] === 5) {
                    this.grid[i][j] = 0; // Reset the cell value to 0 (empty)
                    // Remove 'visited' and 'path' classes from the cell's HTML element
                    table.rows[i].cells[j].classList.remove('visited', 'path');
                }
            }
        }
    }

    // Dijkstra's algorithm implementation for pathfinding
    async dijkstra() {
        if (this.isAnimating) return; // Prevent concurrent animations
        this.isAnimating = true; // Set the animation flag
        this.clearVisited(); // Clear previous visited/path markings

        const start = [0, 0];  // Start coordinates
        const end = [this.rows - 1, this.cols - 1]; // End coordinates
        const visited = new Set(); // Keep track of visited nodes
        const queue = [[start]]; // Queue for cells to explore, starts with initial cell
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // Possible directions to move
        const table = document.getElementById("board"); // Get the HTML table element

        // Main loop while there are cells to explore
        while (queue.length > 0) {
            const path = queue.shift(); // Get the current path
            const [x, y] = path[path.length - 1]; // Get coordinates of current node
            const nodeKey = `${x},${y}`;  // Unique key for the current node

            // If current node is the end node, reconstruct and visualize the path
            if (x === end[0] && y === end[1]) {
                // Iterate through the path and add the path class to the html element
                for (const [pathX, pathY] of path) {
                    this.grid[pathX][pathY] = 5; // Mark as part of the path
                    table.rows[pathX].cells[pathY].classList.add('path');
                    await this.delay(50); // Delay to visualize path
                }
                this.isAnimating = false;  // Reset animation flag
                return; // Exit the function
            }

            // If the node has not been visited, mark it as visited
            if (!visited.has(nodeKey)) {
                visited.add(nodeKey); // Add to the set of visited nodes

                // If the node is not start or end, add visited class and delay
                if (this.grid[x][y] !== 1 && this.grid[x][y] !== 2) {
                    this.grid[x][y] = 4; // Mark the cell as visited
                    table.rows[x].cells[y].classList.add('visited');
                    await this.delay(10); // Delay to visualize visit
                }

                // Explore neighboring nodes
                for (const [dx, dy] of directions) {
                    const newX = x + dx;
                    const newY = y + dy;

                    // Check if the neighbor is within bounds, not visited, and not a wall
                    if (newX >= 0 && newX < this.rows &&
                        newY >= 0 && newY < this.cols &&
                        !visited.has(`${newX},${newY}`) &&
                        this.grid[newX][newY] !== 3) {
                        queue.push([...path, [newX, newY]]); // Add neighbor to queue with updated path
                    }
                }
            }
        }

        this.isAnimating = false; // Reset animation flag if no path is found
    }

    // A* search algorithm implementation for pathfinding
    async aStar() {
        if (this.isAnimating) return; // Prevent concurrent animations
        this.isAnimating = true; // Set animation flag
        this.clearVisited(); // Clear visited and path cells

        const start = [0, 0]; // Start coordinates
        const end = [this.rows - 1, this.cols - 1];  // End coordinates
        const openSet = [[start, 0]];  // Set of nodes to evaluate, start with initial node and a dummy fscore
        const cameFrom = new Map(); // Keep track of path for reconstruction
        const gScore = new Map([[start.toString(), 0]]);  // Actual cost from start to the node
        const fScore = new Map([[start.toString(), this.heuristic(start, end)]]); // Estimated cost from start to end through the node
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];  // Possible directions to move
        const table = document.getElementById("board");   // Get the HTML table element

        // Loop while there are cells to explore
        while (openSet.length > 0) {
            let lowestFScoreIndex = 0;
            // Find the node with the lowest F score in the open set
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i][1] < openSet[lowestFScoreIndex][1]) {
                    lowestFScoreIndex = i;
                }
            }

            const [current] = openSet.splice(lowestFScoreIndex, 1)[0]; // Get the node with the lowest F score from open set

            // If current node is the end node, reconstruct the path and stop the animation
            if (current[0] === end[0] && current[1] === end[1]) {
                this.reconstructPath(cameFrom, current, table);
                this.isAnimating = false;
                return;
            }

            // if not start or end, mark current cell as visited and visualize
            if (this.grid[current[0]][current[1]] !== 1 && this.grid[current[0]][current[1]] !== 2) {
                this.grid[current[0]][current[1]] = 4;
                table.rows[current[0]].cells[current[1]].classList.add('visited');
                await this.delay(10);
            }

            // Explore the neighbor nodes
            for (const [dx, dy] of directions) {
                const neighbor = [current[0] + dx, current[1] + dy]; // coordinates of the neighbor

                // Check if neighbor is valid (within the grid and not a wall)
                if (neighbor[0] >= 0 && neighbor[0] < this.rows &&
                    neighbor[1] >= 0 && neighbor[1] < this.cols &&
                    this.grid[neighbor[0]][neighbor[1]] !== 3) {

                    const tentativeGScore = gScore.get(current.toString()) + 1; // Calculate new G score

                    // If the G score is better, add neighbor to the openSet
                    if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
                        cameFrom.set(neighbor.toString(), current); // Update path record
                        gScore.set(neighbor.toString(), tentativeGScore); // Update G score
                        const neighborFScore = tentativeGScore + this.heuristic(neighbor, end); // Calculate F score
                        fScore.set(neighbor.toString(), neighborFScore); // Update F score

                        // Check if neighbour already exist in the openSet, update fscore if true
                        let addedToOpenSet = false;
                        for (let i = 0; i < openSet.length; i++) {
                            if (openSet[i][0].toString() === neighbor.toString()) {
                                openSet[i][1] = neighborFScore;
                                addedToOpenSet = true;
                                break;
                            }
                        }

                        // If the neighbor is new, add it to the open set
                        if (!addedToOpenSet) {
                            openSet.push([neighbor, neighborFScore]);
                        }
                    }
                }
            }
        }
        this.isAnimating = false; // Reset animation flag if no path is found
    }


    // Heuristic function for A*, Manhattan distance
    heuristic(node, goal) {
        return Math.abs(node[0] - goal[0]) + Math.abs(node[1] - goal[1]);
    }

    // Reconstruct the path found by A* algorithm
    async reconstructPath(cameFrom, current, table) {
        const path = [current]; // Initialize with the end node
        // Trace back from end to start to reconstruct the path
        while (cameFrom.has(current.toString())) {
            current = cameFrom.get(current.toString());
            path.unshift(current); // Add node to the start of the path
        }

        // Mark each node in the path on the visual grid
        for (const [pathX, pathY] of path) {
            this.grid[pathX][pathY] = 5; // Mark as path cell in data
            table.rows[pathX].cells[pathY].classList.add('path'); // Add 'path' class for visual effect
            await this.delay(50); // Add delay for animation
        }
    }


    // Simple delay function for animations
    async delay(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // Writes the grid to the HTML table
    writeGrid() {
        const table = document.getElementById("board");
        if (!table) return; // If the table doesn't exist, exit

        // If the table is empty create and fill it
        if (!table.firstChild) {
            const fragment = document.createDocumentFragment();

            // Loop through all rows and columns
            for (let i = 0; i < this.rows; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < this.cols; j++) {
                    const cell = document.createElement('td'); // Create a cell
                    cell.dataset.row = i;  // Set row and column dataset
                    cell.dataset.col = j;

                    // Add CSS classes based on the value of the grid
                    if (this.grid[i][j] === 1) cell.classList.add('start'); // Start cell
                    else if (this.grid[i][j] === 2) cell.classList.add('end'); // End cell

                    row.appendChild(cell); // Add cell to row
                }
                fragment.appendChild(row); // Add row to fragment
            }
            table.appendChild(fragment); // Add the fragment to the table
        } else {
            // if table already exist, update cell classes
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.updateCellClasses(table.rows[i].cells[j], this.grid[i][j]);
                }
            }
        }
    }

    // Updates CSS classes of a cell based on grid value
    updateCellClasses(cell, value) {
        cell.classList.remove('visited', 'path', 'wall'); // Remove classes first
        switch (value) {
            case 3: // Wall
                cell.classList.add('wall');
                break;
            case 4: // Visited cell
                cell.classList.add('visited');
                break;
            case 5: // Path cell
                cell.classList.add('path');
                break;
        }
    }
}

// Variable to track if mouse button is pressed
let isMouseDown = false;
// Initialize grid with dimensions
const board = new Grid(
    Math.floor(window.innerHeight / 32 - 3),
    Math.floor(window.innerWidth / 32 - 2)
);
board.generateGrid(); // Generate the initial grid
board.writeGrid(); // Write the grid to the HTML table


// Event listeners for mouse interaction
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) isMouseDown = true; // Set isMouseDown if left mouse button is pressed
});

document.addEventListener('mouseup', (event) => {
    if (event.button === 0) isMouseDown = false; // Reset isMouseDown if left mouse button is released
});


// Add event listeners for mouse interaction on the grid
document.getElementById('board').addEventListener('mouseover', handleBoardInteraction); // Mouse over grid cells
document.getElementById('board').addEventListener('mousedown', handleBoardInteraction); // Mouse down on grid cells


// Handles mouse interactions for drawing walls
function handleBoardInteraction(event) {
    // If it is mouseover and mouse is not pressed, or the target is not a td, exit
    if (event.type === 'mouseover' && !isMouseDown || !event.target.matches('td')) return;

    const cell = event.target; // Get the cell on which action was performed
    const i = parseInt(cell.dataset.row); // Get row index from the cell's dataset
    const j = parseInt(cell.dataset.col); // Get column index from the cell's dataset

    // If the cell is not start or end point, toggle wall status
    if (board.grid[i][j] !== 1 && board.grid[i][j] !== 2) {
        cell.classList.remove('visited', 'path'); // Remove visited or path classes if they are present
        cell.classList.toggle('wall'); // Toggle the 'wall' class on cell
        board.grid[i][j] = cell.classList.contains('wall') ? 3 : 0; // Update the value in the grid (3 for wall, 0 for empty)
    }
}

// Select all buttons
const startButton1 = document.querySelector("body > nav > ul.left > li:nth-child(1)");
const startButton2 = document.querySelector("body > nav > ul.left > li:nth-child(2)");
const clearPathButton = document.querySelector("body > nav > ul.right > li:nth-child(1)");
const clearBoardButton = document.querySelector("body > nav > ul.right > li:nth-child(2)");

// Event listeners for buttons
if (startButton1) startButton1.addEventListener('click', () => board.dijkstra()); // Run dijkstra when first button is clicked
if (startButton2) startButton2.addEventListener('click', () => board.aStar()); // Run A* when the second button is clicked
if (clearPathButton) clearPathButton.addEventListener('click', () => board.clearVisited()); // Clear only path and visited cells
if (clearBoardButton) clearBoardButton.addEventListener('click', () => { // Reset the whole board
    board.generateGrid();
    board.writeGrid();
});