var Socialnetwork = function () {
	this.people = [
		'Charlie', 'Augustus', 'Veruca', 'Violet', 'Mike', 'Joe', 'Willy', 'Miranda'
	];
	this.links = [
		['Augustus', 'Willy'],
		['Mike', 'Joe'],
		['Miranda', 'Mike'],
		['Violet', 'Augustus'],
		['Miranda', 'Willy'],
		['Charlie', 'Mike'],
		['Veruca', 'Joe'],
		['Miranda', 'Augustus'],
		['Veruca', 'Joe'],
		['Joe', 'Charlie'],
		['Veruca', 'Augustus'],
		['Miranda', 'Violet']
	];
	this.domain = function () {
		var domain = [];
		for (var i = 0, j = this.people.length * 2; i < j; i += 1) {
			domain.push([10, 370]);
		}
		return domain;
	}.call(this);
};


Socialnetwork.prototype.crosscount = function crosscount(v) {

	// 数字のリストを 人:(x, y)　形式のディクショナリに変換
	var loc = function () {
		var loc = {};
		for (var i = 0, j = this.people.length; i < j; i += 1) {
			loc[this.people[i]] = [v[i * 2], v[i * 2 + 1]];
		}
		return loc;
	}.call(this);

	var total = 0;

	// リンクの全ての組み合わせに対してループにかける
	(function () {
		for (var i = 0, l = this.links.length; i < l; i += 1) {
			for (var j = i + 1; j < l; j += 1) {

				// 座標の取得
				var x1, x2, x3, x4, y1, y2, y3, y4;
				x1 = loc[this.links[i][0]][0];  // console.log("i: %d, j: %d, x1: %d", i, j, x1);
				y1 = loc[this.links[i][0]][1];  // console.log("i: %d, j: %d, y1: %d", i, j, y1);
				x2 = loc[this.links[i][1]][0];  // console.log("i: %d, j: %d, x2: %d", i, j, x2);
				y2 = loc[this.links[i][1]][1];  // console.log("i: %d, j: %d, y2: %d", i, j, y2);
				x3 = loc[this.links[j][0]][0];  // console.log("i: %d, j: %d, x3: %d", i, j, x3);
				y3 = loc[this.links[j][0]][1];  // console.log("i: %d, j: %d, y3: %d", i, j, y3);
				x4 = loc[this.links[j][1]][0];  // console.log("i: %d, j: %d, x4: %d", i, j, x4);
				y4 = loc[this.links[j][1]][1];  // console.log("i: %d, j: %d, y4: %d", i, j, y4);

				var den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

				// den === 0 なら線は平行
				if (den === 0) {
					continue;
				}

				// 他の場合 ua と ub は交点を各線の分点で表現したもの
				var ua, ub;
				ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
				ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

				if (ua > 0 && ua < 1 && ub > 0 && ub < 1) {
					total += 1;
				}
			}
		}
	}.call(this));

	// ノード間を離すためのコスト
	(function () {
		for (var i = 0, l = this.people.length - 1; i < l; i += 1) {
			for (var j = 1 + 1; j < l; j += 1) {

				// 2つのノードの座標をとる
				var x1, y1, x2, y2;
				x1 = loc[this.people[i]][0];  // console.log("i: %d, j: %d, x1: %d", i, j, x1);
				y1 = loc[this.people[i]][1];  // console.log("i: %d, j: %d, y1: %d", i, j, y1);
				x2 = loc[this.people[j]][0];  // console.log("i: %d, j: %d, x2: %d", i, j, x2);
				y2 = loc[this.people[j]][1];  // console.log("i: %d, j: %d, y2: %d", i, j, y2);

				// 両者の距離を求める
				var dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

				// 50ピクセルより近いときにペナルティ
				if (dist < 50) {
					total += (1 - (dist / 50));
				}
			}
		}
	}.call(this));
	return total;
};


Socialnetwork.prototype.drawnetwork = function (sol, canvasID) {

	// 描画するcanvasのID
	var canvas = document.getElementById(canvasID);

	// 線を引くための準備
	var ctx = canvas.getContext('2d');

	// canvasを一旦リセット
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = 0.5;  // 線の太さ
	ctx.font = "normal 12px sans-serif";  // 文字

	// 座標連想配列の生成
	var pos = function () {
		var pos = {};
		for (var i = 0, j = this.people.length; i < j; i += 1) {
			pos[this.people[i]] = [sol[i * 2], sol[i * 2 + 1]];
		}
		return pos;
	}.call(this);

	// リンクの描画
	for (var i = 0, j = this.links.length; i < j; i += 1) {
		ctx.beginPath();
		ctx.moveTo(pos[this.links[i][0]][0], pos[this.links[i][0]][1]);
		ctx.lineTo(pos[this.links[i][1]][0], pos[this.links[i][1]][1]);
		ctx.closePath();
		ctx.stroke();
	}

	// 人の描画
	for (var i in pos) {
		ctx.fillText(i, pos[i][0], pos[i][1]);
	}
};
