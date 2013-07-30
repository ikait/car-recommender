importScripts('car.js');

self.onmessage = function (e) {
  var cars = e.data;
  var c = new Car();

  for (var i = 0, j = cars.length; i < j; i += 1) {
    for (var k = 0; k < j; k += 1) {
      if (cars[i] !== cars[k]) {
        c.getSimilarityScore.apply(cars[i], [cars[k], cars[i], c]);
      }
    }
  }

  for (var i = 0, j = cars.length; i < j; i += 1) {
    cars[i].similarities.sort(function (a, b) {
      return (a.score > b.score) ? -1 : 1;
    });
  }

  self.postMessage(cars);
};
