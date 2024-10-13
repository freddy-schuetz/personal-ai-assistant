import { runNativeScriptAngularApp, platformNativeScript } from '@nativescript/angular';
import { AppModule } from './app/app.module';

runNativeScriptAngularApp({
  appModuleBootstrap: () => platformNativeScript().bootstrapModule(AppModule),
});