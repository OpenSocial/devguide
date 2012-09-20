package org.opensocial;
/**

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.Iterator;
import java.util.Properties;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.apache.abdera2.activities.model.ASObject;
import org.apache.abdera2.activities.model.Activity;
import org.apache.abdera2.activities.model.Activity.ActivityBuilder;
import org.apache.abdera2.activities.model.MediaLink;
import org.apache.abdera2.activities.model.Verb;
import org.apache.abdera2.activities.model.objects.PersonObject;
import org.apache.wink.common.annotations.Workspace;
import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONObject;

import twitter4j.ResponseList;
import twitter4j.Status;
import twitter4j.Twitter;
import twitter4j.TwitterFactory;
import twitter4j.conf.ConfigurationBuilder;

/**
 * Proxy that reads a Twitter user's timeline (or from the public timeline if no user given) and 
 * returns those tweets in the form of an Activity Stream.  It will also add some custom OpenSocial 
 * embedded experiences depending on the content within the tweet.  Gadget embedded experiences can be configured
 * using the hashtags.properties and urls.properties files.
 * 
 * OAuth configuration for accessing Twitter APIs is located in TwitterProxy.properties
 * 
 * An HTTP GET with the "screen_name" parameter returns activities for the specified screen name.
 * An HTTP GET without any parameters returns activities from the public timeline.
 * 
 * For example, /twitterProxy/rest/timeline?screen_name=joeschmoe_dev
 * would return the last 20 activities for 'joeschmoe_dev'
 * 
 * @author mgmarum
 *
 */
@Path("timeline")
@Workspace(workspaceTitle = "Twitter ActivityStream Proxy", collectionTitle = "activities")
public class TwitterProxy {
  
  
  protected TwitterFactory tf = null;
  protected Twitter twitter = null;
  
  public TwitterProxy(){
    ConfigurationBuilder cb = new ConfigurationBuilder();
    
    Properties props = new Properties();
    try {
      InputStream is = TwitterProxy.class.getClassLoader().getResourceAsStream("TwitterProxy.properties");
      props.load(is);
      cb.setDebugEnabled(true)
      .setOAuthConsumerKey(props.getProperty("oauth_key"))
      .setOAuthConsumerSecret(props.getProperty("oauth_secret"))
      .setOAuthAccessToken(props.getProperty("oauth_access_token"))
      .setOAuthAccessTokenSecret(props.getProperty("oauth_access_token_secret")); 
    } catch (IOException e) {
      e.printStackTrace();
    }
    tf = new TwitterFactory(cb.build());
    twitter = tf.getInstance();
  }
  
  @Context protected UriInfo uriInfo = null;
  
  /**
   * Called on HTTP GET
   * Returns last 20 tweets from the user using "screen_name".
   * If screenName is null or an empty string, we return the last 20 tweets from the public
   * timeline
   * @param screenName
   * @return JSON Response a ActivityStream Activity collection for the set tweets
   */
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Object getTweets(@QueryParam("screen_name") String screenName){
    
    
    JSONArray resultArray = new JSONArray();
    ResponseList<Status> list = null;
    try {
      if(screenName == null || screenName.equals("")){
        list = twitter.getHomeTimeline();
      } else {
        list = twitter.getUserTimeline(screenName);
      }
      
      
      System.out.println("Rate limit: " + list.getRateLimitStatus().getRemainingHits());
      Iterator<Status> iter = list.iterator();
      while(iter.hasNext()){
        Status status = iter.next();
        
        ActivityBuilder activityBuilder = Activity.makeActivity()
          .id(Long.toString(status.getId()))
          .verb(Verb.POST)
          .published(new DateTime(status.getCreatedAt().getTime()))
          .source(ASObject.makeObject(ASObject.SOURCE).displayName(status.getSource()))
          .author(
              PersonObject.makePerson(status.getUser().getScreenName())
                .id(Long.toString(status.getUser().getId()))
                .image(MediaLink.makeMediaLink(status.getUser().getProfileImageURL().toExternalForm())).get());

        boolean eeAdded = false;
        eeAdded = EmbeddedExperiences.addHashtagEE(uriInfo, status, activityBuilder);
        
        
        if(!eeAdded){
          eeAdded = EmbeddedExperiences.addUrlMatchedEE(uriInfo, status, activityBuilder);
        }
        
        if(!eeAdded){
          eeAdded = EmbeddedExperiences.addUrlStyleEE(status, activityBuilder);
        }
        
        activityBuilder.content(status.getText());
        Activity activity = activityBuilder.get();
        StringWriter swriter = new StringWriter();
        activity.writeTo(swriter);
        JSONObject jobj = new JSONObject(swriter.toString());
        
        resultArray.put(jobj);
      }
      return resultArray;
    } catch (Exception e) {
      e.printStackTrace();
      return Response.serverError().entity(e).build();
    }
  }
  

  

  


}
