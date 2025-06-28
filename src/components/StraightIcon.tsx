import React from 'react';
import Svg, { Path } from 'react-native-svg';

const StraightIcon = ({ style }: { style?: any }) => (
  <Svg viewBox="0 0 24 24" fill="#4CAF50" style={style}>
    <Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
  </Svg>
);

export default StraightIcon; 