(function($){

// Logger (static)
ppc.logger = gs(base, {
	log: [],
	add: function(message, level, id){
		id = id || null;
		var datetime = new Date();
		var d = datetime.toLocaleTimeString() + '.' + datetime.getMilliseconds();
		var a = this.get('log');
		var l = {message: message, level: level, datetime: d, id: id};
		a.push(l);
		var text = this.get('_str', l);
		if (l.level === 3) {
			alert('エラー: ' + l.message);
		}
		if (ppc.user.get('monitor')) {
			console.log(text);
		}
		ppc.renderer.get('render').get('at',
			ppc.parser.created.get('jq', 'log'),
			$('<li>', {
				class: 'log-level' + level,
				text: text,
			})
		);
		return this.set('log', a);
	},
	error: function (e){
		this.get('add', e.message, 3);
	},
	_str: function(o){
		var s = '',
			l = '成功';
		if (o.level === 1) { l = '情報'; }
		else if (o.level === 2) { l = '警告'; }
		else if (o.level === 3) { l = 'エラー'; }
		s = l + ': ' + o.message + ' [' + o.datetime + ']';
		if (o.id) {
			s += ' <' + o.id + '>';
		}
		return s;
	},
});

})(jQuery);
