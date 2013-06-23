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
		this.func = fw.func;
		this.name = fw.name;
		this.children = children;
	};

	gp.node.prototype.evaluate = function (inp) {
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

	gp.node.prototype.display = function (indent) {
		indent = indent || 0;
		console.log(multiStr(' ', indent) + this.name);

		this.children.forEach(function (e, i) {
			e.display(indent + 1);
		});
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


	gp.hidenfunction = function (x, y) {

	};

	gp.buildhiddenset = function () {

	};

	gp.scorefunction = function (tree, s) {

	};


	gp.mutate = function (t, pc, probchange) {
		probchange = probchange || 0.1;

	};


	gp.crossover = function (t1, t2, probswap, top) {
		probswap = probswap || 0.7;
		top = top || 1;

	};

	return gp;
};


