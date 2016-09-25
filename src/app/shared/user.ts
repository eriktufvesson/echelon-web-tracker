import {Injectable} from '@angular/core';
import {Headers, RequestOptions} from '@angular/http';
import {AuthHttp} from 'angular2-jwt';
import 'rxjs/add/operator/map';
import {Config} from './config';

@Injectable()
export class User {
  private apiUrl: string = Config.API_URL + '/api/';

  public visible: boolean = false;

  constructor(private authHttp: AuthHttp) { }

  getCurrentUser() {
    return new Promise<any>((resolve, reject) => {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
      let options = new RequestOptions({ headers: headers });

      this.authHttp.get(this.apiUrl + 'user/current', options)
        .map(res => res.json())
        .subscribe(
          user => resolve(user),
          err => reject(err)
        );
    });
  }

  getVisibleUsers() {
    return new Promise<any>((resolve, reject) => {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
      let options = new RequestOptions({ headers: headers });

      //this.authHttp.get(this.apiUrl + 'user/visible', options)
      this.authHttp.get(this.apiUrl + 'user/random?nbr=10&lat=55.702177&lon=13.173477&radius=3000', options)
        .map(res => res.json())
        .subscribe(
          users => resolve(users),
          err => reject(err)
        );
    });
  }
}

