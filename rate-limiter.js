function rate_limiter(username,pageLimit,page,errorPage,res,client) {
  var key=username+page;
  //If Key has not get expired
  client.exists(key, function(err, reply) {
    if (reply == 1) {
      client.get(key, function(err, reply1) {
        if(reply1>1)
        {
          res.render(page);
          client.decr(key, function(err, reply2) {
            console.log(reply2); 
          });
        }
        else
          res.render(errorPage);
      });
    } 
    else {
      client.hgetall(username, function(err, obj){
        if(pageLimit=='developers')
          var pl=obj.developers;
        else if(pageLimit=='companies')
          var pl=obj.companies;
        else if(pageLimit=='students')
          var pl=obj.students;
        //Set Rate-Limit for particular page and user
        client.set(key, pl);
        //Key will expire after 1 minute
        client.expire(key, 60);
        if(err)
          console.log(err);
        if(pl>0)
          res.render(page);
        else
          res.render(errorPage);
      });
    }
  });
}

module.exports = rate_limiter
