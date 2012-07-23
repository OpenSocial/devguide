

function initContext() {
  log("embedly_ee init");
  opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function(key){
      var context = opensocial.data.getDataContext().getDataSet(key);
      if(context.url){
        gadgets.window.adjustHeight(120);
        getEmbedlyData(context.url);
      } else {
        $('.failURI').text(context.url);
        $('fail').fadeIn();
      }
    });
}

function getEmbedlyData(uri){
  
  $.embedly(uri, {key:'7470c05236da11e1a92e4040d3dc5c07', maxWidth: gadgets.window.getWidth()-40}, function(oembed, dict){
    $("#description").append(oembed.description);
    $("#provider_name").append(oembed.provider_name);
    $("#name").append(oembed.title);
    if(oembed.type === "video"){
      gadgets.window.adjustHeight(gadgets.window.getHeight()+oembed.height+40);
      $("#oembed_html").append(oembed.html);
    } else if(oembed.type === "photo") {
      gadgets.window.adjustHeight(gadgets.window.getHeight()+oembed.height+40);
      $("#oembed_html").append("<img src='"+oembed.url+"' width='"+oembed.width+" height='"+oembed.height+"'/>");
    }
    $('#loading').fadeOut(function(){
      $('#success').fadeIn();
    });
    
  });
  
}


function log(obj){
  if(window.console){
    console.log(obj);
  }
}

gadgets.util.registerOnLoadHandler(initContext);