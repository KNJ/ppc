(function($){

	// Senbei
	ppc.senbei = cloz(base,{
		self: null,
		init: function(){
			var self = senbei({
				name: 'ppc' + ppc.user.get('id'),
				read: 'localStorage',
				write: 'localStorage',
				// write: ['localStorage', function(s){ppc.storage = s;}]
			},[
				{
					base: $('#gstchk'),
					condition: function(b){ return b.prop('checked'); },
					t: function(){ ppc.user.set('guest', true); },
					f: function(){ ppc.user.set('guest', false); },
					on: {
						change: true,
					},
				},
				{
					base: $('#rnkchk'),
					condition: function(b){ return b.prop('checked'); },
					t: function(){ ppc.user.set('vranking', true); },
					f: function(){ ppc.user.set('vranking', false); },
					on: {
						change: true,
					},
				},
				{
					base: $('#check-enable-animation'),
					condition: function(b){ return b.prop('checked'); },
					t: function(){ ppc.user.set('animation', true); },
					f: function(){ ppc.user.set('animation', false); },
					on: {
						change: true,
					},
				},
				{
					base: $('#ppcranking'),
					condition: function(b){ return b.prop('checked'); },
					t: function(){
						$('#login_status .join').text('参加');
						ppc.user.set('pranking', true);
					},
					f: function(){
						$('#login_status .join').text('不参加（「環境設定」から変更できます）');
						ppc.user.set('pranking', false);
					},
					on: {
						change: true,
					},
				},
			]);
			this.set('self', self);
		},
	});

})(jQuery);