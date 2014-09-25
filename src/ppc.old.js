(function($){

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
				.append($('<div>', {class: 'message-start', html: message_start}))
				.append($('<div>', {id: 'result', text: 0}))
				.append($('<div>', {class: 'message-end', html: message_end}))
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

				// パワー標準偏差、HOT標準偏差
				var sd_power = ppc.math.get('standardDeviation', illusts, 'power', total_power),
				sd_hot = ppc.math.get('standardDeviation', illusts, 'hot', ppc.user.get('hot_sum'));

				var dataset = [];

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
					$('.display_works>ul>li').eq(i).find('.bookmark-count:first').html('<i class="_icon sprites-bookmark-badge"></i>' + v.get('bookmarked_total') + ' (' + v.get('bookmarked_public') + ' + ' + v.get('bookmarked_private') + ')');

					/*
					var timestamp_a = v.get('timestamp').split(' ');
					data.date = timestamp_a[0];
					data.time = timestamp_a[1];
					data.dv_power = dv_power;
					data.dv_hot = dv_hot;
					dataset.push(data);
					*/

				});

				// console.log(dataset.toSource());

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

})(jQuery);
