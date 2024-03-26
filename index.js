//Grabbing HTML elements
var form = document.querySelector('form:first-of-type')
var weatherSection = document.getElementById('weather')

//Fetch website
var weatherURL = "https://api.openweathermap.org/data/2.5/weather/?units=imperial&appid=f11e5038feccf0030bec41086ba452c4&q="

form.onsubmit = function(e) {
    //Prevent default form function
    e.preventDefault()
    // //Grab user input
    var searchTerm = form.search.value.trim()
    //Check for a user input
    if(!searchTerm) return
    //reset form
    form.search.value = ""
    //fetch API information
    fetch(weatherURL + searchTerm)
    //transform to json
    .then(function(res) {
       //Display error if no location found
        if (res.status !== 200) {
            throw new Error('Location Not Found')
        }
        return res.json()
    })
    //display weather information
    .then(renderWeather)
    //catch errors
    .catch(function(err) {
        weatherSection.innerHTML = err.message
    })
}

//function for displaying weather information
function renderWeather (data) {
    //reset weather information section
    weatherSection.innerHTML = ""

    //display city and country code (h2)
    var location = document.createElement('h2')
    location.textContent = data.name + ', ' + data.sys.country
    weatherSection.appendChild(location)

    //display a google maps link (a)
    var mapsLink = document.createElement('a')
    mapsLink.href = "https://www.google.com/maps/search/?api=1&query=" + data.coord.lat + ',' + data.coord.lon
    mapsLink.textContent = "Click to view map"
    mapsLink.target = "__BLANK"
    weatherSection.appendChild(mapsLink)

    //display weather icon of current weather condition (img)
    var weatherIcon = document.createElement('img')
    weatherIcon.src = "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png"
    weatherIcon.alt = data.weather[0].main
    weatherSection.appendChild(weatherIcon)

    //display current weather condition (p)
    var currentWeather = document.createElement('p')
    currentWeather.textContent = data.weather[0].description
    currentWeather.style.textTransform = "capitalize"
    weatherSection.appendChild(currentWeather)
    weatherSection.appendChild(document.createElement('br'))

    //display actual temperature (p)
    var actualTemp = document.createElement('p')
    actualTemp.textContent = "Current: " + data.main.temp + "\u00B0 F"
    weatherSection.appendChild(actualTemp)

    //display perceived temperature (p)
    var perceivedTemp = document.createElement('p')
    perceivedTemp.textContent = "Feels like: " + data.main.feels_like + "\u00B0 F"
    weatherSection.appendChild(perceivedTemp)
    weatherSection.appendChild(document.createElement('br'))

    //display time info was last updated (p)
    var lastUpdated = document.createElement('p')
    var date = new Date (data.dt * 1000)
    var timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    })
    lastUpdated.textContent = "Last updated: " + timeString
    weatherSection.appendChild(lastUpdated)
}