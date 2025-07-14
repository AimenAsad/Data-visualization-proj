// js/sunburst.js

dispatcher = window.dispatcher;

function drawSunburst(containerId, data, { levels }) {
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  if (!levels.length) {
    container.append('p').text('Select at least one level.');
    return;
  }

  // Build nested
  function nest(arr, depth=0) {
    if (depth===levels.length) return arr.map(d=>({ name:'__leaf__', value:1 }));
    const key = levels[depth];
    const g = d3.group(arr, d=>d[key]);
    return Array.from(g, ([k,subset])=>({
      name:k,
      children: nest(subset, depth+1)
    }));
  }

  const tree = { name:'root', children: nest(data,0) };
  const root = d3.hierarchy(tree).sum(d=>d.value||0).sort((a,b)=>b.value-a.value);

  const { width, height } = container.node().getBoundingClientRect();
  const radius = Math.min(width, height)/2;

  d3.partition().size([2*Math.PI, radius])(root);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const svg = container.append('svg')
      .attr('width', width).attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  const arc = d3.arc()
    .startAngle(d=>d.x0).endAngle(d=>d.x1)
    .innerRadius(d=>d.y0).outerRadius(d=>d.y1);

  svg.selectAll('path')
    .data(root.descendants().filter(d=>d.depth>0))
    .join('path')
      .attr('d', arc)
      .attr('fill', d=>color(d.ancestors().map(n=>n.data.name).join('/')))
      .attr('stroke','#fff')
      .on('click', (event, d) => {
        const key = d.ancestors().map(n=>n.data.name).slice(1).join('||');
        dispatcher.call('filterChanged', null, {
          type: 'sunburst',
          key
        });
      })
    .append('title')
      .text(d=>{
        const lvl = levels[d.depth-1];
        return `${lvl}: ${d.data.name}\nCount: ${d.value}`;
      });
}

window.drawSunburst = drawSunburst;
