import { StringMap } from '@angular/compiler/src/compiler_facade_interface';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-array',
  templateUrl: './array.component.html',
  styleUrls: ['./array.component.scss'],
})
export class ArrayComponent implements OnInit, OnDestroy {
  @Input() array!: FormArray
  @Input() title!: string;
  @Input() type!: string;
  @Output() change: EventEmitter<any> = new EventEmitter();


  eventYear?: number;
  eventContent?: string;
  memoirTitle?: string;
  memoirAuthor?: string;
  memoirContent?: string;

  private newEvent() {
    return new FormGroup({
      startYear: new FormControl(''),
      endYear: new FormControl(''),
      event: new FormControl(''),
    });
  }

  private newMemoir() {
    return new FormGroup({
      memoirTitle: new FormControl(''),
      memoirContent: new FormControl(''),
      memoirAuthor: new FormControl(''),
    });
  }

  arraySubscription?: Subscription;

  constructor() {}

  ngOnInit(): void {

    if (this.array.length == 0) {
      if (this.type == 'event') {
        this.array.push(this.newEvent());
      }

      if (this.type == 'memoir') {
        this.array.push(this.newMemoir());
      }
    }

    // if (this.type === 'event') {
    //   this.array.push(this.newEvent())
    //   // for (const [i, value] of this.array.value.entries()) {
    //   //   console.log(i)
    //   //   this.localArray.at(i).patchValue({
    //   //     startYear: value.startYear,
    //   //     endYear: value.endYear,
    //   //     event: value.event
    //   //   })
    //   // }
    // }

    // if (this.type === 'memoir') {
    //   this.array.push(this.newMemoir())
    //   // for (const [i, value] of this.array.value.entries()) {
    //   //   this.localArray.at(i).patchValue({
    //   //     memoirTitle: value.memoirTitle,
    //   //     memoirAuthor: value.memoirAuthor,
    //   //     memoirContent: value.memoirContent
    //   //   })
    //   // }
    // }
  }

  ngOnDestroy(): void {
    this.arraySubscription?.unsubscribe();
  }

  onContentChange(event: Event) {
    console.log(event);
  }

  get controls() {
    return this.array.controls as FormGroup[];
  }

  add() {
    console.log(this.array);
    if (this.type == 'event') {
      this.array.push(this.newEvent());
    }

    if (this.type == 'memoir') {
      this.array.push(this.newMemoir());
    }

    this.change.emit({
      type: this.type,
      array: this.array,
    });
  }

  remove(i: number) {
    this.array.removeAt(i);
    this.change.emit({
      type: this.type,
      array: this.array,
    });
  }
}
