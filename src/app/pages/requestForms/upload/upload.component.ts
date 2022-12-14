import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, lastValueFrom, Subscription, zip } from 'rxjs';
import { ArchieveApiService } from 'src/app/core/services/archives-api-service';
import { AuthServiceService } from 'src/app/core/services/auth-service.service';
import { ContributionsService } from 'src/app/core/services/contributions.service';
import { ImagesService } from 'src/app/core/services/images.service';
import { StorageApIService } from 'src/app/core/services/storage-api.service';
import {
  ContributionDetails,
  ImagesSchema,
  langType,
  Rightist,
  RightistSchema,
  UploadImagesType,
} from 'src/app/core/types/adminpage.types';
import { UUID } from 'src/app/core/utils/uuid';
import { mapOtherRightists } from './upload.helper';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit, OnDestroy {
  // private _contribution!: Contribution;
  private _contribution: langType = {} as any;
  contributionId!: string;
  rightist?: Rightist;
  isLoading: boolean = false;
  sub: Subscription[] = [];
  minDate: Date = new Date('1940-01-01');
  maxDate: Date = new Date('1965-01-01');
  minDate2: Date = new Date('1850-01-01');
  maxDate2: Date = new Date('2050-01-01');
  isAdmin: boolean = false;
  allForms = this.formBuilder.group({
    event: [],
    imagesDetails: [],
    memoir: [],
    rightist: [],
    content: [''],
    otherContent: [''],
  });
  language = this.translate.currentLang;
  otherLanguage = this.language === 'en' ? 'cn' : 'en';
  subLang: Subscription[] = [];
  allData: any;

  @Input() get contribution() {
    return this._contribution[this.language];
  }

  set contribution(contribution: ContributionDetails) {
    if (contribution?.rightist) {
      this._contribution[this.language] = contribution;
    }
  }

  @Input() page: string = '';

  @Output() formChange: EventEmitter<any> = new EventEmitter();
  @Output() eventChange: EventEmitter<any> = new EventEmitter();
  @Output() memoirChange: EventEmitter<any> = new EventEmitter();
  @Output() imageChange: EventEmitter<any> = new EventEmitter();
  @Output() descriptionChange: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();

  constructor(
    private contributionService: ContributionsService,
    private auth: AuthServiceService,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private imageAPI: ImagesService,
    private archiveAPI: ArchieveApiService,
    private storageAPI: StorageApIService,
    private translate: TranslateService,
    private contributionAPI: ContributionsService,
    private formBuilder: FormBuilder
  ) {}

  clear2() {
    this.allForms.reset();
  }

  ngOnDestroy(): void {
    this.sub.forEach((sub) => sub.unsubscribe());
    this.subLang.forEach((sub) => sub.unsubscribe());
  }

  descriptionChanged(data: any) {
    // this will will update / remove later
    this.descriptionChange.emit({
      type: 'original',
      value: data,
    });
  }

  otherDescriptionChanged(data: any) {
    // this will will update / remove later
    this.descriptionChange.emit({
      type: 'other',
      value: data,
    });
  }

  ngOnInit(): void {
    this.language = localStorage.getItem('lang')!;
    this.otherLanguage = this.language === 'en' ? 'cn' : 'en';

    this.sub.push(
      this.auth.isAdmin.subscribe((data) => {
        this.isAdmin = data;
        this.onInit();
      })
    );
    this.subLang.push(
      this.translate.onLangChange.subscribe((data) => {
        this.language = data.lang;
        this.otherLanguage = data.lang === 'en' ? 'cn' : 'en';
        this.onInit();
      })
    );
    this.allForms.valueChanges.subscribe((x) => {
      console.log(x);
    });
  }

  updateData() {
    let zipObj$;
    if (this.page === 'profile' && this.isAdmin) {
      // getRightistById
      zipObj$ = zip(
        this.archiveAPI.getRightistById(this.language, this.contributionId),
        this.archiveAPI.getRightistById(this.otherLanguage, this.contributionId)
      );
    } else if (this.page !== 'profile') {
      zipObj$ = zip(
        this.contributionAPI.getUserContribution(
          this.language,
          this.contribution?.contributorId || this.auth.uid,
          this.contribution?.contributionId || this.contributionId
        ),
        this.contributionAPI.getUserContribution(
          this.otherLanguage,
          this.contribution?.contributorId || this.auth.uid,
          this.contribution?.contributionId || this.contributionId
        )
      );
    }
    zipObj$?.subscribe((data: any) => {
      this.allData = data;
      this._contribution[this.language] = data[0] || data[1];
      this._contribution[this.otherLanguage] = data[1] || data[0];
      const curr = this._contribution[this.language];
      const other = this._contribution[this.otherLanguage];
      const { rightist: r1 } = this._contribution[this.language];
      const { rightist: r2 } = this._contribution[this.otherLanguage];
      console.log({ r1, r2 });
      if (r1 && r2) {
        this.mapForm(r1, r2);
      } else if (curr && other) {
        this.mapForm(curr, other);
      }
      this.allForms.patchValue({
        rightist: {
          ...(curr?.rightist || curr),
          ...mapOtherRightists(other?.rightist || other),
          name: curr?.rightist?.fullName || curr?.fullName || '',
          occupation:
            curr?.rightist?.workplaceCombined || curr?.workplaceCombined || '',
          ethnic: curr?.rightist?.ethnicity || curr?.ethnicity,
        },
        content: curr?.rightist?.description || curr?.description || '',
        otherContent: other?.rightist?.description || other?.description || '',
      });
    });
  }

  mapForm(r1: Rightist, r2: Rightist) {
    const length =
      (r1.memoirs?.length ?? 0) > (r2.memoirs?.length ?? 0)
        ? r1?.memoirs?.length ?? 0
        : r2?.memoirs?.length ?? 0;
    const memoirs: any[] = [];
    for (let i = 0; i < length; i++) {
      const m1 = r1.memoirs?.[i] ?? ({} as any);
      const m2 = r2.memoirs?.[i] ?? ({} as any);
      if (m1 && m2) {
        memoirs.push({
          memoirTitle: m1.memoirTitle,
          otherMemoirTitle: m2.memoirTitle || '',
          memoirContent: m1.memoirContent || '',
          otherMemoirContent: m2.memoirContent || '',
          memoirAuthor: m1.memoirAuthor || '',
          otherMemoirAuthor: m2.memoirAuthor || '',
        });
      }
    }
    // const nullZero
    const enlen =
      (r1?.events?.length ?? 0) > (r2?.events?.length ?? 0)
        ? r1?.events?.length ?? 0
        : r2?.events?.length ?? 0;
    const events: any[] = [];
    for (let i = 0; i < enlen; i++) {
      const m1 = r1.events?.[i] ?? ({} as any);
      const m2 = r2.events?.[i] ?? ({} as any);
      if (m1 && m2) {
        events.push({
          startYear: m1.startYear || m2.startYear,
          event: m1.event || '',
          otherEvent: m2.event || '',
        });
      }
    }

    // imageId: x.imageId,
    // rightistId: rightistId,
    // imagePath: x.image,
    // imageUrl: images[i].imageUrl,
    // isProfile: x.isProfile,
    // isGallery: x.imageUpload,
    // category: x.otherImageCategory,
    // title: x.otherImageTitle,
    // detail: x.otherImageDes,
    // source: x.otherImageSource,

    const imagesLength =
      (r1?.images?.length ?? 0) > (r2?.images?.length ?? 0)
        ? r1?.images?.length ?? 0
        : r2?.images?.length ?? 0;
    const images = [] as any;
    for (let i = 0; i < imagesLength; i++) {
      const i1 = r1.images?.[i] ?? ({} as any);
      const i2 = r2.images?.[i] ?? ({} as any);
      if (i1 && i2) {
        images.push({
          file: undefined,
          image: '',
          imageId: i1?.imageId,
          imageCategory: i1?.category,
          imageDes: i1?.detail,
          imageDetails: i1?.detail,
          imageSource: i1?.source,
          imageTitle: i1?.title,
          imageUpload: i1?.isGallery,
          isProfile: i1?.isProfile,
          imageUrl: i1?.imageUrl,
          // other fields
          otherImage: '',
          otherImageCategory: i2?.category,
          otherImageDes: i2?.detail,
          otherImageDetails: '',
          otherImageSource: i2?.source,
          otherImageTitle: i2?.title,
          otherImageUpload: i2?.isGallery,
          otherImageUrl: i2?.imageUrl,
        });
      }
      console.log(images, 'dsdsdsdsdsd');
    }
    this.allForms.patchValue({
      event: events,
      memoir: memoirs,
      imagesDetails: images,
    });
  }

  onInit() {
    if (this.page === 'contribution') {
      if (this.contribution) {
        if (this.contribution.contributionId && this.contribution.rightist) {
          const rightist: Rightist = this.contribution.rightist;
          // this.mapForm(rightist);
          this.updateData();
        }
      }
    } else {
      this.sub.push(
        this.activatedRoute.queryParams.subscribe((params) => {
          this.contributionId = params['value'];
          // if (!this.contributionId) {
          //   this.contributionId = params['value'];
          // }
          this.page = params['page'];
          if (['account', 'profile'].includes(this.page)) {
            if (this.contributionId) {
              this.updateData();
            }
          }
        })
      );
    }
  }

  onSave() {
    this.save.emit({
      type: 'save',
    });
  }

  async onSubmit() {
    this.isLoading = true;
    const rightistId =
      this.contribution?.rightist?.rightistId ||
      this.contribution?.rightistId ||
      `Rightist-${UUID()}`;
    const {
      name,
      otherName,
      gender,
      otherGender,
      status,
      otherStatus,
      ethnic,
      otherEthnic,
      occupation,
      otherOccupation,
      rightistYear,
      birthYear,
      deathYear,
    } = this.allForms.value.rightist!;
    const dd: UploadImagesType[] = this.allForms.value.imagesDetails;

    const currentImages = () =>
      dd.map(async (x) => {
        const file = x.imageUrl.includes('firebasestorage')
          ? x.imageUrl
          : await this.storageAPI.uploadContributionImage(
              this.auth.uid,
              rightistId,
              x.imageId,
              x.file
            );

        return {
          imageId: x.imageId,
          rightistId: rightistId,
          imagePath: x.image,
          imageUrl: file || '',
          isProfile: x.isProfile,
          isGallery: x.imageUpload,
          category: x.imageCategory,
          title: x.imageTitle,
          detail: x.imageDes,
          source: x.imageSource,
        };
      }) || ([] as any);
    let images: ImagesSchema[] = [] as any;
    try {
      images = await Promise.all(currentImages());
      currentImages();
    } catch (e) {
      console.log('Error: ', e, 'images');
    }

    const otherImages = () =>
      dd.map((x, i) => ({
        imageId: x.imageId,
        rightistId: rightistId,
        imagePath: x.image,
        imageUrl: images[i].imageUrl,
        isProfile: x.isProfile,
        isGallery: x.imageUpload,
        category: x.otherImageCategory,
        title: x.otherImageTitle,
        detail: x.otherImageDes,
        source: x.otherImageSource,
      })) || ([] as any);

    // if (!this.contribution) {
    let rightist: RightistSchema = {
      rightistId: rightistId,
      contributorId: this.auth.uid,
      // imageId: [],
      // profileImageId: '',
      images: images,
      initial: '',
      firstName: '',
      lastName: '',
      fullName: name,
      gender: gender || 'unknown',
      birthYear: birthYear || 0,
      deathYear: deathYear || 0,
      rightistYear: rightistYear,
      status: status || 'Unknown',
      ethnicity: ethnic || '',
      job: occupation,
      education: '',
      birthplace: '',
      detailJob: '',
      workplace: '',
      workplaceCombined: occupation,
      events: this.allForms.value.event,
      memoirs: this.allForms.value.memoir,
      reference: '',
      description: this.allForms.value.content,
      lastUpdatedAt: new Date(),
      source: 'contributed',
      imageId: '',
    };

    let otherRightist: RightistSchema = {
      rightistId: rightistId || '',
      contributorId: this.auth.uid || '',
      imageId: '',
      // profileImageId: '',
      images: otherImages(),
      initial: '',
      firstName: '',
      lastName: '',
      fullName: otherName || '',
      gender: otherGender || '',
      birthYear: birthYear || '',
      deathYear: 0,
      rightistYear: rightistYear || '',
      status: otherStatus || 'Unknown',
      ethnicity: otherEthnic || '',
      job: otherOccupation,
      detailJob: '',
      workplace: '',
      workplaceCombined: otherOccupation || '',
      events: (this.allForms.value.event || []).map((e) => {
        return {
          startYear: e.startYear || '',
          event: e.otherEvent || '',
        };
      }),
      memoirs: (this.allForms.value.memoir || []).map((m) => {
        return {
          memoirTitle: m.otherMemoirTitle || '',
          memoirContent: m.otherMemoirContent || '',
          memoirAuthor: m.otherMemoirAuthor || '',
        };
      }),
      reference: '',
      description: this.allForms.value?.otherContent || '',
      lastUpdatedAt: new Date(),
      source: 'contributed',
      birthplace: '',
      education: '',
    };

    if (this.language === 'en') {
      rightist.initial = rightist.fullName.trim().charAt(0).toUpperCase();
      otherRightist.initial = rightist.fullName.trim().charAt(0).toUpperCase();
    }
    let contributionId = this.contributionId || UUID();

    if (this.isAdmin && ['contribution', 'profile'].includes(this.page)) {
      Promise.all([
        this.contributionService.updateUserContribution(this.language, {
          contributionId: contributionId,
          contributorId: this.auth.uid,
          rightistId: rightistId,
          contributedAt: new Date(),
          approvedAt: new Date(),
          rejectedAt: new Date(),
          publish: 'approved',
          lastUpdatedAt: new Date(),
        }),
        this.archiveAPI.addRightist(this.language, rightist),
        this.contributionService.updateUserContribution(this.otherLanguage, {
          contributionId: contributionId,
          contributorId: this.auth.uid,
          rightistId: rightistId,
          contributedAt: new Date(),
          approvedAt: new Date(),
          rejectedAt: new Date(),
          publish: 'approved',
          lastUpdatedAt: new Date(),
        }),
        this.archiveAPI
          .addRightist(this.otherLanguage, otherRightist)
          .then(() => {
            this.route.navigateByUrl('/account');
          }),
      ])
        .then(() => {
          this.clear2();
          this.route.navigateByUrl('/account');
          this.isLoading = false;
        })
        .catch((err) => {
          console.log(err);
          this.isLoading = false;
          // use the alert service to show a message
        });
    } else {
      Promise.all([
        this.contributionService.updateUserContribution(this.language, {
          contributionId: contributionId,
          contributorId: this.auth.uid,
          rightistId: rightistId,
          contributedAt: new Date(),
          approvedAt: new Date(),
          rejectedAt: new Date(),
          publish: 'new',
          rightist: rightist,
          lastUpdatedAt: new Date(),
        }),
        this.contributionService.updateUserContribution(this.otherLanguage, {
          contributionId: contributionId,
          contributorId: this.auth.uid,
          rightistId: rightistId,
          contributedAt: new Date(),
          approvedAt: new Date(),
          rejectedAt: new Date(),
          publish: 'new',
          rightist: otherRightist,
          lastUpdatedAt: new Date(),
        }),
      ])
        .then(() => {
          this.clear2();
          this.route.navigateByUrl('/account');
          this.isLoading = false;
        })
        .catch((err) => {
          console.log(err);
          this.isLoading = false;
          // use the alert service to show a message
        });
    }
  }
}
