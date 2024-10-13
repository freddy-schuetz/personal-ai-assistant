import { Component } from '@angular/core';
import { RouterExtensions } from '@nativescript/angular';
import { ApplicationSettings } from '@nativescript/core';

@Component({
  selector: 'ns-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  apiUrl: string;

  constructor(private routerExtensions: RouterExtensions) {
    this.apiUrl = ApplicationSettings.getString('apiUrl') || 'http://static.108.101.245.188.clients.your-server.de:11434';
  }

  saveSettings() {
    ApplicationSettings.setString('apiUrl', this.apiUrl);
    this.goBack();
  }

  goBack() {
    this.routerExtensions.back();
  }
}