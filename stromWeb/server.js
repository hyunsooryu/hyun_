var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlMaker = require('./urlMaker');
var db = require('./db');
var fs = require('fs');
var getTime = require('./getTime');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

//product
app.get('/p/:type/:prdCd', (req, res)=>{
    res.redirect(302, urlMaker.getPrdUrlAddress(req.params.type, req.params.prdCd));
});
//deal
app.get('/d/:type/:dealNo', (req, res)=>{
    res.redirect(302, urlMaker.getPrdUrlAddress(req.params.type, req.params.dealNo));
});

//mobile
app.get('/m/:prdCd', (req, res)=>{
    res.redirect(302, urlMaker.getPrdUrlAddress(req.params.prdCd));
});

//shortUrl
app.get('/:shortUrl', async (req, res)=>{
    try{
    let _id = req.params.shortUrl;
    let resolvedData = await db.getOriginalUrl(req.params.shortUrl);
      if(resolvedData == null){
          return res.send(new Error("ERROR"));
      }else{
          await db.updateShortUrl(_id); 
          console.log("count, recentlyUsedAt 업데이트");
          return res.redirect(302, resolvedData);
      }
  }catch(err){
      console.log(err);
      return res.send(err);
  }
});  

//HOME
app.get('/', function(req, res){
    fs.readFile("/IDE/nodejs/m-gs/public/index.html", function(error, data){
        if(error)console.log(error);
        else{
            res.writeHead(200, {'Content-Type':'text/html'});
            res.end(data);
        }
    })
});

app.post('/getShortUrl', async (req, res) => {
    let originalUrl = req.body.url;
    console.log("/getShortUrl ->" + originalUrl);
    try {
        let _new = false;
        let _id = await db.isAlreadyExistOriginalUrl(originalUrl); //db에 _id값이 있다면 _id값을 가져오고, 만약 _id값이 없다면 null을 리턴한다. _id -> shortUrl
        if (_id == null) {  //데이터가 없다면
            console.log("등록되어 있지 않은 URL");
            _new = true;
            await db.createShortUrl(originalUrl); // shortUrl을 생성한다.
            _id = await db.isAlreadyExistOriginalUrl(originalUrl); //생성된 _id 값을 가져온다.
            console.log(" -> shortUrl 생성 : " + _id);
        }
        let doc = await db.getInformation(_id);
        console.log("Information : " + doc);
        let returnData = {
            "_id": _id,
            "originalurl": doc.originalurl,
            "count": doc.count,
            "createdLocalTime": getTime.getLocalTimeString(false, doc.created),
            "recentlyUsedLocalTime": getTime.getLocalTimeString(_new, doc.recentlyUsed)
        };
      
   //     await db.updateShortUrl(_id); //값을 업데이트 해준다.
        return res.send(returnData);
    } catch (err) {
        return res.send(err);
    }
});

app.listen(9000, ()=>{
    console.log("URL-SHORTENER NOW LISTENING ON PORT 8080!");
});




