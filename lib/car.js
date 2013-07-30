//----------------------------------------------------------------------/
// 自動車のオブジェクト Car
// これが何千個newして作られる
//----------------------------------------------------------------------/
var Car = function (obj) {
  this.values = obj || {};
  this.similarities = [];
};

// 全長、全幅、全高をメートルの整数で取得する (引数なしだと3つが入ったオブジェクトで返す)
Car.prototype.getSizeWithMetre = function (where, car) {
  var self = car || this;
  var item = ["full_length", "full_height", "full_width"];
  var metre_ratio = 0.001;
  var size;
  if (where) {
    if (self.values && self.values[where]) {
      size = +self.values[where].replace(/,/g, '') * metre_ratio;
    }
  } else {
    size = {};
    item.forEach(function (e, i) {
      if (self.values && self.values[where]) {
        size[e] = +self.values[where].replace(/,/g, '') * metre_ratio;
      }
    });
  }
  return (size) ? size : {};
};

// 自分と、与えられた車の類似値を比較して、覚えておく (ついでにスコアを返す)
Car.prototype.getSimilarityScore = function (cmpcar, car, func) {
  var self = car || this;  // 自分: self  比較する車: cmpcar
  var func = func || this;
  var score = 0, similarity = {};

  // ボディタイプが一緒であれば +1
  score += (self.cartype === cmpcar.cartype) ? 1 : 0;

  // 動力分類が一緒であれば +1
  score += (self.values.power === cmpcar.values.power) ? 1 : 0;

  // 駆動方式が一緒であれば +1
  score += (self.values.drive_system === cmpcar.values.drive_system) ? 1 : 0;

  // 色について
  // 選択できる色の一致率 (0〜1)
  //


  // 全長と全幅でユークリッド距離を求めそのまま足す
  var c1 = {}, c2 = {};
  c1.length = func.getSizeWithMetre.call(self, "full_length");
  c1.height = func.getSizeWithMetre.call(self, "full_height");
  c2.length = func.getSizeWithMetre.call(cmpcar, "full_length");
  c2.height = func.getSizeWithMetre.call(cmpcar, "full_height");
  score += (
    1 / ( 1 +
      Math.sqrt(
        Math.pow(c1.length - c2.length, 2) + Math.pow(c1.height - c2.height, 2)
      )
    )
  );

  similarity.score = score;
  similarity.car = cmpcar;

  // self.similarities.push(similarity);
  return similarity;  // スコアと車の組を返す
};
