// js/force_directed.js

dispatcher = window.dispatcher;

function drawForceDirected(containerId, data, { idField, linksField, weightField }) {
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  const { width, height } = container.node().getBoundingClientRect();

  const svg = container.append('svg')
      .attr('width', width).attr('height', height);
  const svgGroup = svg.append('g');

  svg.call(d3.zoom().on('zoom', ({transform}) =>
    svgGroup.attr('transform', transform)
  ));

  // Flatten
  const links = [];
  data.forEach(d => {
    const src = d[idField], arr = d[linksField], wt = weightField ? +d[weightField] : 1;
    if (Array.isArray(arr)) arr.forEach(t=>links.push({ source:src, target:t, value:wt}));
  });

  const nodeKeys = Array.from(new Set(links.flatMap(l=>[l.source,l.target])));
  const nodes = nodeKeys.map(id=>({ id }));

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d=>d.id).distance(50).strength(1))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width/2, height/2));

  const link = svgGroup.append('g')
      .attr('stroke','#999').attr('stroke-opacity',0.6)
    .selectAll('line').data(links).join('line')
      .attr('class','link')
      .attr('stroke-width', d=>Math.sqrt(d.value));

  const node = svgGroup.append('g')
      .attr('stroke','#fff').attr('stroke-width',1.5)
    .selectAll('circle').data(nodes).join('circle')
      .attr('class','node')
      .attr('r', 5)
      .attr('fill','#69b3a2')
      .call(d3.drag()
        .on('start',(e,d)=>{ if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (e,d)=>{ d.fx=e.x; d.fy=e.y; })
        .on('end',  (e,d)=>{ if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      )
      .on('click',(event,d)=>{
        dispatcher.call('filterChanged', null, {
          type: 'force',
          key: d.id
        });
      });

  node.append('title').text(d=>d.id);

  sim.on('tick',()=>{
    link
      .attr('x1',d=>d.source.x).attr('y1',d=>d.source.y)
      .attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node
      .attr('cx',d=>d.x).attr('cy',d=>d.y);
  });
}

window.drawForceDirected = drawForceDirected;
