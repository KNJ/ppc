(function(){

// 管理者設定 (static)
ppc.admin = gs(base, {
	version: gs(base, {
		script: '141001',
		css: '140926',
	}),
	canonical_domain: 'eshies.net',
	domain: 'eshies.net',
	max_illusts: 28, // 測定対象上限数
	min_illusts: 20, // 測定対象下限数
	suspended: false,
});

})();
