import { AlertModule } from 'ngx-bootstrap/alert';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  BsDatepickerConfig,
  BsDatepickerModule,
} from 'ngx-bootstrap/datepicker';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgModule } from '@angular/core';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import {
  ProgressbarConfig,
  ProgressbarModule,
} from 'ngx-bootstrap/progressbar';
import { PaginationModule, PaginationConfig } from 'ngx-bootstrap/pagination';

export const getProgressbarConfig = (): ProgressbarConfig =>
  Object.assign(new ProgressbarConfig(), {
    animate: true,
    striped: true,
    max: 100,
  });

@NgModule({
  declarations: [],
  imports: [
    BrowserAnimationsModule,
    CollapseModule.forRoot(),
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    ModalModule.forRoot(),
    TypeaheadModule.forRoot(),
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
  ],
  exports: [
    BsDropdownModule,
    CollapseModule,
    AlertModule,
    ModalModule,
    BsDatepickerModule,
    TypeaheadModule,
    PaginationModule,
    ProgressbarModule,
  ],
  providers: [
    BsDatepickerConfig,
    PaginationConfig,
    { provide: ProgressbarConfig, useFactory: getProgressbarConfig },
  ],
  bootstrap: [],
})
export class NgxBootstrapModule {}
