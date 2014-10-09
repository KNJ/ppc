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
var $leftColumn = ppc.parser.get('jq', 'col_l');
var $rightColumn = ppc.parser.get('jq', 'col_r');

// DOM生成・削除
ppc.renderer.get('init1');

$('div.pages').fadeOut('slow');
ppc.parser.created.get('jq', 'tab_group').fadeOut('slow',function(){
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/jquery-ui-1.8.2.custom');
	ppc.renderer.get('load').get('css', ppc.uri.get('css') + '/ppc' + ppc.admin.get('version').get('css'));
	ppc.renderer.get('load').get('css', '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min');

	ppc.renderer.get('init2');

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

	var verifyJQueryUI = function(){

		var d = new $.Deferred();
		// Wait until jQuery UI is completely loaded
		var timer0 = window.setInterval(

			function(){

				try {

					// タブ表示
					ppc.parser.created.get('jq', 'tab_group').tabs({
						selected: 5,
						disabled: [1,2],
						show: {
							effect: 'fadeIn',
							duration: 200,
						},
						hide: {
							effect: 'fadeOut',
							duration: 200,
						}
					}).fadeIn('slow');

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
		verifyJQueryUI(), // 処理1
		$.getJSON(ppc.uri.get('guest') + '?callback=?', function(data){ // 処理2
			var guest_profile = new Object(data);
			ppc.user.set('guest_profile', guest_profile);
		})
	)
	// 上の2つの処理が終わったら実行
	.then(function(){
		try {
			// テンプレートをダウンロード
			$.getJSON(ppc.uri.get('ajax') + '/page/template' + '?callback=?', {}, function(data){
				ppc.logger.get('add', 'テンプレートをダウンロードしました', 0);
				var $html = $(data.html);
				ppc.parser.template.set('$doc', $html);

				ppc.renderer.get('init3');

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