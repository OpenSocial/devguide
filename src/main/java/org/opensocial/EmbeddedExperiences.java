package org.opensocial;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Iterator;
import java.util.Properties;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import org.apache.abdera2.activities.model.ASBase;
import org.apache.abdera2.activities.model.ASBase.ASBuilder;
import org.apache.abdera2.activities.model.Activity.ActivityBuilder;
import org.apache.abdera2.activities.model.objects.EmbeddedExperience;
import org.apache.abdera2.common.iri.IRI;
import org.apache.wink.common.annotations.Workspace;

import twitter4j.HashtagEntity;
import twitter4j.Status;
import twitter4j.URLEntity;


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
  public Object getHashTagConfigAsText(){
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
  public Object getUrlConfigAsText(){
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
  
  public static boolean addUrlMatchedEE(UriInfo uriInfo, Status status, ActivityBuilder activityBuilder) {
	    Properties urlProps = new Properties();
	    try {
	      InputStream is = TwitterProxy.class.getClassLoader().getResourceAsStream("urls.properties");
	      urlProps.load(is);
	    }catch (IOException ex){
	      System.out.println("Could not open urls.properties, skipping.");
	    }
	    Iterator<String> urlIter = urlProps.stringPropertyNames().iterator();
	    while(urlIter.hasNext()){
	    	String urlPattern = urlIter.next();
	    	String gadget = urlProps.getProperty(urlPattern);

	    	URLEntity[] urls = status.getURLEntities();
	    	for (URLEntity urlEntity : urls) {
	    		URL expandedUrl = urlEntity.getExpandedURL();
	    		if(expandedUrl == null){
	    			expandedUrl = urlEntity.getURL();
	    		}
	    		if(expandedUrl == null){
	    			continue;
	    		}
	    		String expanded = expandedUrl.toExternalForm();

	    		if(expanded.contains(urlPattern)){
	    			if(!gadget.startsWith("http")){
	    				gadget = "http://"+uriInfo.getBaseUri().getAuthority() + gadget;
	    			}
	    			activityBuilder.embeddedExperience(EmbeddedExperience.makeEmbeddedExperience()
	    					.gadget(new IRI(gadget))
	    					.context(ASBase.make()
	    							.set("url",expanded)
	    							.set("text",status.getText())
	    							.get())
	    							.get());
	    			return true;
	    		}
	    	}
	    }
	      
	    
	    return false;
	  }
  
  public static boolean addUrlStyleEE(Status status, ActivityBuilder activityBuilder) {
	    URLEntity[] urls = status.getURLEntities();
	    if(urls.length > 0){
	      URLEntity entity = urls[0];
	      URL url = entity.getURL();
	      if(entity.getExpandedURL() != null){
	        url = entity.getExpandedURL();
	      }
	      activityBuilder.embeddedExperience(EmbeddedExperience.makeEmbeddedExperience()
	          .url(url.toExternalForm())
	          .get());
	      return true;
	    }
	    return false;
	  }
  
  public static boolean addHashtagEE(UriInfo uriInfo, Status status, ActivityBuilder activityBuilder) {

	  //Reload EE configuration on each request so that it can be dynamically updated
	  Properties hashtagsProps = new Properties();
	  try {
		  InputStream is = TwitterProxy.class.getClassLoader().getResourceAsStream("hashtags.properties");
		  hashtagsProps.load(is);
	  }catch (IOException ex){
		  System.out.println("Could not open hashtags.properties, skipping.");
	  }

	  Iterator<String> tagIter =  hashtagsProps.stringPropertyNames().iterator();
	  while(tagIter.hasNext()){
		  String hashtag = tagIter.next();
		  String gadget = hashtagsProps.getProperty(hashtag);
		  HashtagEntity[] hashtags = status.getHashtagEntities();
		  for (HashtagEntity hashtagEntity : hashtags) {
			  if(hashtagEntity.getText().toLowerCase().startsWith(hashtag.toLowerCase())){
				  ASBuilder builder = ASBase.make()
						  .set("hashtag",hashtagEntity.getText())
						  .set("text",status.getText());
				  URLEntity[] urls = status.getURLEntities();
				  if(urls.length > 0){ //Grab and set a URL if there is one
					  URLEntity entity = urls[0];
					  URL url = entity.getURL();
					  if(entity.getExpandedURL() != null){
						  url = entity.getExpandedURL();
					  }
					  builder.set("url",url);
				  }
				  if(!gadget.startsWith("http")){
					  gadget = "http://"+uriInfo.getBaseUri().getAuthority() + gadget;
				  }
				  activityBuilder.embeddedExperience(EmbeddedExperience.makeEmbeddedExperience()
						  .gadget(new IRI(gadget))
						  .context(builder.get())
						  .get());
				  return true;

			  }
		  }
	  }
	  return false;
  }

}

