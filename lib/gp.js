var Gp = function () {


  // JavaScriptは 'aa' * 2 -> 'aaaa' みたいなことができないので、
  // それを実現するための関数をつくりました。
  var multiStr = function (str, num) {
    return (function () {
      var s = '';
      for (var i = 0, j = num; i < j; i += 1) {
        s += str;
      }
      return s;
    }());
  };


  var gp = {};


  // class fwrapper
  gp.fwrapper = function (func, childcount, name) {
    this.func = func;
    this.childcount = childcount;
    this.name = name;
  };


  // class node
  gp.node = function (fw, children)  {
    this.func = fw.func || {};
    this.name = fw.name || '';
    this.children = children || {};
  };

  gp.node.prototype.evaluate = function nodeevaluate(inp) {
    var self = this;
    var results = (function () {
      var results = [];
      self.children.forEach(function (e, i) {
        results.push(e.evaluate(inp));
      });
      return results;
    }());
    return self.func(results);
  };

  gp.node.prototype.display = function nodedisplay(indent) {
    indent = indent || 0;
    console.log(multiStr(' ', indent) + this.name);

    try {
      this.children.forEach(function (e, i) {
        e.display.call(e, (indent + 1));
      });
    } catch (e) {
      console.info(this, e);
    }
  };


  // class paramnode
  gp.paramnode = function (idx) {
    this.idx = idx;
  };

  gp.paramnode.prototype.evaluate = function (inp) {
    return inp[this.idx];
  };

  gp.paramnode.prototype.display = function (indent) {
    indent = indent || 0;
    console.log("%sp%d", multiStr(' ', indent), this.idx);
  };


  // class constnode
  gp.constnode = function (v) {
    this.v = v;
  };

  gp.constnode.prototype.evaluate = function (inp) {
    return this.v;
  };

  gp.constnode.prototype.display = function (indent) {
    indent = indent || 0;
    console.log("%s%d", multiStr(' ', indent), this.v);
  };


  gp.addw = new gp.fwrapper(function (l) {
    return l[0] + l[1];
  }, 2, 'add');

  gp.subw = new gp.fwrapper(function (l) {
    return l[0] - l[1];
  }, 2, 'subtract');

  gp.mulw = new gp.fwrapper(function (l) {
    return l[0] + l[1];
  }, 2, 'multiply');

  gp.iffunc = function (l) {
    if (l[0] > 0) return l[1];
    else return l[2];
  };

  gp.ifw = new gp.fwrapper(gp.iffunc, 3, 'if');

  gp.isgreater = function (l) {
    if (l[0] > l[1]) return 1;
    else return 0;
  };

  gp.gtw = new gp.fwrapper(gp.isgreater, 2, 'isgreater');

  gp.flist = [gp.addw, gp.mulw, gp.ifw, gp.gtw, gp.subw];

  gp.exampletree = function () {
    return new gp.node(gp.ifw, [
      new gp.node(gp.gtw, [new gp.paramnode(0), new gp.constnode(3)]),
      new gp.node(gp.addw, [new gp.paramnode(1), new gp.constnode(5)]),
      new gp.node(gp.subw, [new gp.paramnode(1), new gp.constnode(2)])
    ]);
  };

  // p.279 最初の集団をつくる
  gp.makerandomtree = function (pc, maxdepth, fpr, ppr) {
    maxdepth = (typeof maxdepth === 'undefined') ? 4 : maxdepth;

    /** ↑について、
    maxdepth = maxdepth || 4 とすると、maxdepthが0のときもfalseと(勝手に)解釈し、
    その結果、4が代入されてしまうようです。すると、永久に再帰してstack overflow!
    になるので、undefinedすなわち引数が与えられているか否か、と厳密に判定しています。
    */
    fpr = fpr || 0.5;
    ppr = ppr || 0.6;

    if (Math.random() < fpr && maxdepth > 0) {
      var f = Python.random.choice(gp.flist);
      var children = (function () {
        var children = [];
        for (var i = 0, j = f.childcount; i < j; i += 1) {
          children.push( new gp.makerandomtree(pc, maxdepth - 1, fpr, ppr) );
        }
        return children;
      }());
      return new gp.node(f, children);
    } else if (Math.random() < ppr) {
      return new gp.paramnode(Python.random.randint(0, pc - 1));
    } else {
      return new gp.constnode(Python.random.randint(0, 10));
    }
  };


  gp.hiddenfunction = function (x, y) {
    return Math.pow(x, 2) + 2 * y + 3 * x + 5;
  };

  gp.buildhiddenset = function () {
    var rows = [];
    for (var i = 0, j = 200; i < j; i += 1) {
      var x = Python.random.randint(0, 40);
      var y = Python.random.randint(0, 40);
      rows.push([x, y, gp.hiddenfunction(x, y)]);
    }
    return rows;
  };

  gp.scorefunction = function (tree, s) {
    var dif = 0;
    s.forEach(function (data) {
      var v = tree.evaluate([data[0], data[1]]);
      dif += Math.abs(v - data[2]);
    });
    return dif;
  };


  gp.mutate = function (t, pc, probchange) {
    probchange = probchange || 0.2;

    if (Math.random() < probchange) {
      return new gp.makerandomtree(pc);
    } else {
      var result = jQuery.extend(true, {}, t);
      if (typeof t === 'object' && "children" in t) {
        result.children = (function () {
          var children = [];
          t.children.forEach(function (e) {
            children.push(new gp.mutate(e, pc, probchange));
          });
          return children;
        }());
      }
      return result;
    }
  };

  gp.crossover = function (t1, t2, probswap, top) {
    probswap = probswap || 0.7;
    top = top || 1;

    if (Math.random() < probswap && top !== 0) {
      return jQuery.extend(true, {}, t2);
    } else {
      var result = jQuery.extend(true, {}, t1);
      if ("children" in t1 && "children" in t2) {
        result.children = (function () {
          var children = [];
          t1.children.forEach(function (e) {
            children.push(new gp.crossover(e, Python.random.choice(t2.children), probswap, 0));
          });
          return children;
        }());
      }
      return result;
    }
  };

  gp.evolve = function (pc, popsize, rankfunction, maxgen, mutationrate, breedingrate, pexp, pnew) {
    maxgen = maxgen || 500;
    mutationrate = mutationrate || 0.1;
    breedingrate = breedingrate || 0.4;
    pexp = pexp || 0.7;
    pnew = pnew || 0.05;

    var scores, newpop;

    // ランダムな低い数値を返す。pexpが低ければ低いほど得られる数値は小さくなる
    var selectindex = function () {
      return parseInt( Math.log(Math.random()) / Math.log(pexp), 10 );
    };

    // 初期集団をランダムに作り上げる
    var population = (function () {
      var population = [];
      for (var i = 0, j = popsize; i < j; i += 1) {
        population.push( new gp.makerandomtree(pc) );
      }
      return population;
    }());

    for (var i = 0, j = maxgen; i < j; i += 1) {
      scores = rankfunction(population);
      console.log(scores[0][0]);
      if (+scores[0][0] === 0) break;

      // 上位2つは無条件に採用
      newpop = [scores[0][1], scores[1][1]];

      // 次世代を作る
      while (newpop.length < popsize) {
        if (Math.random() > pnew) {
          newpop.push( new gp.mutate( new gp.crossover(scores[selectindex()][1],
                                                       scores[selectindex()][1],
                                                       breedingrate),
                                        pc,
                                        mutationrate
                                      )
                      );
        } else {
          newpop.push( new gp.makerandomtree(pc) );
        }
      }
      population = newpop;
    }

    scores[0][1].display();
    return scores[0][1];
  };

  gp.getrankfunction = function (dataset) {
    return function (population) {
      var scores = (function () {
        var scores = [];
        population.forEach(function (e, i) {
          scores.push([gp.scorefunction(e, dataset), e]);
        });
        return scores;
      }());
      scores.sort(function (a, b) { return a[0] - b[0]; });
      return scores;
    };
  };

  gp.gridgame = function (p) {

    // ボードのサイズ
    var max = [3, 3];

    // それぞれのプレイヤーの最後の動きを記憶
    var lastmove = [-1, -1];

    // プレイヤーの位置を記憶
    var location = [[Python.random.randint(0, max[0]), Python.random.randint(0, max[1])]];

    // 2番目のプレイヤーと最初のプレイヤーの距離を十分にとる
    location.push([(location[0][0] + 2) % 4, (location[0][1] + 2) % 4]);

    // 50回動いたら引き分け
    for (var o = 0, r1 = 50; o < r1; o += 1) {

      // それぞれのプレイヤーの分繰り返す
      for (var i = 0, r2 = 2; i < r2; i += 1) {
        var locs = location[i].concat(location[1 - i]);
        locs.push(lastmove[i]);
        var move = p[i].evaluate(locs) % 4;

        // 行内の同じ方向へ2回移動すると負け
        if (lastmove[i] == move) return 1 - i;

        lastmove[i] = move;
        if (move === 0) {
          location[i][0] -= 1;

          // ボードの制限
          if (location[i][0] < 0) location[i][0] = 0;
        }
        if (move === 1) {
          location[i][0] += 1;
          if (location[i][0] > max[0]) location[i][0] = max[0];
        }
        if (move === 2) {
          location[i][1] -= 1;
          if (location[i][1] < 0) location[i][1] = 0;
        }
        if (move === 3) {
          location[i][1] += 1;
          if (location[i][1] > max[1]) location[i][1] = max[1];
        }

        // 他のプレイヤーを捕まえたら勝利
        if (location[i] == location[1 - i]) return i;
      }
    }
    return -1;
  };

  gp.tournament = function (pl) {

    // 負けの回数
    var losses = (function () {
      var losses = [];
      pl.forEach(function () {
        losses.push(0);
      });
      return losses;
    }());

    // すべてのプレイヤーは自分以外のすべてのプレイヤーと対戦
    for (var i = 0, il = pl.length; i < il; i += 1) {
      for (var j = 0, jl = pl.length; j < jl; j += 1) {
        if (i === j) continue;

        // 勝者は誰?
        var winner = gp.gridgame([pl[i], pl[j]]);

        // 負けは2ポイント、引き分けは1ポイント
        if (winner === 0) {
          losses[j] += 2;
        } else if (winner === 1) {
          losses[i] += 2;
        } else if (winner === -1) {
          losses[i] += 1;
          losses[j] += 1;
        }
      }
    }

    var z = Python.zip(losses, pl);
    z.sort(function (a, b) {
      return a[0] - b[0];
    });
    return z;
  };

  gp.humanplayer = function () {};

  gp.humanplayer.prototype.evaluate = function (board) {

    // Pythonの 配列 in 配列をたくさんもつ配列 と同じことがJavaScriptではできないので、同じことをすべく
    // 配列をたくさん持つ配列の中に、指定した配列と同じ配列があるかどうかを判定する関数をつくりました
    var isArrayInArrays = function (arr, arrs) {

      // 配列arrの要素数分だけループする
      for (var i = 0, I = arr.length; i < I; i += 1) {

        // 配列arrsの要素数分ループ
        for (var j = 0, J = arrs.length; j < J; j += 1) {

          // もし、配列arr(Aとする)の1つ目の要素と、
          // 配列arrsの1つ目の要素の配列(Bとする)の1つ目の要素が一致したら
          if (arr[i] == arrs[j][i]) {
            var match = 0;

            // Aの配列とBの配列を比較していく
            for (var k = 0, K = arr.length; k < K; k += 1) {
              if (arr[k] !== arrs[j][k]) break;  // 一致しない要素があればもうダメ、他の配列へ
              match += 1;
              if (match == arr.length) return true;  // すべて一致したらtrueを返す
            }
          }
        }
      }
      return false;
    };


    // 自分の位置とあいての位置を取得
    var me = board.slice(0, 2);
    others = (function () {
      var others = [];
      for (var i = 2, j = board.length; i < j; i += 2) {
        others.push(board.slice(i, i + 2));
      }
      return others;
    }());

    // ボードの表示
    buf = [];

    for (var i = 0, I = 4; i < I; i += 1) {
      for (var j = 0, J = 4; j < J; j += 1) {
        if (i === me[0] && j === me[1]) {
          buf.push('O');
        } else if (isArrayInArrays([i, j], others)) {
          buf.push('X');
        } else {
          buf.push('.');
        }
      }
      buf.push('\n');
    }

    console.log(' ' + buf.join(' '));


    // 参照用に移動を表示
    console.log('あなたの先ほどの移動は%dでした', board[board.length - 1]);
    console.log(' 0');
    console.log('2  3');
    console.log(' 1');

    // とりあえずランダムで0-3をかえす
    var input = Python.random.randint(0, 3);
    console.log('移動先を入力:', input, '(ランダムで移動しています)');

    return input;
  };


  return gp;
};
