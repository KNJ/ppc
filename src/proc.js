(function($){

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
	'http://' + ppc.admin.get('domain') + '/js/ppc/jquery-ui-1.8.2.custom.min.js'
]);

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

})(jQuery);