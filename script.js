'use strict';

const form = document.querySelector('.form');
const containertasks = document.querySelector('.tasks');
const inputType = document.querySelector('.form__input--type');
const inputTimeReq = document.querySelector('.form__input--TimeReq');
const inputDueDate = document.querySelector('.form__input--DueDate');
const inputProjectNo = document.querySelector('.form__input--ProjectNo');
const inputElevation = document.querySelector('.form__input--elevation');
const sortDivider = document.querySelector('.sort__devider');
const showSortBtns = document.querySelector('.show__sort__btns');
const validationMsg = document.querySelector('.validation__msg');
const clearAllBtn = document.querySelector('.clr__all__btn');
const overviewBtn = document.querySelector('.overview__btn');
const confMsg = document.querySelector('.confirmation__msg');
const yesBtn = document.querySelector('.yes__button');
const noBtn = document.querySelector('.no__button');
const sortContainer = document.querySelector('.sort__buttons__container');

class task {
    
    id = Math.random() + '';
    constructor(coords, TimeReq, DueDate, date){
        this.coords = coords;
        this.TimeReq = TimeReq; 
        this.DueDate = DueDate; 
        this.date = date;      
    }
    _setDescription(){
        this.description = `Task (${this.ProjectNo}) has to be finished within ${this.DueDate} days`;
        
    }
}

class Project extends task {
    type = 'Project';
    constructor(coords, TimeReq, DueDate, date, ProjectNo){
        super(coords, TimeReq, DueDate, date);
        this.ProjectNo = ProjectNo
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        this.pace = this.DueDate / this.TimeReq
        return this.pace
    }
}

class Chore extends task {
    type = 'Important';
    constructor(coords, TimeReq, DueDate, date, elevationGain){
        super(coords, TimeReq, DueDate, date);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        //km/h
        this.speed = this.TimeReq / (this.DueDate / 60)
    }
}

VANTA.WAVES({
    el: "#main-background",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x161f27
  })


/////////////////////////////////////////////////////////////////
// APP ARCHITECTURE



class App {
    #map;
    #mapEvent;
    #tasks = [];
    #markers = [];
    constructor(){

        this._getPosition();

        form.addEventListener('submit', this._newtask.bind(this));
        inputType.addEventListener('change',this._toggleElevationField);
        containertasks.addEventListener('click',this._handletaskClick.bind(this));
        containertasks.addEventListener('change',this._updatetaskInfo.bind(this));
        this._checkStorageAndLoad();
        showSortBtns.addEventListener('click',this._toggleSortBtns.bind(this));
        sortContainer.addEventListener('click',this._sortAndRender.bind(this));
        clearAllBtn.addEventListener('click',this._showDeleteMsg);
        yesBtn.addEventListener('click', this._clearAll);
        noBtn.addEventListener('click', function() {
            confMsg.classList.add('msg__hidden'); 
        });
    }
    _handletaskClick(e){
        const [id,foundtask,taskIndex,element] = this._getId(e);
        if (!id) return;
        if (e.target.classList.contains("remove__btn")) {
          this._removetask( element, taskIndex);
          this._savetasks();
        return;
        };
        if (e.target.classList.contains("task__value")) {
            return;
        };
        this._setIntoView(foundtask);
    }

    _sortAndRender(e){
        const element = e.target.closest('.sort__button');
        let currentDirection = 'descending';
        if (!element) return;
        const arrow = element.querySelector('.arrow');
        const type = element.dataset.type;
        sortContainer.querySelectorAll('.arrow').forEach(e=> e.classList.remove('arrow__up'));
        
        const typeValues = this.#tasks.map(task => {return task[type]})
        const sortedAscending = typeValues.slice().sort(function(a, b){return a-b}).join('');
        const sortedDescending = typeValues.slice().sort(function(a, b){return b-a}).join('');
        
        if (typeValues.join('') === sortedAscending) {
            currentDirection = 'ascending'
               
            arrow.classList.add('arrow__up') 
            
        }
        if (typeValues.join('') === sortedDescending) {
            currentDirection = 'descending' 
           
            arrow.classList.remove('arrow__up')   
    
        }
        
        this._sortArray(this.#tasks, currentDirection, type);

        containertasks.querySelectorAll('.task').forEach(task => task.remove());
        this.#markers.forEach(marker=> marker.remove());
        this.#markers = [];
        this.#tasks.forEach(task => {
            this._rendertask(task);
            this._rendertaskMarker(task);
        });
       const lasttask = this.#tasks[this.#tasks.length - 1];
       this._setIntoView(lasttask);
       
    }
    _sortArray(array,currentDirection,type){
        
        // sort opposite to the currentDirection
        if (currentDirection === 'ascending') {
            array.sort(function(a, b){return b[type]-a[type]});
           
            
        };
        if (currentDirection === 'descending') {
            array.sort(function(a, b){return a[type]-b[type]});
            
            
        };

    };

    _toggleSortBtns(){
        sortContainer.classList.toggle('zero__height');
    };
    _showDeleteMsg(){
        confMsg.classList.remove('msg__hidden');
    };

    _checkStorageAndLoad(){
        const tasks = localStorage.getItem('tasks');
        if (!tasks) return

        // Rebuild objects based on storage
        const temptasks = JSON.parse(tasks);
        temptasks.forEach(task => {
            const typeOftask = task.type;
            let newtask;
            // create task object
            if (typeOftask === 'Project') {
                 newtask = new Project(task.coords, task.TimeReq, task.DueDate, task.date, task.ProjectNo);
            };
            if (typeOftask === 'Important') {
                 newtask = new Important(task.coords, task.TimeReq, task.DueDate, task.date, task.elevationGain);
            };
            
            //push the created task object in the array
            this.#tasks.push(newtask);
        });
        this.#tasks.forEach(task =>  this._rendertask(task));
        // map markers will load after map is loaded    
    };
    _savetasks(){
        const taskString = JSON.stringify(this.#tasks);
        window.localStorage.setItem('tasks', taskString);
    }

    _getPosition(){

        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
            alert("Could not get your position")
        });
    }

    _loadMap(position){
        
    
            const {latitude, longitude} = position.coords;
            const myCoordinates = [latitude, longitude];
        
            this.#map = L.map('map').setView(myCoordinates, 15);

            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on('click', this._showForm.bind(this));

            if(!this.#tasks) return
            this.#tasks.forEach(task => this._rendertaskMarker(task));  

            overviewBtn.addEventListener('click', this._overview.bind(this));
    }

    _showForm(mapE){

        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputTimeReq.focus();
    }
    _clearInputFields(){
        inputTimeReq.value = inputDueDate.value = inputProjectNo.value = inputElevation.value = "";
    }
    _hideForm(){
        this._clearInputFields();
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputProjectNo.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newtask(e){
        ///////// HELPER FUNCTIONS
        // check if type is number
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        // check if number is positive
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        // function to display msg if inputs don't pass validation
        const display = function() {
            //display and hide msg after 3 sec
            validationMsg.classList.add('msg__show');
            setTimeout(() => {
                validationMsg.classList.remove('msg__show');
            }, 3000);
            //clear fields
            this._clearInputFields();
        }
        const displayValidationMsg = display.bind(this);


        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const TimeReq = +inputTimeReq.value 
        const DueDate = +inputDueDate.value 
        const{lat, lng} = this.#mapEvent.latlng;
        let task;
        const date = Date.now(); 
       
        
        if(type === 'Project'){
            const ProjectNo = +inputProjectNo.value;
            // Check if data is valid
            if(
                !validInputs(TimeReq,DueDate,ProjectNo) ||
                !allPositive(TimeReq, DueDate, ProjectNo)
            ) return displayValidationMsg();

            task = new Project([lat, lng], TimeReq, DueDate, date, ProjectNo);
            

        }

        if(type === 'Important'){
            const elevation = +inputElevation.value;
            if(
                !validInputs(TimeReq,DueDate,elevation)||
                !allPositive(TimeReq, DueDate)
            ) return displayValidationMsg();

            task = new Important([lat, lng], TimeReq, DueDate, date, elevation);
            
        }

        
        this._rendertaskMarker(task)

        this.#tasks.push(task);

        this._rendertask(task)

        this._hideForm();
           
    }
    _rendertaskMarker(task){
        // custom icon
        const maptyIcon = L.icon({
            iconUrl: 'icon.png',
            iconSize: [20, 40],
            iconAnchor: [24, 3]
        });
       const layer = L.marker(task.coords, {icon:maptyIcon}).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${task.type}-popup`
        })).setPopupContent(`${task.type === "Project" ? '🏃‍♂️' : '🚴‍♀️'} ${task.description}`).openPopup();
         this.#markers.push(layer);
    }

    _rendertask(task){
        
        let html = `
      <li class="task task--${task.type}" data-id="${task.id}">
        <h2 class="task__title">${task.description}</h2>
        <div class="task__details">
          <span class="task__icon">⏱</span>
          <input class="task__value" value="${task.TimeReq}" data-type="TimeReq" required size="1">
          <span class="task__unit">hrs</span>
        </div>
        <div class="task__details">
          <span class="task__icon">📅</span>
          <input class="task__value" value="${task.DueDate}" data-type="DueDate" required size="1">
          <span class="task__unit">days</span>
        </div>`;

        if (task.type === 'Project') {
            html += ` 
          <div class="task__details">
            <span class="task__icon">🆔</span>
            <input class="task__value" value="${task.ProjectNo}" data-type="ProjectNo" required size="1">
            <span class="task__unit"></span>
          </div>
          <button class="remove__btn"></button>
        </li>`;       
        }
        if (task.type === 'Important') {
            html += `
          <div class="task__details">
            <span class="task__icon">⛰</span>
            <input class="task__value" value="${task.elevationGain}" data-type="elevationGain" required size="2">
            <span class="task__unit">m</span>
          </div>
          <button class="remove__btn"></button>
        </li>`
        }
        sortDivider.insertAdjacentHTML("afterend", html);
        this._savetasks();
        
    }
    _removetask(element, taskIndex){
        // 1. remove from list
        element.remove();
        
        // 2. remove from array
        this.#tasks.splice(taskIndex,1)

        // 3. remove from map
        this.#markers[taskIndex].remove();

        // 4. remove from marker array
        this.#markers.splice(taskIndex,1)
    }
    _clearAll(){
        localStorage.clear();
        location.reload();
        confMsg.classList.add('msg__hidden');
        
    }

    _getId(e){
        // detect task element on click
        const element = e.target.closest('.task');
        if (element) {
            // get info about the task that was clicked on
            const id = element.dataset.id
            const foundtask = this.#tasks.find(elem => elem.id === id)
            const taskIndex = this.#tasks.indexOf(foundtask);
            return [id,foundtask,taskIndex,element]
        }
        return []
    }
    _updatetaskInfo(e){
        
        const [id,foundtask,_,element] = this._getId(e);
        // if no info, return
        if (!id) return;
        const typeOfInput = e.target.dataset.type;
        const newInputValue = +e.target.value;
        let type;
        foundtask[typeOfInput] = newInputValue;
        // recalculate pace or speed
        if (foundtask.type === 'Project') {
            foundtask.calcPace();
            type = 'pace';
        };
        if (foundtask.type === 'Important') {
            foundtask.calcSpeed();
            type = 'speed';
        }

        element.querySelector(`input[data-type ="${type}"`).value = foundtask[type].toFixed(1);
        // save in local storage (update)
        this._savetasks();

         
    }
    _setIntoView(foundtask){
        this.#map.setView(foundtask.coords, 15);
    }
    _overview(){
         if ((this.#tasks.length === 0)) return;
            
        const latitudes = this.#tasks.map(w => {return w.coords[0]})
        const longitudes = this.#tasks.map(w => {return w.coords[1]})
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLong = Math.min(...longitudes);
        const maxLong= Math.max(...longitudes);
        // fit bounds with coordinates
        this.#map.fitBounds([
            [maxLat, minLong],
            [minLat, maxLong]
        ],{padding:[70,70]});

    }

}

const app = new App();







