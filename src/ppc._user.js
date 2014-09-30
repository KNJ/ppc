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
