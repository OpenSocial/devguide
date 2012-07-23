

function initContext() {
  log("og_ee init");
  
  opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function(key){
      var context = opensocial.data.getDataContext().getDataSet(key);
      
      if(context.url){
        getOpenGraphData(context.url);
        if(gadgets.window.getWidth() > 400){
          gadgets.window.adjustHeight(325);
        } else {
          gadgets.window.adjustHeight(375);
        }
      } else {
        log(context);
        $('fail').fadeIn();
      }
    });
}

function getOpenGraphData(uri){
  
  var req = osapi.http.get({
      href: encodeURI(uri), 
      headers : {
      'Accept' : ['application/json']
      }
    });
  
  req.execute(function(response){
      $('#loading').fadeOut();
      
      if (!response.error){
//        log(response.content);
        
        
        var metas = $(response.content).filter(function(){ 
            return $(this).is('meta'); 
          });
        metas.each(function() {
            if($(this).attr("property") === "og:description"){
              $("#description").append($(this).attr("content"));
            } else if($(this).attr("property") === "og:title"){
              $("#productName").append($(this).attr("content"));
            } else if($(this).attr("property") === "og:image"){
              $("#productImage").attr("src",$(this).attr("content"));
            } else{
//              log($(this).attr("property") + " " + $(this).attr("content"));
            }
        });
//        $('#buyItBtn').attr('href',uri);
        $('#buyItBtn').click(function(event){
          showUrlInContainer(uri);
        });
        $('#success').fadeIn();
        
        
      } else {
        $(".failURI").each(function(){
          $(this).text(uri);
        });
        $('#fail').fadeIn();
      }
      
    });
}


function log(obj){
  if(window.console){
    console.log(obj);
  }
}

function showUrlInContainer(url) {

  gadgets.views.openUrl(url, null, "dialog");
}

gadgets.util.registerOnLoadHandler(initContext);