(function($){

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

})(jQuery);
