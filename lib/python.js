// PythonにあってJavaScriptにない機能を再現する
var Python = function () {};

// ランダム
Python.random = {};

// 引数でとる最小値、最大値からランダムの整数を返す
Python.random.randint = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
