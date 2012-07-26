

  var testConfig = testConfig || {};
  testConfig[osapi.container.ContainerConfig.RENDER_DEBUG] = true;
  testConfig[osapi.container.ContainerConfig.RENDER_TEST] = true;
  testConfig[osapi.container.ContainerConfig.ALLOW_DEFAULT_VIEW] = true;
  
  //Initiate the common container code and register any RPC listeners for embedded experiences
  var CommonContainer = new osapi.container.Container(testConfig);
  CommonContainer.init = new function() {
    
    //init
  };
  
  
  $(document).ready(function() {
    loadHelloWorldXML();
    loadHelloWorldGadget();
  });
  
  function loadHelloWorldXML(){

    $.get(getHelloWorldGadgetURL(),
        function(data){
          
          
          var escaped = data;
          var findReplace = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]]
          for(var item in findReplace) {
               escaped = escaped.replace(findReplace[item[0]], findReplace[item[1]]);
          }
          $("#hello-world-xml").find("pre").text(escaped);
          $("#loadingHelloWorldXML").fadeOut(function(){
            $("#hello-world-xml").show();
          });
        }, "text");
    
  }

  function loadHelloWorldGadget(){
  
    var el = document.getElementById('hello-world-gadget-site');
    var gadgetSite = CommonContainer.newGadgetSite(el);
    var params = {};
    params[osapi.container.RenderParam.WIDTH] = '100%';
    params[osapi.container.RenderParam.VIEW] = 'default';
    CommonContainer.navigateGadget(gadgetSite, getHelloWorldGadgetURL(), {}, params, function(metadata){
      if(metadata.error) {
        $("#loadingHelloWorld").html("There was an error launching HelloWorld.xml");
        gadgets.error('There was an error launching HelloWorld.xml');
      } else {
        $("#hello-world-gadget").find("strong").html(metadata.modulePrefs.title);
        $("#loadingHelloWorldGadget").fadeOut(function(){
          $("#hello-world-gadget").show();
        });
        
      }
    });
  }
  
  function getHelloWorldGadgetURL(){
    return window.location.protocol + "//" + window.location.host +"/osJumpstart/gadgets/HelloWorld.xml";
  }
