const _ = require('underscore');
const TTUser = require('./TTUser');
/*
@{
   @"objectIds" : followingObjectIds,
   @"activityObjectIds" : self.objid,
   @"createdDate" : photo.createdAt ? photo.createdAt : dateString,
   @"isRefresh" : [NSString stringWithFormat:@"%@",isRefresh ? @"YES" : @"NO"],
   @"userTrips" : self.userTrips
 };
 */

/**
 * 8/23/2016 - MS
 * In Progress of cleaning up the queryForNewFeed function.
 */

Parse.Cloud.define('Feed.find', function(request, response) {

  const mainPhotos = [];
  const photos = [];
  const subPhotos = [];
  const allPhotos = [];
  const userTrips = [];

  const followees = request.params.objectIds.map(id => {
    return new TTUser(id);
  });


  const photoQuery = new Parse.Query('Activity');
  photoQuery.descending('updatedAt');
  photoQuery.equalTo('type', 'addedPhoto');
  photoQuery.containedIn('fromUser', followees);
  photoQuery.notContainedIn('objectId', request.params.activityObjectIds);
  var createdAt = new Date(request.params.createdDate);
    if(request.params.isRefresh == 'YES'){
        photoQuery.greaterThanOrEqualTo('createdAt',createdAt);
    }else{
        photoQuery.lessThanOrEqualTo('createdAt',createdAt);
    }
  
  photoQuery.include('fromUser');
  photoQuery.include('photo');
  photoQuery.include('trip','trip.publicTripDetail');
  photoQuery.exists('trip');
  photoQuery.exists('fromUser');
  photoQuery.exists('toUser');
    
  photoQuery.limit(200);
    
  photoQuery.find({sessionToken: request.user.getSessionToken()}).then(function(objects) {
    for(var i=0; i<objects.length;i++){
      var object = objects[i];
      var savedTripIndex = containsTripObject(object,mainPhotos);
      if(savedTripIndex == -1){ //not found
        var trip = object.get('trip');
        if(trip){
          if(request.params.isRefresh == 'YES'){
            mainPhotos.push(object); //main photo
                      photos.push(object.get('photo'));
          }else{
            if(!containsObject(trip.id+'.'+object.get('fromUser').id,request.params.userTrips)){
              mainPhotos.push(object); //main photo
                        photos.push(object.get('photo'));
                        userTrips.push(trip.id+'.'+object.get('fromUser').id);
            }
          }
                    
              }
            }
    }
    
    var subQuery = new Parse.Query('Activity');
    subQuery.descending('updatedAt');
    subQuery.equalTo('type', 'addedPhoto');
    subQuery.notContainedIn('photo',photos);
    subQuery.notContainedIn('objectId',request.params.activityObjectIds);
    subQuery.containedIn('fromUser', followees);
    
    subQuery.include('fromUser');
    subQuery.include('photo');
    subQuery.include('trip','trip.publicTripDetail');
    subQuery.exists('trip');
    subQuery.exists('fromUser');
    subQuery.exists('toUser');
    
    subQuery.limit(200);
    
    subQuery.find({sessionToken: request.user.getSessionToken()}).then(function(objects) {
      for(var i=0; i<objects.length;i++){
      var object = objects[i];
          var trip = object.get('trip');
          if(trip){
//                  if(request.params.isRefresh == 'YES'){
            subPhotos.push(object); 
//          }else{
//            if(!containsObject(trip.id+'.'+object.get('fromUser').id,request.params.userTrips)){
//              subPhotos.push(object); 
//                        userTrips.push(trip.id+'.'+object.get('fromUser').id);
//            }
//          }
               }
    }
    
    mainPhotos.sort(date_sort_desc);
    if(request.params.isRefresh == 'YES'){
        subPhotos.sort(date_sort_asc);
     }
        
      allPhotos.push(mainPhotos);
      allPhotos.push(subPhotos);
      allPhotos.push(userTrips);
      response.success(allPhotos);
    
    });
  }, function (error) {
    response.error('Error with queryForNewsFeed or query: '+error.message);
      });
});
