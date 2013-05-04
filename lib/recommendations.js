var Recommendations = function () {
  this.critics = critics;
};


// person1 �� person2 �̋�������ɂ����ގ����X�R�A��Ԃ�
Recommendations.prototype.sim_distance = function (prefs, person1, person2) {

  // ��l�Ƃ��]�����Ă���A�C�e���̃��X�g�𓾂�
  // �Ɠ����ɗv�f�̐��𐔂��Ă���
  var si = {}, n = 0;
  (function () {
    for (var item in prefs[person1]) {
      if (item in prefs[person2]) {
        si[item] = 1;
        n += 1;
      }
    }
  })();

  // ���ɕ]�����Ă���A�C�e�����Ȃ���� 0 ��Ԃ�
  if (n === 0) return 0;

  // ���ׂĂ̍��̕����𑫂����킹��
  var sum_of_squares = 0;
  (function () {
    for (var item in prefs[person1]) {
      if (item in prefs[person2]) {
        sum_of_squares += Math.pow(prefs[person1][item] - prefs[person2][item], 2);
      }
    }
  })();

  return 1 / (1 + sum_of_squares);

};


// p1 �� p2 �̃s�A�\�����֌W����Ԃ�
Recommendations.prototype.sim_pearson = function (prefs, person1, person2) {

  // ��l�Ƃ��]�����Ă���A�C�e���̃��X�g�𓾂�
  // �Ɠ����ɗv�f�̐��𐔂��Ă���
  var si = {}, n = 0;
  for (var item in prefs[person1]) {
    if (item in prefs[person2]) {
      si[item] = 1;
      n += 1;
    }
  }

  // ���ɕ]�����Ă���A�C�e�����Ȃ���� 0 ��Ԃ�
  if (n === 0) return 0;

  // ���ׂĂ̚n�D�����v����
  // ���������v����
  // �ς����v����
  var sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
  for (var it in si) {
    sum1 += prefs[person1][it];
    sum2 += prefs[person2][it];
    sum1Sq += Math.pow(prefs[person1][it], 2);
    sum2Sq += Math.pow(prefs[person2][it], 2);
    pSum += prefs[person1][it] * prefs[person2][it];
  }

  // �s�A�\���ɂ��X�R�A���v�Z����
  var num = pSum - (sum1 * sum2 / n);
  var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) * (sum2Sq - Math.pow(sum2, 2) / n));

  if (den === 0) return 0;

  return num / den;

};


// �f�B�N�V���i�� prefs ���� person �ɂ����Ƃ��}�b�`������̂�����Ԃ�
// ���ʂ̐��Ɨގ����֐��̓I�v�V�����̃p�����[�^
Recommendations.prototype.topMatches = function (prefs, person, n, similarity) {
  n = n || 5;
  similarity = similarity || 'sim_pearson';

  var scores = [];
  for (var other in prefs) {
    if (other != person) {
      scores.push([this[similarity](prefs, person, other), other]);
    }
  }

  // ���X�R�A�����X�g�̍ŏ��ɗ���悤�ɕ��ёւ���
  scores.sort(function (a, b) {
    return b[0] - a[0];
  });

  return scores.slice(0, n);

};


// person �ȊO�̑S���[�U�̕]�_�̏d�ݕt�����ς��g���Aperson �ւ̐��E���Z�o����
Recommendations.prototype.getRecommendations = function (prefs, person, similarity) {
similarity = similarity || 'sim_pearson';
var totals = {};
  var simSums = {};

  for (var other in prefs) {
    // �������g�Ƃ͔�r���Ȃ�
    if (other === person) continue;

    var sim = this[similarity](prefs, person, other);

    // 0 �ȉ��̃X�R�A�͖�������
    if (sim <= 0) continue;

    for (var item in prefs[other]) {
      // �܂����Ă��Ȃ��f��̓��T�̂ݎZ�o
      if ( !(item in prefs[person]) || prefs[person][item] === 0) {
        // �ގ��x * �X�R�A
        totals[item] = totals[item] || 0;
        totals[item] += prefs[other][item] * sim;
        // �ގ��x�����v
        simSums[item] = simSums[item] || 0;
        simSums[item] += sim;
      }
    }
  }

  // ���K�������z������
  var rankings = [];
  for (var item in totals) {
    rankings.push([totals[item] / simSums[item], item]);
  }

  // �\�[�g�ς݂̃��X�g��Ԃ�
  rankings.sort(function (a, b) {
    return b[0] - a[0];
  });

  return rankings;

};


Recommendations.prototype.transformPrefs = function (prefs) {
	var result = [];
	
	for (var person in prefs) {
		for (var item in prefs[person]) {
			result[item] = result[item] || {};
			result[item][person] = prefs[person][item];
		}
	}
	return result;
};


Recommendations.prototype.calculateSimilarItems = function (prefs,n) {
  n = n || 10;
  
  var result = {};
  var itemPrefs = this.transformPrefs(prefs);
  var scores = {};
  
  var c = 0;
  for (var item in itemPrefs){
  	c+=1;
  	if (c%100==0){
  		console.log(itemPrefs.length);
  	}
  	scores = this.topMatches(itemPrefs,item,n=n,similarity='sim_distance');
	result[item]= scores;
  }
  return result;

};


Recommendations.prototype.getRecommendedItems = function (prefs,itemMatch,user) {
	var userRatings = prefs[user];
	var scores ={};
	var totalSim = {};
	
  for(var item in userRatings ){
  var rating = userRatings[item];
  	for(var items in itemMatch[item] ){
	  	var target_item = itemMatch[item][items];
	  	var similarity = target_item[0];
	  	var item2 = target_item[1];
	  		if(item2 in userRatings){ continue; }
			  //
			  scores[item2] = scores[item2] || 0;
			  scores[item2] += similarity * rating;
			  //
			  totalSim[item2] = totalSim[item2] || 0;
			  totalSim[item2] += similarity;
  	}
  }
  var rankings = [];
  for (var item in scores) {
    rankings.push([scores[item] / totalSim[item], item]);
  }
  rankings.sort(function (a, b) {
    return b[0] - a[0];
  });

  return rankings;

};