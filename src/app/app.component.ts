import { Component, AfterViewInit, OnInit, NgZone } from '@angular/core';
import { Auth, User } from './shared';
// import { HTTP_PROVIDERS } from '@angular/http';
import { AUTH_PROVIDERS } from 'angular2-jwt';
import { Config } from './shared';
import * as Rx from 'rxjs/Rx';

declare const FB;
declare const google;
declare const io;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [Auth, User, AUTH_PROVIDERS]
})
export class AppComponent {
  
  private map: any;
  private loggedIn = false;
  private mapLoaded = false;
  private currentUser: any = {};
  private visibleUsers: Array<any> = [];
  private authStream: Rx.Observable<{}> = new Rx.Observable<{}>();
  private authResponseStream: any;
  private userStream: Rx.Observable<{}> = new Rx.Observable<{}>();
  private userResponseStream: any;
  private visibleUsersStream: Rx.Observable<{}> = new Rx.Observable<{}>();
  private visibleUsersResponseStream: any;
  private updatedPositionStream: Rx.Observable<{}> = new Rx.Observable<{}>();
  private updatedPositionResponseStream: any;
  private socket: any;

  private email: string;
  private password: string;
  
  constructor(private auth: Auth, private user: User, private zone: NgZone) {
    FB.init({
      appId: '1747282712157347',
      cookie: false,  // enable cookies to allow the server to access
      // the session
      xfbml: true,  // parse social plugins on this page
      version: 'v2.6' // use graph api version 2.5
    });
  }

  facebookLogin() {
    FB.login(response => {
      this.statusChangeCallback(response);
    });
  }

  login() {
    console.log(this.email, this.password);
    this.auth.login(this.email, this.password).then(
      res => {
        this.loggedIn = true;
        this.currentUser = res.user;
        this.socketAuth(res.token);
      }
    );
  }

  register() {

  }

  updateVisibleUsers() {
    console.log('updateVisibleUsers', this.visibleUsers);
    this.visibleUsers.forEach(user => {
      //console.log(user.id, this.currentUser.id);
      //if (user.id !== this.currentUser.id && user.lastKnownPosition) {
      if (user.lastKnownPosition) {
        let position = new google.maps.LatLng(user.lastKnownPosition.lat, user.lastKnownPosition.lon);
        if (user.marker) {
          user.marker.setPosition(position);
          console.log(user.marker);
          if (!user.marker.map) {
            user.marker.setMap(this.map);
          }
        }
        else {
          user.marker = this.addMarker(position, user.firstName + ' ' + user.lastName, '#03A9F4');
        }
      }
    });
  }

  addVisibleUser(user) {
    this.visibleUsers.push(user);
    this.updateVisibleUsers();
  }

  removeVisibleUser(user) {
    let found = false;
    let i = 0;
    for (i = 0; i < this.visibleUsers.length; i++) {
      if (this.visibleUsers[i].id === user.id) {
        found = true;
        break;
      }
    }
    if (found) {
      //Remove marker if user has one
      if (this.visibleUsers[i].marker) {
        this.visibleUsers[i].marker.setMap(null);
      }
      //Remove line if user has one
      if (this.visibleUsers[i].polyline) {
        this.visibleUsers[i].polyline.setMap(null);
      }
      //Remove user from list
      this.visibleUsers.splice(i, 1);
    }
    this.updateVisibleUsers();
  }

  updatePosition(position) {
    let userId = position.UserId;
    for (let i = 0; i < this.visibleUsers.length; i++) {
      if (this.visibleUsers[i].id === userId) {
        let lat = parseFloat(position.lat);
        let lon = parseFloat(position.lon);
        this.visibleUsers[i].lastKnownPosition = {
          createdAt: position.updatedAt,
          lat: lat,
          lon: lon
        };
        let pos = new google.maps.LatLng(lat, lon);
        if (this.visibleUsers[i].marker) {
          this.visibleUsers[i].marker.setPosition(pos);
        }
        else {
          this.visibleUsers[i].marker =
            this.addMarker(pos, this.visibleUsers[i].firstName + ' ' + this.visibleUsers[i].lastName, '#03A9F4');
        }

        // if (!this.visibleUsers[i].lineCoords) {
        //   this.visibleUsers[i].lineCoords = [];
        // }
        // this.visibleUsers[i].lineCoords.push({
        //   lat,
        //   lon
        // });
        if (!this.visibleUsers[i].polyline) {
          this.visibleUsers[i].polyline = new google.maps.Polyline({
            strokeColor: '#03A9F4',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            path: [pos]
          });
          this.visibleUsers[i].polyline.setMap(this.map);
        }
        else {
          let path = this.visibleUsers[i].polyline.getPath();
          path.push(pos);
        }

        break;
      }
    }
  }

  addMarker(position: any, label: string = null, iconColor: string = null, customIcon: any = null) {
    console.log('addMarker');
    let defaultIcon = {
      path: "M-15,0a15,15 0 1,0 30,0a15,15 0 1,0 -30,0",
      fillColor: iconColor || '#03A9F4',
      fillOpacity: .6,
      anchor: new google.maps.Point(0, 0),
      strokeWeight: 0,
      scale: 1
    };

    let icon = customIcon || defaultIcon;

    let marker = new google.maps.Marker({
      map: this.map,
      position,
      icon
    });

    console.log('marker added', marker);

    if (label) {
      let content = label;
      this.addInfoWindow(marker, content);
    }

    return marker;
  }

  addInfoWindow(marker, content) {
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', function () {
      infoWindow.open(this.map, marker);
    });
  }

  setCenter(user: any) {
    if (user.lastKnownPosition) {
      let position = new google.maps.LatLng(user.lastKnownPosition.lat, user.lastKnownPosition.lon);
      this.map.panTo(position);
    }
  }

  statusChangeCallback(resp) {
    console.log(resp);
    if (resp.status === 'connected') {
      // connect here with your server for facebook login by passing access token given by facebook
      this.auth.facebookLogin(resp.authResponse.userID).then(res => {
        this.loggedIn = true;
        this.currentUser = res.user;
        // if (this.map) {
        //   this.updateVisibleUsers();
        // }
        this.socketAuth(res.token);
      });
    } else if (resp.status === 'not_authorized') {
      this.auth.reset();
      this.loggedIn = false;
      this.currentUser = null;
    } else {
      this.auth.reset();
      this.loggedIn = false;
      this.currentUser = null;
    }
  };

  private initAuthStream(): void {
    this.authStream = Rx.Observable.fromEvent(this.socket, 'authSuccess');

    this.authStream.subscribe(user => {
      this.authResponseStream = Rx.Observable.create(observer => {
        observer.next(user);
      });
      this.authResponseStream.subscribe(user => {
        this.currentUser = user;
        this.loggedIn = true;
        console.log('currentUser', user);
      });
    });
  }

  private initUsersStreams(): void {
    this.visibleUsersStream = Rx.Observable.fromEvent(this.socket, 'visibleUsers');

    this.visibleUsersStream.subscribe(users => {
      this.visibleUsersResponseStream = Rx.Observable.create(observer => {
        observer.next(users);
      });
      this.visibleUsersResponseStream.subscribe(users => {
        if (!this.visibleUsers.length) {
          this.visibleUsers = users;
          console.log('visibleUsers', users);
          this.updateVisibleUsers();
        }
      });
    });

    this.userStream = Rx.Observable.fromEvent(this.socket, 'user');

    this.userStream.subscribe(users => {
      this.userResponseStream = Rx.Observable.create(observer => {
        observer.next(users);
      });
      this.userResponseStream.subscribe(user => {
        console.log('user updated', user);
        if (user.visible) {
          this.addVisibleUser(user);
        }
        else {
          this.removeVisibleUser(user);
        }
        this.updateVisibleUsers();
      });
    });
  }

  private initPositionStreams(): void {
    this.updatedPositionStream = Rx.Observable.fromEvent(this.socket, 'positionUpdated');

    this.updatedPositionStream.subscribe(users => {
      this.updatedPositionResponseStream = Rx.Observable.create(observer => {
        observer.next(users);
      });
      this.updatedPositionResponseStream.subscribe(position => {
        // this.visibleUsers = users;
        console.log('updatedPosition', position);
        this.updatePosition(position);
        // this.updateVisibleUsers();
      });
    });
  }

  socketAuth(auth_token) {
    if (auth_token) {
      this.socket = io.connect(Config.API_URL);
      this.socket.on('connect', () => {
        this.socket.emit('authenticate', { token: auth_token });
        this.initAuthStream();
        this.initUsersStreams();
        this.initPositionStreams();
        this.loggedIn = true;
        // this.initMessagesStreams();
        // this.initLoggedInUser();
      });
    }
  }

  ngOnInit() {
    // FB.getLoginStatus(response => {
    //   this.statusChangeCallback(response);
    // });
    let auth_token = this.auth.getToken();
    if (auth_token) {
      console.log('auth_token found', auth_token);
      // this.user.getCurrentUser().then(user => {
      //   console.log('Logged in user initialized!')
      //   this.currentUser = user;
      //   this.loggedIn = true;
      //   // if (this.mapLoaded) {
      //   //   this.updateVisibleUsers();
      //   // }
      //   this.socketAuth(auth_token);
      // }).catch(err => {
      //   this.loggedIn = false;
      //   this.auth.reset();    
      // });
      this.socketAuth(auth_token);
    }

    // this.socket = io.connect('http://localhost:3757');
    // this.socket.on('connect', () => {
    //   console.log('WebSocket connected');
    // });
  }

  ngAfterViewInit() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        let myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.map = new google.maps.Map(document.getElementById('map'), {
          center: myPos,
          scrollwheel: false,
          zoom: 14
        });

        //this.addMarker(myPos, 'You are here!', null, 'assets/custom-marker-2.png');
        // this.addMarker(myPos, 'You are here!', '#E91E63');

        let self = this;
        google.maps.event.addListenerOnce(this.map, 'idle', function () {
          self.zone.run(() => {
            console.log('map is now loaded!');
            self.mapLoaded = true;

            //Check if there are any markers to be loaded
            console.log('visibleUsers', self.visibleUsers);
            if (self.visibleUsers && self.visibleUsers.length) {
              self.updateVisibleUsers();
            }

            // if (self.loggedIn) {
            //   self.updateVisibleUsers();
            // }
          });
        });
      });
    }
  }
}
