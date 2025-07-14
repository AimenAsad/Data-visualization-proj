let rawData = [];
const dispatcher = d3.dispatch('filterChanged');
window.dispatcher = dispatcher;

// File-picker
const fileInput = d3.select('#file-input');
fileInput.on('change', function() {
  const file = this.files[0];
  if (!file) return;
  d3.json(URL.createObjectURL(file))
    .then(data => { rawData = data; initDashboard(data); })
    .catch(err => alert('Invalid JSON!'));
});

function clearDashboard() {
  d3.select('#controls').html('');
  ['radial-bar','chord-diagram','force-graph','sunburst-chart']
    .forEach(id => d3.select('#'+id).html(''));
}

function initDashboard(data) {
  clearDashboard();
  const colTypes = detectColumnTypes(data);
  buildSelectors(colTypes);
  dispatcher.call('filterChanged', null, { type: 'reset' });
}

function detectColumnTypes(data) {
  const cols = Object.keys(data[0]||{});
  const types = {};
  cols.forEach(col => {
    const sample = data[0][col];
    if (Array.isArray(sample)) types[col] = 'array';
    else if (sample && typeof sample==='object') types[col] = 'object';
    else if (data.every(d=>!isNaN(+d[col]))) types[col]='numeric';
    else types[col]='categorical';
  });
  return types;
}

function buildSelectors(colTypes) {
  const ctrl = d3.select('#controls').html('');

  // Radial
  const radial = ctrl.append('div').attr('class','control-group');
  radial.append('label').text('Radial Category:')
    .append('select').attr('id','radial-cat')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='categorical').map(([c])=>c))
      .enter().append('option').text(d=>d);
  radial.append('label').text('Radial Value:')
    .append('select').attr('id','radial-val')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='numeric').map(([c])=>c))
      .enter().append('option').text(d=>d);
  radial.append('button').text('Draw Radial')
    .on('click', () => {
      const cat = d3.select('#radial-cat').property('value');
      const val = d3.select('#radial-val').property('value');
      drawRadialBar('#radial-bar', rawData, { category:cat, value:val });
    });

  // Chord
  const chord = ctrl.append('div').attr('class','control-group');
  chord.append('label').text('Chord Source:')
    .append('select').attr('id','chord-src')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='categorical').map(([c])=>c))
      .enter().append('option').text(d=>d);
  chord.append('label').text('Target:')
    .append('select').attr('id','chord-tgt')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='array').map(([c])=>c))
      .enter().append('option').text(d=>d);
  chord.append('label').text('Weight (opt):')
    .append('select').attr('id','chord-wt')
      .selectAll('option')
      .data(['None'].concat(Object.entries(colTypes)
        .filter(([,t])=>t==='numeric').map(([c])=>c)))
      .enter().append('option')
        .attr('value',d=>d==='None'? '':d)
        .text(d=>d);
  chord.append('button').text('Draw Chord')
    .on('click', () => {
      const src = d3.select('#chord-src').property('value');
      const tgt = d3.select('#chord-tgt').property('value');
      const wt  = d3.select('#chord-wt').property('value')||null;
      drawChord('#chord-diagram', rawData, { source:src, target:tgt, weight:wt });
    });

  // Force
  const force = ctrl.append('div').attr('class','control-group');
  force.append('label').text('Force Node ID:')
    .append('select').attr('id','force-node')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='categorical').map(([c])=>c))
      .enter().append('option').text(d=>d);
  force.append('label').text('Links:')
    .append('select').attr('id','force-links')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='array').map(([c])=>c))
      .enter().append('option').text(d=>d);
  force.append('label').text('Weight (opt):')
    .append('select').attr('id','force-wt')
      .selectAll('option')
      .data(['None'].concat(Object.entries(colTypes)
        .filter(([,t])=>t==='numeric').map(([c])=>c)))
      .enter().append('option')
        .attr('value',d=>d==='None'? '':d)
        .text(d=>d);
  force.append('button').text('Draw Force')
    .on('click', () => {
      const idF = d3.select('#force-node').property('value');
      const lkF = d3.select('#force-links').property('value');
      const wtF = d3.select('#force-wt').property('value')||null;
      drawForceDirected('#force-graph', rawData, { idField:idF, linksField:lkF, weightField:wtF });
    });

  // Sunburst
  const sun = ctrl.append('div').attr('class','control-group');
  sun.append('label').text('Sunburst Levels:')
    .append('select')
      .attr('id','sunburst-levels')
      .attr('multiple',true)
      .style('height','100px')
      .selectAll('option')
      .data(Object.entries(colTypes)
        .filter(([,t])=>t==='categorical').map(([c])=>c))
      .enter().append('option')
        .attr('value',d=>d)
        .text(d=>d);
  sun.append('button').text('Draw Sunburst')
    .on('click', () => {
      const levels = Array.from(
        d3.select('#sunburst-levels').node().selectedOptions,
        opt => opt.value
      );
      drawSunburst('#sunburst-chart', rawData, { levels });
    });
}

// Brushing & linking listeners
dispatcher.on('filterChanged.radial', ({key,type}) => {
  const bars = d3.selectAll('#radial-bar path');
  type==='reset'? bars.attr('opacity',1) :
    bars.attr('opacity', d=>d.key===key?1:0.2);
});

dispatcher.on('filterChanged.chord', ({keys,type}) => {
  const r = d3.selectAll('#chord-diagram .ribbon');
  if(type==='reset') return r.attr('opacity',1);
  r.attr('opacity', d => {
    const s = keys[0], t=keys[1];
    const a = d.source.index, b=d.target.index;
    return ((s===d3.select(r.nodes()[a]).datum()?.source?.name && t===d3.select(r.nodes()[b]).datum()?.target?.name)
         ||(t===d3.select(r.nodes()[a]).datum()?.source?.name && s===d3.select(r.nodes()[b]).datum()?.target?.name))
        ?1:0.1;
  });
});

dispatcher.on('filterChanged.force', ({key,type}) => {
  const n = d3.selectAll('#force-graph .node');
  type==='reset'? n.attr('opacity',1) :
    n.attr('opacity', d=>d.id===key?1:0.2);
});

dispatcher.on('filterChanged.sunburst', ({key,type}) => {
  const s = d3.selectAll('#sunburst-chart path');
  if(type==='reset') return s.attr('opacity',1);
  s.attr('opacity', d=>{
    const path = d.ancestors().map(n=>n.data.name).slice(1).join('||');
    return path.startsWith(key)?1:0.2;
  });
});