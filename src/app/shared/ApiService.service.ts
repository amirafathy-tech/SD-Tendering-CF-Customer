import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = "https://proxy-server.cfapps.eu10-004.hana.ondemand.com/api"
 
  constructor(private http: HttpClient) { }

  get<T>(url: string, queryParam?: string, headers?: HttpHeaders): Observable<T> {
    let params = new HttpParams();

    if (queryParam) {
      params = params.set('keyword', queryParam);
      console.log(params);
    }
    console.log(this.http.get<T>(`${this.baseUrl}/${url}`, { params }));
    return this.http.get<T>(`${this.baseUrl}/${url}`);
  }

  getID<T>(url: string, id: number, params?: HttpParams, headers?: HttpHeaders): Observable<T> {
    //const options = { params, headers };

    //headers =new HttpHeaders().set('Authorization',`Bearer ${ localStorage.getItem('token')}`)
    console.log(this.http.get<T>(`${this.baseUrl}/${url}/${id}`));
    return this.http.get<T>(`${this.baseUrl}/${url}/${id}`);
  }

  post<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {

    return this.http.post<T>(`${this.baseUrl}/${url}`, body);
  }

  put<T>(url: string, id: number, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${url}/${id}`, body);
  }

  patch<T>(url: string, id: number, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}/${id}`, body);
  }

  update<T>(url: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}`, body);
  }

  delete<T>(url: string, id: number, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${url}/${id}`);
  }

  deleteFromApp<T>(url: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${url}`);
  }
  updateApp<T>(url: string,body?: any,  headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}`, body);
  }
}