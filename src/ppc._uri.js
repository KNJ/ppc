(function(){

// URI (static)
ppc.uri = gs(base, {
	works_all: 'http://www.pixiv.net/member_illust.php',
	illust: function(id){ return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + id; },
	illust_bookmarks: function(id){ return 'http://www.pixiv.net/bookmark_detail.php?illust_id=' + id; },
	home: function(){ return 'http://' + ppc.admin.get('domain'); },
	js: function(name){ return 'http://' + ppc.admin.get('domain') + '/js/' + name + '.js'; },
	css: function(){ return this.get('home') + '/css/ppc'; },
	img: function(){ return this.get('home') + '/img/ppc'; },
	guest: function(){ return this.get('home') + '/ppc/ajax/guest'; },
	record: function(){ return this.get('home') + '/ppc/ajax/record'; },
	ajax: function(){ return this.get('home') + '/ppc/ajax'; },
});

})();
