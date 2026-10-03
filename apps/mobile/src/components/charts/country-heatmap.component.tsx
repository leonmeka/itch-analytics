import { geoNaturalEarth1, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { useCSSVariable } from 'uniwind';
import countriesTopo from 'world-atlas/countries-110m.json';
import codeByNumeric from './country-codes.json';

export type CountryValue = { code: string; value: number };

const FEATURES = (
  feature(
    countriesTopo as unknown as Topology,
    (countriesTopo as unknown as Topology).objects.countries,
  ) as FeatureCollection<Geometry, { name: string }>
).features;

const MAP_WIDTH = 600;
const MAP_HEIGHT = 320;

const projection = geoNaturalEarth1().fitExtent(
  [
    [3, 3],
    [MAP_WIDTH - 3, MAP_HEIGHT - 3],
  ],
  { type: 'Sphere' } as never,
);
const path = geoPath(projection);

// Generic world-map heatmap: countries shade from a subtle base to full
// accent intensity by value (sqrt scale keeps small values visible).
// Callers pass ISO alpha-2 codes + counts; unknown codes render as base.
export function CountryHeatmap({
  countries,
  height = 180,
}: {
  countries: CountryValue[];
  height?: number;
}) {
  const [accent, border] = useCSSVariable(['--cash-accent', '--cash-border']) as string[];
  const byCode = new Map(countries.map((entry) => [entry.code.toUpperCase(), entry.value]));
  const max = Math.max(1, ...countries.map((entry) => entry.value));

  return (
    <View>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {FEATURES.map((f, index) => {
          const alpha2 = codeByNumeric[String(f.id)] ?? '';
          const value = byCode.get(alpha2) ?? 0;
          const intensity = Math.sqrt(Math.min(1, value / max));
          const key = alpha2 || `${f.properties?.name ?? 'region'}-${index}`;
          return (
            <SvgPath
              key={key}
              d={path(f) ?? ''}
              fill={accent}
              fillOpacity={intensity > 0 ? 0.15 + intensity * 0.85 : 0.12}
              stroke={border}
              strokeOpacity={intensity > 0 ? 0.6 : 0.25}
              strokeWidth={0.4}
            />
          );
        })}
      </Svg>
    </View>
  );
}
