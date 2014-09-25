(function(){

// 定数
ppc.constants = gs(base, {
	rank_list: [0, 1000, 10000, 100000, 300000, 1000000, 10000000, 100000000],
	ranker_list: [17, 359, 2128, 950, 610, 518, 89, 5],
	sort_keys: gs(base, {
		id: '投稿日時',
		viewed: '閲覧数',
		scored: '総合点',
		rated: '評価回数',
		power: 'パワー',
		rated_ratio: '評価率',
		scored_average: '平均点',
		bookmarked_total: 'ブックマーク数',
		bookmarked_ratio: 'ブックマーク率',
		bookmarked_public_ratio: 'ブックマーク公開率',
		hot: 'HOT',
	}),
});

})();
