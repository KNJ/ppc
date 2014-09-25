(function(){

// 管理者設定 (static)
ppc.admin = gs(base, {
	version: gs(base, {
		script: '*',
		css: '140920',
	}),
	canonical_domain: 'eshies.net',
	domain: 'dev.eshies.net',
	max_illusts: 28, // 測定対象上限数
	min_illusts: 20, // 測定対象下限数
	suspended: false,
});

})();
