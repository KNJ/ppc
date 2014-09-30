(function(){

// Cookie (each cookie inherits from this)
ppc.cookie = cloz(base, {
	name: '', // cookie名
	params: {},
	expires: 150,
	input: function(key, val){
		var params = this.get('params');
		params[key] = val;
		return this.set('params', params);
	},
	output: function(key, val){
		if (this.get('params').hasOwnProperty(key)) {
			return this.get('params')[key];
		}
		else {
			return val;
		}
	},
	remove: function(key){
		var params = this.get('params');
		delete params[key];
		return this.set('params', params);
	},
	// cookieを読み取る
	// 継承した時は必ずreadしてparamsを取得する
	read: function(){
		var cs = document.cookie.split(';');
		for (var i = 0; i < cs.length; i++) {
			var kv = cs[i].split('=');
			if (kv[0].replace(/ /g, '') == this.get('name')) {
				return this.set('params', JSON.parse(decodeURIComponent(kv[1])));
			}
		}
		return this.set('params', {});
	},
	// cookieに書き込む
	write: function(){
		var c = '';
		c += this.get('name') + '=' + encodeURIComponent(JSON.stringify(this.get('params')));
		var exp = new Date();
		exp.setDate(exp.getDate() + this.get('expires'));
		c += '; expires=' + exp.toGMTString();
		document.cookie = c;
		return c;
	},
});

ppc.cookie.ppc = cloz(ppc.cookie, {
	name: 'ppc',
});
ppc.cookie.ppc.get('read');

})();
