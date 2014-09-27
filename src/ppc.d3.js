(function($){

	// D3
	ppc.d3 = gs(base, {
		field: null,
		dataset: [],
		selection: null,
		width: 744,
		height: 360,
		padding: gs(base, {
			top: 60,
			right: 50,
			bottom: 60,
			left : 50,
		}),
		scaleX: null,
		scaleY: null,
		axis_x: null,
		axis_y: null,
		init: function(dataset){
			var selection = d3.select(this.get('field')).append('svg').attr({
				width: this.get('width'),
				height: this.get('height'),
			});
			this.set('selection', selection);
			this.set('dataset', dataset);
		},
	});

	ppc.d3.whole = gs(ppc.d3, {
		field: '.svg-whole',
		render: function(){
			try {

				var whole = this,
					dataset = whole.get('dataset'),
					selection = whole.get('selection'),
					min = d3.min(dataset, function(d){
						return d.get('date');
					});

				dataset.sort(function(a, b){
					return b.get('dv_power') - a.get('dv_power');
				});

				var scaleX = d3.time.scale()
				.domain([
					new Date(min),
					new Date()
				])
				.range([whole.get('padding').get('left'), whole.get('width') - whole.get('padding').get('right')])
				.nice();

				var scaleY = d3.time.scale()
					.domain([
						new Date(1970, 1, 1, 23, 59, 59),
						new Date(1970, 1, 1, 0, 0, 0)
					])
					.range([whole.get('padding').get('top'), whole.get('height') - whole.get('padding').get('bottom')])
					.nice();

				var axis_x = d3.svg.axis()
					.scale(scaleX)
					.orient('bottom')
					.tickFormat(d3.time.format('%Y/%m'));

				var axis_y = d3.svg.axis()
					.scale(scaleY)
					.orient('left')
					.tickFormat(d3.time.format('%H:%M'));

				// x軸の描画
				selection.append('g')
					.attr({
						class: 'axis axis-x',
						transform: 'translate(0,' + (whole.get('height') - whole.get('padding').get('bottom')) + ')',
					})
					.call(axis_x)
					.selectAll('text')
					.attr({
						x: 35,
						y: -5,
						transform: 'rotate(90)',
					});

				d3.select('.axis-x')
					.append('text')
					.attr({
						x: 0,
						y: -720,
						transform: 'rotate(90)',
					})
					.text('投稿年月日');

				// y軸の描画
				selection.append('g')
					.attr({
						class: 'axis axis-y',
						transform: 'translate(' + whole.get('padding').get('left') + ',0)',
					})
					.call(axis_y)
					.append('text')
					.attr({
						x: -44,
						y: 35,
					})
					.text('投稿時刻');

				// ツールチップ
				var $tooltip = ppc.parser.template.get('jq', 'tooltip_whole').clone().appendTo(whole.get('field'));
				var tooltip = d3.select('.tooltip-whole');

				// 点の描画
				selection.selectAll('circle')
					.data(dataset)
					.enter()
					.append('circle')
					.on('mouseover', function(d){

						d3.select(this)
						.transition()
						.duration(300)
						.attr({
							'fill-opacity': '1',
						});

						$tooltip.find('.title').text(d.get('title')).end()
						.find('.thumbnail').empty().append(d.get('$thumbnail').clone()).end()
						.find('.hot').text((d.get('hot') | 0).comma()).end()
						.find('.power').text(d.get('power').comma()).end()
						.find('.date').text(d.get('date')).end()
						.find('.time').text(d.get('time'));

						var self = d3.select(this),
						x = d3.select(this).attr('cx'),
						y = d3.select(this).attr('cy'),
						w = tooltip.style('width').number(0),
						h = tooltip.style('height').number(0),
						left = x - w / 2 - 3;

						// ツールチップが描画領域幅からはみ出さないようにする
						if (left < whole.get('padding').get('left')) {
							left = whole.get('padding').get('left');
						}
						else if (left + w > whole.get('width') - whole.get('padding').get('right')) {
							left = whole.get('width') - whole.get('padding').get('right') - w;
						}

						return tooltip.style('visibility', 'visible')
							.style({
								top: (y - 20 - h) + 'px',
								left: left + 'px',
							});

					})
					.on('mouseout', function(){

						d3.select(this)
						.transition()
						.duration(600)
						.attr({
							'stroke-width': '0',
							'fill-opacity': '.5',
						});
						return tooltip.style('visibility', 'hidden');

					})
					.transition()
					.delay(function(d, i){
						return i * 50;
					})
					.duration(1000)
					.each('start', function(){
						d3.select(this).attr({
							r: 0,
							fill: 'rgb(255,255,255)',
							'fill-opacity': 0,
						});
					})
					.attr({
						cx: function(d){ return scaleX(new Date(d.get('date'))); },
						cy: function(d){
							var times = d.get('time').split(':');
							return scaleY(new Date(1970, 1, 1, times[0], times[1], times[2]));
						},
						r: function(d){ return Math.sqrt(d.get('dv_power')) * 3; },
						fill: function(d){

							var v = d.get('dv_hot') > 100 ? 100 : d.get('dv_hot');
							v = v < 37 ? 37 : v;
							v = v - 37;

							var y = Math.LOG2E * Math.log(v + 1);
							var h = 360 - y / 6 * 360;
							var s = Math.pow(y / 6 * 10, 2);
							var l = 100 - y / 6 * 50;
							return 'hsl(' + h + ',' + s + '%,' + l  + '%)';

						},
						'fill-opacity': 0.5,

					});

			}
			catch(e){
				ppc.logger.get('error', e);
			}

		},
	});

})(jQuery);
