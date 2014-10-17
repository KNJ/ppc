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
