(function(){

// Math (static)
ppc.math = gs(base, {
	div: function(a, b){
		if (!b) { return 0; }
		return a / b;
	},
	freshment: function(interval_average, interval){
		return 1 / Math.pow((12 / (interval_average + 5) + 1), (interval / (1000 * 60 * 60 * 24 * 365)).toFixed(4));
	},
	pixivPower: function(followers, my_pixiv, total_power, hot_sum){
		return (followers * 0.0001 + my_pixiv * 0.001 + 1) * total_power + Number(hot_sum);
	},
	sum: function(a, prop){
		var sum = 0;
		$.each(a, function(i, v){
			sum += v.get(prop);
		});
		return sum;
	},
	standardDeviation: function(dataset, prop, sum){

		var l = dataset.length, sigma = 0;

		$.each(dataset, function(i, v){
			sigma += Math.pow((v.get(prop) - sum / l), 2);
		});

		return Math.sqrt(sigma / l);

	},
	deviation: function(sd, val, average){

		return (10 * ( val - average ) / sd + 50).toFixed(1);

	},
});

})();
