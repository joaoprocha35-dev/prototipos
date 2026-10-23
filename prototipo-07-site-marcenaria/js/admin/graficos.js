/**
 * Gráficos do painel em SVG/HTML puro (sem bibliotecas).
 *
 * Cada gráfico é redesenhado na largura real do contêiner (textos sempre nítidos e legíveis no
 * celular) e traz uma tabela oculta com os mesmos números para leitores de tela.
 * As barras crescem com uma transição CSS curta (desligada com movimento reduzido).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  parent?.appendChild(node);
  return node;
}

/** Tabela oculta com os dados do gráfico (alternativa acessível). A classe fica num <div>:
 *  uma <table> ignora width: 1px e alargaria a página. */
function dataTable(caption, headers, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'visually-hidden';
  const table = document.createElement('table');
  wrap.appendChild(table);
  table.innerHTML = `<caption>${caption}</caption><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>`;
  const body = document.createElement('tbody');
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell, index) => {
      const td = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) td.scope = 'row';
      td.textContent = cell;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  table.appendChild(body);
  return wrap;
}

/** Redesenha quando o contêiner muda de largura (um quadro por mudança). */
const observers = new WeakMap();
function onResize(container, draw) {
  observers.get(container)?.disconnect();
  let lastWidth = container.clientWidth;
  let frame = 0;
  const observer = new ResizeObserver(() => {
    if (container.clientWidth === lastWidth || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      lastWidth = container.clientWidth;
      draw();
    });
  });
  observer.observe(container);
  observers.set(container, observer);
}

/**
 * Colunas verticais (ex.: faturamento dos últimos 12 meses).
 * @param {{ labels: string[], longLabels: string[], values: number[], highlight: number,
 *           format: (n:number)=>string, axisFormat: (n:number)=>string, caption: string }} options
 */
export function barChart(container, options) {
  const draw = () => {
    const { labels, longLabels, values, highlight, format, axisFormat, caption } = options;
    const width = Math.max(280, container.clientWidth);
    const height = width < 520 ? 220 : 280;
    const pad = { top: 16, right: 8, bottom: 30, left: width < 520 ? 52 : 64 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const { top: max, ticks } = niceScale(Math.max(...values, 1));
    const step = innerW / values.length;
    const barW = Math.min(44, step * 0.62);
    const labelEvery = width < 420 ? 2 : 1;

    container.replaceChildren();
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': caption, class: 'chart-svg' }, container);

    for (let i = 0; i <= ticks; i += 1) {
      const value = (max / ticks) * i;
      const y = pad.top + innerH - (value / max) * innerH;
      svgEl('line', { x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: i ? 'chart-gridline' : 'chart-axis' }, svg);
      svgEl('text', { x: pad.left - 8, y: y + 4, 'text-anchor': 'end', class: 'chart-tick' }, svg).textContent = axisFormat(value);
    }

    values.forEach((value, index) => {
      const h = Math.max(2, (value / max) * innerH);
      const x = pad.left + step * index + (step - barW) / 2;
      const y = pad.top + innerH - h;
      const bar = svgEl('rect', {
        x, y, width: barW, height: h, rx: Math.min(6, barW / 3),
        class: index === highlight ? 'chart-bar is-highlight' : 'chart-bar',
        style: `--delay: ${index * 30}ms`,
      }, svg);
      svgEl('title', {}, bar).textContent = `${longLabels[index]}: ${format(value)}`;
      if (index % labelEvery === 0 || index === highlight) {
        svgEl('text', {
          x: x + barW / 2, y: height - 10, 'text-anchor': 'middle',
          class: index === highlight ? 'chart-label is-highlight' : 'chart-label',
        }, svg).textContent = labels[index];
      }
    });

    container.appendChild(dataTable(caption, ['Mês', 'Valor'], values.map((value, i) => [longLabels[i], format(value)])));
  };
  draw();
  onResize(container, draw);
}

/**
 * Rosca com legenda (ex.: projetos por ambiente no mês).
 * @param {{ items: {label:string, value:number, color:string}[], total: string, totalLabel: string,
 *           format: (n:number)=>string, caption: string, empty: string }} options
 */
export function donutChart(container, options) {
  const { items, total, totalLabel, format, caption, empty } = options;
  container.replaceChildren();
  const sum = items.reduce((acc, item) => acc + item.value, 0);
  const wrap = document.createElement('div');
  wrap.className = 'donut';
  container.appendChild(wrap);

  const size = 180;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'donut__svg', role: 'img', 'aria-label': caption }, wrap);
  svgEl('circle', { cx: size / 2, cy: size / 2, r: radius, class: 'donut__track' }, svg);
  let offset = 0;
  if (sum > 0) {
    items.filter((item) => item.value > 0).forEach((item) => {
      const length = (item.value / sum) * circumference;
      const arc = svgEl('circle', {
        cx: size / 2, cy: size / 2, r: radius, class: 'donut__arc',
        stroke: item.color,
        'stroke-dasharray': `${Math.max(0, length - 2)} ${circumference}`,
        'stroke-dashoffset': -offset,
        transform: `rotate(-90 ${size / 2} ${size / 2})`,
      }, svg);
      svgEl('title', {}, arc).textContent = `${item.label}: ${format(item.value)}`;
      offset += length;
    });
  }
  svgEl('text', { x: size / 2, y: size / 2 - 2, 'text-anchor': 'middle', class: 'donut__total' }, svg).textContent = total;
  svgEl('text', { x: size / 2, y: size / 2 + 20, 'text-anchor': 'middle', class: 'donut__total-label' }, svg).textContent = totalLabel;

  const legend = document.createElement('ul');
  legend.className = 'chart-legend';
  legend.setAttribute('role', 'list');
  if (!sum) {
    legend.innerHTML = `<li class="chart-legend__empty">${empty}</li>`;
  } else {
    items.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="chart-legend__swatch" style="background:${item.color}"></span><span class="chart-legend__label"></span><strong></strong>`;
      li.querySelector('.chart-legend__label').textContent = item.label;
      li.querySelector('strong').textContent = format(item.value);
      legend.appendChild(li);
    });
  }
  wrap.appendChild(legend);
  container.appendChild(dataTable(caption, ['Item', 'Quantidade'], items.map((item) => [item.label, format(item.value)])));
}

/**
 * Barras horizontais em HTML (ex.: projetos por etapa).
 * @param {{ items: {label:string, value:number, color:string}[], format: (n:number)=>string }} options
 */
export function horizontalBars(container, { items, format }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'hbars';
  list.setAttribute('role', 'list');
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'hbars__item';
    li.innerHTML = '<span class="hbars__label"></span><span class="hbars__track"><span class="hbars__fill"></span></span><strong class="hbars__value"></strong>';
    li.querySelector('.hbars__label').textContent = item.label;
    li.querySelector('.hbars__value').textContent = format(item.value);
    const fill = li.querySelector('.hbars__fill');
    fill.style.setProperty('--size', `${(item.value / max) * 100}%`);
    fill.style.setProperty('--delay', `${index * 50}ms`);
    fill.style.background = item.color;
    list.appendChild(li);
  });
  container.appendChild(list);
}

/** Eixo com passos "redondos" (ex.: máximo 195 mil → 0, 50, 100, 150, 200 mil), até 5 marcações. */
function niceScale(value) {
  const raw = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks = Math.max(1, Math.ceil(value / step));
  return { top: ticks * step, ticks };
}
