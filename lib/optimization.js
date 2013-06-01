var Optimization = function () {
	this.people = people;
	this.flights = flights;
	this.destination = 'LGA';
};


Optimization.prototype.getminutes = function (t) {
	x = t.split(':');
	return x[0] * 60 + x[1] * 1;
};


// スケジュールをプリントする関数
// 引数には出発人数*2(行き/帰り)数の要素が入った配列をとる
Optimization.prototype.printschedule = function (r) {
	for (var i = 0, j = r.length / 2; i < j; i += 1) {
		var name, origin, out, ret;
		name = this.people[i][0];
		origin = this.people[i][1];
		out = this.flights[origin][this.destination][r[i * 2]];
		ret = this.flights[this.destination][origin][r[i * 2 + 1]];

		// js に print はないので console.log で代用
		console.log("%s %s %s-%s $%d %s-%s $%d",
				name, origin,
				out[0], out[1], out[2],
				ret[0], ret[1], ret[2]);
	}
};


// スケジュールをオブジェクトで返す関数もあると便利かなと思って作りました
Optimization.prototype.getschedule = function (r) {
	var schedule = {};
	for (var i = 0, j = r.length / 2; i < j; i += 1) {
		var name, origin, out, ret;
		name = this.people[i][0];
		origin = this.people[i][1];
		out = this.flights[origin][this.destination][r[i * 2]];
		ret = this.flights[this.destination][origin][r[i * 2 + 1]];
		schedule[name] = {
			"origin": origin,
			"out": {
				"time": {
					"dep": out[0],
					"arr": out[1]
				},
				"price": out[2]
			},
			"ret": {
				"time": {
					"dep": ret[0],
					"arr": ret[1]
				},
				"price": ret[2]
			}
		};
	}
	return schedule;
};


Optimization.prototype.schedulecost = function (sol) {
	var totalprice, latestarrival, earliestdep;
	totalprice = 0;
	latestarrival = 0;
	earliestdep = 24 * 60;
	for (var i = 0, j = sol.length / 2; i < j; i += 1) {

		// 行き(outbound)と帰り(return)のフライトを得る
		var origin, outbound, returnf;
		origin = this.people[i][1];
		outbound = this.flights[origin][this.destination][sol[i * 2]];
		returnf = this.flights[this.destination][origin][sol[i * 2 + 1]];

		// 運賃総額 totalprice は出立便と帰宅便すべての運賃
		totalprice += outbound[2];
		totalprice += returnf[2];

		// 最も遅い到着と最も早い出発を記録
		if (latestarrival < this.getminutes(outbound[1])) {
			latestarrival = this.getminutes(outbound[1]);
		}
		if (earliestdep > this.getminutes(returnf[0])) {
			earliestdep = this.getminutes(returnf[0]);
		}
	}


	// 最後の人が到着するまで全員空港で待機。
	// 帰りも近い空港にみんなで来て自分の便を待たねばならない。
	var totalwait = 0;
	for (var i = 0, j = sol.length / 2; i < j; i += 1) {
		var origin, outbound, returnf;
		origin = this.people[i][1];
		outbound = this.flights[origin][this.destination][sol[i * 2]];
		returnf = this.flights[this.destination][origin][sol[i * 2 + 1]];
		totalwait += latestarrival - this.getminutes(outbound[1]);
		totalwait += this.getminutes(returnf[0]) - earliestdep;
	}

	// この解ではレンタカーの追加料金が必要か？　これは50ドル!
	if (latestarrival < earliestdep) {
		totalprice += 50;
	}
	return totalprice + totalwait;
};


// ランダムサーチ(無作為探索)
Optimization.prototype.randomoptimize = function (domain, costf) {

};


// ヒルクライム
Optimization.prototype.hillclimb = function (domain, costf) {

};


// 模擬アニーリング
Optimization.prototype.annealingoptimize = function (domain, costf, T, cool, step) {
	T = T - 0 || 10000.0;
	cool = cool - 0 || 0.95;
	step = step - 0 || 1;

};


// 遺伝アルゴリズム
Optimization.prototype.geneticoptimize = function (domain, costf, popsize, step, mutprob, elite, maxiter) {
	popsize = popsize - 0 || 50;  // 生成する解の数(1世代あたり)
	step = step - 0 || 1;  // 突然変異を起こすときにずらす数
	mutprob = mutprob - 0 || 0.2;  // 突然変異ですくるものの割合(残りが交叉)
	elite = elite - 0 || 0.2;  // エリートで次世代に引き継がれる上位の割合
	maxiter = maxiter - 0 || 100;  // 計算をおこなう世代数

	// ランダムの整数を返す関数
	// jsではrandintがないため、Math.random()と足し算を組み合わせて再現する
	// Math.random()は0〜1までの数字を返す
	var randint = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	// 突然変異の操作
	// 引数vecには突然変異を起こすもととなる解の候補の配列がはいる
	var mutate = function (vec) {
		var i = randint(0, domain.length - 1);

		// MEMO:
		// 教科書通りに書いてもうまく動かないような...? 理由は、
		// - 以下の if, else if に該当しないケースでは、undefined を返すこととなる
		// - stepの数値次第では最大/小値よりも大きい/小さい数値が混じった配列を返すことと成る
		// なので、上の2点を踏まえて、書き換えてみます
		/*
		// 0.5の確率で、vec[i]がdomain[i]の最小値より大きいとき
		if (Math.random() < 0.5 && vec[i] > domain[i][0]) {

			// jsでは配列同士を+演算子でくっつけられないので、代わりにconcatメソッドをつかう
			// [0:i]という表記も使えないため、代わりにslice(0, i)とする
			return vec.slice(0, i).concat([vec[i] - step], vec.slice(i + 1));

		// そしてvecのi番目がdomain[i]の最大値より小さいとき
		} else if (vec[i] < domain[i][1]) {
			return vec.slice(0, i).concat([vec[i] + step], vec.slice(i + 1));
		}
		*/

		// vec[i]が最小値よりstepを足した数以下の時はひく
		if (vec[i] >= domain[i][0] + step) {
			return vec.slice(0, i).concat([vec[i] - step], vec.slice(i + 1));

		// vec[i]が最大値よりstepを引いた数以上の時はたす
		} else if (vec[i] <= domain[i][1] - step) {
			return vec.slice(0, i).concat([vec[i] + step], vec.slice(i + 1));
		}

	};

	// 交叉の操作
	var crossover = function (r1, r2) {
		var i = randint(1, domain.length - 2);
		return r1.slice(0, i).concat(r2.slice(i));
	};

	// 初期個体群の構築
	var pop = function () {
		var r = [];
		for (var i = 0, j = popsize; i < j; i += 1) {
			var vec = function () {
				var r = [];
				for (var i = 0, j = domain.length; i < j; i += 1) {
					r.push(randint(domain[i][0], domain[i][1]));
				}
				return r;
			}.call(this);
			r.push(vec);
		}
		return r;
	}.call(this);

	// 各世代の勝者数は?
	var topelite = Math.floor(elite * popsize);

	// Main loop
	var scores = [];

	for (var i = 0, j = maxiter; i < j; i += 1) {

		scores = function () {
			var r = [];
			for (var i = 0, j = pop.length; i < j; i += 1) {
				// mutate関数でundefinedを返すことがあるため、エラー回避のため判別する
				if (pop[i]) r.push([costf.call(this, pop[i]), pop[i]]);
			}
			return r;
		}.call(this);

		scores.sort(function (a, b) {
			return a[0] - b[0];
		});

		var ranked = function () {
			var r = [];
			for (var i = 0, j = scores.length; i < j; i += 1) {
				r.push(scores[i][1]);
			}
			return r;
		}.call(this);

		// まず純粋な勝者
		pop = ranked.slice(0, topelite);

		// 勝者に突然変異や交配を行ったものを追加
		while (pop.length < popsize) {
			if (Math.random() < mutprob) {

				// 突然変異
				var c = randint(0, topelite);
				pop.push(mutate(ranked[c]));
			} else {

				// 交叉
				var c1 = randint(0, topelite);
				var c2 = randint(0, topelite);
				pop.push(crossover(ranked[c1], ranked[c2]));
			}
		}

		// 現在のベストスコアを出力
		console.log(scores[0][0]);
	}
	return scores[0][1];
};
