(function($){

// Parser
ppc.parser = cloz(base, {
	$doc: $(document),
	selector: cloz(base, {
		col_l: '.layout-a .ui-layout-west',
		col_r: '.layout-a ._unit',
		nickname: '.user-name:first',
		tags: '.tags:first',
	}),
	text: function(key){
		return this.get('$doc').find(this.get('selector').get(key)).text();
	},
	val: function(key){
		return this.get('$doc').find(this.get('selector').get(key)).val();
	},
	attr: function(key, attr){
		return this.get('$doc').find(this.get('selector').get(key)).attr(attr);
	},
	prop: function(key, attr){
		return this.get('$doc').find(this.get('selector').get(key)).prop(attr);
	},
	length: function(key){
		return this.get('$doc').find(this.get('selector').get(key)).length;
	},
	jq: function(key){
		return this.get('$doc').find(this.get('selector').get(key));
	},
	check: function(){
		for (var k in this.get('selector')) {
			console.log(this.get('selector').get(key) + ' => ' + $(this.get('selector').get(key)).length);
		}
	},
});

// parser - イラスト管理ページ(member_illust.php)
ppc.parser.home = cloz(ppc.parser, {
	selector: cloz(base, {
		contents: '#wrapper',
		illust: '.display_editable_works>ul>li',
		illust_anchor: '.display_editable_works a[href^="member_illust.php?mode=medium&illust_id="]',
		user_id: 'a[href^="member_illust.php?id="]:first',
		page2: '.page-list a[href*="p=2"]',
		posted: '.column-header .count-badge:first',
		works: '.display_editable_works:first',
	}),
	ads: [
		'.ads_area',
		'.area_new:has(a[href*="ads.pixiv"])',
		'a[href*="ads.pixiv"]',
		'.column-header+aside',
	],
	illust_jq: function(i){
		return $('.display_editable_works>ul>li').eq(i);
	},
	illust_id: function(i){
		return this.get('illust_jq', i).find('input[id^="i_"]:first').val();
	},
	illust_title: function(i){
		return this.get('illust_jq', i).find('img[src*="_s."]:first').parent().text();
	},
	illust_figures: function(i, c){
		return this.get('illust_jq', i).find('.display-report>.report-link.' + c + '>.count:first').text().number(0);
	},
	$illust_thumbnail: function(i){
		return this.get('illust_jq', i).find('img[src*="/img/"]:first').clone();
	},
	$illust_report: function(i){
		return this.get('illust_jq', i).find('.display-report:first');
	},
});

// parser - 新たに生成したもの
ppc.parser.created = cloz(ppc.parser, {
	selector: cloz(base, {
		connections: '#maxconn option:selected',
		guest: '#gstchk',
		log: '#ppc_log',
		login_status: '#login_status',
		max_illusts: '#max_illusts option:selected',
		result: '#result',
		tab_group: '#tab_group',
	}),
});

// parser - テンプレート
ppc.parser.template = cloz(ppc.parser, {
	selector: cloz(base, {
		summary: '#summary',
		tooltip_whole: '.tooltip-whole',
	}),
});

// parser - 個別イラストブックマークページ(bookmark_detail.php?illust_id=)
ppc.parser.illust = cloz(ppc.parser, {
	selector: cloz(base, {
		title: '.title>.self',
		bookmarked: '.list-option:first',
		bookmarked_total: '.bookmark-count:first',
		image_response: '.image-response-count:first',
		datetime: '.pipe-separated:first>li:first',
		user_name: '.user-name:first',
		tags: '.tags:first',
		bookmarked_latest: '.bookmark-items>.bookmark-item:first',
		tags_num_total: '.tags:first>li>.tag-icon',
		tags_num_self: '.self-tag',
	}),
});

// parser - フォロワーページ(bookmark.php?type=reg_user)
ppc.parser.follower = cloz(ppc.parser, {
	selector: cloz(base, {
		followers: '.info:first .count:first',
		my_pixiv: '.mypixiv-unit:first>.unit-count'
	}),
});

// parser - イラストごとにオブジェクトを継承($docが異なるため)
ppc.parser.illust.illusts = [];

})(jQuery);
