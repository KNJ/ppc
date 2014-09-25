(function(){

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

})();
