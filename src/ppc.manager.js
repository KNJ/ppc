(function(){

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
				timestamp_b = timestamp.split(' '),
				date = timestamp_b[0],
				time = timestamp_b[1],
				milliseconds = datetime.getTime(),
				interval = ppc.user.get('now') - milliseconds;

				illust.set('timestamp', timestamp);
				illust.set('date', date);
				illust.set('time', time);
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

		// 各パラメータ合計
		var rated_sum = ppc.math.get('sum', ppc.illusts, 'rated'),
		scored_sum = ppc.math.get('sum', ppc.illusts, 'scored'),
		commented_sum = ppc.math.get('sum', ppc.illusts, 'commented'),
		viewed_sum = ppc.math.get('sum', ppc.illusts, 'viewed'),
		bookmarked_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_total'),
		bookmarked_public_sum = ppc.math.get('sum', ppc.illusts, 'bookmarked_public'),
		hot_sum = ppc.math.get('sum', ppc.illusts, 'hot');

		ppc.user.set('rated_sum', rated_sum);
		ppc.user.set('scored_sum', scored_sum);
		ppc.user.set('commented_sum', commented_sum);
		ppc.user.set('viewed_sum', viewed_sum);
		ppc.user.set('bookmarked_sum', bookmarked_sum);
		ppc.user.set('bookmarked_public_sum', bookmarked_public_sum);
		ppc.user.set('hot_sum', hot_sum | 0);

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

			pixiv_power = ppc.math.get('pixivPower', followers, my_pixiv, total_power, hot_sum);
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

})();
