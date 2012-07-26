

function loadContainer() {
  //TODO: Dynamically load container
    if(!CommonContainer){
      CommonContainer = constructContainer();
      changeToken();
      fetchAS();
    }
;
}

$(function() {
   $(".tabs").tabs();
   $(".pills").tabs();
   $('#screenName').bind('change',function(){
     clearStreams();
     fetchAS();
   });
   $("#ee_hashtags").load("rest/ee/hashtags");
   $("#ee_urls").load("rest/ee/urls");
});



//When the document is ready kick off the request so we can render the activity stream
$(document).ready(function() {
  loadContainer();
  //auto refresh the stream 
//  setInterval(function () {
//	  fetchAS();
//	}, 5000);
});



function fetchAS(){
//  osapi.activitystreams.get({userId: 'john.doe'}).execute(function(response){
//    renderAS(response);
//  });
  var name = "";
  if($('#screenName').val()){
    name = $('#screenName').val();
  }

  $.get('rest/timeline?screen_name='+name, function(dataResponse){
    
  }).success(function(dataResponse){
    renderAS(dataResponse);
  }).error(function(dataResponse){
    log("Error: " + dataResponse);
  });
    
}


var CommonContainer;

function constructContainer(){

  var testConfig = testConfig || {};
  testConfig[osapi.container.ContainerConfig.RENDER_DEBUG] = true;
  testConfig[osapi.container.ContainerConfig.RENDER_TEST] = true;
  
  //Initiate the common container code and register any RPC listeners for embedded experiences
  var myCommonContainer = new osapi.container.Container(testConfig);
  myCommonContainer.init = new function() {
  	
    myCommonContainer.views.createElementForUrl = function(opt_viewTarget) {
  	   if(opt_viewTarget === 'dialog'){
  	     $("#containerDialog").dialog("destroy");
  	     $("#containerDialog").dialog({
  	       draggable: true, 
  	       closeOnEscape: true, 
  	       resizable: true,  
  	       autoOpen: false, 
  	       height: 600, 
  	       width: 800,
  	       buttons: { "Ok": function() { $(this).dialog("close"); }}
  	     });
  	     $("#containerDialog").dialog('open');
  	     return document.getElementById('containerDialog');
  	   } else {
  	     log("Page only supports opening URL in dialog");
  	     return null;
  	   }
  	  };
  
  	  myCommonContainer.views.destroyElement = function(site) {
  	    myCommonContainer.ee.close(site);
  	};
  	
  	if (myCommonContainer.actions) {
  	  log("using container actions");
      // Called when an action should be displayed in the container
  	  myCommonContainer.actions.registerShowActionsHandler(showActions);
  
      // Called when a action should be removed from the container
      myCommonContainer.actions.registerHideActionsHandler(hideActions);
      
      // Called for actions contributed by pre-loaded gadgets (lazy load)
      myCommonContainer.actions.registerNavigateGadgetHandler(preRenderGadget);
  
  	}
  };
  return myCommonContainer;
}

function preRenderGadget(gadgetUrl, opt_params){
  log("preRenderGadget call...");
  log(gadgetUrl);
  log(opt_params);
}

/**
 * Displays the set of actions within the container
 * @returns
 */
function showActions(actions){
  log("Adding actions..");
  log(actions);
}

/**
 * Removes the set of actions within the container
 * @param actions
 */
function hideActions(actions){
  log("Removing actions..");
  log(actions);
}

/**
 * Renders the activity stream on the page
 * @param stream the activity stream json.
 * @return void.
 */
function renderAS(stream) {
  $("span[newactivity]").each(function(){
      $(this).remove();
  });
  if(stream.list){
    jQuery.each(stream.list.reverse(), createFullActivityEntry);
  } else if(stream.content){
    jQuery.each(stream.content.reverse(), createFullActivityEntry);
  } else if(stream){
    jQuery.each(stream.reverse(), createFullActivityEntry);
  }
}

function log(obj){
  if(window.console){
    console.log(obj);
  }
}

/**
 * Called when an embedded experience needs to be loaded
 * @param id of the ui element where the embedded experience needs to be surfaced
 * @param embed is the ee details that will be based once rendered
 * @return void.
 */
function onLaunch(id) {
  if($('#useModal:checked').val()){
    renderModalEE(id);
  } else {
    renderInlineEE(id);
  }
}

function renderModalEE(id){
  var rendered = $('#as_'+id).data("rendered");
  if(!rendered){
    $('#modalEETitle').text($('#title_'+id).text());
    openEE(id, "modalEEiframe");
    $('#modalEE').bind('hidden', function () {
      closeEE(id);
    });
    $('#modalEE').modal('show');
  } else {
    $('#modalEE').modal('hide');
  }
  
}

function renderInlineEE(id){
  var rendered = $('#as_'+id).data("rendered");
  if(!rendered){
    $( '#eeShow_'+id ).show('slow', function(){
      openEE(id, "eeShow_"+id);
    });
  } else {
    $( '#eeShow_'+id ).hide('slow');
    closeEE(id);
    $( '#eeShow_'+id ).empty();
  }
}

function openEE(id, eeElementId){
  var eeElement = document.getElementById(eeElementId);
//  var embed = $('#as_'+id).data("embedData");
  var gadget = $('#as_'+id).find('meta[itemprop="gadget"]').first().attr("content");
  var jsonContext = unescape($('#as_'+id).find('meta[itemprop="context"]').first().attr("content"));
  var context = gadgets.json.parse(jsonContext);
  var url = $('#as_'+id).find('meta[itemprop="url"]').first().attr("content");
  var embed = new Object();
  embed.gadget = gadget;
  embed.context = context;
  embed.url = url;
  var params = new Object();
  if(embed.gadget){
    params[osapi.container.ee.RenderParam.GADGET_RENDER_PARAMS] = {
        'height' : $('#'+eeElementId).height(),
        'width' : $('#'+eeElementId).width(),
        'view' : "embedded"
    };
  } else {
    params[osapi.container.ee.RenderParam.URL_RENDER_PARAMS] = {
        'height' : 600,
        'width' : $('#'+eeElementId).width()
    };
  }
  
  var currentEESite = CommonContainer.ee.navigate(eeElement, embed, params, 
      function(site, metaData) {
        if(metaData.error){
          log("Error opening ee"+id+" - HttpStatus: "  +metaData.status);
          log(metaData.error);
          $( '#eeShow_'+id ).hide('slow');
          $( '#eeShow_'+id ).empty();
        } else {
          $('#as_'+id).data("rendered",true);
          $('#as_'+id).data("eeSite",currentEESite);
        }
      });
}

function closeEE(id){
  var currentEESite = $('#as_'+id).data("eeSite");
  CommonContainer.ee.close(currentEESite);
  $('#as_'+id).data("rendered",false);
}

function include(arr,obj) {
  if(arr.indexOf){
    return (arr.indexOf(obj) != -1);
  }
  for(var i=0; i<arr.length; i++) {
      if (arr[i] == obj) return true;
  }
  return false;
}

//Allows extensions to change how the Activity Stream entry HTML is generated 
var activityEntryMutatorCallback = $.Callbacks();

var activityIds = new Array();
/**
 * Called for each activity entry and adds the necessary HTML to the page.
 * @param i the item in the activity stream we are currently rendering.
 * @param entry the activity stream entry json.
 * @return void.
 */
function createFullActivityEntry(idx, entry) {
  if(!include(activityIds,entry.id)){
    activityIds.push(entry.id);
  } else {
    return; //Skip creating activity if it already exists
  }
  var i = entry.id;
  
  var asTemplate = '<div id="as_" class="activity-entry inner" itemscope itemtype="http://schema.org/Intangible/OpenSocialActivity">'+ 
  '<h3 id="header_as_"><strong itemprop="name" id="title_">%TITLE%</strong> <span id="new_as_" class="label label-success" newactivity>NEW</span></h3>'+
  '<div itemprop="description">%CONTENT%</div> ' +
  '<small><em>%ACTOR%</em> %SOURCE%</small> ' +
  '<div class="entry-timestamp">%TIMESTAMP%</div>' +
  '<div class="embeddedexperience hide" id="eeShow_"/>' +
  '</div>';
	
	 var asEntry= asTemplate;
   activityEntryMutatorCallback.fire(entry);
   
   asEntry = asEntry.replace(/(as_)/g, '$1' +i);
   asEntry = asEntry.replace(/(title_)/g, '$1' +i);
   asEntry = asEntry.replace(/(eeShow_)/g, '$1' +i);
  
  
  if (entry.title){
	  asEntry = asEntry.replace(/(\%TITLE\%)/g, entry.title);
    if(entry.content){
      asEntry = asEntry.replace(/(\%CONTENT\%)/g, entry.content);
    } else {
      asEntry = asEntry.replace(/(\%CONTENT\%)/g, "");
    }
	} else {
	  if(entry.content){
	    asEntry = asEntry.replace(/(\%TITLE\%)/g, entry.content);
	  } else {
	    asEntry = asEntry.replace(/(\%TITLE\%)/g, "Activity Entry: " + entry.id);
	  }
	  asEntry = asEntry.replace(/(\%CONTENT\%)/g, "");
	}
	
	if(entry.published){
	  asEntry = asEntry.replace(/(\%TIMESTAMP\%)/g, entry.published);
	} else {
	  asEntry = asEntry.replace(/(\%TIMESTAMP\%)/g, "");
	}
	
  if(entry.actor){
    var actorName = "";
    if(entry.actor.displayName){
      actorName = entry.actor.displayName;
    }else if (entry.actor.id) {
      actorName = entry.actor.id;
    } else {
      actorName = "Anonymous";
    }
    var actorImg = "";
    if(entry.actor.image){
      actorImg = "<img itemprop='image' class='avatar-icon' src='" + entry.actor.image.url + "'/>";
    } else {
      actorImg = "<img class='avatar-icon' src='/samplecontainer/examples/nophoto.gif'/>";
    }
    asEntry = asEntry.replace(/(\%ACTOR\%)/g, actorImg + actorName);
  } else {
    asEntry = asEntry.replace(/(\%ACTOR\%)/g, "<img class='avatar-icon' src='/samplecontainer/examples/nophoto.gif'/> Anonymous");
  }
  if(entry.source){
    var source = "";
    if(entry.source.displayName){
      var source = "&mdash; " + entry.source.displayName;
    }
    asEntry = asEntry.replace(/(\%SOURCE\%)/g, source);
  } else {
    asEntry = asEntry.replace(/(\%SOURCE\%)/g, "");
  }
  

	
   //Switch out broken avatar icons
   $('#as_'+i).find(".avatar-icon").error(function(){
    
     log("Bad avatar for "+ actorName + " - " + $(this).attr('src'));
     if($(this).attr('src') != '/samplecontainer/examples/nophoto.gif'){
       $(this).attr('src', '/samplecontainer/examples/nophoto.gif');
     } else {
       $(this).hide();
     }
   });
   var actionReq = entry.actionRequired || (entry.openSocial && entry.openSocial.embed && entry.openSocial.embed.actionRequired);

   $('#stream').prepend($(asEntry));

   
   if(actionReq){
     $('#as_'+i).addClass("actionRequired");
   }
   $('#new_as_'+i).fadeOut(4500,function(){
     $(this).remove();
   });
   
   createEmbeddedExperience(entry, i);

}




function buildTimestamp(now){
  var ts = "";
  ts = now.getUTCFullYear()+"-";
  if((now.getMonth()+1)<9){
    ts = ts+"0";
  }
  ts = ts+(now.getUTCMonth()+1)+"-";
  if(now.getDate()<10){
    ts = ts+"0";
  }
  ts = ts + now.getUTCDate()+ "T";
  if(now.getHours()<10){
    ts = ts + "0";
  }
  ts = ts + now.getUTCHours()+":";
  if(now.getMinutes()<10){
    ts = ts + "0";
  }
  ts = ts + now.getUTCMinutes()+":";
  if(now.getSeconds()<10){
    ts = ts + "0";
  }
  ts = ts + now.getUTCSeconds()+"Z";
  return ts;
}


function clearStreams(){
  activityIds = new Array(); //Clear list of rendered activities
  $("#liveStreams").find(".activity-entry").each(function(){ //Remove all activity entries from HTML
    $(this).remove();
  });
}

var eeEmbedCallback = $.Callbacks();

/**
 * Create activity stream specific content for Embedded Experience
 * @return void.
 */
function createEmbeddedExperience(entry, i){
  var extensions = entry.openSocial;
  if (extensions) {
    var embed = extensions.embed;
    if (embed) {  //Altering context to append in our User ID from the page
      
      eeEmbedCallback.fire(embed);

      $('#as_'+i).data("rendered", false);
      if(embed.gadget){
        $('#as_'+i).append('<meta itemprop="gadget" content="'+embed.gadget+'" />');
        $('#as_'+i).append("<meta itemprop='context' content='"+escape(gadgets.json.stringify(embed.context))+"' />");
      }
      if(embed.url){
        $('#as_'+i).append('<meta itemprop="url" content="'+embed.url+'" />');
      }
      $('#as_'+i).hover(
          function() {
            $('#header_as_'+i).append("<span id='eeHint' title='Click activity to expand' style='float: right; font-size: 36px;'>&raquo;</span>");
            $('#eeHint').tooltip({'placement' : 'right', 'offset': 10});
          }, 
          function () {
            $('#header_as_'+i).find("span:last").remove();
          }
      );
      $('#as_'+i).click(function(e){
        if (!e) var e = window.event;
        if(e.target.tagName != "A"){ //If not selecting a hyperlink, expand EE
          onLaunch(i);
        }
      });
    };
  }
}


function changeToken(){
  var userId = 'john.doe'+new Date().getTime();
  shindig.auth.updateSecurityToken(generateSecureToken(userId,userId));
  var st = shindig.auth.getSecurityToken();
  
}

function generateSecureToken(ownerId, viewerId) {
  // TODO: Use a less silly mechanism to generate security tokens

  var fields = [ownerId, viewerId, "*", 'shindig', "*", '0', 'default', new Date().getTime()];
  for (var i = 0; i < fields.length; i++) {
    // escape each field individually, for metachars in URL
    fields[i] = escape(fields[i]);
  }
  return fields.join(':');
}

