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