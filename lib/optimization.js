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
