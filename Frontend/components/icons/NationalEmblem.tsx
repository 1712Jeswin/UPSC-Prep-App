import React from 'react';
import { Svg, Path, Circle, G } from 'react-native-svg';

interface NationalEmblemProps {
  size?: number;
  color?: string;
}

export const NationalEmblem = ({ size = 200, color = "#2D5A61" }: NationalEmblemProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <G fill={color}>
        {/* Simplified National Emblem of India SVG Path */}
        <Path d="M256 40c-15.6 0-29.4 10.4-33.6 25.4-8.8 31.6-13.4 64.6-13.4 98.6 0 45.4 8.2 88.6 23.2 128.4L256 320l23.8-27.6c15-39.8 23.2-83 23.2-128.4 0-34-4.6-67-13.4-98.6-4.2-15-18-25.4-33.6-25.4z" />
        <Path d="M192 160c0-30.8 4.2-60.6 12-89.2-12.4 1.8-24 6.8-33.8 14.6-25.2 19.8-35.4 53.6-24.8 84.4 7.4 21.6 19.6 40.8 35.2 56.4 17.6 17.6 30.6 38.8 38.6 62l12.8-6.4c-26.6-43.2-40-79.6-40-121.8z" />
        <Path d="M320 160c0-30.8-4.2-60.6-12-89.2 12.4 1.8 24 6.8 33.8 14.6 25.2 19.8 35.4 53.6 24.8 84.4-7.4 21.6-19.6 40.8-35.2 56.4-17.6 17.6-30.6 38.8-38.6 62l-12.8-6.4c26.6-43.2 40-79.6 40-121.8z" />
        {/* Base / Abacus */}
        <Path d="M176 400h160c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16z" />
        <Path d="M208 360h96c8.8 0 16 7.2 16 16v8H192v-8c0-8.8 7.2-16 16-16z" />
        {/* Ashoka Chakra (Simplified) */}
        <Circle cx="256" cy="380" r="14" />
        <Path d="M256 362c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18zm0 32c-7.7 0-14-6.3-14-14s6.3-14 14-14 14 6.3 14 14-6.3 14-14 14z" />
      </G>
    </Svg>
  );
};

export default NationalEmblem;
