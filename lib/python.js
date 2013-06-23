// PythonにあってJavaScriptにない機能を再現する
var p = function () {};

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
