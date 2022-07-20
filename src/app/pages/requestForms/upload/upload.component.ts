import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ETHNIC_GROUP_CONSTANTS,
  LIST_OF_JOB,
} from 'src/app/core/constants/group.constants';
import { AuthServiceService } from 'src/app/core/services/auth-service.service';
import { ContributionsService } from 'src/app/core/services/contributions.service';
import { Contribution, Rightist } from 'src/app/core/types/adminpage.types';
import { UUID } from 'src/app/core/utils/uuid';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit, OnDestroy {
  private _contribution!: Contribution;
  contributionId!: string;
  ethnicGroup: string[] = ETHNIC_GROUP_CONSTANTS;
  occupation: string[] = LIST_OF_JOB;
  selected?: string;
  selected2?: string;
  sub: Subscription[] = [];
  url = '';
  minDate: Date = new Date('1940-01-01');
  maxDate: Date = new Date('1965-01-01');
  minDate2: Date = new Date('1840-01-01');
  maxDate2: Date = new Date('1950-01-01');

  @Input() get contribution() {
    return this._contribution;
  }
  set contribution(contribution: Contribution) {
    if (contribution.rightist) {
      this._contribution = contribution;
    }
  }
  @Input() page?: string;

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    gender: new FormControl(''),
    status: new FormControl(''),
    ethnic: new FormControl(''),
    occupation: new FormControl('', Validators.required),
    rightestYear: new FormControl('', Validators.required),
    birthYear: new FormControl('', Validators.required),
  });
  form2 = new FormGroup({
    imageUpload: new FormControl(''),
    image: new FormControl(''),
    content: new FormControl(''),
  });

  imageForm = new FormGroup({
    imageTitle: new FormControl(''),
    imageDes: new FormControl(''),
  });

  imageArray = new FormArray([this.newImage()]);
  eventArray = new FormArray([this.newEvent()]);
  memoirArray = new FormArray([this.newMemoir()]);
  imageForm2 = new FormGroup({
    imageUpload: new FormControl(''),
    image: new FormControl(''),
  });

  private newImage() {
    return new FormGroup({
      imageUpload: new FormControl(''),
      image: new FormControl(''),
      imageTitle: new FormControl(''),
      imageDes: new FormControl(''),
    });
  }

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

  get eventControls() {
    return this.eventArray.controls as FormGroup[];
  }

  get imageControls() {
    return this.imageArray.controls as FormGroup[];
  }

  get memoirControls() {
    return this.memoirArray.controls as FormGroup[];
  }

  removeMemoir(i: number) {
    this.memoirArray.removeAt(i);
  }

  removeImageSection(i: number) {
    this.imageArray.removeAt(i);
  }

  constructor(
    private contributionService: ContributionsService,
    private auth: AuthServiceService,
    private route: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  clear() {
    this.form.reset();
  }

  clear2() {
    this.url = '';
    this.form2.reset();
    this.imageForm.reset();
    this.eventArray.reset();
    this.memoirArray.reset();
  }

  clearImage() {
    this.imageForm.reset();
  }

  addImage() {
    this.imageArray.push(this.newImage());
  }

  addEvent() {
    this.eventArray.push(this.newEvent());
  }

  removeEvent(i: number) {
    this.eventArray.removeAt(i);
  }

  addMemoir() {
    this.memoirArray.push(this.newMemoir());
  }

  ngOnDestroy(): void {
    this.sub.forEach((sub) => sub.unsubscribe());
  }

  onFormChange(event: Event) {
    console.log(event)
  }

  ngOnInit(): void {
    if (this.page === 'contribution') {
      if (this.contribution) {
        if (this.contribution.contributionId && this.contribution.rightist) {
          const rightist: Rightist = this.contribution.rightist;
          this.mapForm(rightist);
        }
      }
    } else {
      this.sub.push(
        this.activatedRoute.queryParams.subscribe((params) => {
          this.contributionId = params['contributionId'];
          this.page = params['page'];
          if (this.page === 'account') {
            if (this.contributionId) {
              this.sub.push(
                this.contributionService
                  .fetchContributorByContributionId(this.contributionId)
                  .subscribe((contribution: any) => {
                    this.contribution = contribution;
                    this.mapForm(contribution.rightist);
                  })
              );
            }
          }
        })
      );
    }
  }

  mapForm(rightist: Rightist) {
    if (this.form && this.form2 && this.eventArray && this.memoirArray) {
      this.form.patchValue({
        name: rightist.lastName + ' ' + rightist.firstName,
        occupation: rightist.job,
        ethnic: rightist.ethnicity,
        rightestYear: rightist.rightistYear,
        ...rightist,
      });
      this.form2.patchValue({
        content: rightist.description,
      });
      this.eventArray.patchValue(rightist.events);
      this.memoirArray.patchValue(rightist.memoirs);
    }
  }

  onselectFile(e) {
    if (e.target.files) {
      var reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = (event: any) => {
        this.url = event.target.result;
      };
    }
  }

  onSubmit() {
    const {
      name,
      gender,
      status,
      ethnic,
      rightestYear,
      occupation,
      birthYear,
    } = this.form.value;
    const { content } = this.form2.value;
    const rightistId =
      this.contribution?.rightist?.rightistId || `Rightist-${UUID()}`;
    this.contributionService
      .contributionsAddEdit({
        contributionId: this.contributionId,
        contributorId: [this.auth.uid],
        contributedAt: new Date(),
        rightistId: rightistId,
        approvedAt: new Date(),
        publish: 'new',
        rightist: {
          rightistId: rightistId,
          imageId: [this.url],
          initial: name.trim().charAt(0).toUpperCase(),
          firstName: '',
          lastName: '',
          fullName: name,
          gender: gender || '',
          birthYear: birthYear,
          deathYear: 0,
          rightistYear: rightestYear,
          status: status || 'Unknown',
          ethnicity: ethnic || '',
          job: occupation,
          detailJob: '',
          workplace: '',
          workplaceCombined: '',
          events: this.eventArray.value,
          memoirs: this.memoirArray.value,
          reference: '',
          description: content,
          lastUpdatedAt: new Date(),
          source: 'contributed'
        },
      })
      .then(() => {
        this.clear();
        this.clear2();
        this.route.navigateByUrl('/account');
      });
  }
}
