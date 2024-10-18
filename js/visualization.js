class NBA_Visual {
    constructor(_config, _data) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: 550,
          containerHeight: 700,
          margin: {top: 25, right: 30, bottom: 25, left: 30}
        }
        this.data = _data;
        this.initVis();
    }

 
    initVis(){
        let vis = this;
        vis.config.width_l = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height_l = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
        vis.local = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('id','local');

        vis.svg = vis.local.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.court_height = 451;
        vis.court_width = 480;

        vis.courtGroup = vis.svg.append('g');
        vis.heatGroup = vis.svg.append('g');

        vis.xScale = d3.scaleLinear()
            .domain([-250, 250])
            .range([0, vis.court_width]);

        vis.yScale = d3.scaleLinear()
            .domain([-47.5, 422.5])
            .range([0, vis.court_height]);
    
    }

    updateVis(){
        let vis = this;

        // Draw the court rectangle
        vis.court = vis.courtGroup.append('rect')
            .attr('width', vis.court_width)
            .attr('height', vis.court_height)
            .attr('fill', 'black');

        vis.courtGroup.append('text')
            .attr("x", vis.court_width / 2) 
            .attr("y", -10) 
            .attr("text-anchor", "middle") 
            .style("font-size", "1.5em") 
            .style("font-weight", "bold")
            .text("Shot Frequency Heatmap");


        d3.select('#player-name').text(vis.displayPlayer);
        d3.select('#player-image')
            .attr('src', `img/${vis.displayPlayer}.png`)
            .attr('alt', `${vis.displayPlayer} Image`)
            .style('max-width', '150px')
            .style('max-height', '150px')
            .style('border', '2px solid steelblue');

        vis.player_data = vis.data.filter(d => d.PLAYER_NAME === vis.displayPlayer);
        d3.select('#team').text(`Team: ${vis.player_data[0].TEAM_NAME}`);
        d3.select('#chart-title').text('Shot Zone Distribution')
            .style('color', 'steelblue');

        /*
        vis.shotZoneRangeCounts = d3.rollup(vis.player_data, 
            v => v.length, 
            d => d.SHOT_ZONE_RANGE);

        vis.shotZoneRangeCount = Array.from(vis.shotZoneRangeCounts, ([shotZoneRange, count]) => ({ shotZoneRange, count }));

        vis.piecolorScale = d3.scaleOrdinal()
        .domain(vis.shotZoneRangeCount.map(d => d.shotZoneRange))
        .range(d3.schemeCategory10);

        vis.svg_donut = d3.select('#player-info')
            .append('svg')
            .attr('width', 150)
            .attr('height', 200);

        d3.pie(vis.shotZoneRangeCount)
            .value(d => d.count);
        */    
        
        d3.select('#svg_bar').remove();
        vis.svg_bar = d3.select('#player-info')
            .append('svg')
            .attr('width', 160)
            .attr('height', 200)
            .attr('id', 'svg_bar');

        const shotDataMap = new Map();
        let totalShots = 0;
        vis.player_data.forEach(d => {
            const key = d.SHOT_ZONE_RANGE;
            totalShots++;
            if (shotDataMap.has(key)) {
            shotDataMap.set(key, shotDataMap.get(key) + 1);
            } else {
            shotDataMap.set(key, 1);
            }
        });

        vis.shotZoneCount = Array.from(shotDataMap, ([key, value]) => ({ key, value }));
        vis.shotZoneDist = vis.shotZoneCount.map(d => {
            const zone = d.key === 'Less Than 8 ft.' ? '< 8 ft.' : d.key;
            return {
                zone: zone,
                frequency: d.value,
                percentage: (d.value / totalShots) * 100
            };
        });

        vis.shotZoneDist.sort((a, b) => a.percentage - b.percentage);
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(vis.shotZoneDist, d => d.percentage)])
            .range([0, 100]);
        
        const yScale = d3.scaleBand()
            .domain(vis.shotZoneDist.map(d => d.zone))
            .range([100, 0])
            .padding(0.1);

        vis.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute');

        vis.bar = vis.svg_bar.selectAll('.bar')
            .data(vis.shotZoneDist)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.zone))
            .attr('width', d => xScale(d.percentage))
            .attr('height', yScale.bandwidth())
            .attr('fill', 'steelblue');

        d3.select('#svg_right').remove();
        d3.select('#title').text('');

        vis.bar.on('mouseover', function(event, d) {
            d3.select(this)
            .attr('fill', 'orange') 
            .attr('width', d => xScale(d.percentage) + 5); 

            labels.filter(label => label.zone === d.zone)
                .select('text')
                .attr('fill', 'orange')
                .style('font-size', '14px');

            vis.hoverzone = d.zone;

            const mappedZone = (() => {
                switch(d.zone) {
                    case '< 8 ft.':
                        return 'Rim';
                    case '8-16 ft.':
                        return 'Short 2pts shot';
                    case '16-24 ft.':
                        return 'Long 2pts shot';
                    case '24+ ft.':
                        return '3pts shot';
                    default:
                        return d.zone;
                }
            })();
            const tooltipText = `${mappedZone}: ${d.percentage.toFixed(2)}%`;
            const chartRect = vis.svg_bar.node().getBoundingClientRect(); // Get bounding rectangle of the chart
            const chartTop = chartRect.top + window.pageYOffset; // Calculate top position relative to the viewport
            const tooltipTop = chartTop - vis.tooltip.node().offsetHeight; // Position tooltip above the chart
            vis.tooltip.style('opacity', 1)
                .text(tooltipText)
                .style('left', (chartRect.left) + 'px') 
                .style('top', tooltipTop + 'px');
        })
        .on('mouseout', function(d) {
            d3.select(this)
                .attr('fill', 'steelblue') 
                .attr('width', d => xScale(d.percentage));

            labels.filter(label => label.zone === vis.hoverzone)
                .select('text')
                .attr('fill', 'black') 
                .style('font-size', '10px');

            vis.tooltip.style('opacity', 0);
        })
        .on('click', function(event, d) {
            d.zone = d.zone.replace("< 8 ft.", "Less Than 8 ft.");
            const tableTitle = d.zone + " Shot Action Distribution";

            const filteredData = vis.player_data.filter(data => data.SHOT_ZONE_RANGE === d.zone);
            const actionTypeMap = new Map();
            filteredData.forEach(data => {
                const actionType = data.ACTION_TYPE;
                const shotMadeFlag = Number(data.SHOT_MADE_FLAG); // Convert to number
                if (actionTypeMap.has(actionType)) {
                    actionTypeMap.get(actionType).attempts++;
                    actionTypeMap.get(actionType).made += shotMadeFlag; // Accumulate made shots
                } else {
                    actionTypeMap.set(actionType, { attempts: 1, made: shotMadeFlag });
                }
            });
        
            const totalAttempts = filteredData.length;

            const actionTypeDist = [];
            actionTypeMap.forEach((value, key) => {
                const shootingPercentage = (value.made / value.attempts) * 100;
                const frequencyPercentage = (value.attempts / totalAttempts) * 100;
                actionTypeDist.push({ actionType: key, attempts: value.attempts, made: value.made, shootingPercentage: shootingPercentage, frequencyPercentage: frequencyPercentage });
            });
            
            // Sort the data by frequency percentage
            actionTypeDist.sort((a, b) => b.frequencyPercentage - a.frequencyPercentage);
            
            d3.select("#svg-right").selectAll("*").remove();
            
            const table = d3.select("#svg-right")
                .style("margin-left", "50px");

            const tbody = table.append("tbody");

            table.style("font-family", "Arial, sans-serif")
                    .style("font-size", "14px");
            
            table.append("caption")
                .attr("text-anchor", "middle")
                .style("font-size", "1.5em")
                .style("font-weight", "bold")
                .style("margin-bottom", "5px")
                .text(tableTitle);

                const columnNames = ["Action Type", "Frequency Bar", "Frequency %", "FG%"];

                // Append headers for columns
                table.append("thead")
                    .append("tr")
                    .selectAll("th")
                    .data(columnNames)
                    .enter()
                    .append("th")
                    .text(d => d);
                    
                const maxRows = 18;
                const displayedData = actionTypeDist.slice(0, maxRows);
                const maxFrequencyPercentage = d3.max(displayedData, d => d.frequencyPercentage);
                const paddingFactor = 1
                // Append rows
                const rows = tbody.selectAll("tr")
                    .data(displayedData)
                    .enter()
                    .append("tr")
                    
                
                // Define color scale for different rows
                const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
                
                // Append data to rows
                rows.append("td")
                    .text(d => d.actionType)
                    .style("font-weight", "530")
                    .style("padding-right", "10px")
                    .style("padding-left", "10px");
                
                rows.append("td")
                    .style("padding-right", "10px")
                    .style("padding-left", "10px")
                    .append("svg")
                    .attr("width", 180)
                    .attr("height", 20)
                    .append("rect")
                    .attr("width",  d => `${(d.frequencyPercentage / maxFrequencyPercentage) * 100 * paddingFactor}%`)
                    .attr("height", 20)
                    .style("fill", (_, i) => colorScale(i));
                
                rows.append("td")
                    .text(d => `${d.frequencyPercentage.toFixed(2)}%`)
                    .style("text-shadow", "1 1 1")         
                    .style("padding-right", "10px")
                    .style("padding-left", "10px");
                
                rows.append("td")
                    .text(d => `${d.shootingPercentage.toFixed(2)}%`) 
                    .style("font-weight", "Semi Bold")
                    .style("padding-right", "10px")
                    .style("padding-left", "10px");
                
        });


        const labels = vis.svg_bar.selectAll('.label')
            .data(vis.shotZoneDist)
            .enter()
            .append('g')
            .attr('class', 'label');
        
        /*labels.append('text')
            .attr('x', d => xScale(d.percentage) + 5)
            .attr('y', d => yScale(d.zone) + yScale.bandwidth() / 2)
            .attr('dy', '0.05em')
            .text(d => `${d.percentage.toFixed(2)}%`)
            .attr('fill', 'black')
            .style('font-size', '10px');
        */

        labels.append('text')
            .attr('x', d => xScale(d.percentage) + 5) 
            .attr('y', d => yScale(d.zone) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text(d => d.zone)
            .attr('fill', 'black')
            .attr('dx', '0.25em')
            .style('font-size', '10px');

        const density = d3.contourDensity()
            .x(d => vis.xScale(d.LOC_X))
            .y(d => vis.yScale(d.LOC_Y))
            .size([vis.court_width, vis.court_height])
            .bandwidth(25) 
            .thresholds(50) 
            (vis.player_data);
        
        vis.colorScale = d3.scaleQuantize()
            .domain([0, d3.max(density, d=>d.value)]) 
            .range(['#D5C5C5', '#9F9F9F', '#706A7C', '#675678', '#713A71', '#9D3E5E', '#BC5245', '#C86138', '#C96239', '#D37636', '#D67F39', '#DA8C3E', '#E1A352'])

        //const colorScale = d3.scaleSequential(d3.interpolateOrRd)
        //    .domain([0, d3.max(density, d => d.value)]);

        vis.heatGroup.selectAll('path').remove();

        vis.svg.append("defs").append("clipPath")
            .attr("id", "court-clip")
            .append("rect")
            .attr("width", vis.court_width)
            .attr("height", vis.court_height);

        vis.heatGroup.selectAll('path')
            .data(density)
            .enter().append('path')
            .attr('d', d3.geoPath())
            .attr('fill', d => vis.colorScale(d.value))
            .attr('opacity', 0.15)
            .attr("clip-path", "url(#court-clip)");

        // Append a group for court elements
        vis.court = vis.courtGroup.append('g');

        // basket rim
        vis.basket = vis.court.append('circle')
            .attr("cx", 240)
            .attr("cy", 50.38) //0.1125% ratio of distance to the bounce and half court length
            .attr("r", 7.5)
            .attr("stroke", "white")
            .attr('stroke-width', '0.2%');

        // paint area
        vis.paint = vis.court.append('rect')
            .attr('x', 163)
            .attr('y', 0)
            .attr('width', 154)
            .attr('height', 182.32)
            .attr('stroke', 'white')
            .attr('fill', 'none')
            .attr('stroke-width', '0.3%');

        vis.backboard = vis.court.append('line')
            .attr('x1', 210)
            .attr('y1', 38.38)
            .attr('x2', 270)
            .attr('y2', 38.38)
            .attr('stroke', 'white')
            .attr('stroke-width', '0.3%');

        // three point left line
        vis.court.append("line")
            .attr("x1", 28.8)
            .attr("y1", 0)
            .attr("x2", 28.8)
            .attr("y2", 134)
            .attr("stroke", "white")
            .attr('stroke-width', '0.3%');

        // three point right line
        vis.court.append("line")
            .attr("x1", 451.2)
            .attr("y1", 0)
            .attr("x2", 451.2)
            .attr("y2", 134)
            .attr("stroke", "white")
            .attr('stroke-width', '0.3%');

        const arcPath = vis.court.append('path')
        .attr('d', 'M 12 50.38 A 210 210 0 0 0 468 50.38') // radius length %0.45 of court width
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', '2');

        //hide extra 3-point arc    
        vis.court.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 28)
            .attr('height', 136)
            .attr('fill', 'black');
        
        //hide extra 3-point arc
        vis.court.append('rect')
            .attr('x', 452.1)
            .attr('y', 0)
            .attr('width', 27.9)
            .attr('height', 136)
            .attr('fill', 'black');

        //inner arc
        vis.court.append('path')
            .attr('d', 'M 201 50.38 A 20 20 0 0 0 279 50.38')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none');

        //inner paint
        vis.court.append('rect')
            .attr('x', 182.4)
            .attr('y', 0)
            .attr('width', 115.2)
            .attr('height', 182.32)
            .attr('stroke', 'white')
            .attr('fill', 'none')
            .attr('stroke-width', '0.2%');

        vis.court.append('path')
            .attr('d', 'M 182.4 182.32 A 20 20 0 0 0 297.6 182.32')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none');

        vis.court.append('path')
            .attr('d', 'M 297.6 182.32 A 20 20 0 0 0 182.4 182.4')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none')
            .attr('stroke-dasharray', '5, 5');
        
        //half court circle
        vis.court.append('path')
            .attr('d', 'M 259.2 451 A 20 20 0 0 0 220.8 451')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none');

        //half court circle     
        vis.court.append('path')
            .attr('d', 'M 297.6 451 A 20 20 0 0 0 182.4 451')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none');

        vis.renderVis();
    } 

    renderVis(){
        let vis = this;

        //basket
        vis.heatGroup.append('circle')
            .attr("cx", 240)
            .attr("cy", 50.38) //0.1125% ratio of distance to the bounce and half court length
            .attr("r", 7.5)
            .attr("stroke", "white")
            .attr('stroke-width', '0.2%')
            .attr('fill', 'none')
            .attr('opacity', '0.5');

        //paint
        vis.heatGroup.append('rect')
            .attr('x', 163)
            .attr('y', 0)
            .attr('width', 154)
            .attr('height', 182.32)
            .attr('stroke', 'white')
            .attr('fill', 'none')
            .attr('stroke-width', '0.3%')
            .attr('opacity', '0.5');

        //backboard
        vis.heatGroup.append('line')
            .attr('x1', 210)
            .attr('y1', 38.38)
            .attr('x2', 270)
            .attr('y2', 38.38)
            .attr('stroke', 'white')
            .attr('stroke-width', '0.3%')
            .attr('opacity', '0.5');

        //inner arc 
        vis.heatGroup.append('path')
            .attr('d', 'M 201 50.38 A 20 20 0 0 0 279 50.38')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none')
            .attr('opacity', '0.5');

        //inner paint
        vis.heatGroup.append('rect')
            .attr('x', 182.4)
            .attr('y', 0)
            .attr('width', 115.2)
            .attr('height', 182.32)
            .attr('stroke', 'white')
            .attr('fill', 'none')
            .attr('stroke-width', '0.2%')
            .attr('opacity', '0.5');

        vis.heatGroup.append('path')
            .attr('d', 'M 182.4 182.32 A 20 20 0 0 0 297.6 182.32')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none')
            .attr('opacity', '0.5');

        vis.heatGroup.append('path')
            .attr('d', 'M 297.6 182.32 A 20 20 0 0 0 182.4 182.4')
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .attr('fill', 'none')
            .attr('stroke-dasharray', '5, 5')
            .attr('opacity', '0.5');
        
    }
}
