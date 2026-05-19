// Grid legend:
// 0 = walkable aisle
// 1 = Zone 1 (🍬 Bánh kẹo)
// 2 = Zone 2 (🥤 Đồ uống)
// 3 = Zone 3 (🧴 Hoá phẩm)
// 4 = Zone 4 (🎁 KM)
// 5 = Packing area
// 6 = Entrance

const GRID = [
//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
//              1 1 1 1 1 1 1 1 1 1 1
  [6,6,0,0,0,0,0,0,0,0,0,0,0,6,6,6], // row 0: Entrance
  [6,0,1,1,0,1,1,0,2,2,0,2,2,0,6,6], // row 1: Zone 1 (trái) + Zone 2 (phải)
  [6,0,1,1,0,1,1,0,2,2,0,2,2,0,6,6], // row 2: Zone 1 (trái) + Zone 2 (phải)
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // row 3: Main aisle
  [6,0,3,3,0,3,3,0,4,4,0,4,4,0,6,6], // row 4
  [6,0,3,3,0,3,3,0,4,4,0,4,4,0,6,6], // row 5
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // row 6: Aisle
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], // row 7: Packing area
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], // row 8: Packing area
];

const ROWS = GRID.length;
const COLS = GRID[0].length;

// Map shelf position codes to grid coordinates
const SHELF_POSITIONS = {
  // Zone 1 - Bánh kẹo
  'A1': [1, 2], 'A2': [1, 3], 'A3': [1, 5], 'A4': [1, 6],
  'A5': [1, 8], 'A6': [1, 9], 'A7': [1, 11], 'A8': [1, 12],
  'B1': [2, 2], 'B2': [2, 3], 'B3': [2, 5], 'B4': [2, 6],
  'B5': [2, 8], 'B6': [2, 9], 'B7': [2, 11], 'B8': [2, 12],
  // Zone 3 - Hoá phẩm
  'C1': [4, 2], 'C2': [4, 3], 'C3': [4, 5], 'C4': [4, 6],
  'C5': [4, 8], 'C6': [4, 9], 'C7': [4, 11], 'C8': [4, 12],
  'D1': [5, 2], 'D2': [5, 3], 'D3': [5, 5], 'D4': [5, 6],
  'D5': [5, 8], 'D6': [5, 9], 'D7': [5, 11], 'D8': [5, 12],
};

// Entrance position (top-left)
const ENTRANCE_POS = [0, 2];

// Packing area center position
const PACKING_POS = [7, 7];

// Zone metadata
const ZONE_META = {
  1: { name: 'Bánh kẹo', icon: '🍬', color: '#e8f5e9', textColor: '#2e7d32' },
  2: { name: 'Đồ uống', icon: '🥤', color: '#e3f2fd', textColor: '#1565c0' },
  3: { name: 'Hoá phẩm', icon: '🧴', color: '#fce4ec', textColor: '#c62828' },
  4: { name: 'Khuyến mãi', icon: '🎁', color: '#fff3e0', textColor: '#e65100' },
};

// All shelf positions as an ordered list for hash-based lookup
const ALL_SHELF_POSITIONS = Object.values(SHELF_POSITIONS);

// Simple string hash for deterministic position mapping
function hashLocation(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Parse shelf code from a location string (e.g., "Kệ A1" -> "A1")
// Also handles real formats like "14.07.B" -> "07" (shelf number)
function parseShelfCode(locationStr) {
  if (!locationStr) return null;
  // Try old format: letter + digit (e.g., "A1" from "Kệ A1")
  const oldMatch = locationStr.match(/[A-D]\d/);
  if (oldMatch && SHELF_POSITIONS[oldMatch[0]]) return oldMatch[0];
  // Try new format: extract shelf number (e.g., "07" from "14.07.B")
  const numMatch = locationStr.match(/(\d{2,3})\s*\.\s*([A-D])/);
  if (numMatch) return `${numMatch[2]}${numMatch[1]}`;
  return null;
}

// Get grid position for a location string
function getPosFromLocation(locationStr) {
  if (!locationStr) return null;

  // Map real database location codes to zone center positions
  const CODE_TO_POS = {
    'FRESH':    [1, 2],   // Zone 1 - A1
    'DRY':     [1, 5],   // Zone 1 - A3
    'BEVERAGE': [1, 8],  // Zone 2 - A5
    'FROZEN':   [4, 8],  // Zone 4 - C5
  };

  // Check direct location code match (e.g. "FRESH", "DRY")
  const upper = locationStr.toUpperCase().trim();
  if (CODE_TO_POS[upper]) return CODE_TO_POS[upper];

  // Check if location name contains known keywords
  if (locationStr.includes('Thực phẩm tươi') || locationStr.includes('tươi')) return CODE_TO_POS['FRESH'];
  if (locationStr.includes('Đồ khô') || locationStr.includes('Gia vị')) return CODE_TO_POS['DRY'];
  if (locationStr.includes('Đồ uống') || locationStr.includes('Nước')) return CODE_TO_POS['BEVERAGE'];
  if (locationStr.includes('đông lạnh') || locationStr.includes('Đông lạnh')) return CODE_TO_POS['FROZEN'];

  // Try old format first: "Kệ A1" → SHELF_POSITIONS["A1"]
  const oldMatch = locationStr.match(/[A-D]\d/);
  if (oldMatch && SHELF_POSITIONS[oldMatch[0]]) {
    return SHELF_POSITIONS[oldMatch[0]];
  }

  // Try real format: "14.07.B" or "12.03\n.A"
  const match = locationStr.match(/(\d+)\.\s*(\d+)\s*\.?\s*([A-D])?/);
  if (match) {
    const shelfNum = parseInt(match[2], 10);
    const tier = match[3];

    let row;
    if (tier === 'A') row = 1;
    else if (tier === 'B') row = 2;
    else if (tier === 'C') row = 4;
    else if (tier === 'D') row = 5;
    else row = 1 + (shelfNum % 2 === 0 ? 1 : 0);

    const cols = [2, 3, 5, 6, 8, 9, 11, 12];
    const col = cols[(shelfNum - 1) % 8];

    return [row, col];
  }

  // Fallback: hash-based deterministic mapping
  const hash = hashLocation(locationStr);
  return ALL_SHELF_POSITIONS[hash % ALL_SHELF_POSITIONS.length];
}

export {
  GRID, ROWS, COLS, SHELF_POSITIONS, ENTRANCE_POS, PACKING_POS,
  ZONE_META, parseShelfCode, getPosFromLocation,
};
