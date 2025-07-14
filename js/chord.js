// js/chord.js

// Grab the single dispatcher
dispatcher = window.dispatcher;

function drawChord(containerId, data, { source, target, weight }) {
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  const { width, height } = container.node().getBoundingClientRect();
  const outerRadius = Math.min(width, height)/2 - 40;
  const innerRadius = outerRadius - 20;

  const svg = container.append('svg')
      .attr('width', width).attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  // Flatten links
  const links = [];
  data.forEach(d => {
    const src = d[source], tg = d[target], wt = weight ? +d[weight] : 1;
    if (Array.isArray(tg)) tg.forEach(t => links.push({ source:src, target:t, value:wt }));
    else if (tg != null)  links.push({ source:src, target:tg, value:wt });
  });

  const keys = Array.from(new Set(links.flatMap(l => [l.source, l.target])));
  const matrix = keys.map(k1 => keys.map(k2 =>
    links.filter(l => l.source===k1 && l.target===k2).reduce((s,l)=>s+l.value,0)
  ));

  const chords = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

  // Arc groups
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  svg.append('g').selectAll('g')
    .data(chords.groups)
    .enter().append('g')
    .append('path')
      .attr('d', arc)
      .attr('fill', d => color(keys[d.index]))
      .attr('stroke','#000')
    .append('title')
      .text(d => `${keys[d.index]}: ${d.value.toLocaleString()}`);

  // Ribbons
  svg.append('g').attr('fill-opacity',0.7).selectAll('path')
    .data(chords)
    .enter().append('path')
      .attr('class','ribbon')
      .attr('d', d3.ribbon().radius(innerRadius))
      .attr('fill', d => color(keys[d.target.index]))
      .attr('stroke','#000')
      .on('click', (event,d) => {
        const src = keys[d.source.index], tgt = keys[d.target.index];
        dispatcher.call('filterChanged', null, {
          type: 'chord',
          keys: [src, tgt]
        });
      })
    .append('title')
      .text(d => `${keys[d.source.index]} → ${keys[d.target.index]}: ${d.source.value.toLocaleString()}`);
}

window.drawChord = drawChord;
