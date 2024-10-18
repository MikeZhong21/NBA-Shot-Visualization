let visual;
d3.csv('data/Player_shotdata.csv').then(data => {
    visual = new NBA_Visual({ parentElement: '#svg-container'}, data);
  })
  .catch(error => {
    console.error('Error loading CSV file:', error);
  });

  d3.select('#player-selection').on('change', function() {
    // Get selected display type and update chart
    visual.displayPlayer = d3.select(this).property('value');
    visual.updateVis();
  });