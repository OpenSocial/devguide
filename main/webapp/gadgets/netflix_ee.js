function handleODataResponse(odataJson){

  var id = gadgets.util.escapeString(odataJson.d.results[0].__metadata.uri);
  var movie = odataJson.d.results[0];
  log(movie);
  if(movie.__metadata.type == "Netflix.Catalog.v2.Title"){
      $("#movieName").append(movie.Name);
      $("#synopsis").append(movie.Synopsis);
      $("#yearReleased").append(movie.ReleaseYear);
      $("#boxArt").attr("src",movie.BoxArt.MediumUrl);
      if(movie.Genres){
        $.each(movie.Genres.results, function(idx){

          var genre = movie.Genres.results[idx];
          var genreid = gadgets.util.escapeString(genre.__metadata.uri);
          $("#genresSpan").append('<span id="'+id+'_'+genreid+' class="span"><a class="tag" href="'+genre.Titles.__deferred.uri+'" target="_blank">'+genre.Name+'</a></span>');
        });
        $("#genresSection").show();
      }
      if(movie.Instant && movie.Instant.Available){
        $("#actionsSpan").append('<span id="'+id+'_instant_action" class="span action"><a class="btn btn-primary">Instantly</a></span>');
      }
      if(movie.Dvd && movie.Dvd.Available){
        $("#actionsSpan").append('<span id="'+id+'_dvd_action" class="span action"><a class="btn btn-primary">DVD</a></span>');
      }
      if(movie.BlueRay && movie.BlueRay.Available){
        $("#actionsSpan").append('<span id="'+id+'_blueray_action" class="span action"><a class="btn btn-primary">BlueRay</a></span>');
      }
      $(".btn-primary").click(function(event){
        showUrlInContainer(movie.Url);
      });
      $("#actionsSpan").show();
  }
}

function getODataJSON(uri){
  uri = encodeURI(uri);
  var req = osapi.http.get({
    href: uri, 
    format: 'json', 
    headers : {
    'Accept' : ['application/json']
    }
  });
  
  req.execute(function(dataResponse){
    $("#loading").fadeOut(function(){
      $(this).remove();
      $(".odataURI").each(function(){
        $(this).text(uri);
      });
      if (!dataResponse.error && dataResponse.content.d) {
        var odataJson = dataResponse.content;
        if(!odataJson.d.results || !odataJson.d.results[0]){
          $('#odataMovieMissing').fadeIn();
        } else {
          handleODataResponse(odataJson);
          $("#success").fadeIn();
        }
      } else {
        log(dataResponse.error);
        $("#odataFail").fadeIn();
      }
    });

  });
  
  
}

function initContext() {
  log("netflix_ee init");
  opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function(key){
      var context = opensocial.data.getDataContext().getDataSet(key);
      log(context);
      var movie;
      if(typeof context === 'string'){
        movie = context;
      } else {
        var start = context.text.indexOf('"');
        if(start > -1){
          var end = context.text.substring(start+1).indexOf('"');
          movie = context.text.substring(start+1,start+1+end);
        } else {
          movie = "";
        }
        
      }
      log(movie);
      var uri = "http://odata.netflix.com/Catalog/Titles?$filter=ShortName eq '"+movie+"'&$expand=Genres";
      getODataJSON(uri);
      if(gadgets.window.getWidth() > 400){
        gadgets.window.adjustHeight(325);
      } else {
        gadgets.window.adjustHeight(375);
      }
      
    });
}

function showUrlInContainer(url) {

  gadgets.views.openUrl(url, null, "dialog");
}


function log(obj){
  if(window.console){
    console.log(obj);
  }
}

gadgets.util.registerOnLoadHandler(initContext);