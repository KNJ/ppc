(function(){

// Illust (each iilust inherits from this)
ppc.illust = cloz(base, {
	id: null,
	title: null,
	html: null,
	interval: null,
	age: function(){
		var minutes = this.get('interval') / (1000 * 60);
		var hours = minutes / 60;
		var days = hours / 24;
		var years = days / 365, // うるう年は無視（暫定）
			age = '';
		if (years | 0) {
			age += (years | 0) + '年';
		}
		if (days | 0) {
			age += (days | 0) % 365 + '日';
		}
		if (hours | 0) {
			age += (hours | 0) % 24 + '時間';
		}
			age += (minutes | 0) % 60 + '分';
		return age;
	},
	url: function(){
		return ppc.uri.get('illust', this.get('id'));
	},
	url_bookmarks: function(){
		return ppc.uri.get('illust_bookmarks', this.get('id'));
	},
	jq: function(){
		var html = this.get('html');
		return $(html);
	},
});

})();
