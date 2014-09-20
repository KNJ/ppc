/**
 * @copyright (c) 2014 KNJ | THE MIT License | https://github.com/KNJ/ppc/blob/master/LICENSE
 */

 // 文字列から数字を抜き出す
String.prototype.number = function(i){
	if (i === null) {
		return this.match(/\d{1,}/g);
	}
	return Number(this.match(/\d{1,}/g)[i]);
};

// 数値にコンマを付ける
Number.prototype.comma = function(){
	return this.toString().replace(/([0-9]+?)(?=(?:[0-9]{3})+$)/g, '$1,');
};

// カプセル化
var gs = function(base, ex){
	var derived = {};
	var o = Object.create(base);

	derived.get = function(prop){
		if (typeof o[prop] === 'undefined') {
			return base.get.apply(this, arguments);
		}
		else if (typeof o[prop] === 'function') {
			var arg = [];
			for (var i = 1; i < arguments.length; i++) {
				arg.push(arguments[i]);
			}

			return o[prop].apply(this, arg);
		}
		else {
			return o[prop];
		}
	};
	derived.getAll = function(){
		return o;
	};
	derived.set = function(prop, value){
		o[prop] = value;
		return o[prop];
	};

	if (typeof ex === 'object' && ex !== null) {
		for (var p in ex) {
			derived.set(p, ex[p]);
		}
	}

	return derived;
};

(function($){

if (location.href !== 'http://www.pixiv.net/member_illust.php' && location.href !== 'http://www.pixiv.net/member_illust.php?res=full' && location.href !== 'http://www.pixiv.net/member_illust.php?res=all') {
	alert('http://www.pixiv.net/member_illust.php\nまたは\nhttp://www.pixiv.net/member_illust.php?res=full\nで実行してください。');
	return;
}

var ppc = {}, base = {};

// 管理者設定 (static)
ppc.admin = gs(base, {
	version: gs(base, {
		script: '140920',
		css: '140920',
	}),
	canonical_domain: 'eshies.net',
	domain: 'eshies.net',
	max_illusts: 28, // 測定対象上限数
	min_illusts: 20, // 測定対象下限数
	suspended: false,
});

// ユーザー設定 (static)
ppc.user = gs(base, {
	// 自動取得
	id: null,
	nickname: null,
	token: null,
	twitter: false, // Twitter連携
	name: null,
	twitter_name: null,
	scope: location.href === 'http://www.pixiv.net/member_illust.php?res=full' ? 'full' : 'all',
	last_power: 0,
	// オプション
	guest: true, // ゲストを呼ぶか
	guest_profile: null, // ゲストを呼ぶ呼ばないにかかわらず、ゲストオブジェクト取得してここに格納
	connections: null,
	illusts: null,
	monitor: false, // 常時コンソールにログを出力
	release: 0, // 公開レベル
});

// 定数
ppc.constants = gs(base, {
	rank_list: [0, 1000, 10000, 100000, 300000, 1000000, 10000000, 100000000],
	ranker_list: [17, 359, 2128, 950, 610, 518, 89, 5],
	sort_keys: gs(base, {
		id: '投稿日時',
		viewed: '閲覧数',
		scored: '総合点',
		rated: '評価回数',
		power: 'パワー',
		rated_ratio: '評価率',
		scored_average: '平均点',
		bookmarked_total: 'ブックマーク数',
		bookmarked_ratio: 'ブックマーク率',
		bookmarked_public_ratio: 'ブックマーク公開率',
		hot: 'HOT',
	}),
});

// URI (static)
ppc.uri = gs(base, {
	works_all: 'http://www.pixiv.net/member_illust.php',
	illust: function(id){ return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + id; },
	illust_bookmarks: function(id){ return 'http://www.pixiv.net/bookmark_detail.php?illust_id=' + id; },
	home: function(){ return 'http://' + ppc.admin.get('domain'); },
	css: function(){ return this.get('home') + '/css/ppc'; },
	img: function(){ return this.get('home') + '/img/ppc'; },
	guest: function(){ return this.get('home') + '/ppc/ajax/guest'; },
	record: function(){ return this.get('home') + '/ppc/ajax/record'; },
	ajax: function(){ return this.get('home') + '/ppc/ajax'; },
});

// Rank (static)
ppc.rank = gs(base, {
	bookmarked: [7.2, 3.8, 2.4, 1.2, 0],
	rated: [14, 10, 6, 3, 0],
	scored: [9.96, 9.8, 9.4, 8.8, 0],
});

// Manager (static)
ppc.manager = gs(base, {
	init: function(){
		try {
			ppc.logger.get('add', 'PPCの初期化を開始しました', 0, 'start initialization');

			// 最大同時接続数を設定
			ppc.user.set('connections', ppc.parser.created.get('val', 'connections'));

			// 測定日時を設定
			var now = (new Date()).getTime() + (new Date()).getTimezoneOffset() * 60 * 1000 + 540 * 60 * 1000;
			ppc.user.set('now', now);

			// 環境設定から最大測定対象数を取得
			var max_illusts = Number(ppc.parser.created.get('val', 'max_illusts'));

			// 最大測定対象数が測定対象上限数を上回っている場合、測定対象上限数丸める
			if (max_illusts > ppc.admin.get('max_illusts')) {
				ppc.user.set('illusts', ppc.admin.get('max_illusts'));
			}

			// 最大測定対象数が測定対象下限数を下回っている場合、測定対象下限数に丸める
			if (max_illusts < ppc.admin.get('min_illusts')) {
				ppc.user.set('illusts', ppc.admin.get('min_illusts'));
			}

			// 測定するイラスト数を設定
			var illusts = ppc.user.set('illusts', ppc.parser.home.get('length', 'illust'));

			// 最大測定対象数より表示されているイラストが多い場合、最大測定対象数に丸める
			if (illusts > max_illusts) {
				ppc.user.set('illusts', max_illusts);
			}

			// イラスト投稿数が0または正しく取得できなかった場合、処理を停止
			if (!ppc.user.get('illusts')) {
				ppc.logger.get('add', '作品投稿数が取得できませんでした', 3);
				return false;
			}

			// 各イラストについてオブジェクトを生成し、配列に格納
			var box = {}; // ID重複確認用
			for (var i = 0; i < ppc.user.get('illusts'); i++) {
				var id = ppc.parser.home.get('illust_id', i);
				if (!isFinite(id)) {
					ppc.logger.get('add', '作品のIDが取得できませんでした (index = ' + i + ')', 3);
					return false;
				}
				ppc.logger.get('add', 'イラストのIDを取得しました => ' + id + ' (index = ' + i + ')', 0);
				for (var k in box) {
					if (box[k] == id) {
						ppc.logger.get('add', '作品IDの競合が検出されました', 3);
						return false;
					}
				}
				box[i] = id;
				var ins = gs(ppc.illust, {
					id: id,
				});
				ppc.illusts[i] = ins;
			}

			ppc.logger.get('add', 'PPCの初期化を完了しました', 0, 'end initialization');
			return true;
		}
		catch (e) {
			ppc.logger.get('error', e);
		}
	},
	run: function(){
		ppc.logger.get('add', '測定を開始しました', 0, 'start analyzing');

		// タブを切り替える
		ppc.parser.created.get('jq', 'tab_group').tabs({disabled: [2]}).tabs('select', 1);

		if (!ppc.ajax.illust.get('init')) {
			return false;
		}

		if (!ppc.ajax.illust.get('run')) {
			return false;
		}

		return true;
	},
	finish: function(){
		ppc.logger.get('add', '測定を完了しました', 0, 'end analyzing');

		if (!this.get('_process')) {
			return false;
		}

		return true;
	},
	_process: function(){
		ppc.logger.get('add', 'データ処理を開始しました', 0);

		try {
			for (var i = 0; i < ppc.user.get('illusts'); i++) {
				$html = ppc.illusts[i].get('jq');

				// イラストごとにオブジェクトを継承
				ppc.parser.illust.illusts[i] = gs(ppc.parser.illust, {
					$doc: $html,
					$image_response: null,
				});
			}

			// イラスト情報の登録
			for (var j = 0; j < ppc.user.get('illusts'); j++) {
				var illust = ppc.illusts[j],
				parser = ppc.parser.illust.illusts[j];

				// ID・サムネイル
				var id = ppc.parser.home.get('illust_id', j),
				$thumbnail = ppc.parser.home.get('$illust_thumbnail', j);

				illust.set('id', id);
				illust.set('$thumbnail', $thumbnail);

				// タイトル
				var title = parser.get('text', 'title');

				illust.set('title', title);

				// 総合ブックマーク数・公開ブックマーク数・非公開ブックマーク数
				var $bookmarked = parser.get('jq', 'bookmarked'),
					$bookmarked_total = parser.get('jq', 'bookmarked_total'),
					bookmarked_total = 0,
					bookmarked_public = 0,
					bookmarked_private = 0;

				// 1つ以上のブックマークがある場合
				if ($bookmarked_total.length) {
					bookmarked_total = $bookmarked_total.text().number(0);
				}
				// 1つ以上の公開ブックマークがある場合
				if ($bookmarked.length) {
					var bookmarked = $bookmarked.text().number(null);
					// 公開ブックマークしかない場合
					if (bookmarked.length < 3) {
						bookmarked_public = bookmarked_total;
					}
					// 非公開ブックマークがある場合
					else {
						bookmarked_public = bookmarked[1].number(0);
						bookmarked_private = bookmarked[2].number(0);
					}
				}
				// 公開ブックマークがない場合
				else {
					bookmarked_private = bookmarked_total;
				}

				illust.set('bookmarked_total', bookmarked_total);
				illust.set('bookmarked_public', bookmarked_public);
				illust.set('bookmarked_private', bookmarked_private);
				illust.set('bookmarked_public_ratio', ppc.math.get('div', bookmarked_public * 100, bookmarked_total));

				// 評価回数・総合点・コメント数・閲覧数
				var rated = ppc.parser.home.get('illust_figures', j, 'rating-count'),
				scored = ppc.parser.home.get('illust_figures', j, 'score'),
				commented = ppc.parser.home.get('illust_figures', j, 'comments'),
				viewed = ppc.parser.home.get('illust_figures', j, 'views');

				illust.set('rated', rated);
				illust.set('scored', scored);
				illust.set('commented', commented);
				illust.set('viewed', viewed);
				illust.set('scored_average', ppc.math.get('div', scored, rated));
				illust.set('rated_ratio', ppc.math.get('div', rated * 100, viewed));
				illust.set('bookmarked_ratio', ppc.math.get('div', bookmarked_total * 100, viewed));

				// 投稿日時
				var timestamp = parser.get('text', 'datetime'),
				timestamp_a = timestamp.number(null),
				datetime = new Date(timestamp_a[0], timestamp_a[1] - 1, timestamp_a[2], timestamp_a[3], timestamp_a[4], timestamp_a[5], 0),
				milliseconds = datetime.getTime(),
				interval = ppc.user.get('now') - milliseconds;

				illust.set('timestamp', timestamp);
				illust.set('milliseconds', milliseconds);
				illust.set('interval', interval); // ミリ秒単位の経過時間
				illust.set('interval_days', interval / (1000 * 60 * 60 * 24)); // 日単位の経過時間

				// HOT
				var hot = ppc.math.get('div', viewed, interval / (1000 * 60 * 60 * 24));

				illust.set('hot', hot);

				// イメレスbadge
				$image_response = parser.get('jq', 'image_response');
				illust.set('$image_response', $image_response);

				// タグ
				$tags = parser.get('jq', 'tags');
				illust.set('$tags', $tags);

				// タグ数
				tags_num_total = parser.get('length', 'tags_num_total');
				tags_num_self = parser.get('length', 'tags_num_self');
				illust.set('tags_num_total', tags_num_total);
				illust.set('tags_num_self', tags_num_self);

				// 最新ブックマーク
				$bookmarked_latest = parser.get('jq', 'bookmarked_latest');
				illust.set('$bookmarked_latest', $bookmarked_latest);

			}

			// ユーザーID(数字)・ニックネーム・投稿数
			var user_id = ppc.parser.home.get('attr', 'user_id', 'href').number(0),
			user_name = ppc.parser.illust.illusts[0].get('text', 'user_name'),
			posted = ppc.parser.home.get('text', 'posted').number(0);

			ppc.user.set('id', user_id);
			ppc.user.set('nickname', user_name);
			ppc.user.set('posted', posted);

			// フォロワー数・マイピク数取得
			ppc.ajax.follower.get('load');

		}
		catch (e){
			ppc.logger.get('error', e);
			return false;
		}

		ppc.logger.get('add', 'データ処理を完了しました', 0);
	},
	calc: function(){
		ppc.logger.get('add', '計算を開始しました');

		try {
			var now = ppc.user.get('now'),
			illusts = ppc.user.get('illusts'),
			followers = ppc.user.get('followers'),
			my_pixiv = ppc.user.get('my_pixiv'),
			total_power = 0,
			pixiv_power = 0;

			var index_last = illusts - 1,
			interval_longest = (now - ppc.illusts[index_last].get('milliseconds')) / (1000 * 60 * 60 * 24);

			var interval_average = interval_longest / illusts;

			ppc.user.set('interval_longest', interval_longest);
			ppc.user.set('interval_average', interval_average.toFixed(1));

			for (var i = 0; i < illusts; i++) {
				var illust = ppc.illusts[i],
				interval = illust.get('interval'),
				freshment = ppc.math.get('freshment', interval_average, interval),
				power = 0,
				bt = illust.get('bookmarked_total'),
				bpb = illust.get('bookmarked_public'),
				bpr = illust.get('bookmarked_private'),
				r = illust.get('rated'),
				s = illust.get('scored'),
				c = illust.get('commented'),
				v = illust.get('viewed');

				if (v) {
					power =  c * 10;
					power += v;
					power += bt * bpb * 1000 / v;
					if (r) {
						power += s * s / r;
					}
					power *= freshment;
					power = Math.round(power);
					total_power += power;
				}

				illust.set('freshment', freshment);
				illust.set('power', power);

				// Elements
				var elements = [
					['現在', null],
					['閲覧', v],
					['評価', r],
					['点', s],
					['ブクマ', bt],
					['日', illust.get('interval_days')],
					['パワー', power]
				];

				illust.set('elements', elements);

			}

			pixiv_power = ppc.math.get('pixivPower', followers, my_pixiv, total_power);
			ppc.user.set('total_power', Math.ceil(total_power));
			ppc.user.set('pixiv_power', Math.ceil(pixiv_power));

		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
		ppc.logger.get('add', '計算を完了しました');
		this.get('result');
	},
	result: function(){
		ppc.logger.get('add', '結果表示を開始しました', 0);

		ppc.renderer.get('remove', '#processing,#processing-description');

		if (!ppc.old.get('result')) {
			return false;
		}

		ppc.logger.get('add', '結果表示を終了しました', 0);
	},
});

// Parser
ppc.parser = gs(base, {
	$doc: $(document),
	selector: gs(base, {
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
ppc.parser.home = gs(ppc.parser, {
	selector: gs(base, {
		contents: '#wrapper',
		illust: '.display_works>ul>li',
		illust_anchor: '.display_works a[href^="member_illust.php?mode=medium&illust_id="]',
		user_id: 'a[href^="member_illust.php?id="]:first',
		page2: '.page-list a[href*="p=2"]',
		posted: '.column-header .count-badge:first',
		works: '.display_works:first',
	}),
	ads: [
		'.ads_area',
		'.area_new:has(a[href*="ads.pixiv"])',
		'a[href*="ads.pixiv"]',
		'.column-header+aside',
	],
	illust_jq: function(i){
		return $('.display_works>ul>li').eq(i);
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
ppc.parser.created = gs(ppc.parser, {
	selector: gs(base, {
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
ppc.parser.template = gs(ppc.parser, {
	selector: gs(base, {
		summary: '#summary',
	}),
});

// parser - 個別イラストブックマークページ(bookmark_detail.php?illust_id=)
ppc.parser.illust = gs(ppc.parser, {
	selector: gs(base, {
		title: '.title>.self',
		bookmarked: '.list-option:first',
		bookmarked_total: '.bookmark-count:first',
		image_response: '.image-response-count:first',
		datetime: '.pipe-separated:first>li',
		user_name: '.user-name:first',
		tags: '.tags:first',
		bookmarked_latest: '.bookmark-items>.bookmark-item:first',
		tags_num_total: '.tags:first>li>.tag-icon',
		tags_num_self: '.self-tag',
	}),
});

// parser - フォロワーページ(bookmark.php?type=reg_user)
ppc.parser.follower = gs(ppc.parser, {
	selector: gs(base, {
		followers: '.info:first .count:first',
		my_pixiv: '.mypixiv-unit:first>.unit-count'
	}),
});

// parser - イラストごとにオブジェクトを継承($docが異なるため)
ppc.parser.illust.illusts = [];

// Logger (static)
ppc.logger = gs(base, {
	log: [],
	add: function(message, level, id){
		var datetime = new Date();
		d = datetime.toLocaleTimeString() + '.' + datetime.getMilliseconds();
		var a = this.get('log');
		var i = id ? id : null;
		var l = {message: message, level: level, datetime: d, id: i};
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

// Ajax
ppc.ajax = gs(base, {
	url: null,
	type: 'GET',
	data_type: 'html',
	cache: false,
	load: function(index){
		var self = this,
			url = this.get('url'),
			type = this.get('type'),
			data_type = this.get('data_type'),
			cache = this.get('cache');
		$.ajax({
			url: url,
			type: type,
			data_type: data_type,
			cache: cache,
			beforeSend: function(){
				ppc.logger.get('add', 'リクエストを送信しました -> ' + url, 0);
				self.get('_beforeFilter');
			},
			success: function(data){
				ppc.logger.get('add', 'レスポンスを受信しました <- ' + url, 0);
				self.get('_afterFilter', data, index);
			},
			error: function(){
				ppc.logger.get('add', 'レスポンスを受信できませんでした - ' + url, 3);
			},
		});
	},
	_beforeFilter: function(){},
	_afterFilter: function(){},
});

// ajax - イラスト情報をスクレイピング
ppc.ajax.illust = gs(ppc.ajax, {
	active: 0,
	complete: 0,
	index: 0,
	connections: null,
	illusts: null,
	init: function(){
		ppc.logger.get('add', 'Ajaxの初期化を開始しました', 0);

		try {
			this.set('active', 0);
			this.set('complete', 0);
			this.set('index', 0);
			this.set('connections', ppc.user.get('connections'));
			this.set('illusts', ppc.user.get('illusts'));
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}

		ppc.logger.get('add', 'Ajaxの初期化を終了しました', 0);

		return true;
	},
	run: function(){
		ppc.logger.get('add', 'Sequential Ajaxを開始しました', 0);

		try {
			// 最初のAjaxをアクティブにする
			this.set('url', ppc.illusts[0].get('url_bookmarks'));
			this.get('_activate');
		}
		catch (e){
			ppc.logger.get('error', e);
			return false;
		}

		return true;
	},
	_activate: function(){
		var i = this.get('index');
		// すべてのAjaxが開始しているまたはアクティブ数が接続数以上になる場合はこれ以上アクティブにしない
		if (i >= this.get('illusts') || this.get('active') >= this.get('connections')) {
			// このスコープでの処理は理論上1回しか起こらない

			// インデクスを1つ減らす
			this.set('index', i - 1);
			return true;
		}
		else {
			// アクティブ数を1つ増やす
			var a = this.get('active');
			this.set('active', a + 1);

			this.get('load', i);

			if (i + 1 !== this.get('illusts')) {

				// インデクスを1つ増やす
				j = this.set('index', i + 1);

				// Ajaxをアクティブにする
				this.set('url', ppc.illusts[j].get('url_bookmarks'));
				this.get('_activate');
				return false;
			}

			return true;
		}
	},
	_afterFilter: function(html, i){
		try {
			var j = this.get('index');

			// 取得したHTMLを保存
			ppc.illusts[i].set('html', html);

			// アクティブ数を1つ減らす
			var a = this.get('active');
			this.set('active', a - 1);

			// 完了数を1つ増やす
			var c = this.get('complete');
			this.set('complete', c + 1);

			// すべてのAjaxが開始していなければ次のAjaxへ移る
			if (j + 1  < this.get('illusts')) {

				// インデクスを1つ増やす
				k = this.set('index', j + 1);

				// Ajaxをアクティブにする
				this.set('url', ppc.illusts[k].get('url_bookmarks'));
				this.get('_activate');
				return;
			}

			// すべてのAjaxが完了していればManagerに伝える
			if (this.get('complete') === this.get('illusts')) {
				ppc.logger.get('add', 'Sequential Ajaxを完了しました', 0);
				ppc.manager.get('finish');
			}

			return;
		}
		catch (e) {
			ppc.logger.get('error', e);
			return;
		}

	},
});

// ajax - フォロワー数やマイピク数をスクレイピング
ppc.ajax.follower = gs(ppc.ajax, {
	url: 'http://www.pixiv.net/bookmark.php?type=reg_user',
	_afterFilter: function(html){
		try {
			ppc.parser.follower.set('$doc', $(html));
			var followers = ppc.parser.follower.get('text', 'followers'),
			my_pixiv = ppc.parser.follower.get('text', 'my_pixiv');

			if (!my_pixiv) {
				my_pixiv = '0';
			}
			ppc.user.set('followers', followers.number(0));
			ppc.user.set('my_pixiv', my_pixiv.number(0));
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}

		// 完了をManagerに伝え、計算に入る
		ppc.manager.get('calc');

		return true;
	},
});

// ajax - 2ページ目
ppc.ajax.page2 = gs(ppc.ajax, {
	url: ppc.uri.get('works_all') + '?res=' + ppc.user.get('scope') + '&p=2',
	// 2ページ目をつなげる
	_afterFilter: function(data){
		var $html = $(data).find('.display_works:first').clone();

		ppc.renderer.get('render').get('at', '.display_works', $html);
		this.get('_drop');
		ppc.renderer.get('activateStartButton');
		ppc.logger.get('add', '2ページ目の作品を追加しました');
	},
	// 測定対象外の余剰分を落とす
	_drop: function(){
		try {
			for (var i = ppc.parser.home.get('length', 'illust'); i > ppc.admin.get('max_illusts'); i--) {
				ppc.parser.home.get('illust_jq', i - 1).remove();
			}
		}
		catch (e) {
			ppc.logger.get('error', e);
		}
	},
});

// Math (static)
ppc.math = gs(base, {
	div: function(a, b){
		if (!b) { return 0; }
		return a / b;
	},
	freshment: function(interval_average, interval){
		return 1 / Math.pow((12 / (interval_average + 5) + 1), (interval / (1000 * 60 * 60 * 24 * 365)).toFixed(4));
	},
	pixivPower: function(followers, my_pixiv, total_power){
		return (followers * 0.0001 + my_pixiv * 0.001 + 1) * total_power;
	},
	sum: function(a, prop){
		var sum = 0;
		$.each(a, function(i, v){
			sum += v.get(prop);
		});
		return sum;
	},
	standardDeviation: function(illusts, total_power, count){
		var sigma = 0;
		$.each(illusts, function(i, v){
			sigma += Math.pow((v.get('power') - total_power / count), 2);
		});
		return Math.sqrt(sigma / count);
	},
	deviation: function(sd, power, power_average){
		return (10 * ( power - power_average ) / sd + 50).toFixed(1);
	},
});

// Renderer
ppc.renderer = gs(base, {
	load: gs(base, {
		css: function(href){
			$('<link rel="stylesheet" href="' + href + '.css">').appendTo('head');
		}
	}),
	render: gs(base, {
		at: function(selector, jq){
			return jq.appendTo(selector);
		},
	}),
	update: function(selector, text){
		$(selector).text(text);
	},
	remove: function(selector){
		$(selector).remove();
	},
	removeAds: function(){
		$.each(ppc.parser.home.get('ads'), function(i, selector){
			$(selector).remove();
		});
	},
	fillUserStatus: function(data){
		try {
			if (data.message === 'authorized') { // Twitter認証に成功した場合
				ppc.logger.get('add', 'Twitterと連携しました', 0);
				$('#profile_image').attr('src', data.profile_image_url.replace(/normal+\./g, 'mini.')).css('display', 'inline');
				$('#screen_name').text(data.screen_name);
				$('#profile_image,#screen_name').wrap('<a href="' + ppc.uri.get('home') + '/account" target="_blank"></a>');
				ppc.user.set('twitter', true);
				ppc.user.set('token', data.token);
				ppc.user.set('last_power', data.last_power);
				ppc.user.set('twitter_name', data.screen_name);
				ppc.user.set('name', data.name);
				ppc.user.set('release', data.release);
			}
			$('#login_status .last_power').text(Number(data.last_power).comma());
			$('#login_status .last_recorded').text(data.recorded);
			if (data.release > 0) {
				var t = window.setInterval(function(){
					if ($('#ppcranking').length == 1) {
						clearInterval(t);
						$('#ppcranking').attr('checked', true);
						if ($('#ppcranking').attr('checked')) { $('#login_status .join').text('参加'); }
						if (data.release == 1) {$('#release1').attr('checked', true);}
						else if (data.release == 2) {$('#release2').attr('checked', true);}
						else if (data.release == 3) {$('#release3').attr('checked', true);}
					}
				}, 200);
			}
			else {
				$('#ppcranking').attr('checked', false);
				if (!$('#ppcranking').attr('checked')) { $('#login_status .join').text('不参加（環境設定から変更できます）'); }
			}
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
	},
	fillRanking: function (){
		var target = ppc.parser.created.get('selector').get('login_status');
		$.getJSON(ppc.uri.get('ajax') + '/ranking' + '?callback=?', {}, function(data){
			if (data.denominator >= data.numerator) { // 分母が分子以上であれば表示（pixivパワーが0だと例外発生するから）
				$('.denominator', target).text(data.denominator);
				$('.numerator', target).text(data.numerator);
				$('.jump', target).html('<a href="' + ppc.uri.get('home') +'/ppc/ranking/power?page=' + data.page + '" target="_new">ランキングで位置を確認</a>');
				$('.percentage', target).html('(上から' + Math.ceil((Number(data.numerator) / Number(data.denominator) * 100)) + '%)<a href="' + ppc.uri.get('home') +'/ppc/ranking/power?page=' + data.page + '" target="_new"><i class="fa fa-external-link"></i></a>');
			}
		});
	},
	activateStartButton: function(){
		if (!ppc.admin.get('suspended')) {
			$('#btn-ppc').on('click', function(){

				// old
				if (!ppc.old.get('button')) {
					return false;
				}

				if (!ppc.manager.get('init')) {
					return false;
				}

				if (!ppc.manager.get('run')) {
					return false;
				}

				return true;

			}).removeClass('disabled').text('測定する！');
		}
	},
	addNewTabLink: function(selector){
		$(selector).find('a').attr('target', '_blank');
	},
});

// Utility (static)
ppc.utility = gs(base, {
	color: function(deviation){
		if(deviation <= 50){ return 'rgb(247,231,183)'; }
		else{
			return 'rgb(247,' + Math.ceil( 231 - (deviation - 50) * 2 ) + ',' + Math.ceil( 183 - (deviation - 50) * 2 ) + ')';
		}
	},
	tab: function(html1, html2, b){
		var h = '<div>' +
		'<div class="column-header"><div class="layout-cell"><h1 class="column-title">' + html1 + '</h1></div></div>' +
		'<div class="column-body' + (b ? ' adjusted' : '') + '">' + html2 + '</div>' +
		'</div>';
		return h;
	},
	rateWithLetter: function(n, a){
		var letters = ['S','A','B','C','D','E','F'],
			rating = '';
		$.each(a, function(i, v){
			rating = '<span class="letter letter' + letters[i] + '">' + letters[i] + '</span>';
			return (n < v);
		});
		return rating;
	},
	createTableHtml: function(ary, bgColor, bool){
		var t = '<table>';
		$.each(ary, function(i, value1){
			if(!i){
				if (bool) {
					t += '<thead>';
					$.each(ary[i], function(j, value2){
						t += '<th>' + value2 + '</th>';
					});
					t += '</thead>';
				}
				t += '<tbody>';
			}else if(i % 2){
				t += '<tr>';
				$.each(ary[i], function(k, value3){
					t += '<td style="background:' + bgColor + ';">' + value3 + '</td>';
				});
				t += '</tr>';
			}else{
				t += '<tr>';
				$.each(ary[i], function(k, value3){
					t += '<td>' + value3 + '</td>';
				});
				t += '</tr>';
			}
		});
		t += '</table></tbody>';
		return t;
	},
	tags_num: function(total, self) {
		return total + '(' + ( total - self ) + ')';
	},
});

// Old (static)
ppc.old = gs(base, {
	button: function(){
		try {
			$('#btn-ppc').addClass('disabled').text('測定しています').off();
			window.scroll(0,0);

			if ($('#gstchk').prop('checked')) {
				$('<img id="guest" src="' + ppc.uri.get('img') + '/' + ppc.user.get('guest_profile').PpcGuest.illust_id + '.' + ppc.user.get('guest_profile').FileExtension.name + '" width="180" height="180" style="margin:5px;display:none;" />').appendTo($ppc_result);
				if (ppc.user.get('guest_profile').PpcGuest.illust_id) {
					$('#guest', $ppc_result).wrap('<a href="http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + ppc.user.get('guest_profile').PpcGuest.illust_id + '" target="_blank"></a>');
				}
				else {
					$('#guest', $ppc_result).wrap('<span>');
				}
			}
			else {
				ppc.user.set('guest', false);
				$('<div>').attr({id:'guest', width:'180px'}).appendTo($ppc_result);
				$('#guest', $ppc_result).wrap('<span>');
				index = 0;
			}

			$('#message').css('display', 'none');
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
		return true;
	},
	result: function(){
		try {
			// ボタン切り替え
			$('#btn-ppc').text('測定が終わりました').off();

			// タブ表示
			ppc.parser.created.get('jq', 'tab_group').tabs('option', 'disabled', []);
			ppc.parser.created.get('jq', 'tab_group').tabs('select', 1);

			ppc.renderer.get('render').get('at', '#totalResult .column-body', $ppc_result);
			$('#guest').parent().wrap('<div id="ppc_left" />');
			$('<div>', {id: 'ppc_right'}).insertAfter('#ppc_left');

			// ソート切り替えナビゲーション挿入
			$('<div>', {
					class: 'extaraNaviAlso edit_work_navi',
					html: $('<ul>', {
							html: function(){
								$('<span>', {id: 'temp'}).appendTo('body');
								for (var k in ppc.constants.get('sort_keys').getAll()) {
									$('<li>', {
										html: $('<a>', {
											class: 'black_link sort-by sort-by-' + k,
											href: '#',
											'data-sort-by': k,
											html: ppc.constants.get('sort_keys').get(k) + '<i class="fa fa-sort-numeric-desc"></i><i class="fa fa-sort-numeric-asc"></i>',
										})
									}).appendTo('#temp');
								}
								var result = $('#temp').html();
								$('#temp').remove();
								return result;
							}
						}
					)
				}
			).appendTo('#detail .column-body');

			$('.sort-by').on('click', function(){
				var self = $(this);
				var order = 'desc';
				var k = self.data('sort-by'), t = self.text();
				ppc.illusts.sort(function(a, b){
					return b.get(k) - a.get(k);
				});
				if (self.hasClass('desc')) {
					// 昇順にする
					order = 'asc';
					$('.sort-by').removeClass('active').removeClass('desc').removeClass('asc').find('.fa').css('display', 'none');
					self.addClass(order).addClass('active').find('.fa-sort-numeric-asc').css('display', 'inline');
					ppc.illusts.reverse();
				}
				else {
					// 降順にする
					$('.sort-by').removeClass('active').removeClass('desc').removeClass('asc').find('.fa').css('display', 'none');
					self.addClass(order).addClass('active').find('.fa-sort-numeric-desc').css('display', 'inline');
				}
				ppc.old.get('arrange', t, ppc.illusts, order);
				return false;
			});

			$('<ul>', {id: 'sortableList'}).appendTo('#detail .column-body');

			$('.sort-by.sort-by-id').addClass('desc').addClass('active').find('.fa-sort-numeric-desc').css('display', 'inline');
			ppc.old.get('arrange', ppc.constants.get('sort_keys').get('id'), ppc.illusts, 'desc');

			// 各パラメータ合計
			var rated_sum = ppc.math.get('sum', ppc.illusts, 'rated'),
			scored_sum = ppc.math.get('sum', ppc.illusts, 'scored'),
			commented_sum = ppc.math.get('sum', ppc.illusts, 'commented'),
			viewed_sum = ppc.math.get('sum', ppc.illusts, 'viewed'),
			bookmarked_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_total'),
			bookmarked_public_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_public');
			hot_sum = ppc.math.get('sum', ppc.illusts, 'hot');

			ppc.user.set('rated_sum', rated_sum);
			ppc.user.set('scored_sum', scored_sum);
			ppc.user.set('commented_sum', commented_sum);
			ppc.user.set('viewed_sum', viewed_sum);
			ppc.user.set('bookmarked_sum', bookmarked_sum);
			ppc.user.set('bookmarked_public_sum', bookmarked_public_sum);
			ppc.user.set('hot_sum', hot_sum | 0);

			var message_start = ppc.user.get('guest_profile').PpcMessage.start,
			message_end = ppc.user.get('guest_profile').PpcMessage.end;

			if (!message_start || !ppc.user.get('guest')) {
				message_start = 'あなたのpixivパワーは';
			}
			if (!message_end || !ppc.user.get('guest')) {
				message_end = 'です！';
			}

			$('#ppc_result')
			.prepend($('<div>', {id: 'ppc_bottom'}))
			.prepend(
				$('<div>', {id: 'ppc'})
				.append($('<div>', {class: 'message-start', text: message_start}))
				.append($('<div>', {id: 'result', text: 0}))
				.append($('<div>', {class: 'message-end', text: message_end}))
			)
			.prepend($('<div>', {id: 'ppc_top'}));

			$('#guest').show();

			this.get('_step1');

		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
		return true;
	},
	_step1: function(){
		var total_power = ppc.user.get('total_power'),
			piece = Math.round(total_power / 100),
			$result = ppc.parser.created.get('jq', 'result'),
			n = 0,
			self = this;
		$result.css('color', '#999');

		// 例外：パワーが0の場合
		if (total_power === 0) {
			self.get('_wait1');
			return true;
		}

		var timer = window.setInterval(function(){
			n += piece;
			if (n > total_power) {
				n = total_power;
				$result.text(n.comma());
				clearInterval(timer);
				self.get('_wait1');
			}
			$result.text(n.comma());
		}, 30);
		return true;
	},
	_wait1: function(){
		var self = this;
		window.setTimeout(function(){
			$('#ppc_left')
			.append(
				$('<div>', {
					class: 'bonus',
					text: 'フォロワー補正： +' + (ppc.user.get('followers') * 0.01).toFixed(2) + '%',
				})
			)
			.append(
				$('<div>', {
					class: 'bonus',
					text: 'マイピク補正： +' + (ppc.user.get('my_pixiv') * 0.1).toFixed(1) + '%',
				})
			)
			.append(
				$('<div>', {
					class: 'bonus',
					text: '勢い補正： +' + ppc.user.get('hot_sum').comma(),
				})
			)
			.find('.bonus').fadeIn();
			self.get('_step2');
		}, 1500);
	},
	_step2: function(){
		var total_power = ppc.user.get('total_power'),
			pixiv_power = ppc.user.get('pixiv_power'),
			piece = Math.round((pixiv_power - total_power) / 20),
			$result = ppc.parser.created.get('jq', 'result'),
			n = total_power,
			self = this;
		$result.css('color', '#f99');

		// 例外：パワーが0の場合
		if (pixiv_power === 0) {
			self.get('_wait2');
			return true;
		}

		var timer = window.setInterval(function(){
			n += piece;
			if (n > pixiv_power) {
				n = pixiv_power;
				$result.css('color', 'red').text(n.comma());
				clearInterval(timer);
				self.get('_wait2');
			}
			$result.text(n.comma());
		}, 30);
		return true;
	},
	_wait2: function(){
		var user_id = ppc.user.get('id'),
		nickname = ppc.user.get('nickname'),
		pixiv_power = ppc.user.get('pixiv_power'),
		total_power = ppc.user.get('total_power'),
		rated_sum = ppc.user.get('rated_sum'),
		scored_sum = ppc.user.get('scored_sum'),
		commented_sum = ppc.user.get('commented_sum'),
		viewed_sum = ppc.user.get('viewed_sum'),
		bookmarked_sum = ppc.user.get('bookmarked_sum'),
		interval_longest = ppc.user.get('interval_longest'),
		illusts = ppc.illusts,
		count = ppc.user.get('illusts'),
		rank = 'F',
		message = 'message_f',
		index = 0,
		self = this;

		window.setTimeout(function(){
			try {
				var users = 0;
				$.each(ppc.constants.get('ranker_list'), function(i, v){
					users += v;
				});
				var by = 10000 / users;
				var fd = $.map(ppc.constants.get('ranker_list'), function(v, i){
					return (v *= by).toFixed(0);
				});
				var fd_sum = 0;
				$.each(fd, function(i, v){
					fd_sum += Number(v);
				});

				var ranks = ppc.constants.get('rank_list');

				// pixiv_powerに応じてランクを与える
				var r = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];
				var m = ['message_f', 'message_e', 'message_d', 'message_c', 'message_b', 'message_a', 'message_s', 'message_s'];
				var vranking = ''; // 仮想順位
				$.each(ranks, function(i, v){
					if (pixiv_power >= v) {
						rank = r[i];
						message = m[i];
						index = i;
					}
				});
				if (rank === 'SS') {
					vranking = '1-' + fd[7];
				}
				else {
					var interval = (ranks[index + 1] - ranks[index]) / fd[index];
					var ranking_begin = 0;
					var power_begin = ranks[index];
					for(var i = 7; i >= index; i--){
						ranking_begin += Number(fd[i]);
					}
					var j = 0;
					while(pixiv_power > power_begin){
						power_begin += Number(interval);
						j++;
					}
					vranking = (ranking_begin - j).toFixed(0);
				}

				// ゲストのコメント
				if (ppc.user.get('guest_profile').PpcMessage[message] !== '' && ppc.user.get('guest')){
					$('<span>', {text: ppc.user.get('guest_profile').PpcMessage[message]}).appendTo('#ppc');
				}

				$('#ppc_left')
				.append(
					$('<div>', {
						class: 'summary-interval-average',
						text: '平均投稿間隔： ' + ppc.user.get('interval_average') + '日',
					})
				)
				.append(
					$('<div>', {
						class: 'summary-rank',
						html: 'ランク: <span class="rank">' + rank +'</span>',
					})
				)
				.find('.summary-interval-average, .summary-rank').fadeIn();

				$('<div>').fadeIn().html('pixivパワー: <span>' + pixiv_power.comma() +'</span>').insertBefore('#ppc_left>div:first');
				$('<div>').fadeIn().html('測定対象数: <span>' + ppc.user.get('illusts') +'</span>').insertBefore('#ppc_left>div:first');
				$('<div>').fadeIn().html('投稿数: <span>' + ppc.user.get('posted') +'</span>').insertBefore('#ppc_left>div:first');

				// 仮想順位の表示
				if(ppc.cookie.ppc.get('output', 'rnkchk', false)){
					$('<div>').css({display: 'none'}).fadeIn().html('仮想順位： <strong>' + vranking +'</strong> / 10000 前回順位： ' + ppc.cookie.ppc.get('output', 'ranking', 'データ無し')).appendTo('#ppc_right');
					ppc.cookie.ppc.get('input', 'ranking', vranking);
					ppc.cookie.ppc.get('write');
				}

				$('<br>').appendTo('#ppc_result');

				ppc.renderer.get('render').get('at', '#ppc_right', ppc.parser.template.get('jq', 'summary'));
				$('#summary')
					.find('.illusts').text(ppc.user.get('illusts')).end()
					.find('.rate')
						.find('.sum').text(rated_sum).end()
						.find('.average-per-work').text((rated_sum / count).toFixed(1)).end()
						.find('.average-per-day').text((rated_sum / interval_longest).toFixed(1)).end()
						.end()
					.find('.score')
						.find('.sum').text(scored_sum).end()
						.find('.average-per-work').text((scored_sum / count).toFixed(1)).end()
						.find('.average-per-day').text((scored_sum / interval_longest).toFixed(1)).end()
						.end()
					.find('.comments')
						.find('.sum').text(commented_sum).end()
						.find('.average-per-work').text((commented_sum / count).toFixed(1)).end()
						.find('.average-per-day').text((commented_sum / interval_longest).toFixed(1)).end()
						.end()
					.find('.view')
						.find('.sum').text(viewed_sum).end()
						.find('.average-per-work').text((viewed_sum / count).toFixed(1)).end()
						.find('.average-per-day').text((viewed_sum / interval_longest).toFixed(1)).end()
						.end()
					.find('.bookmarks')
						.find('.sum').text(bookmarked_sum).end()
						.find('.average-per-work').text((bookmarked_sum / count).toFixed(1)).end()
						.find('.average-per-day').text((bookmarked_sum / interval_longest).toFixed(1)).end()
						.end()
					.find('tr').not(':first').filter(':even').css('backgroundColor', '#f3f3f3');

				// 標準偏差
				var sd = ppc.math.get('standardDeviation', illusts, total_power, count);

				$.each(illusts, function(i, v){
					var deviation = ppc.math.get('deviation', sd, v.get('power'), total_power / count),
						$illust_report = ppc.parser.home.get('$illust_report', i);
					v.set('deviation', deviation);
					$illust_report.append('<span class="report-link">鮮度&nbsp;<span class="count">' + v.get('freshment').toFixed(2) + '</span></span>');
					$illust_report.append('<span class="report-link">パワー&nbsp;<span class="count">' + v.get('power') + '</span></span>');
					$illust_report.append('<span class="report-link">偏差値&nbsp;<span class="count">' + v.get('deviation') + '</span></span>');
					$illust_report.append('<span class="report-link">タグ数&nbsp;<span class="count">' + ppc.utility.get('tags_num', v.get('tags_num_total'), v.get('tags_num_self')) + '</span></span>');
					$('.display-report').eq(i).css('border-color', ppc.utility.get('color', v.get('deviation')));
					$('.display_works>ul>li').eq(i).find('.bookmark-count:first').html('<i class="_icon sprites-bookmark-badge"></i>' + v.get('bookmarked_total') + ' (' + v.get('bookmarked_public') + ' + ' + v.get('bookmarked_private') + ')');
				});

			}
			catch (e) {
				ppc.logger.get('error', e);
				return false;
			}

			// パワーの保存
			self.get('_save');

			// タイムラインの埋め込み
			$('<a>', {
				class: 'twitter-timeline',
				href: 'https://twitter.com/hashtag/pixiv%E3%83%91%E3%83%AF%E3%83%BC%E3%83%81%E3%82%A7%E3%83%83%E3%82%AB%E3%83%BC',
				'data-widget-id': '511162064274866177',
				text: 'pixivパワー に関するツイート'
			}).appendTo('#totalResult .column-body');
			!function(d,s,id){
				var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}
			}(document,'script','twitter-wjs');

			var tweet1 = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(nickname + 'のpixivパワーは【' + pixiv_power.comma() + '】です。') + '&hashtags=' + encodeURIComponent('pixivパワーチェッカー') + '&url=http://www.pixiv.net/member.php?id=' + user_id;
			var tweet2 = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('私のpixivパワーは【' + pixiv_power.comma() + '】です。') + '&hashtags=' + encodeURIComponent('pixivパワーチェッカー');

			$('<div>', {id: 'tweet'}).appendTo('#ppc_right');
			$('<button>', {id: 'btn-tweet', class: 'ppc-button', html: '<i class="fa fa-twitter"></i>結果をツイート'}).appendTo('#tweet');
			$('#btn-tweet').wrap($('<a/>', {class: 'wrapper-btn-tweet'}).attr('href', tweet1).attr('target', '_blank'));
			$('<br><input type="checkbox" id="pidchk"><label for="pidchk">pixivへのリンクを載せる</label>').appendTo('#tweet');
			$('#pidchk').attr('checked', ppc.cookie.ppc.get('output', 'pidchk', true));

			if (!($('#pidchk').prop('checked'))){
				$('#tweet a').attr('href', tweet2);
			}
			$('#pidchk').on('click', function(){
				if ($('#pidchk').prop('checked')) {
					$('#tweet a').attr('href', tweet1);
					ppc.cookie.ppc.get('input', 'pidchk', true);
				}
				else {
					$('#tweet a').attr('href', tweet2);
					ppc.cookie.ppc.get('input', 'pidchk', false);
				}
				ppc.cookie.ppc.get('write');
			});

			// リンクを新しいタブで開くようにする
			ppc.renderer.get('addNewTabLink', ppc.parser.home.get('jq', 'contents'));
			$('a[href^="javascript"], a[href="#"]').attr('target', '');

		}, 1500);

		ppc.logger.get('add', 'すべての処理が完了しました', 0);

	},
	_save: function(){
		var pixiv_power = ppc.user.get('pixiv_power');
		var last_power = ppc.user.get('last_power');
		try {
			if (ppc.user.get('twitter')) {
				var release = 0;
				if ($('#ppcranking').attr('checked') && $('input[name="release"]:checked').length === 1) {
					release = $('input[name="release"]:checked').attr('value');
				}

				$('<div>', {id:'neighbors-mes'}).appendTo('#totalResult .column-body');

				$('<div>', {id:'ppc_neighbors'}).appendTo('#totalResult .column-body');

				$.getJSON(ppc.uri.get('record') + '?callback=?',
					{
						User: {pixiv_id: ppc.user.get('id'), twitter_name: ppc.user.get('twitter_name'), name: ppc.user.get('name')},
						PpcPower: {power: pixiv_power, release: release},
						token: ppc.user.get('token'),
					},
					function(data){
						if (data.status == 'ok') {
							var target = $('#login_status').find('.updown:first'),
								updown = pixiv_power - last_power,
								text = 'pixivパワーを保存しました';

							if (updown >= 0) {
								updown = '(+' + updown.comma() + ')';
								target.addClass('up').text(updown);
							}
							else {
								updown = '(' + updown.comma() + ')';
								target.addClass('down').text(updown);
							}
							ppc.renderer.get('update', '#login_status .last_power:first', pixiv_power.comma());
							ppc.renderer.get('fillRanking');

							if (release == 1) {
								text += '（ランキングにTwitterとpixivを公開）';
							}
							else if (release == 2) {
								text += '（ランキングにTwitterのみ公開）';
							}
							else if (release == 3) {
								text += '（ランキングに匿名で公開）';
							}
							ppc.logger.get('add', text, 0);

							if (data.neighbors.length) {
								ppc.renderer.get('update', '#neighbors-mes', 'あなたとpixivパワーが近いユーザー（Twitterとpixivを公開しているユーザーのみ表示）');
								$.each(data.neighbors, function(i, v){
									var img = v.User.twitter_image;

									if (img.substr(7, 10) !== ppc.admin.get('canonical_domain')) {
										img = ppc.uri.get('img') + '/profile.png';
									}
									$('<div>', {class:'ppc-unit'})
									.append(
										$('<div>',{class:'ppc-power',text: Number(v.PpcPower.power).comma()})
									)
									.append(
										$('<a>',{class:'twitter-image',href:'http://twitter.com/' + v.User.twitter_name, target:'_blank'})
										.append(
											$('<img>',{width:'48',height:'48',border:'0',alt:v.User.name,src:img})
										)
									)
									.append(
										$('<a>',{href:'http://twitter.com/' + v.User.twitter_name, target:'_blank'})
										.append(
											$('<div>',{class:'ppc-name',text:v.User.name})
										)
									)
									.append(
										$('<a>',{href:'http://www.pixiv.net/member.php?id=' + v.User.pixiv_id, target:'_blank'})
										.append(
											$('<div>',{class:'ppc-pixiv_id',text:'(' + v.User.pixiv_id + ')'})
										)
									)
									.appendTo('#ppc_neighbors');
								});
							}
							else {
								ppc.renderer.get('update', '#neightbors-mes', 'あなたとpixivパワーが近い公開ユーザーはいません');
							}
						}
						else if (data.status == 'error') {
							ppc.logger.get('error', data);
						}
					}
				);

			}
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
	},
	createArrayForTable: function(elem){
		var a = [['', (elem[0])[0]]];
		$.each(elem, function(i, value){
			if(i){
				a[0].push('/' + value[0]);
			}
		});
		var len1 = elem.length;
		for(var i=0; i < len1; i++){
			if(i){
				a.push([]);
				var len2 = len1 + 1;
				for(var j=0; j < len2; j++){
					if(!j){
						a[i].push((elem[i])[0]);
					}
					else if(j === 1){
						a[i].push(Number((elem[i])[1]) | 0);
					}
					else {
						a[i].push((ppc.math.get('div', elem[i][1], elem[j-1][1])).toFixed(2));
					}
				}
			}
		}
	return a;
	},
	// 作品詳細の並べ替え
	arrange: function(text, illusts, order){
		var order_text = order === 'desc' ? '降順' : '昇順';
		$('#detail').find('h1:first').addClass('arranging').text('並べ替え中…');
		$('#sortableList').animate({opacity: 0.5}, function(){
			$('#sortableList>li').remove();
			$('#detail').find('h1:first').removeClass('arranging').text('各作品の詳細 - ' + text + '順（' + order_text + '）');

			$.each(illusts, function(i, v){

				$('<li>', {class:'works'}).appendTo('#sortableList');
				var $detail_left = $('<div>', {class:'detailLeft'}).html(v.get('$thumbnail')).appendTo('#sortableList li:last').append('<br>').append(
					$('<a>', {
						href: v.get('url_bookmarks'),
						target: '_blank',
						class: 'bookmark-count',
						html: '<i class="_icon sprites-bookmark-badge"></i>' + v.get('bookmarked_total') + ' (' + v.get('bookmarked_public') + ' + ' + v.get('bookmarked_private') + ')'
					})
				).append(
					$('<div>', {
						class: 'display_hot',
						text: (v.get('hot') | 0).comma() + ' HOT'
					})
				).find('img').wrap($('<a>', {
					href: v.get('url'),
					target: '_blank',
				}));

				if(v.get('$image_response')){
					v.get('$image_response').insertAfter('.bookmark-count:last');
					$('<br>').insertAfter('.bookmark-count:last');
				}

				var votes = [
					['','','','','評定'],
					['閲覧数：', v.get('viewed').comma(), '評価率：', v.get('rated_ratio').toFixed(2) + '%', ppc.utility.get('rateWithLetter', ppc.math.get('div', v.get('rated') * 100, v.get('viewed')), ppc.rank.get('rated'))],
					['総合点：', v.get('scored').comma(), '平均点：', v.get('scored_average').toFixed(2) + '点', ppc.utility.get('rateWithLetter', ppc.math.get('div', v.get('scored'), v.get('rated')), ppc.rank.get('scored'))],
					['評価回数：',v.get('rated').comma(), 'ブクマ率：', v.get('bookmarked_ratio').toFixed(2) + '%', ppc.utility.get('rateWithLetter', ppc.math.get('div', v.get('bookmarked_total') * 100, v.get('viewed')), ppc.rank.get('bookmarked'))],
					['パワー：', v.get('power').comma(), 'ブクマ公開率：', v.get('bookmarked_public_ratio').toFixed(0) + '%', '']
				];

				$('<div>', {
					class: 'detailRight',
					html: '<h2><a href="' + v.get('url') + '" target="blank">' + v.get('title') + '</a></h2>',
				}).appendTo('#sortableList li:last').append(
					$('<div>', {
						text:'投稿日時：' + v.get('timestamp') + '　経過：' + v.get('age')
					})
				).append(v.get('$tags')).append(
					$('<div>',{
						class:'votes',
						html: ppc.utility.get('createTableHtml', votes,'#FFFFFF',true)
					})
				);

				$('.votes').last().find('th')
				.filter(':odd').css({width:'50px', paddingLeft:'8px'}).end()
				.filter(':even').css({width:'108px'}).end()
				.last().css({width:'30px'}).end()
				.find('tr').find('td:eq(1)').css({borderRight:'1px solid #CCC'});

				$('<div>', {
					class:'detailBottom',
					html: ppc.utility.get('createTableHtml', ppc.old.get('createArrayForTable', v.get('elements')), '#f3f3f3', true),
				}).appendTo('#sortableList li.works:last').prepend(
					$('<div>',{
						class:'toggleNext',
						text:'詳細を表示▼',
					})
				).prepend(
					$('<ul>', {
						class:'bookmark-item'
					})
				);

				v.get('$bookmarked_latest').appendTo('.bookmark-item:last');
			});

			$('#sortableList a').attr({'target':'_blank'});
			$('.toggleNext').on('click', function(){
				var $next = $(this).next();
				$next.toggle();
				if ($next.css('display') === 'none') {
					$(this).text('詳細を表示▼');
				}
				else {
					$(this).text('詳細を隠す▲');
				}
			});

			//セルのハイライト
			var current_r, current_c;
			$('.detailBottom table td').hover(function(){
				(current_r = $(this).parent().children('.detailBottom table td')).addClass('hover');
				(current_c = $(this).parent().parent().find('td').filter(':nth-child('+ (current_r.index($(this))+1) +')')).addClass('hover');
				},
				function(){
					current_r.removeClass('hover');
					current_c.removeClass('hover');
				}
			);

			$(this).css('opacity', 1);
		});
	},
});

// Illust (each iilust inherits from this)
ppc.illust = gs(base, {
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

// Cookie (each cookie inherits from this)
ppc.cookie = gs(base, {
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

ppc.cookie.ppc = gs(ppc.cookie, {
	name: 'ppc',
});
ppc.cookie.ppc.get('read');

// Illust継承オブジェクトを格納する配列
// ppc.illustと混同しないように注意
ppc.illusts = [];

//thanks to 'http://d.hatena.ne.jp/holidays-l/20070923/p1'
(function(l){
	var f, m, e, t;
	(function g(){
		m = l.shift();
		if (!m)
			return f && f();
		if (typeof m == 'string' || m instanceof String)
			m = {
				'window': m
			};
		for (var p in m) {
			var type = typeof p;
			if (p == 'window' || type == 'undefined') {
				e = document.createElement('script');
				e.type = 'text/javascript';
				e.src = m[p];
				document.documentElement.appendChild(e);
			}
		}
		t = setInterval(function(){
			for (var p in m) {
			var type = typeof p;
				if (type == 'undefined')
					return;
			}
			clearInterval(t);
			g();
		}, 99);
	})();
	return function(c){
		return function(){
			var a = arguments;
			f = function(){
				c.apply(c, a);
			};
		};
	};
})

// Load external libraries
([
	'http://' + ppc.admin.get('domain') + '/js/ppc/jquery-ui-1.8.2.custom.min.js'
]);

$.fn.extend({
	// HTMLの呼び出し
	appendHtml: function(page, func){
		var target = this;
		$.getJSON(ppc.uri.get('ajax') + '/page/' + page + '?callback=?', {}, function(data){
			$(data.html).appendTo(target);
			func();
		});
	},
	appendTab: function(text, anchor){
		return this.append($('<li>').prepend(($('<a>').attr('href', anchor)).prepend($('<span>').text(text))));
	}
});

// 主な処理はここから開始
var $leftColumn = ppc.parser.get('jq', 'col_l');
var $rightColumn = ppc.parser.get('jq', 'col_r');

$('<div>', {id:'buttons', class:'right-container'}).prependTo('.layout-column-2');
$('a', $leftColumn).attr('target', '_blank');
$('.display_works>ul>li>span').wrap('<div class="status" />');

ppc.renderer.get('removeAds');

if ($('#message').length) {
    alert('ページを再読み込みしてから実行してください。');
    return;
}

$rightColumn.wrapInner('<div id="works" />');
$rightColumn.wrap('<div id="tab_group" />');

$('div.pages').fadeOut('slow');
ppc.parser.created.get('jq', 'tab_group').fadeOut('slow',function(){
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/jquery-ui-1.8.2.custom');
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/ppc' + ppc.admin.get('version').get('css'));
	ppc.renderer.get('load').get('css', '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min');

	ppc.parser.created.get('jq', 'tab_group').prepend(
		$('<ul>').prepend(
			$('<li>').prepend(
				$('<a>').attr('href', '#works').prepend(
					$('<span>').text('作品')
				)
			)
		)
	);

	// タブ生成
	ppc.parser.created.get('jq', 'tab_group').find('>ul')
	.appendTab('pixivパワー', '#totalResult')
	.appendTab('詳細', '#detail')
	.appendTab('環境設定', '#conf')
	.appendTab('ログ', '#ppcLog')
	.appendTab('お知らせ', '#ppc-info')
	.appendTab('PPCについて', '#ppc-about');

	ppc.parser.created.get('jq', 'tab_group').find('>div')
	.append($('<div>', {id: 'totalResult', class: 'ppcTab'}))
	.append($('<div>', {id: 'detail', class: 'ppcTab'}))
	.append($('<div>', {id: 'conf', class: 'ppcTab'}))
	.append($('<div>', {id: 'ppcLog', class: 'ppcTab'}))
	.append($('<div>', {id: 'ppc-info', class: 'ppcTab'}))
	.append($('<div>', {id: 'ppc-about', class: 'ppcTab'}));

	$('#totalResult')
	.append(ppc.utility.get('tab', 'pixivパワーの測定結果','',1))
	.append($('<div>', {
		id: 'processing',
		text: '測定中',
	}))
	.append($('<div>', {
		id: 'processing-description',
		text: '測定中です。何もせずにお待ちください。',
	}));
	$('#detail').append(ppc.utility.get('tab', '各作品の詳細','',0));
	$('#conf').append(ppc.utility.get('tab', '環境設定','',1));
	$('#ppcLog').append(ppc.utility.get('tab', '測定のログ','',1));
	$('#ppc-info').append(ppc.utility.get('tab', 'お知らせ','',1)).find('.column-body').appendHtml('promotion', function(){});
	$('#ppc-about').append(ppc.utility.get('tab', 'PPCについて','',1)).find('.column-body').appendHtml('about', function(){
		ppc.renderer.get('update', '.ppc-version', ppc.admin.get('version').get('script'));
	});

	ppc.renderer.get('render').get('at',
		'#ppcLog .column-body',
		$('<ul>', {
			id: 'ppc_log',
			css: {
				maxHeight: '500px',
				overflow: 'scroll',
			}
		})
	);

	ppc.renderer.get('render').get('at',
		'#conf .column-body',
		$('<div>', {
			id: 'configuration',
		})
	);

	// 環境設定
	$('#configuration').appendHtml('configuration', function(){
		$('#gstchk').attr('checked', ppc.cookie.ppc.get('output', 'gstchk', true));
		$('#gstchk').on('click', function(){
			if ($(this).prop('checked')) {
				ppc.cookie.ppc.get('input', 'gstchk', true);
			}
			else {
				ppc.cookie.ppc.get('input', 'gstchk', false);
			}
			ppc.cookie.ppc.get('write');
		});

		$('#rnkchk').attr('checked', ppc.cookie.ppc.get('output', 'rnkchk', false));
		$('#rnkchk').on('click', function(){
			if ($(this).prop('checked')) {
				ppc.cookie.ppc.get('input', 'rnkchk', true);
			}
			else {
				ppc.cookie.ppc.get('input', 'rnkchk', false);
			}
			ppc.cookie.ppc.get('write');
		});

		$('#ppcranking').on('click', function(){
			if ($(this).prop('checked')) {
				$('#login_status .join').text('参加');
				ppc.cookie.ppc.get('input', 'ppcranking', true);
			}
			else {
				$('#login_status .join').text('不参加（「環境設定」から変更できます）');
				ppc.cookie.ppc.get('input', 'ppcranking', false);
			}
			ppc.cookie.ppc.get('write');
		});

		$('#release' + ppc.cookie.ppc.get('output', 'release', '1')).attr('checked', true);
		$('#release1,#release2,#release3').on('click', function(){
			ppc.cookie.ppc.get('input', 'release', $(this).attr('value'));
			ppc.cookie.ppc.get('write');
		});

		$('.help_trigger').hover(
			function(){
				$(this).parent().parent().children('td').children('.configuration_help').css('visibility', 'visible');
			},
			function(){
				$(this).parent().parent().children('td').children('.configuration_help').css('visibility', 'hidden');
			}
		);
	});

	$('#conf .column-body').appendHtml('ppcranking', function(){});

	// ゲストの情報を取得
	$.getJSON(
		ppc.uri.get('guest') + '?callback=?', function(data){
			var guest_profile = new Object(data);
			ppc.user.set('guest_profile', guest_profile);
		}
	);

	// Wait until jQuery UI is completely loaded
	var timer0 = window.setInterval(
		function(){
			try {
				// タブ表示
				ppc.parser.created.get('jq', 'tab_group').tabs({selected: 5, disabled: [1,2], fx:{opacity: 'toggle', duration: 'fast'}}).fadeIn('slow');
				clearInterval(timer0);
				ppc.logger.get('add', 'jQuery UIを読み込みました', 0);
			}
			catch(e){
				// ppc.logger.get('error', e);
			}

			try {
				// テンプレートをダウンロード
				$.getJSON(ppc.uri.get('ajax') + '/page/template' + '?callback=?', {}, function(data){
					var $html = $(data.html);
					ppc.parser.template.set('$doc', $html);
					ppc.logger.get('add', 'テンプレートをダウンロードしました', 0);

					// 測定ボタンを生成
					$html.find('#btn-ppc').appendTo('#buttons');

					// 2ページ目があるかどうか確認
					// 確認後、開始ボタンを利用可にする
					if (ppc.parser.home.get('length', 'page2') > 0) {
						ppc.logger.get('add', '21以上の作品が検出されました', 1);
						ppc.ajax.page2.get('load');
					}
					else {
						ppc.renderer.get('activateStartButton');
					}

					// ログインステータスの表示
					$('#buttons').appendHtml('login_status', function(){
						if (window.addEventListener) {
							window.addEventListener('message', function(e){
								var data = JSON.parse(e.data);
								if (e.origin === ppc.uri.get('home') || e.origin === ppc.uri.get('home') + '/') {
									ppc.renderer.get('fillUserStatus', data);
									ppc.renderer.get('fillRanking');
								}
							});
						}
						if (ppc.user.get('release') > 0) {
							ppc.renderer.get('update', '#login_status .join', '参加');
						}
						else {
							ppc.renderer.get('update', '#login_status .join', '不参加（「環境設定」から変更できます）');
						}
					});

					// Twitterログインボタンの生成
					ppc.renderer.get('render').get('at',
						'#buttons',
						$('<iframe>', {
							id: 'login_with_twitter',
							class: 'button',
							name: 'login_with_twitter',
							width: '120',
							height: '34',
							src: ppc.uri.get('home') + '/twitter/button',
						})
					);

					// Tiwtterアイコン、screen nameの表示
					ppc.renderer.get('render').get('at', '#buttons', $('<img>', {id:'profile_image'}));
					ppc.renderer.get('render').get('at', '#buttons', $('<span>', {id:'screen_name', text:'Twitterとの連携でパワーの保存やランキングへの参加ができます'}));
				});
			}
			catch (e) {
				ppc.logger.get('error', e);
			}

		},100
	);
});

var $ppc_result = $('<div>').attr('id', 'ppc_result');

})(jQuery);