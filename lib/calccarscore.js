importScripts('car.js');

self.onmessage = function (e) {
  var cars = e.data;
  var c = new Car();

  cars.forEach(function (car, i, carsParent) {
    cars.forEach(function (car2) {
      if (car !== car2) {
        c.getSimilarityScore.apply(carsParent[i], [car2, carsParent[i], c]);
      }
    });
  });

  cars.forEach(function (e, i, cars) {
    cars[i].similarities.sort(function (a, b) {
      return (a.score > b.score) ? -1 : 1;
    });
  });

  self.postMessage(cars);
};
