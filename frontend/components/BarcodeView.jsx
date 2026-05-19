import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const CODE39 = {
  '0':'000110100','1':'100100001','2':'001100001','3':'101100000',
  '4':'000110001','5':'100110000','6':'001110000','7':'000100101',
  '8':'100100100','9':'001100100','A':'100001001','B':'001001001',
  'C':'101001000','D':'000011001','E':'100011000','F':'001011000',
  'G':'000001101','H':'100001100','I':'001001100','J':'000011100',
  'K':'100000011','L':'001000011','M':'101000010','N':'000010011',
  'O':'100010010','P':'001010010','Q':'000000111','R':'100000110',
  'S':'001000110','T':'000010110','U':'110000001','V':'011000001',
  'W':'111000000','X':'010010001','Y':'110010000','Z':'011010000',
  '-':'010000101','.':'110000100',' ':'011000100','$':'010101000',
  '/':'010100010','+':'010001010','%':'000101010','*':'010010100',
};

const NARROW = 2;
const WIDE = 5;
const GAP = 2;

function encodeToBars(text) {
  const upper = text.toUpperCase().replace(/[^0-9A-Z\-. $\/+%]/g, '');
  if (!upper) return [];
  const encoded = '*' + upper + '*';
  const bars = [];
  let x = 0;
  for (let ci = 0; ci < encoded.length; ci++) {
    const pattern = CODE39[encoded[ci]];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === '1' ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, w, black: true });
      x += w;
    }
    if (ci < encoded.length - 1) x += GAP;
  }
  const svgWidth = Math.max(160, Math.min(400, x));
  const scale = (svgWidth - 8) / x;
  return {
    bars: bars.map(b => ({ ...b, x: b.x * scale + 4, w: Math.max(1.5, b.w * scale) })),
    svgWidth,
  };
}

export default function BarcodeView({ value, style, width, height = 60 }) {
  const result = encodeToBars(value || '');
  const { bars } = result;
  const svgWidth = width || result.svgWidth;
  return (
    <View style={[{ alignSelf: 'center' }, style]}>
      <Svg width={svgWidth} height={height}>
        {bars.map((b, i) =>
          b.black ? (
            <Rect key={i} x={b.x} y={4} width={b.w} height={height - 8} fill="#000" />
          ) : null
        )}
      </Svg>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: '#000',
          fontWeight: '600',
          marginTop: 2,
          textAlign: 'center',
        }}
      >
        {value || ''}
      </Text>
    </View>
  );
}
