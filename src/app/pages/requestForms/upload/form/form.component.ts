import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ETHNIC_GROUP_CONSTANTS, LIST_OF_JOB } from 'src/app/core/constants/group.constants';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  @Input() page?: string
  @Input() form!: FormGroup
  @Output() change: EventEmitter<any> = new EventEmitter()

  formSubscription?: Subscription
  ethnicGroup: string[] = ETHNIC_GROUP_CONSTANTS;
  occupation: string[] = LIST_OF_JOB;

  constructor() { }

  ngOnInit(): void {
    this.formSubscription = this.form.valueChanges.subscribe((data) => {
      this.change.emit(data)
    })
  }

  clear() {
    this.form.reset();
  }
}
