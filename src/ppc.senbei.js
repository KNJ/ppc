(function($){

	// Senbei
	ppc.senbei = cloz(base,{
		self: null,
		init: function(){
			var self = senbei({
				name: ppc.user.get('id'),
				use: 'localStorage',
				write: ['localStorage', function(s){ppc.storage = s;}]
			},[
				{
					base: $('.senbei'),
					n: function(){
						console.log(ppc.storage);
					},
					on: {
						change: true,
					},
				}
			]);
			this.set('self', self);
		},
	});

})(jQuery);