(function(){

// 管理者設定 (static)
ppc.admin = cloz(base, {
	version: cloz(base, {
		script: '141013',
		css: '141010',
	}),
	canonical_domain: 'eshies.net',
	domain: 'dev.eshies.net',
	max_illusts: 28, // 測定対象上限数
	min_illusts: 20, // 測定対象下限数
});

})();
