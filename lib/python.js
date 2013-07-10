// PythonにあってJavaScriptにない機能を再現する
var p = function () {};

p.prototype.zip = function () {
	var args = arguments;
	for (var i = 0; i < arguments.length; i += 1) {
		if (i > 0) {
			if (arguments[i].length !== arguments[i - 1].length) {

				// 与えられた配列の長さが同じでなければ失敗。
				// Pythonではどうなるのかは後で調べる!　とりあえずp.292で使う用
				return 0;
			}
		}
	}
	return (function () {
		var r = [];

		// 引数の最初の配列の持つ要素分だけループ
		for (var i = 0; i < args[0].length; i += 1) {
			var z = [];

			// 引数で与えられた配列の数だけループ
			for (var j = 0; j < args.length; j += 1) {
				z.push(args[j][i]);
			}
			r.push(z);
		}
		return r;
	}());
};

// ランダム
p.prototype.random = {};

// 引数でとる最小値、最大値からランダムの整数を返す
p.prototype.random.randint = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 与えられた配列の中からランダムに１つの要素を返す
p.prototype.random.choice = function (arr) {
	return arr[this.randint(0, arr.length - 1)];
};

var Python = new p();
