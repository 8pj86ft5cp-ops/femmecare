export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartSeries {
  label: string;
  color: string;
  points: LineChartPoint[];
}

export function LineChart({ title, unit, series }: { title: string; unit: string; series: LineChartSeries[] }) {
  const points = series.flatMap((item) => item.points);
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">Ainda não há medições suficientes para exibir o gráfico.</p>;
  }

  const valores = points.map((point) => point.value);
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  const margem = Math.max((maior - menor) * 0.15, maior * 0.05, 1);
  const minimo = Math.max(0, menor - margem);
  const maximo = maior + margem;
  const largura = 640;
  const altura = 240;
  const padding = { top: 16, right: 16, bottom: 36, left: 44 };
  const areaLargura = largura - padding.left - padding.right;
  const areaAltura = altura - padding.top - padding.bottom;
  const todosRotulos = points.map((point) => point.label);
  const primeiro = todosRotulos[0];
  const ultimo = todosRotulos[todosRotulos.length - 1];

  function coordenadas(item: LineChartSeries) {
    return item.points.map((point, index) => {
      const proporcaoX = item.points.length === 1 ? 0.5 : index / (item.points.length - 1);
      return {
        ...point,
        x: padding.left + areaLargura * proporcaoX,
        y: padding.top + areaAltura * (1 - (point.value - minimo) / (maximo - minimo)),
      };
    });
  }

  return (
    <figure className="space-y-3">
      <figcaption className="font-medium text-slate-700">{title}</figcaption>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          role="img"
          aria-label={`${title}. Unidade: ${unit}.`}
          className="h-auto min-w-[460px] w-full"
        >
          {[0, 0.5, 1].map((proporcao) => {
            const y = padding.top + areaAltura * proporcao;
            const valor = maximo - (maximo - minimo) * proporcao;
            return (
              <g key={proporcao}>
                <line x1={padding.left} y1={y} x2={largura - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">
                  {Math.round(valor)}
                </text>
              </g>
            );
          })}
          {series.map((item) => {
            const coords = coordenadas(item);
            return (
              <g key={item.label}>
                {coords.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={coords.map((point) => `${point.x},${point.y}`).join(' ')}
                  />
                )}
                {coords.map((point) => (
                  <circle key={`${point.label}-${point.value}`} cx={point.x} cy={point.y} r="4" fill={item.color}>
                    <title>{point.label}: {point.value} {unit}</title>
                  </circle>
                ))}
              </g>
            );
          })}
          <text x={padding.left} y={altura - 8} fill="#64748b" fontSize="11">{primeiro}</text>
          {ultimo !== primeiro && (
            <text x={largura - padding.right} y={altura - 8} textAnchor="end" fill="#64748b" fontSize="11">{ultimo}</text>
          )}
        </svg>
      </div>
      <ul className="flex flex-wrap gap-4 text-xs text-slate-600">
        {series.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
