package org.opensocial;

import org.apache.wink.common.annotations.Workspace;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;


/**
 * TODO:  Change this so that the configuration can be modified at runtime, preferably from a web UI
 * inside the osJumpstart container.
 * 
 * @author mgmarum
 *
 */
@Path("ee")
@Workspace(workspaceTitle = "ActivityStream EE configuration", collectionTitle = "embedded experiences")
public class EmbeddedExperiences {
  
  @Path("hashtags")
  @GET
  @Produces(MediaType.TEXT_PLAIN)
  public Object getHashTagConfig(){
    try {
      InputStream is = TwitterProxy.class.getClassLoader().getResourceAsStream("hashtags.properties");
      InputStreamReader reader = new InputStreamReader(is);
      BufferedReader br = new BufferedReader(reader);
      StringBuffer buff = new StringBuffer();
      String line = null;
      while((line = br.readLine()) != null){
        buff.append(line);
        buff.append('\n');
      }
      return buff.toString();
    }catch (IOException ex){
      System.out.println("Could not open hashtags.properties, skipping.");
    }
    return "";
  }
  
  @Path("urls")
  @GET
  @Produces(MediaType.TEXT_PLAIN)
  public Object getUrlConfig(){
    try {
      InputStream is = TwitterProxy.class.getClassLoader().getResourceAsStream("urls.properties");
      InputStreamReader reader = new InputStreamReader(is);
      BufferedReader br = new BufferedReader(reader);
      StringBuffer buff = new StringBuffer();
      String line = null;
      while((line = br.readLine()) != null){
        buff.append(line);
        buff.append('\n');
      }
      return buff.toString();
    }catch (IOException ex){
      System.out.println("Could not open urls.properties, skipping.");
    }
    return "";
  }

}
