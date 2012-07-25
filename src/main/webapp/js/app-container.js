

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
    loadHelloWorldGadget();
  });

  function loadHelloWorldGadget(){
  
    var el = document.getElementById('hello-world-gadget');
    var gadgetSite = CommonContainer.newGadgetSite(el);
    var params = {};
    params[osapi.container.RenderParam.WIDTH] = '100%';
    params[osapi.container.RenderParam.VIEW] = 'default';
    CommonContainer.navigateGadget(gadgetSite, window.location.protocol + "//" + window.location.host +"/osJumpstart/gadgets/HelloWorld.xml", {}, params, function(metadata){
      if(metadata.error) {
        $("#loadingHelloWorld").html("There was an error launching HelloWorld.xml");
        gadgets.error('There was an error launching HelloWorld.xml');
      } else {
        $("#loadingHelloWorld").fadeOut();
        $("#hello-world-gadget").show();
      }
    });
  }
