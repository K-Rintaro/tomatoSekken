require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const { WebClient, LogLevel } = require("@slack/web-api");
const request = require("request")

const client = new WebClient(process.env.SLACK_TOKEN, {
  logLevel: LogLevel.DEBUG
});

app.set('port', PORT)
app.use(express.static(path.join(__dirname, 'public')))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.listen(app.get('port'), ()=>{ console.log("Node app is running at localhost:" + app.get('port')); });

app.post('/slacker', (req, res) => {
  const channelId = req.body.to;
  const km = req.body.detail;
  const kiken = req.body.caution;
  const keido = req.body.keido;
  const ido = req.body.ido;
  hue();
  async function hue()  {
    try {
      const result = await client.chat.postMessage({
        channel: channelId,
        text: kiken + "を感知しました。\n感知速度: " + km + "\n緯度: " + ido + "\n経度: " + keido + "\nGoogle Mapで場所を確認: " + `https://www.google.com/maps?q=${ido},${keido}`
      });
      console.log(result);
    }
    catch (error) {
      console.error(error);
    }
  }
})

app.post('/auth', (req, res) => {
  const code = req.body.code

  request({
      url: "https://slack.com/api/oauth.access",
      method: "POST",
      form: {
          client_id: "client_id",
          client_secret: "client_secret",
          code: code,
          redirect_uri: "https://yo-gurutosekken.herokuapp.com/authorize"
      }
  }, (error, response, body) => {
      const param = JSON.parse(body);
      console.log(param);
      const access_token = param['access_token'];

      request("https://slack.com/api/auth.test",{
          method: "POST",
          form: {
              token: access_token
          }
      },(error, response, body) => {
          const user = JSON.parse(body); 
          console.log(user);
          request("https://slack.com/api/users.info ", {
              method: 'POST',
              form: {
                  token: access_token,
                  user: param['user_id']
              }
          }, (error, response, body) => {
              res.send(user);
          })
      })
  })
})

app.post('/', function(req, res) {
    var idoo = req.body.ido;
    var keidoo = req.body.keido;
    fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${idoo}&lon=${keidoo}&appid=${process.env.TOKEN_KEY}`)
    .then(res => res.json())
    .then(json => {
        var otenki = json.weather[0].main
        var otenkidetail = json.weather[0].description
        var hairetsu = [otenki, otenkidetail]
        res.send(hairetsu);
    });
})
