var express = require('express');
var router = express.Router();
var request = require('request');
const NodeCache = require( "node-cache" );
var api = require("./public/config/api.json");
var currency = require("./public/config/currency.json");
var limit = require("./public/config/limit.json");

var tickerURL = api.coinmarketcap.base + api.coinmarketcap.ticker;
var globalURL = api.coinmarketcap.base + api.coinmarketcap.global;
var coinCapURL = api.coincap.base;
var history = {
    'one_day': api.coincap.history_1day,
    'seven_day': api.coincap.history_7day,
    'thirty_day': api.coincap.history_30day,
    'ninety_day': api.coincap.history_90day
};

const cache = new NodeCache({ stdTTL: 600} );

//Middle ware that is specific to this router
// router.use(function timeLog(req, res, next) {
//     console.log('Time: ', Date.now());
//     next();
// });

//Home
router.get('/', function (req, res) {
    render = true;
    var tickers;
    if(cache.get("tickers")) {
        console.log("cached");
        tickers = cache.get("tickers");
        res.render('home', {
            title : 'Crypto List',
            tickers : tickers
        })
    }
    else {
        request.get({ url: tickerURL+"?limit=0"},
            function(error, response, body) {
                console.log("caching....");
                cache.set('tickers', body);
                setTickerBasicInfoCache();
                tickers = body;
                res.render('home', {
                    title : 'Crypto List',
                    tickers : tickers
                })
            });
    }

});

router.get('/details/', function (req, res) {
    var name = req.query.value;
    var tickers;
    if(cache.get("ticker_basic_info")) {
        console.log("cached ticker");
        tickers = cache.get("ticker_basic_info");
    }
    else {
        request.get({ url: tickerURL+"?limit=0"},
            function(error, response, body) {
                tickers = JSON.parse(body);
                console.log("caching in details...");
                cache.set('tickers', body);
                setTickerBasicInfoCache();
        });
    }
    var id, title;
    if(tickers) {
        for(var i = 0; i < tickers.length; i++) {
            if(tickers[i]['name'] === name) {
                id = tickers[i]['id'];
                title = tickers[i]['name']
            }
        }
    }
    else {
        id = name.replace(/ /g,'').toLowerCase();
    }

    request.get({ url: tickerURL+"/"+id},
        function(error, response, body) {
            res.render('currency-detail', {
                title : title,
                details : body,
                display : JSON.parse(body)
            })
        });
});

router.get('/currency/history/', function (req, res) {
    var symbol = req.query.value;
    var day = req.query.day ? req.query.day : 'seven_day';
    var coincapHistoryURL = coinCapURL + history[day];
    console.log("calling : " + coincapHistoryURL);
    request.get({ url: coincapHistoryURL+"/"+symbol},
        function(error, response, body) {
            res.send(body);
        });
});

function setTickerBasicInfoCache() {
    var tickers = JSON.parse(cache.get("tickers"));
    var tickerArray = [];
    for(var i = 0; i < tickers.length; i++) {
        tickerArray.push({
            'id' : tickers[i]['id'],
            'name' : tickers[i]['name'],
            'symbol' : tickers[i]['symbol']
        });
    }
    cache.set('ticker_basic_info', tickerArray, 5184000);
}

router.get('/cache', function (req, res) {
   res.send(cache.get("tickers"));
});


module.exports = router;