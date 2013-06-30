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
		fpr = fpr || 0.8;
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
		s.forEach(function (e) {
			var v = tree.evaluate([e[0], e[1]]);
			dif += Math.abs(v - e[2]);
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


	return gp;
};
