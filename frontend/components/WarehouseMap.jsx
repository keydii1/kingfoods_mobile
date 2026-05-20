import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Circle, Polyline, G, Text as SvgText } from 'react-native-svg';
import {
  GRID, ROWS, COLS, SHELF_POSITIONS,
  getPosFromLocation, PACKING_POS, ENTRANCE_POS,
} from '../config/warehouseLayout';
import { findShortestPath, pathDistance } from '../utils/pathfinding';

const ZONE = {
  1: { fill: '#e8f5e9', stroke: '#a5d6a7', text: '#2e7d32', label: 'Thực phẩm tươi', icon: '🥦' },
  2: { fill: '#e3f2fd', stroke: '#90caf9', text: '#1565c0', label: 'Đồ khô & Gia vị', icon: '🥫' },
  3: { fill: '#fce4ec', stroke: '#ef9a9a', text: '#c62828', label: 'Hoá mỹ phẩm', icon: '🧴' },
  4: { fill: '#fff3e0', stroke: '#ffcc80', text: '#e65100', label: 'Đồ đông lạnh', icon: '❄️' },
};

const GAP = 1;
const PAD_X = 36;
const PAD_Y = 28;

// Pre-compute shelf position lookup (module-level, runs once)
const posToShelf = {};
Object.entries(SHELF_POSITIONS).forEach(([code, [r, c]]) => {
  posToShelf[`${r},${c}`] = code;
});

const colLabels = Array.from({ length: COLS }, (_, i) => i + 1);

function computeArrows(route) {
  if (!route || route.length < 3) return [];
  const arrows = [];
  for (let i = 1; i < route.length - 1; i++) {
    const [pr, pc] = route[i - 1];
    const [cr, cc] = route[i];
    const [nr, nc] = route[i + 1];
    const dir1 = `${cr - pr},${cc - pc}`;
    const dir2 = `${nr - cr},${nc - cc}`;
    if (dir1 !== dir2) {
      arrows.push({ r: cr, c: cc, from: dir1, to: dir2 });
    }
  }
  return arrows;
}

// Memoized static grid cells - never change so render once
const StaticGrid = memo(function StaticGrid({ CELL, STEP, toX, toY, cx, cy }) {
  return (
    <>
      {GRID.map((row, r) =>
        row.map((cell, c) => {
          const x = toX(c);
          const y = toY(r);
          const w = CELL;
          const h = CELL;

          if (cell === 0) {
            return (
              <Rect key={`${r},${c}`} x={x} y={y} width={w} height={h} fill="#f8f8f8" rx={1} />
            );
          }

          if (cell >= 1 && cell <= 4) {
            const z = ZONE[cell];
            const code = posToShelf[`${r},${c}`];
            return (
              <G key={`${r},${c}`}>
                <Rect x={x} y={y} width={w} height={h} fill={z.fill} stroke={z.stroke} strokeWidth={1} rx={3} />
                <Rect x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.15)" rx={3} />
                {code && (
                  <SvgText
                    x={cx(c)}
                    y={cy(r) + 1}
                    fill={z.text}
                    fontSize={8}
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="central"
                  >
                    {code}
                  </SvgText>
                )}
              </G>
            );
          }

          if (cell === 5) {
            return (
              <Rect key={`${r},${c}`} x={x} y={y} width={w} height={h} fill="#e0e0e0" stroke="#ccc" strokeWidth={0.5} rx={1} />
            );
          }

          if (cell === 6) {
            return (
              <Rect key={`${r},${c}`} x={x} y={y} width={w} height={h} fill="#c8e6c9" stroke="#a5d6a7" strokeWidth={0.5} rx={1} />
            );
          }

          return null;
        })
      )}
    </>
  );
});

// Memoized column and row labels - never change
const GridLabels = memo(function GridLabels({ cx, cy }) {
  return (
    <>
      {/* Column labels */}
      {colLabels.map((label, c) => (
        <SvgText
          key={`col-${c}`}
          x={cx(c)}
          y={12}
          fill="#999"
          fontSize={9}
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* Row labels */}
      {GRID.map((_, r) => (
        <SvgText
          key={`row-${r}`}
          x={14}
          y={cy(r) + 3}
          fill="#999"
          fontSize={9}
          fontWeight="600"
          textAnchor="middle"
        >
          {r + 1}
        </SvgText>
      ))}
    </>
  );
});

// Memoized static decorations (packing label, entrance)
const StaticDecorations = memo(function StaticDecorations({ cx, cy, toY, CELL }) {
  return (
    <>
      {/* Packing label */}
      <SvgText x={cx(7)} y={cy(7) + 1} fill="#888" fontSize={9} fontWeight="700" textAnchor="middle" alignmentBaseline="central">
        📦
      </SvgText>
      <SvgText x={cx(7)} y={toY(8) + CELL + 8} fill="#888" fontSize={8} fontWeight="600" textAnchor="middle">
        Khu đóng gói
      </SvgText>

      {/* Entrance label */}
      {GRID[0][2] === 6 && (
        <SvgText x={cx(2)} y={cy(0) + 1} fill="#388e3c" fontSize={10} textAnchor="middle" alignmentBaseline="central">
          🚪
        </SvgText>
      )}
    </>
  );
});

// Route overlay - only re-renders when route changes
const RouteOverlay = memo(function RouteOverlay({ route, routePoints, arrows, cx, cy }) {
  if (!route || route.length <= 1) return null;
  return (
    <>
      <Polyline
        points={routePoints}
        fill="none"
        stroke="#d32f2f"
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Polyline
        points={routePoints}
        fill="none"
        stroke="#ef5350"
        strokeWidth={10}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.2}
      />

      {/* Route dots */}
      {route.map(([r, c], i) =>
        i > 0 && i < route.length - 1 ? (
          <Circle key={i} cx={cx(c)} cy={cy(r)} r={2.5} fill="#fff" stroke="#d32f2f" strokeWidth={1.5} />
        ) : null
      )}

      {/* Direction arrows at turns */}
      {arrows.map((a, i) => (
        <SvgText
          key={`arrow-${i}`}
          x={cx(a.c)}
          y={cy(a.r) + 1}
          fill="#d32f2f"
          fontSize={11}
          fontWeight="900"
          textAnchor="middle"
          alignmentBaseline="central"
        >
          ▶
        </SvgText>
      ))}
    </>
  );
});

// Markers overlay - start and target
const MarkersOverlay = memo(function MarkersOverlay({ startPos, targetPos, targetShelfCode, cx, cy, toX, toY, CELL }) {
  return (
    <>
      {/* Start marker */}
      {startPos && (
        <G>
          <Circle cx={cx(startPos[1])} cy={cy(startPos[0])} r={CELL / 2.2} fill="#2e7d32" opacity={0.12} />
          <Circle cx={cx(startPos[1])} cy={cy(startPos[0])} r={7} fill="#4caf50" stroke="#fff" strokeWidth={2} />
          <SvgText x={cx(startPos[1])} y={cy(startPos[0]) + 1} fill="#fff" fontSize={8} textAnchor="middle" alignmentBaseline="central">
            🧑
          </SvgText>
        </G>
      )}

      {/* Target cell highlight */}
      {targetPos && (
        <G>
          <Rect
            x={toX(targetPos[1]) - 2} y={toY(targetPos[0]) - 2}
            width={CELL + 4} height={CELL + 4}
            fill="none" stroke="#ef5350" strokeWidth={4} rx={5}
            opacity={0.9}
          />
          <Rect
            x={toX(targetPos[1]) - 4} y={toY(targetPos[0]) - 4}
            width={CELL + 8} height={CELL + 8}
            fill="none" stroke="#ef5350" strokeWidth={1.5} rx={7}
            opacity={0.4}
          />
          <Circle cx={cx(targetPos[1])} cy={cy(targetPos[0])} r={CELL / 1.8} fill="#ef5350" opacity={0.15} />
          <Circle cx={cx(targetPos[1])} cy={cy(targetPos[0])} r={10} fill="#ef5350" stroke="#fff" strokeWidth={3} />
          <SvgText
            x={cx(targetPos[1])}
            y={cy(targetPos[0]) - 18}
            fill="#c62828"
            fontSize={11}
            fontWeight="900"
            textAnchor="middle"
          >
            {targetShelfCode || `[${targetPos[0]+1},${targetPos[1]+1}]`}
          </SvgText>
          <SvgText x={cx(targetPos[1])} y={cy(targetPos[0]) + 1} fill="#fff" fontSize={9} textAnchor="middle" alignmentBaseline="central">
            🎯
          </SvgText>
        </G>
      )}
    </>
  );
});

function WarehouseMap({
  currentLocation,
  targetLocation,
  targetLocationName,
  showRoute = true,
  fromPacking = false,
}) {
  const { width: screenWidth } = useWindowDimensions();

  // Memoize layout calculations - only recompute when screen width changes
  const layout = useMemo(() => {
    const CELL = Math.floor((screenWidth - 2 * PAD_X - COLS * GAP) / COLS);
    const STEP = CELL + GAP;
    const _toX = (c) => PAD_X + c * STEP;
    const _toY = (r) => PAD_Y + r * STEP;
    const _cx = (c) => _toX(c) + CELL / 2;
    const _cy = (r) => _toY(r) + CELL / 2;
    const svgWidth = PAD_X * 2 + COLS * STEP;
    const svgHeight = PAD_Y * 2 + ROWS * STEP;
    return { CELL, STEP, toX: _toX, toY: _toY, cx: _cx, cy: _cy, svgWidth, svgHeight };
  }, [screenWidth]);

  const { CELL, toX, toY, cx, cy, svgWidth, svgHeight } = layout;
  const viewBox = `0 0 ${svgWidth} ${svgHeight}`;

  // Memoize position calculations - only recompute when locations change
  const startPos = useMemo(() => {
    return fromPacking
      ? PACKING_POS
      : (currentLocation
          ? getPosFromLocation(currentLocation) || ENTRANCE_POS
          : ENTRANCE_POS);
  }, [currentLocation, fromPacking]);

  const targetPos = useMemo(() => {
    return targetLocation
      ? getPosFromLocation(targetLocation)
      : PACKING_POS;
  }, [targetLocation]);

  // Memoize pathfinding - the heavy computation, only when positions change
  const { route, arrows, routePoints, distance } = useMemo(() => {
    const _route = showRoute && startPos && targetPos
      ? findShortestPath(startPos, targetPos)
      : null;
    const _arrows = computeArrows(_route);
    const _routePoints = _route
      ? _route.map(([r, c]) => `${cx(c)},${cy(r)}`).join(' ')
      : '';
    const _distance = _route ? pathDistance(_route) : 0;
    return { route: _route, arrows: _arrows, routePoints: _routePoints, distance: _distance };
  }, [startPos, targetPos, showRoute, cx, cy]);

  const targetShelfCode = useMemo(() => {
    return targetLocation && targetPos
      ? posToShelf[`${targetPos[0]},${targetPos[1]}`] || null
      : null;
  }, [targetLocation, targetPos]);

  const startLabel = useMemo(() => {
    return fromPacking
      ? 'Khu ĐG'
      : (currentLocation && startPos ? posToShelf[`${startPos[0]},${startPos[1]}`] || currentLocation : 'Cửa vào');
  }, [fromPacking, currentLocation, startPos]);

  return (
    <View style={styles.wrapper}>
        <View style={styles.legend}>
          {[1, 2, 3, 4].map(z => (
            <View key={z} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ZONE[z].fill, borderColor: ZONE[z].stroke }]} />
              <Text style={styles.legendText}>{ZONE[z].icon} {ZONE[z].label}</Text>
            </View>
          ))}
        </View>
        <Svg width={svgWidth} height={svgHeight} viewBox={viewBox}>
          {/* Floor */}
          <Rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#e8e8e8" rx={6} />

          {/* Labels - memoized */}
          <GridLabels cx={cx} cy={cy} />

          {/* Static grid cells - memoized, no re-render when route changes */}
          <StaticGrid CELL={CELL} STEP={layout.STEP} toX={toX} toY={toY} cx={cx} cy={cy} />

          {/* Static decorations - memoized */}
          <StaticDecorations cx={cx} cy={cy} toY={toY} CELL={CELL} />

          {/* Route path - only re-renders when route changes */}
          <RouteOverlay route={route} routePoints={routePoints} arrows={arrows} cx={cx} cy={cy} />

          {/* Start & Target markers - only re-renders when positions change */}
          <MarkersOverlay
            startPos={startPos}
            targetPos={targetPos}
            targetShelfCode={targetShelfCode}
            cx={cx} cy={cy} toX={toX} toY={toY} CELL={CELL}
          />
        </Svg>

        {/* Info bar */}
        {route && (
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Đi từ</Text>
              <Text style={styles.infoValue}>{startLabel}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Đến</Text>
              <Text style={styles.infoValue}>{targetLocationName || targetLocation || 'Khu đóng gói'}</Text>
            </View>
          </View>
        )}
    </View>
  );
}

// Wrap with React.memo to skip re-renders when props haven't changed
export default memo(WarehouseMap);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e0e0e0',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
});
