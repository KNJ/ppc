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

// Cloz
var cloz = function(base, ex){
	base = base || {};
	var derived = {};
	var o = Object.create(base);
	var isStr = function(prop){
		if (Object.prototype.toString.call(prop) === '[object String]') {
			return true;
		}
		return false;
	};
	var isObj = function(prop){
		if (Object.prototype.toString.call(prop) === '[object Object]') {
			return true;
		}
		return false;
	};

	derived.get = function(prop){
		if (!isStr(prop)) {
			throw new Error('The first argument of cloz.get() must be string.');
		}
		if (typeof o[prop] === 'undefined') {
			if (base.hasOwnProperty('get')) {
				return base.get.apply(this, arguments);
			}
			else {
				throw new Error('Cannot find property "' + prop + '"');
			}
		}
		else if (typeof o[prop] === 'function') {
			var args = [];
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			return o[prop].apply(this, args);
		}
		else {
			return o[prop];
		}
	};
	derived.gain = function(prop, val){
		if (!isStr(prop)) {
			throw new Error('The first argument of cloz.gain() must be string');
		}
		if (typeof o[prop] === 'undefined') {
			if (base.hasOwnProperty('get')) {
				return base.gain.apply(this, arguments);
			}
			else {
				val = val || null;
				return val;
			}
		}
		else if (typeof o[prop] === 'function') {
			var args = [];
			for (var i = 2; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			return o[prop].apply(this, args);
		}
		else {
			return o[prop];
		}
	};
	derived.getAll = function(){
		return o;
	};
	derived.set = function(prop, val){
		if (isStr(prop)) {
			o[prop] = val;
			return o[prop];
		}
		if (isObj(prop)) {
			for (var p in prop) {
				o[p] = prop[p];
			}
			return prop;
		}
		throw new Error('The first argument of cloz.set() must be string');
	};
	derived.extend = function(prop, obj){
		if (!isStr(prop)) {
			throw new Error('The first argument of cloz.extend() must be string');
		}
		o[prop] = cloz(this.get(prop), obj);
		return o[prop];
	};

	if (typeof ex === 'object' && ex !== null) {
		for (var p in ex) {
			derived.set(p, ex[p]);
		}
		if (ex.hasOwnProperty('__cloz')) {
			ex.__cloz();
		}
		if (ex.hasOwnProperty('_cloz')) {
			ex._cloz();
		}
		else {
			derived.gain('_cloz');
		}
	}
	else {
		derived.gain('_cloz');
	}

	return derived;
};

// pixivにエラーメッセージを送るのを無効化
window.onerror = null;

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

var ppc = ppc || {};
var base = {};
var $ppc_result = $('<div>').attr('id', 'ppc_result');

// 方針
// input、select、およびtextareaでそれぞれ処理を分岐する
// inputはtypeによってさらに細かく処理を分岐する

var senbei;

(function($){

$.fn.extend({
	tag: function(){
		return this.get()[0].localName;
	},
	type: function(){
		return this.get()[0].type;
	},
});

senbei = function(configuration, conditions){

	conditions = conditions || [];

	// クッキーのデフォルト有効期限（1ヶ月）
	var exp = new Date();
	exp.setMonth(exp.getMonth() + 1);
	exp.toGMTString();

	// senbeiの核となるオブジェクト
	var o = {
		conf: {
			name: 'senbei',
			// 読み書き媒体（文字列または配列〉
			// 配列で複数指定した場合、
			// 読みでは、先に指定した媒体が優先され、空の場合は次に指定したものが読まれる
			// 書きでは、指定した媒体すべてに書き込む
			read: null, // 読み込み
			write: null, // 書き込み
			cookie: {
				expires: exp,
				domain: null,
				path: null,
				secure: false,
			},
		},
	};

	// ユーザ設定で上書き
	$.extend(true, o.conf, configuration);

	// API（これから増やしていく？）
	// ストレージを抹消するAPI
	o.remove = function(storage){
		var exp = new Date();
		if (String(storage).toLowerCase() === 'localstorage') {
			localStorage.removeItem(o.conf.name);
		}
		else if (String(storage).toLowerCase() === 'cookie') {
			exp.setTime(0);
			writeCookie(o.conf.name, {}, {expires:exp});
		}
		else {
			localStorage.removeItem(o.conf.name);
			exp.setTime(0);
			writeCookie(o.conf.name, {}, {expires:exp});
		}
	};

	// ----- start reading -----

	var read = forceArray(o.conf.read), storage = null;

	$.each(read, function(i, v){

		if (String(v).toLowerCase() === 'localstorage') {
			storage = JSON.parse(localStorage.getItem(o.conf.name));
		}
		else if (String(v).toLowerCase() === 'cookie') {
			storage = readCookie(o.conf.name);
		}
		else if (v !== null) {
			storage = v;
		}

		if (storage !== null) {
			// storageに何かしらのデータがあればそれを採用して抜ける
			return false;
		}

	});

	storage = storage || {};

	// ----- end reading -----

	// ----- start restoring -----

	$.each(storage, function(k, v){

		var target = '.senbei[name=' + '"' + k + '"]';

		if (v.control === 'input' || v.control === 'textarea') {

			// radio or checkbox
			if (v.type === 'radio' || v.type === 'checkbox') {

				var values = forceArray(v.value);

				// 一度チェックをすべて解除
				// これにより属性値のcheckedを解除する
				// 初訪問の場合は属性値のcheckedが適用されるが、一度でも変更を加えた場合はそれが無視される
				$(target).prop('checked', false);

				$.each(values, function(j, w){
					var spec =  target + '[value="' + w + '"]';
					$(spec).prop('checked', true);
				});

			}
			// the others
			else {
				$(target).val(v.value);
			}

		}
		// select
		else if (v.control === 'select') {

			$target = $(target).find('option').prop('selected', false);

			$.each(v.value, function(j, w){
				$target.filter('[value="' + w + '"]').prop('selected', true);
			});

		}

	});

	// ----- end restoring -----

	// senbeiクラスの付いた要素に変更が行われたとき
	$('.senbei').on('change', function(){

		// 変更が行われた要素
		var $self = $(this);

		var name = $self.attr('name');

		// 変更が行われた要素と同じnameをもつ要素群
		var $selves = $('[name="' + name + '"]');

		// storageに書き込み
		// ----- start writing -----

		var write = forceArray(o.conf.write);

		storage[name] = {
			control: $self.tag(),
			type: $self.type(),
			value: getValue($self.tag(), $selves),
		};

		$.each(write, function(i, v){

			if (String(v).toLowerCase() === 'localstorage') {
				localStorage.setItem(o.conf.name, JSON.stringify(storage));
			}
			else if (String(v).toLowerCase() === 'cookie') {
				writeCookie(o.conf.name, storage, o.conf.cookie);
			}
			else if (typeof v === 'function') {
				v(storage);
			}

		});

		// ----- end writing -----

	});

	$.each(conditions, function(i, v){

		var w = $.extend({
			name: 'f' + i,
			base: null, // jQuery object
			condition: function(){ return null; },
			t: function(){ return null; },
			f: function(){ return null; },
			n: function(){ return null; },
			on: {},
		}, v);

		o[w.name] = function() {
			var bool = w.condition(w.base);
			if (bool) {
				w.t(w.base);
			}
			else if (bool !== null || !bool) {
				w.f(w.base);
			}
			w.n(w.base);
		};

		o[w.name]();

		for (var k in w.on) {

			var values = forceArray(w.on[k]);

			for (var j in values) {
				if (values[j] === true) {
					w.base.on(k, o[w.name]);
				}
				else {
					$(values[j]).on(k, o[w.name]);
				}
			}

		}

	});

	return o;

	// value、チェックの入ったvalue(s)、または選択されているvalue(s)を取得
	function getValue(control, $selves){

		var type = $selves.type();
		var value = null;

		if (control === 'input' || control === 'textarea') {

			// radio or checkbox
			if (type === 'radio' || type === 'checkbox') {
				value = [];
				$selves.filter(':checked').each(function(){
					value.push($(this).val());
				});
			}
			// the others
			else {
				value = $selves.val();
			}

		}
		// select
		else if (control === 'select') {

			value = [];
			$selves.find('option').filter(':selected').each(function(){
				value.push($(this).val());
			});

		}

		return value;
	}

	function readCookie(name){
		var params = document.cookie.split(';');
		for (var i = 0; i < params.length; i++) {
			var kv = params[i].split('=');
			if (kv[0] === name) { return JSON.parse(decodeURIComponent(kv[1])); }
		}
		return null;
	}

	function writeCookie(name, value, options){
		value = JSON.stringify(value);
		value = encodeURIComponent(value);
		var cookie = name + '=' + value;
		if (options.expires) { cookie += '; expires=' + options.expires; }
		if (options.domain) { cookie += '; domain=' + options.domain; }
		if (options.path) { cookie += '; path=' + options.path; }
		if (options.secure) { cookie += '; secure'; }
		document.cookie = cookie;
	}

	function forceArray(val){
		if (Object.prototype.toString.call(val) !== '[object Array]') {
			return [val];
		}
		return val;
	}

};

})(jQuery);
(function(){

// 管理者設定 (static)
ppc.admin = cloz(base, {
	version: cloz(base, {
		script: '141018',
		css: '141010',
	}),
	canonical_domain: 'eshies.net',
	domain: 'eshies.net',
	max_illusts: 28, // 測定対象上限数
	min_illusts: 20, // 測定対象下限数
});

})();

(function(){

// URI (static)
ppc.uri = cloz(base, {
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

(function(){

// ユーザー設定 (static)
ppc.user = cloz(base, {
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

})();

(function(){

// Ajax
ppc.ajax = cloz(base, {
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
				return self.get('_afterFilter', data, index);
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
ppc.ajax.illust = cloz(ppc.ajax, {
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
ppc.ajax.follower = cloz(ppc.ajax, {
	url: 'http://www.pixiv.net/bookmark.php?type=reg_user',
	_afterFilter: function(html){
		var d = new $.Deferred();
		try {
			ppc.parser.follower.set('$doc', $(html));
			var followers = ppc.parser.follower.get('text', 'followers'),
			my_pixiv = ppc.parser.follower.get('text', 'my_pixiv') || '0';

			ppc.user.set('followers', followers.number(0));
			ppc.user.set('my_pixiv', my_pixiv.number(0));
			d.resolve();
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}

		return d.promise();
	},
});

// ajax - 2ページ目
ppc.ajax.page2 = cloz(ppc.ajax, {
	url: ppc.uri.get('works_all') + '?res=' + ppc.user.get('scope') + '&p=2',
	// 2ページ目をつなげる
	_afterFilter: function(data){
		var $html = $(data).find('.display_editable_works:first').clone();

		ppc.renderer.get('render').get('at', '.display_editable_works', $html);
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

})();

(function(){

// 定数
ppc.constants = cloz(base, {
	rank_list: [0, 1000, 10000, 100000, 300000, 1000000, 10000000, 100000000],
	ranker_list: [17, 359, 2128, 950, 610, 518, 89, 5],
	sort_keys: cloz(base, {
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

})();

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

(function($){

	// D3
	ppc.d3 = cloz(base, {
		field: null,
		dataset: [],
		selection: null,
		width: 744,
		height: 360,
		padding: cloz(base, {
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

	ppc.d3.whole = cloz(ppc.d3, {
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

(function($){

// Logger (static)
ppc.logger = cloz(base, {
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

(function(){

// Manager (static)
ppc.manager = cloz(base, {
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
				var ins = cloz(ppc.illust, {
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
		ppc.parser.created.get('jq', 'tab_group').tabs({
			disabled: [2],
		}).tabs('option', 'active', 1);

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
				ppc.parser.illust.illusts[i] = cloz(ppc.parser.illust, {
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
					timestamp_b = timestamp.split(' '),
					date = timestamp_b[0],
					time = timestamp_b[1],
					milliseconds = datetime.getTime(),
					interval = ppc.user.get('now') - milliseconds;

				illust.set({
					timestamp: timestamp,
					date: date,
					time: time,
					milliseconds: milliseconds,
					interval: interval, // ミリ秒単位の経過時間
					interval_days: interval / (1000 * 60 * 60 * 24), // 日単位の経過時間
				});

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

				illust.set({
					tags_num_total: tags_num_total,
					tags_num_self: tags_num_self,
				});

				// 最新ブックマーク
				$bookmarked_latest = parser.get('jq', 'bookmarked_latest');
				illust.set('$bookmarked_latest', $bookmarked_latest);

			}

			// ユーザーID(数字)・ニックネーム・投稿数
			var user_name = ppc.parser.illust.illusts[0].get('text', 'user_name'),
				posted = ppc.parser.home.get('text', 'posted').number(0);

			ppc.user.set({
				nickname: user_name,
				posted: posted,
			});

			this.get('_calc');

		}
		catch (e){
			ppc.logger.get('error', e);
			return false;
		}

		ppc.logger.get('add', 'データ処理を完了しました', 0);
	},
	_calc: function(){
		ppc.logger.get('add', '計算を開始しました');

		// 各パラメータ合計
		var rated_sum = ppc.math.get('sum', ppc.illusts, 'rated'),
			scored_sum = ppc.math.get('sum', ppc.illusts, 'scored'),
			commented_sum = ppc.math.get('sum', ppc.illusts, 'commented'),
			viewed_sum = ppc.math.get('sum', ppc.illusts, 'viewed'),
			bookmarked_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_total'),
			bookmarked_public_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_public'),
			hot_sum = ppc.math.get('sum', ppc.illusts, 'hot');

		ppc.user.set({
			rated_sum: rated_sum,
			scored_sum: scored_sum,
			commented_sum: commented_sum,
			viewed_sum: viewed_sum,
			bookmarked_sum: bookmarked_sum,
			bookmarked_public_sum: bookmarked_public_sum,
			hot_sum: hot_sum | 0,
		});

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

			ppc.user.set({
				interval_longest: interval_longest,
				interval_average: interval_average.toFixed(1),
			});

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

				illust.set({
					freshment: freshment,
					power: power,
				});

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

			pixiv_power = ppc.math.get('pixivPower', followers, my_pixiv, total_power, hot_sum);
			ppc.user.set({
				total_power: Math.ceil(total_power),
				pixiv_power: Math.ceil(pixiv_power),
			});

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

})();

(function(){

// Math (static)
ppc.math = cloz(base, {
	div: function(a, b){
		if (!b) { return 0; }
		return a / b;
	},
	freshment: function(interval_average, interval){
		return 1 / Math.pow((12 / (interval_average + 5) + 1), (interval / (1000 * 60 * 60 * 24 * 365)).toFixed(4));
	},
	pixivPower: function(followers, my_pixiv, total_power, hot_sum){
		return (followers * 0.0001 + my_pixiv * 0.001 + 1) * total_power + Number(hot_sum);
	},
	sum: function(a, prop){
		var sum = 0;
		$.each(a, function(i, v){
			sum += v.get(prop);
		});
		return sum;
	},
	standardDeviation: function(dataset, prop, sum){

		var l = dataset.length, sigma = 0;

		$.each(dataset, function(i, v){
			sigma += Math.pow((v.get(prop) - sum / l), 2);
		});

		return Math.sqrt(sigma / l);

	},
	deviation: function(sd, val, average){

		return (10 * ( val - average ) / sd + 50).toFixed(1);

	},
});

})();

(function($){

// Old (static)
ppc.old = cloz(base, {
	button: function(){
		try {
			$('#btn-ppc').addClass('disabled').text('測定しています').off();
			window.scroll(0,0);

			if (ppc.user.get('guest')) {
				if (ppc.user.get('guest_profile').PpcGuest.illust_id) {
					$('#guest', $ppc_result).wrap('<a href="http://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + ppc.user.get('guest_profile').PpcGuest.illust_id + '" target="_blank"></a>');
				}
				else {
					$('#guest', $ppc_result).wrap('<span>');
				}
			}
			else {
				ppc.user.set('guest', false);
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
			ppc.parser.created.get('jq', 'tab_group').tabs({
				disabled: false,
			});

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

			$('.sort-by.sort-by-id').addClass('desc').addClass('active').find('.fa-sort-numeric-desc').css('display', 'inline');
			ppc.old.get('arrange', ppc.constants.get('sort_keys').get('id'), ppc.illusts, 'desc');

			var message_start = ppc.user.get('guest_profile').PpcMessage.start,
				message_end = ppc.user.get('guest_profile').PpcMessage.end;

			if (!message_start || !ppc.user.get('guest')) {
				message_start = 'あなたのpixivパワーは';
			}
			if (!message_end || !ppc.user.get('guest')) {
				message_end = 'です！';
			}

			// ゲストのメッセージを埋め込む
			ppc.renderer.get('alter', '.message-start', message_start);
			ppc.renderer.get('alter', '.message-end', message_end);

			if (ppc.user.get('guest')) {
				$('#guest').show();
			}

			$('#ppc_result').show();

			// 連続処理
			this.get('_step1').then(function(){
				return ppc.old.get('_wait1');
			}).then(function(){
				return ppc.old.get('_step2');
			}).then(function(){
				return $.when(
					ppc.old.get('_wait2'),
					ppc.old.get('_save') // パワーの保存
				);
			}).then(function(){
				ppc.old.get('_showNeighbors');
				ppc.logger.get('add', 'すべての処理が完了しました', 0);
			});

		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
		return true;
	},
	_step1: function(){
		var d = new $.Deferred();
		var total_power = ppc.user.get('total_power'),
			piece = Math.round(total_power / 100),
			$result = ppc.parser.created.get('jq', 'result'),
			n = 0,
			self = this;
		$result.css('color', '#999');

		// 例外：パワーが0の場合
		if (total_power === 0) {
			self.get('_wait1');
			return d.promise();
		}

		if (ppc.user.get('animation')) {
			var timer = window.setInterval(function(){
				n += piece;
				if (n > total_power) {
					n = total_power;
					$result.text(n.comma());
					clearInterval(timer);
					d.resolve();
				}
				$result.text(n.comma());
			}, 30);
		}
		else {
			$result.text(total_power.comma());
			d.resolve();
		}

		return d.promise();
	},
	_wait1: function(){

		var d = new $.Deferred();

		var timeout = ppc.user.get('animation') ? 1500 : 0;

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
			d.resolve();

		}, timeout);

		return d.promise();
	},
	_step2: function(){
		var d = new $.Deferred();
		var total_power = ppc.user.get('total_power'),
			pixiv_power = ppc.user.get('pixiv_power'),
			piece = Math.round((pixiv_power - total_power) / 20),
			$result = ppc.parser.created.get('jq', 'result'),
			n = total_power;

		$result.css('color', '#f99');

		// 例外：パワーが0の場合
		if (pixiv_power === 0) {
			d.resolve();

			return d.promise();
		}

		if (ppc.user.get('animation')) {
			var timer = window.setInterval(function(){
				n += piece;
				if (n > pixiv_power) {
					n = pixiv_power;
					$result.css('color', 'red').text(n.comma());
					clearInterval(timer);
					d.resolve();
				}
				$result.text(n.comma());
			}, 30);
		}
		else {
			$result.css('color', 'red').text(pixiv_power.comma());
			d.resolve();
		}

		return d.promise();
	},
	_wait2: function(){

		var d = new $.Deferred();

		var timeout = ppc.user.get('animation') ? 1500 : 0;

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
				if (ppc.user.get('vranking')){
					ppc.renderer.get('update', '.order-vranking', vranking);
					ppc.renderer.get('update', '.record-vranking', $('#record-vranking').val());
					$('#record-vranking').val(vranking).trigger('change');
				}
				else {
					$('#vranking').css('display', 'none');
				}

				$('<br>').appendTo('#ppc_result');

				// サマリーの表示
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

				// パワー標準偏差、HOT標準偏差
				var sd_power = ppc.math.get('standardDeviation', illusts, 'power', total_power),
					sd_hot = ppc.math.get('standardDeviation', illusts, 'hot', ppc.user.get('hot_sum'));

				$.each(illusts, function(i, v){
					var data = {};

					var dv_power = ppc.math.get('deviation', sd_power, v.get('power'), total_power / count),
					dv_hot = ppc.math.get('deviation', sd_hot, v.get('hot'), ppc.user.get('hot_sum') / count),
					$illust_report = ppc.parser.home.get('$illust_report', i);

					v.set('dv_power', dv_power);
					v.set('dv_hot', dv_hot);
					$illust_report.append('<span class="report-link">鮮度&nbsp;<span class="count">' + v.get('freshment').toFixed(2) + '</span></span>');
					$illust_report.append('<span class="report-link">パワー&nbsp;<span class="count">' + v.get('power') + '</span></span>');
					$illust_report.append('<span class="report-link">偏差値&nbsp;<span class="count">' + dv_power + '</span></span>');
					$illust_report.append('<span class="report-link">タグ数&nbsp;<span class="count">' + ppc.utility.get('tags_num', v.get('tags_num_total'), v.get('tags_num_self')) + '</span></span>');
					$('.display-report').eq(i).css('border-color', ppc.utility.get('color', dv_power));
					$('.display_editable_works>ul>li').eq(i).find('.bookmark-count:first').html('<i class="_icon sprites-bookmark-badge"></i>' + v.get('bookmarked_total') + ' (' + v.get('bookmarked_public') + ' + ' + v.get('bookmarked_private') + ')');

				});

				$('#ppc_right').show();

			}
			catch (e) {
				ppc.logger.get('error', e);
				return false;
			}

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

			// ツイートボタンにリンクを貼る
			var tweet1 = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(nickname + 'のpixivパワーは【' + pixiv_power.comma() + '】です。') + '&hashtags=' + encodeURIComponent('pixivパワーチェッカー') + '&url=http://www.pixiv.net/member.php?id=' + user_id;
			var tweet2 = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('私のpixivパワーは【' + pixiv_power.comma() + '】です。') + '&hashtags=' + encodeURIComponent('pixivパワーチェッカー');

			$('#btn-tweet').wrap($('<a/>', {class: 'wrapper-btn-tweet'}).attr('href', tweet1).attr('target', '_blank'));

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

			// 作品ステータスマップの生成と表示
			ppc.renderer.get('render').get('at', '#ppc_result', $('<div>', {
				class: 'svg-whole',
			}));
			ppc.renderer.get('render').get('at', '.svg-whole', $('<h2>', {
				text: '作品ステータスマップ',
			}));
			ppc.d3.whole.get('init', ppc.illusts);

			$(window).on('scroll', function(){
				var self = $(window);
				var scroll_bottom = self.scrollTop() + self.height();
				if (scroll_bottom > 1000) {
					self.off('scroll');
					$('.svg-whole').show('blind', {easing: 'easeInOutExpo'}, 1500, function(){
						$(this).css({visibility:'visible'}).fadeIn(null, function(){
							ppc.d3.whole.get('render');
						});
					});
				}
			});

			// リンクを新しいタブで開くようにする
			ppc.renderer.get('addNewTabLink', ppc.parser.home.get('jq', 'contents'));
			$('a[href^="javascript"], a[href="#"]').attr('target', '');
			d.resolve();

		}, timeout);

		return d.promise();

	},
	_save: function(){
		var d = new $.Deferred();
		var pixiv_power = ppc.user.get('pixiv_power');
		var last_power = ppc.user.get('last_power');
		try {
			if (ppc.user.get('twitter')) {
				var release = 0;
				if ($('#ppcranking').prop('checked') && $('input[name="release"]:checked').length === 1) {
					release = $('input[name="release"]:checked').val();
				}

				$.getJSON(ppc.uri.get('record') + '?callback=?', {
						User: {pixiv_id: ppc.user.get('id'), twitter_name: ppc.user.get('twitter_name'), name: ppc.user.get('name')},
						PpcPower: {power: pixiv_power, release: release},
						token: ppc.user.get('token'),
					}
				).then(function(data){

					// パワーの近いユーザー
					ppc.user.set('neighbors', data.neighbors);

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

						d.resolve();
					}
					else if (data.status == 'error') {
						ppc.logger.get('error', data);
						return false;
					}
				});

			}
			else {
				d.resolve();
			}

			return d.promise();
		}
		catch (e) {
			ppc.logger.get('error', e);
			return false;
		}
	},
	_showNeighbors: function(){

		// twitter連携してないとneighborsが取得できないので…（パワーを送信する必要が生じるため）
		if (ppc.user.get('twitter')) {
			var neighbors = ppc.user.get('neighbors');
			if (neighbors.length) {
				ppc.renderer.get('update', '#neighbors-mes', 'あなたとpixivパワーが近いユーザー（Twitterとpixivを公開しているユーザーのみ表示）');
				$.each(neighbors, function(i, v){
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
			$('#neighbors-mes, #ppc_neighbors').show();
		}

		return;
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
					html: ppc.utility.get('createTableHtml', ppc.utility.get('createArrayForTable', v.get('elements')), '#f3f3f3', true),
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

})(jQuery);

(function($){

// Parser
ppc.parser = cloz(base, {
	$doc: $(document),
	selector: null,
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
		for (var k in this.get('selector').getAll()) {
			var len = $(this.get('selector').get(k)).length,
				message = 'セレクタ検証(' + k + ') => ' + len,
				level = len ? 1 : 2;
			ppc.logger.get('add', message, level);
		}
	},
});

// parser - イラスト管理ページ(member_illust.php)
ppc.parser.home = cloz(ppc.parser, {
	selector: cloz(base, {
		col_l: '.layout-a .ui-layout-west',
		col_r: '.layout-a ._unit',
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
		'.ads_area_y',
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

(function(){

// Rank (static)
ppc.rank = cloz(base, {
	bookmarked: [7.2, 3.8, 2.4, 1.2, 0],
	rated: [14, 10, 6, 3, 0],
	scored: [9.96, 9.8, 9.4, 8.8, 0],
});

})();

(function($){

// Renderer
ppc.renderer = cloz(base, {
	load: cloz(base, {
		css: function(href){
			$('<link rel="stylesheet" href="' + href + '.css">').appendTo('head');
		}
	}),
	render: cloz(base, {
		at: function(selector, jq){
			return jq.appendTo(selector);
		},
	}),
	update: function(selector, text){
		$(selector).text(text);
	},
	alter: function(selector, html){
		$(selector).html(html);
	},
	remove: function(selector){
		$(selector).remove();
	},
	removeAds: function(){
		$.each(ppc.parser.home.get('ads'), function(i, selector){
			$(selector).remove();
		});
	},
	init1: function(){
		var $leftColumn = ppc.parser.home.get('jq', 'col_l');
		var $rightColumn = ppc.parser.home.get('jq', 'col_r');

		// レイアウト上、邪魔になる要素を削除
		this.get('removeAds');

		$('<div>', {id:'buttons', class:'right-container'}).prependTo('.layout-column-2');
		$('a', $leftColumn).attr('target', '_blank');
		$('.display_editable_works>ul>li>span').wrap('<div class="status" />');

		$rightColumn.wrapInner('<div id="works" />');
		$rightColumn.wrap('<div id="tab_group" />');
	},
	init2: function(){
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

		$('#conf .column-body').appendHtml('ppcranking', function(){});

	},
	init3: function(){

		// 測定ボタンを生成
		ppc.parser.template.get('$doc').find('#btn-ppc').appendTo('#buttons');

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

		ppc.renderer.get('render').get('at', '#totalResult .column-body', $ppc_result);

		$('#ppc_result')
			.prepend($('<div>', {id: 'ppc_bottom'}))
			.prepend(
				$('<div>', {id: 'ppc'})
					.append($('<div>', {class: 'message-start'}))
					.append($('<div>', {id: 'result', text: 0}))
					.append($('<div>', {class: 'message-end'}))
			)
			.prepend($('<div>', {id: 'ppc_top'}));

		// guest
		$('<img id="guest" src="' + ppc.uri.get('img') + '/' + ppc.user.get('guest_profile').PpcGuest.illust_id + '.' + ppc.user.get('guest_profile').FileExtension.name + '" width="180" height="180" style="margin:5px;display:none;" />').appendTo($ppc_result);

		$('#guest').wrap('<div id="ppc_left" />');
		$('<div>', {id: 'ppc_right'}).insertAfter('#ppc_left');

		// 仮想順位
		$('<div>', {
			id: 'vranking',
		}).html('仮想順位： <strong class="order-vranking">???</strong> / 10000 前回順位： <span class="record-vranking"></span>')
			.appendTo('#ppc_right');

		// サマリー
		ppc.renderer.get('render').get('at', '#ppc_right', ppc.parser.template.get('jq', 'summary'));

		// ツイートボタン
		$('<div>', {id: 'tweet'}).appendTo('#ppc_right')
			.append($('<button>', {
				id: 'btn-tweet',
				class: 'ppc-button',
				html: '<i class="fa fa-twitter"></i>結果をツイート',
			}))
			.append('<br>')
			.append($('<input type="checkbox" checked>') // type属性は後から追加できない模様
				.attr({
					id: 'pidchk',
					class: 'senbei',
					name: 'add-pixiv',
					value: '1',
				}))
			.append($('<label>', {
				for: 'pidchk',
				text: 'pixivへのリンクを載せる',
			}));

		// パワーの近いユーザー
		$('#totalResult .column-body')
			.append($('<div>', {id: 'neighbors-mes'}).css('display', 'none'))
			.append($('<div>', {id: 'ppc_neighbors'}).css('display', 'none'));

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

		$('<ul>', {id: 'sortableList'}).appendTo('#detail .column-body');

	},
	senbei: function(){
		ppc.senbei.get('init');
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
						$('#ppcranking').prop('checked', true);
						if ($('#ppcranking').prop('checked')) { $('#login_status .join').text('参加'); }
						if (data.release == 1) { $('#release1').prop('checked', true); }
						else if (data.release == 2) { $('#release2').prop('checked', true); }
						else if (data.release == 3) { $('#release3').prop('checked', true); }
					}
				}, 200);
			}
			else {
				$('#ppcranking').prop('checked', false);
				if (!$('#ppcranking').prop('checked')) { $('#login_status .join').text('不参加（環境設定から変更できます）'); }
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
	},
	addNewTabLink: function(selector){
		$(selector).find('a').attr('target', '_blank');
	},
});

})(jQuery);

(function($){

	// Senbei
	ppc.senbei = cloz(base,{
		self: null,
		storage: null,
		init: function(){
			var self = senbei({
				name: 'ppc' + ppc.user.get('id'),
				read: 'localStorage',
				write: ['localStorage', function(s){ ppc.senbei.set('storage', s); }]
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
(function($){

// Utility (static)
ppc.utility = cloz(base, {
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

})(jQuery);

(function($){

if ($('#buttons').length) {
    alert('ページを再読み込みしてから実行してください。');
    return;
}

if (location.href !== 'http://www.pixiv.net/member_illust.php' && location.href !== 'http://www.pixiv.net/member_illust.php?res=full' && location.href !== 'http://www.pixiv.net/member_illust.php?res=all') {
	alert('http://www.pixiv.net/member_illust.php\nまたは\nhttp://www.pixiv.net/member_illust.php?res=full\nで実行してください。');
	return;
}

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
	ppc.uri.get('js', 'jquery-ui.min'),
	ppc.uri.get('js', 'd3.v3.min')
]);

// 主な処理はここから開始

// ユーザーIDの取得
var user_id = ppc.parser.home.get('attr', 'user_id', 'href').number(0);
ppc.user.set('id', user_id);

var $leftColumn = ppc.parser.home.get('jq', 'col_l');
var $rightColumn = ppc.parser.home.get('jq', 'col_r');

// DOM生成・削除
ppc.renderer.get('init1');

$('div.pages').fadeOut('slow');
ppc.parser.created.get('jq', 'tab_group').fadeOut('slow',function(){
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/jquery-ui-1.8.2.custom');
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/ppc' + ppc.admin.get('version').get('css'));
	ppc.renderer.get('load').get('css', '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min');

	ppc.renderer.get('init2');

	// 環境設定
	var appendConfiguration = function(){
		var d = new $.Deferred();

		$('#configuration').appendHtml('configuration', function(){

			$('.help_trigger').hover(
				function(){
					$(this).parent().parent().children('td').children('.configuration_help').css('visibility', 'visible');
				},
				function(){
					$(this).parent().parent().children('td').children('.configuration_help').css('visibility', 'hidden');
				}

			);
			d.resolve();

		});

		return d.promise();
	};

	var verifyJQueryUI = function(){

		var d = new $.Deferred();
		// Wait until jQuery UI is completely loaded
		var timer0 = window.setInterval(

			function(){

				try {

					// タブ表示
					ppc.parser.created.get('jq', 'tab_group').tabs({
						disabled: [1,2],
						show: {
							effect: 'fadeIn',
							duration: 200,
						},
						hide: {
							effect: 'fadeOut',
							duration: 200,
						}
					}).tabs('option', 'active', 5).fadeIn('slow');

					clearInterval(timer0);
					ppc.logger.get('add', 'jQuery UIを読み込みました', 0);
					d.resolve();

				}
				catch(e){
					// ppc.logger.get('error', e);
				}

			},100
		);

		return d.promise();
	};

	// 並行処理
	$.when(
		appendConfiguration(),
		verifyJQueryUI(),
		ppc.ajax.follower.get('load'),
		$.getJSON(ppc.uri.get('guest') + '?callback=?', function(data){
			var guest_profile = new Object(data);
			ppc.user.set('guest_profile', guest_profile);
		})
	)
	// 上のすべての処理が終わったら実行（Loggerはここから使える）
	.then(function(){

		// セレクタ検証
		ppc.parser.home.get('check');

		try {
			// テンプレートをダウンロード
			$.getJSON(ppc.uri.get('ajax') + '/page/template' + '?callback=?', {}, function(data){
				ppc.logger.get('add', 'テンプレートをダウンロードしました', 0);
				var $html = $(data.html);
				ppc.parser.template.set('$doc', $html);

				ppc.renderer.get('init3');

				// フォーム部品をすべて置いたのでsenbeiを発動させる
				ppc.renderer.get('senbei');

				// 2ページ目があるかどうか確認
				// 確認後、開始ボタンを利用可にする
				if (ppc.parser.home.get('length', 'page2') > 0) {
					ppc.logger.get('add', '21以上の作品が検出されました', 1);
					ppc.ajax.page2.get('load');
				}
				else {
					ppc.renderer.get('activateStartButton');
				}
			});
		}
		catch (e) {
			ppc.logger.get('error', e);
		}
	});

});

})(jQuery);