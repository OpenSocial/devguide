
var ebayAuctionsByUPC = '<?xml version="1.0" encoding="utf-8"?>'+
                        '<FindProductsRequest xmlns="urn:ebay:apis:eBLBaseComponents">'+
                        '<ProductID type="%TYPE%">%ID%</ProductID>'+
                        '<IncludeSelector>Items</IncludeSelector>' + 
                        '<HideDuplicateItems>true</HideDuplicateItems>' +
                        '<AvailableItemsOnly>true</AvailableItemsOnly>' +
                        '<MaxEntries>1</MaxEntries>'+
                        '</FindProductsRequest>';


function getAuctions(type, id, callback){
  
  var req = osapi.http.post({
    href: 'http://open.api.ebay.com/shopping?', 
    headers : {
      'X-EBAY-API-CALL-NAME' : ['FindProducts'],
      'X-EBAY-API-APP-ID' : ['MattMaru-203d-4ed5-b3ee-44fa6f41dc3d'],
      'X-EBAY-API-REQUEST-ENCODING' : ['XML'],
      'X-EBAY-API-VERSION' : ['745'],
      'X-EBAY-API-SITE-ID' : ['0'],
      'Content-Type': ['application/xml']
    },
    body : ebayAuctionsByUPC.replace("%ID%",id).replace("%TYPE%", type)
  });
  
  req.execute(callback);
 
}

function initContext() {
  log("ebay_ee init");
  opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function(key){
      var context = opensocial.data.getDataContext().getDataSet(key);
      var refId = context.url.substring(context.url.lastIndexOf("/")+1);
      if(refId){
        getItemInfo(refId);
        if(gadgets.window.getWidth() > 400){
          gadgets.window.adjustHeight(275);
        } else {
          gadgets.window.adjustHeight(325);
        }
      } else {
        log(context);
        $('#fail').fadeIn();
      }
    });
}

function listAuctions(response){
  log(response);
  if(!response.error){
    var items = $(response.content).find("itemArray").find("item");
    if(items && items.length > 0){
      if(items.length > 6){
        items = items.slice(0,6);
      }
      items.each(function(idx) {
        var isFreeShipping = $(this).find("shippingType").text() === "Free";
        
        $("#auctions").append("<li> <strong>$"+$(this).find("convertedCurrentPrice").text() 
            + "</strong> " + ((isFreeShipping)? " + Free Shipping!" : "") +
            ' - <a style="cursor: pointer;" onclick="showUrlInContainer(\'' + $(this).find("ViewItemURLForNaturalSearch").text() + '\');">' 
            + $(this).find("title").text() + '</a>'+
            "</li>");
      });
    } else {
      $("#auctions").append("<li>No auctions found on eBay</li>");
    }
  } else {
    $("#auctions").append("<li>Could not check eBay</li>");
  }
}

function getItemInfo(reference){
  
  getAuctions("Reference",reference,function(response){
      $('#loading').fadeOut();
      
      if (!response.error){
        $('#success').fadeIn();
        
        $(response.content).find("Product").find("StockPhotoURL").each(function(){
          $("#productImage").attr("src",$(this).text());
        });
        $(response.content).find("Product").find("Title").each(function(){
          $("#productName").append($(this).text());
        });
        listAuctions(response);
        
        
      } else {
        failed(uri);
      }
      
    });
}

function failed(uri){
  $(".failURI").each(function(){
    $(this).text(uri);
  });
  $('#fail').fadeIn();  
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