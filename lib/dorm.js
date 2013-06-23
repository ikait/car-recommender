var Dorm = function () {

	// 寮。それぞれ空きが2つある
	this.dorms = ['Zeus', 'Athena', 'Hercules', 'Bacchus', 'Pluto'];

	// 人。第1・第2を希望を伴う
	this.prefs = [
		['Toby', ['Bacchus', 'Hercules']],
		['Steve', ['Zeus', 'Pluto']],
		['Andrea', ['Athena', 'Zeus']],
		['Sarah', ['Zeus', 'Pluto']],
		['Dave', ['Athena', 'Bacchus']],
		['Jeff', ['Hercules', 'Pluto']],
		['Fred', ['Pluto', 'Athena']],
		['Suzie', ['Bacchus', 'Hercules']],
		['Laura', ['Bacchus', 'Hercules']],
		['Neil', ['Hercules', 'Athena']]
	];

	// [(0, 9), (0, 8), (0, 7), ..., (0, 0)];
	this.domain = function () {
		var domain = [];
		for (var i = 0, j = this.dorms.length * 2; i < j; i += 1) {
			domain.push([0, j - i - 1]);
		}
		return domain;
	}.call(this);
};

Dorm.prototype.printsolution = function (vec) {
	var slots = function () {

		// 各寮につきスロットを2つずつ生成
		var slots = [];
		for (var i = 0, j = this.dorms.length; i < j; i += 1) {
			slots = slots.concat([i, i]);  // concatは結合後の配列を返す
		}
		return slots;
	}.call(this);

	// 学生割り当て結果にループをかける
	for (var i = 0, j = vec.length; i < j; i += 1) {
		var x = vec[i] - 0;

		// 残っているスロットから1つ選ぶ
		var dorm = this.dorms[slots[x]];

		// 学生とその割当先の寮を表示
		console.log(this.prefs[i][0], dorm);

		// このスロットを削除
		slots.splice(x, 1);  // spliceは配列自身に変更を加える
	}
};

Dorm.prototype.dormcost = function (vec) {
	var cost = 0;

	// スロットのリストを作成
	var slots = function () {

		// 各寮につきスロットを2つずつ生成
		var slots = [];
		for (var i = 0, j = this.dorms.length; i < j; i += 1) {
			slots = slots.concat([i, i]);  // concatは結合後の配列を返す
		}
		return slots;
	}.call(this);

	// 学生にループをかける
	for (var i = 0, j = vec.length; i < j; i += 1) {
		var x = vec[i] - 0;
		var dorm = this.dorms[slots[x]];
		var pref = this.prefs[i][1];

		// 第1希望のコスト0, 第2希望のコスト1
		if (pref[0] === dorm) {
			cost += 0;
		} else if (pref[1] === dorm) {
			cost += 1;
		} else {
			cost += 3;  // リストになければコスト3
		}
	}
	return cost;
};

/*

var dorm = new Dorm();
var optimization = new Optimization();

console.info("// p.118 ---------------------------------------");
dorm.printsolution([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

console.info("// p.119 ---------------------------------------");
s = optimization.geneticoptimize(dorm.domain, dorm.dormcost.bind(dorm));
dorm.printsolution(s);

*/
