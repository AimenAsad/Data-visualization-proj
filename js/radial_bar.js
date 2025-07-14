// js/radial_bar.js
dispatcher = window.dispatcher;
function drawRadialBar(containerId, data, { category, value }) {
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  const rect   = container.node().getBoundingClientRect();
  const width  = rect.width;
  const height = rect.height;
  const margin = 40;
  const radius = Math.min(width, height) / 2 - margin;

  const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  // Data
  const entries = data.map(d => ({
    key: d[category],
    val: +d[value]
  })).filter(d => d.key != null && !isNaN(d.val));

  // Scales
  const angleScale = d3.scaleBand()
    .domain(entries.map(d => d.key))
    .range([0, 2 * Math.PI])
    .padding(0.1);

  const radiusScale = d3.scaleLinear()
    .domain([0, d3.max(entries, d => d.val)])
    .range([0, radius]);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(entries.map(d => d.key));

  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class','tooltip')
    .style('position','absolute')
    .style('pointer-events','none')
    .style('background','rgba(0,0,0,0.7)')
    .style('color','white')
    .style('padding','4px 8px')
    .style('border-radius','4px')
    .style('font-size','12px')
    .style('visibility','hidden');

  // Draw arcs with full handlers
  svg.selectAll('path')
    .data(entries)
    .join('path')
      .attr('fill', d => color(d.key))
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(0)
        .startAngle(d => angleScale(d.key))
        .endAngle(d => angleScale(d.key) + angleScale.bandwidth())
      )
      .on('mouseover', (event, d) => {
        tooltip
          .html(`<strong>${d.key}</strong><br>${value}: ${d.val}`)
          .style('top',  `${event.pageY + 10}px`)
          .style('left', `${event.pageX + 10}px`)
          .style('visibility','visible');
      })
      .on('mousemove', event => {
        tooltip
          .style('top',  `${event.pageY + 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('visibility','hidden');
      })
      .on('click', (event, d) => {
        window.dispatcher.call('filterChanged', null, {
          type: 'radial',
          key: d.key
        });
      })
    .transition()
      .duration(800)
      .attrTween('d', d => {
        const i = d3.interpolateNumber(0, radiusScale(d.val));
        return t => d3.arc()
          .innerRadius(0)
          .outerRadius(i(t))
          .startAngle(angleScale(d.key))
          .endAngle(angleScale(d.key) + angleScale.bandwidth())();
      });
}

window.drawRadialBar = drawRadialBar;
