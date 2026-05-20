// BFS shortest path on warehouse grid
// 0 = walkable, 5 = packing area, 6 = entrance (all walkable)
// 1-4 = shelves (not walkable, need to go around)

import { GRID, ROWS, COLS } from '../config/warehouseLayout';

function isWalkable(row, col) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  const cell = GRID[row][col];
  return cell === 0 || cell === 5 || cell === 6;
}

// Get neighboring cells (up, down, left, right)
function getNeighbors(row, col) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const result = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (isWalkable(nr, nc)) {
      result.push([nr, nc]);
    }
  }
  return result;
}

// BFS shortest path from [startRow, startCol] to [endRow, endCol]
// Returns array of [row, col] coordinates, or null if no path
function findShortestPath(start, end) {
  const [sr, sc] = start;
  const [er, ec] = end;

  // Handle start on non-walkable cell (shelf)
  if (!isWalkable(sr, sc) && GRID[sr]?.[sc] !== undefined) {
    const neighbors = getNeighbors(sr, sc);
    if (neighbors.length === 0) return null;
    let best = neighbors[0];
    let bestDist = Math.abs(best[0] - er) + Math.abs(best[1] - ec);
    for (const n of neighbors) {
      const d = Math.abs(n[0] - er) + Math.abs(n[1] - ec);
      if (d < bestDist) { best = n; bestDist = d; }
    }
    const path = findShortestPath(best, end);
    return path ? [start, ...path] : null;
  }

  // Handle end on non-walkable cell (shelf) — find nearest walkable neighbor
  if (!isWalkable(er, ec) && GRID[er]?.[ec] !== undefined) {
    const neighbors = getNeighbors(er, ec);
    if (neighbors.length === 0) return null;
    let best = neighbors[0];
    let bestDist = Math.abs(best[0] - sr) + Math.abs(best[1] - sc);
    for (const n of neighbors) {
      const d = Math.abs(n[0] - sr) + Math.abs(n[1] - sc);
      if (d < bestDist) { best = n; bestDist = d; }
    }
    const path = findShortestPath(start, best);
    return path ? [...path, end] : null;
  }

  if (sr === er && sc === ec) return [start];

  const queue = [[sr, sc]];
  const visited = new Set();
  const parent = {};

  visited.add(`${sr},${sc}`);
  parent[`${sr},${sc}`] = null;

  while (queue.length > 0) {
    const [cr, cc] = queue.shift();

    if (cr === er && cc === ec) {
      const path = [];
      let key = `${er},${ec}`;
      while (key) {
        const [r, c] = key.split(',').map(Number);
        path.unshift([r, c]);
        key = parent[key];
      }
      return path;
    }

    for (const [nr, nc] of getNeighbors(cr, cc)) {
      const nk = `${nr},${nc}`;
      if (!visited.has(nk)) {
        visited.add(nk);
        parent[nk] = `${cr},${cc}`;
        queue.push([nr, nc]);
      }
    }
  }

  return null; // No path found
}

// Calculate total travel distance of a path
function pathDistance(path) {
  if (!path || path.length < 2) return 0;
  let dist = 0;
  for (let i = 1; i < path.length; i++) {
    dist += Math.abs(path[i][0] - path[i-1][0]) + Math.abs(path[i][1] - path[i-1][1]);
  }
  return dist;
}

export { findShortestPath, pathDistance, isWalkable, getNeighbors };
