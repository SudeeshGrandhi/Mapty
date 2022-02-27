'use strict';

let map, mapEvent;

//Creating workout(parent)
//id,distance,duration,coords,date,constructor()
const Workout = class {
  //What ever we are mentioning above constructor are yet to implement in es6 they are in stage4
  clicks = 0;
  date = new Date();
  //Date.now() will give time in milliseconds from 1970 january to till date
  id = (Date.now() + '').slice(-10); //This is to identify and slice method is for string
  constructor(distance, duration, coords) {
    this.distance = distance; //in km
    this.duration = duration; //in min
    this.coords = coords; //[lat,lon]
  }
  _setDescription() {
    //We can use this comment saying prettier to ignore the next line
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()] //GetMonth is also 0 based like Arrays
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
};
// Running and Cycling child class of WorkOut
const Running = class extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence; //steps/min
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
};

const Cycling = class extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
    // this.type='cycling'
  }
  calcSpeed() {
    // km/hr
    // prettier-ignore
    this.speed = this.distance / (this.duration/ 60);
    return this.speed;
  }
};
// const run = new Running(10, 50, [39, 14], 10);
// const cyc = new Cycling(10, 50, [39, 14], 10);
// console.log(run, cyc);
// console.log(Date.now());

//ARchitecture
//****************************Refabricating The Code *******************/
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const App = class {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    //What are all required when Home page gets loaded
    //Get Users position
    this._getPosition();

    //Get data from Local storage
    this._getLocalStorage();

    //Attach Event Handlers
    form.addEventListener('submit', this._newWorkout.bind(this));

    //Changing labling from running and cycling and chaning accordingly values

    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  //**************GEOLOCATION-API(Getting Latitude and longitude of our current position) */
  //Here getPosition will have 2 callback functions one it able to track our location another one
  //When its unable to locate us ,Here it is _loadmap and an alert function
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        function () {
          alert('Could not get your position');
        }
      );
  }
  _loadMap(position) {
    // console.log(position);
    //Using getCurrentposition function call back and getting coordinates
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];

    /********************DISPLAYING A MAP USING 3rd PARTY LIBRARY(LEAFLET) *******************/

    //Leaflet --> An open source Javascript library for mobile friendly interactive maps
    //CDN link-> Content delivery network
    //NPM-Node packet Manager
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(this.#map);
    //L. is the name space for leaflet to use its methods
    //Here the string which we pass inside map will be the element where map will be displayed
    //13 here indicates the zoom level and 1st argument in setview should be array of latitude and longitude
    // console.log(map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // document.querySelector('#map').addEventListener('click',function(e){
    //     console.log(e);
    // })
    //We cannot attach an event handler to #map element because it wont produce coordinates at that particular position
    //Attaching event handler to map which we got from leaflet 3rd party vendor
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    //Empty Input
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    // const validInputs = (...inputs) =>
    //   inputs.every(inp => Number.isFinite(inp));

    const validInputs = function (...inputs) {
      return inputs.every(function (inp) {
        return Number.isFinite(inp);
      });
    };

    // const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const allPositive = function (...inputs) {
      return inputs.every(function (inp) {
        return inp > 0;
      });
    };

    e.preventDefault();

    //Get data from the form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let Workout;

    //If workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      Workout = new Running(distance, duration, [lat, lng], cadence);
    }

    //If workout is cycling,create cycling object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      Workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    //Add New object to workout Array
    this.#workouts.push(Workout);

    //Render workout on map as marker

    this._renderWorkoutMarker(Workout);

    //Render workout on list

    this._renderWorkout(Workout);

    //Hide form + clear input fields

    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(Workout) {
    //Here map=L.map('map').setView(coords, 13) && mapEvent is function coming from mapE
    //The above will give latitude and longitude of the place of the map where we clicked
    L.marker(Workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${Workout.type}-popup`,
        })
      )
      .bindPopup(
        `${Workout.type === 'running' ? '🏃‍♂️' : '⚡️'} ${Workout.description}`
      ) //These methoda are chainable
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '⚡️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');
    //Target will always go for bottom one

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // // using the public interface
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    //Objects coming from local storage wont get access to parent methods(Parental inheritance)

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
};

const app = new App();

const date = Date.now(); //this will give time elapsed since 1970 january1 in miliseconds
