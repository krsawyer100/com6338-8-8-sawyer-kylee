const head = document.querySelector('head')
const body = document.querySelector('body')

// mocha CSS link
const mochaCSSPath = "https://cdnjs.cloudflare.com/ajax/libs/mocha/8.3.2/mocha.min.css"
const mochaCSSLinkEl = document.createElement('link')
mochaCSSLinkEl.rel = 'stylesheet'
mochaCSSLinkEl.href = mochaCSSPath
head.prepend(mochaCSSLinkEl)

// custom styles for mocha runner
const mochaStyleEl = document.createElement('style')
mochaStyleEl.innerHTML =
  `#mocha {
    font-family: sans-serif;
    position: fixed;
    overflow-y: auto;
    z-index: 1000;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 48px 0 96px;
    background: white;
    color: black;
    display: none;
    margin: 0;
  }
  #mocha * {
    letter-spacing: normal;
    text-align: left;
  }
  #mocha .replay {
    pointer-events: none;
  }
  #mocha-test-btn {
    position: fixed;
    bottom: 50px;
    right: 50px;
    z-index: 1001;
    background-color: #007147;
    border: #009960 2px solid;
    color: white;
    font-size: initial;
    border-radius: 4px;
    padding: 12px 24px;
    transition: 200ms;
    cursor: pointer;
  }
  #mocha-test-btn:hover:not(:disabled) {
    background-color: #009960;
  }
  #mocha-test-btn:disabled {
    background-color: grey;
    border-color: grey;
    cursor: initial;
    opacity: 0.7;
  }`
head.appendChild(mochaStyleEl)

// mocha div
const mochaDiv = document.createElement('div')
mochaDiv.id = 'mocha'
body.appendChild(mochaDiv)

// run tests button
const testBtn = document.createElement('button')
testBtn.textContent = "Loading Tests"
testBtn.id = 'mocha-test-btn'
testBtn.disabled = true
body.appendChild(testBtn)

const scriptPaths = [
  "https://cdnjs.cloudflare.com/ajax/libs/mocha/8.3.2/mocha.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/chai/4.3.4/chai.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/sinon.js/10.0.1/sinon.min.js",
  // "jsdom.js" // npx browserify _jsdom.js --standalone JSDOM -o jsdom.js
]
const scriptTags = scriptPaths.map(path => {
  const scriptTag = document.createElement('script')
  scriptTag.type = 'text/javascript'
  scriptTag.src = path
  return scriptTag
})

let loaded = 0
if (localStorage.getItem('test-run')) {
  // lazy load test dependencies
  scriptTags.forEach(tag => {
    body.appendChild(tag)
    tag.onload = function () {
      if (loaded !== scriptTags.length - 1) {
        loaded++
        return
      }
      testBtn.textContent = 'Run Tests'
      testBtn.disabled = false
      testBtn.onclick = __handleClick
      runTests()
    }
  })
} else {
  testBtn.textContent = 'Run Tests'
  testBtn.disabled = false
  testBtn.onclick = __handleClick
}

function __handleClick() {
  if (!localStorage.getItem('test-run') && this.textContent === 'Run Tests') {
    localStorage.setItem('test-run', true)
  } else {
    localStorage.removeItem('test-run')
  }
  window.location.reload()
}

function runTests() {
  testBtn.textContent = 'Running Tests'
  testBtn.disabled = true
  mochaDiv.style.display = 'block'
  body.style.overflow = 'hidden'

  mocha.setup("bdd");
  const expect = chai.expect;

  describe("Weather App", function () {
    const getLocalTime = sec => new Date(sec * 1000)
      .toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'})
      .toLowerCase()
    const weatherInfo = {
      "coord": {
        "lon": 139.6917,
        "lat": 35.6895
      },
      "weather": [
        {
          "id": 801,
          "main": "Clouds",
          "description": "few clouds",
          "icon": "02d"
        }
      ],
      "base": "stations",
      "main": {
        "temp": 55.42,
        "feels_like": 52.74,
        "temp_min": 50.67,
        "temp_max": 58.59,
        "pressure": 1020,
        "humidity": 44
      },
      "visibility": 10000,
      "wind": {
        "speed": 4.61,
        "deg": 90
      },
      "clouds": {
        "all": 20
      },
      "dt": 1647843122,
      "sys": {
        "type": 2,
        "id": 268395,
        "country": "JP",
        "sunrise": 1647809057,
        "sunset": 1647852769
      },
      "timezone": 32400,
      "id": 1850144,
      "name": "Tokyo",
      "cod": 200
    }

    const getWeatherHTML = () =>
      document.getElementById('weather-app').innerHTML.toLowerCase()

    async function stubWeatherFetch(returnJSON, query, status) {
      const fetchStub = sinon.stub(window, 'fetch')
        .resolves({ json: sinon.stub().resolves(returnJSON), status: status || 200 })
      document.querySelector('input').value = query
      document.querySelector('#weather-app form button').click()
      expect(fetchStub.called).to.be.true
      expect(fetchStub.firstCall.args[0].includes(query)).to.be.true
      await (() => {
        return new Promise(res => {
          setTimeout(res, 0)
        })
      })();
    }

    before(async () => {
      document
        .querySelector('#weather-app form')
        .addEventListener('submit', e => e.preventDefault())
      await stubWeatherFetch(weatherInfo, 'tokyo, jp')
    })

    after(function () {
      sinon.restore()
      testBtn.textContent = 'Close Tests'
      testBtn.disabled = false
    })

    it('should display "Location Not Found" if no location is found', async function () {
      sinon.restore()
      await stubWeatherFetch({ data: { cod: 404 } }, 'askjdnfks', 404)
      expect(getWeatherHTML().includes('location not found')).to.be.true
    })
    it('should clear the input value after searching for weather data', () => {
      expect(document.querySelector('#weather-app input').value).to.eq("")
    })
    it('should not display "Location not found" after entering a valid location', async () => {
      sinon.restore()
      await stubWeatherFetch(weatherInfo, 'tokyo, jp')
      expect(getWeatherHTML().includes('location not found')).to.be.false
    })
    it('should display city', function () {
      const weatherHTML = getWeatherHTML()
      expect(weatherHTML.includes('tokyo')).to.be.true
      expect(weatherHTML.includes('jp')).to.be.true
    })
    it('should display working map link', function () {
      const link = document.querySelector('#weather-app a')
      expect(link).to.exist
      expect(link.textContent.toLowerCase()).to.eq('click to view map')
      expect(link.href).to.eq('https://www.google.com/maps/search/?api=1&query=35.6895,139.6917')
    })
    it('should display condition icon', function () {
      const img = document.querySelector('#weather-app img')
      expect(img).to.exist
      expect(img.src).to.eq('https://openweathermap.org/img/wn/02d@2x.png')
    })
    it('should display condition', function () {
      expect(getWeatherHTML().includes('few clouds')).to.be.true
    })
    it('should display current temp', function () {
      expect(getWeatherHTML().includes('55.42')).to.be.true
    })
    it('should display current "feels like" temp', function () {
      expect(getWeatherHTML().includes('52.74')).to.be.true
    })
    it('should display updated time', function () {
      expect(getWeatherHTML().includes(getLocalTime(weatherInfo.dt))).to.be.true
    })
    it("should not display previous location's weather info after searching for a new location", async () => {
      sinon.restore()
      await stubWeatherFetch({
          "coord": {
              "lon": -157.8583,
              "lat": 21.3069
          },
          "weather": [
              {
                  "main": "Clouds",
                  "description": "broken clouds",
                  "icon": "04n"
              }
          ],
          "main": {
              "temp": 73.67,
              "feels_like": 74.88,
          },
          "dt": 1647845849,
          "sys": {
              "country": "US",
          },
          "id": 5856195,
          "name": "Honolulu",
        }, 'honolulu, us')

      const weatherHTML = getWeatherHTML()
      expect(weatherHTML.includes('tokyo')).to.be.false
      expect(weatherHTML.includes('jp')).to.be.false
      const link = document.querySelector('#weather-app a')
      expect(link).to.exist
      expect(link.textContent.toLowerCase()).to.eq('click to view map')
      expect(link.href).to.not.eq('https://www.google.com/maps/search/?api=1&query=35.6895,-157.8583')
      const img = document.querySelector('#weather-app img')
      expect(img).to.exist
      expect(img.src).to.not.eq('https://openweathermap.org/img/wn/02d@2x.png')
      expect(getWeatherHTML().includes('few clouds')).to.be.false
      expect(getWeatherHTML().includes('55.42')).to.be.false
      expect(getWeatherHTML().includes('52.74')).to.be.false
      expect(getWeatherHTML().includes(getLocalTime(weatherInfo.dt))).to.be.false

      expect(weatherHTML.includes('honolulu')).to.be.true
      expect(weatherHTML.includes('us')).to.be.true
      expect(link.textContent.toLowerCase()).to.eq('click to view map')
      expect(link.href).to.eq('https://www.google.com/maps/search/?api=1&query=21.3069,-157.8583')
      expect(img.src).to.eq('https://openweathermap.org/img/wn/04n@2x.png')
      expect(getWeatherHTML().includes('broken clouds')).to.be.true
      expect(getWeatherHTML().includes('73.67')).to.be.true
      expect(getWeatherHTML().includes('74.88')).to.be.true
      expect(getWeatherHTML().includes(getLocalTime(1647845849))).to.be.true
    })
  });

  mocha.run();
}