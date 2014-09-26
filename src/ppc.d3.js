(function(){

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
		scale_x: null,
		scale_y: null,
		axis_x: null,
		axis_y: null,
		init: function(){
			var selection = d3.select(this.get('field')).append('svg').attr({
				width: this.get('width'),
				height: this.get('height'),
			});
			this.set('selection', selection);
		},
	});

	ppc.d3.whole = gs(ppc.d3, {
		field: '.svg-whole',
		render: function(){
			selection = this.get('selection');
		},
	});

})();
