import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import 'rxjs/add/operator/map';
import {Config} from './config';

@Injectable()
export class Auth {

  private apiUrl: string = Config.API_URL + 'api/';
  //private localStorage: Storage = new Storage(LocalStorage);

  constructor(private http: Http) { }

  facebookLogin(facebookId: string) {

    return new Promise<any>((resolve, reject) => {

      let body = 'facebookId=' + facebookId;
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
      let options = new RequestOptions({ headers: headers });

      this.http.post(this.apiUrl + 'facebook-auth', body, options)
        .map(res => res.json())
        .subscribe(
          data => {
            this.saveUserToLocalStorage(data.user, data.token);
            resolve(data);
          },
          err => reject(err),
          () => console.log('Login complete')
        );
    });

  }

  login(email: string, password: string) {

    return new Promise<any>((resolve, reject) => {

      let body = 'email=' + email + '&password=' + password;
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
      let options = new RequestOptions({ headers: headers });

      this.http.post(this.apiUrl + 'basic-auth', body, options)
        .map(res => res.json())
        .subscribe(
          data => {
            this.saveUserToLocalStorage(data.user, data.token);
            resolve(data);
          },
          err => reject(err),
          () => console.log('Login complete')
        );
    });

  }

  register(user: any) {
    return new Promise<any>((resolve, reject) => {

      let body = 'email=' + user.email + '&firstName=' + user.firstName + '&lastName=' + user.lastName + '&facebookId=' + user.facebookId;
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
      let options = new RequestOptions({ headers: headers });

      this.http.post(this.apiUrl + 'user', body, options)
        .map(res => res.json())
        .subscribe(
          data => {
            this.saveUserToLocalStorage(data.user, data.token);
            resolve(user)
          },
          err => reject(err),
          () => console.log('Register complete')
        );
    });
  }

  getToken() {
    return localStorage.getItem('id_token');
  }

  getUser() {
    return localStorage.getItem('user');
  }

  reset() {
    localStorage.removeItem('user');
    localStorage.removeItem('id_token');
  }

  private saveUserToLocalStorage(user, token) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (token) {
      localStorage.setItem('id_token', token);
    }
  }

}

