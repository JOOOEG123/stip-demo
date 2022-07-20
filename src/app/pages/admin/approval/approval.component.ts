import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ObjectUnsubscribedError, Subscription } from 'rxjs';
import { ArchieveApiService } from 'src/app/core/services/archives-api-service';
import { ContributionsService } from 'src/app/core/services/contributions.service';
import {
  Categories,
  CategoryList,
  Contribution,
  ContributionJson,
  ContributionSchema,
  Publish,
  Rightist,
} from 'src/app/core/types/adminpage.types';
import { ContributionComponent } from '../contribution/contribution.component';

@Component({
  selector: 'app-approval',
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.scss'],
  animations: [
    trigger('contributionAnimation', [
      state('void', style({ opacity: 1 })),
      state('removed', style({ opacity: 0, display: 'none' })),
      transition('void -> removed', animate('800ms ease-in-out')),
    ]),
  ],
})
export class ApprovalComponent implements OnInit, OnDestroy {
  currentState: string = 'void';

  newContributions: Contribution[] = [];
  approvedContributions: Contribution[] = [];
  rejectedContributions: Contribution[] = [];

  selectedContributions: Contribution[] = [];

  activeCategory!: Categories;
  selectedContribution!: Contribution;

  categoriesList: Categories[] = [
    'New Contributions',
    'Approved Contributions',
    'Rejected Contributions',
  ];
  categories: CategoryList = {
    'New Contributions': this.newContributions,
    'Approved Contributions': this.approvedContributions,
    'Rejected Contributions': this.rejectedContributions,
  };

  disabled: boolean = false;
  modalRef?: BsModalRef;

  contributionSubcription?: Subscription;
  rightistSubscription?: Subscription;

  contributions: any[] = [];
  publish: Publish = 'new';
  isLoaded: boolean = false;
  limit: number = 3;

  emptyContributionMessage = 'Nothing Here!';

  constructor(
    private modalService: BsModalService,
    private contributionAPI: ContributionsService,
    private archiveAPI: ArchieveApiService
  ) {}

  ngOnInit(): void {
    this.contributionSubcription = this.contributionAPI
      .fetchAllContributions()
      .subscribe((data: any) => {
        this.contributions.length = 0;
        this.newContributions.length = 0;
        this.approvedContributions.length = 0;
        this.rejectedContributions.length = 0;
        const test: ContributionJson[] = Object.values(data);
        for (let lol of test) {
          for (const contribution of Object.values(lol)) {
            this.contributions.push(contribution);
          }
        }

        // make sure the latest contribution is at the top
        this.contributions.sort(function (a, b) {
          return (
            new Date(b.lastUpdatedAt).getTime() -
            new Date(a.lastUpdatedAt).getTime()
          );
        });

        for (let contribution of this.contributions) {
          let data: Contribution = {
            ...contribution,
            contributedAt: new Date(contribution.contributedAt),
            approvedAt: new Date(contribution.approvedAt),
            lastUpdatedAt: new Date(contribution.lastUpdatedAt),
            state: 'void',
          };

          if (contribution.publish == 'new') {
            this.newContributions.push(data);
          }

          if (contribution.publish == 'approved') {
            this.archiveAPI
              .getPersonById(data.rightistId)
              .subscribe((rightist: any) => {
                data.rightist = rightist;
              });

            this.approvedContributions.push(data);
          }

          if (contribution.publish == 'rejected') {
            this.rejectedContributions.push(data);
          }
        }
      });

    this.selectedContributions = this.newContributions;
    this.activeCategory = 'New Contributions';
  }

  ngOnDestroy(): void {
    this.contributionSubcription?.unsubscribe();
    this.rightistSubscription?.unsubscribe();
  }

  onApprove(contribution: Contribution) {
    this.modalRef?.hide();
    this.publish = 'approved';
    const index = this.selectedContributions.findIndex(
      (c) => c.contributionId == contribution.contributionId
    );
    this.selectedContribution = this.newContributions[index];
    this.selectedContribution.state = 'removed';
  }

  onReject(contribution: Contribution) {
    this.modalRef?.hide();
    this.publish = 'rejected';
    const index = this.selectedContributions.findIndex(
      (c) => c.contributionId == contribution.contributionId
    );

    this.selectedContribution = this.newContributions[index];
    this.selectedContribution.state = 'removed';
  }

  onReconsider(contribution: Contribution) {
    this.modalRef?.hide();
    this.publish = 'approved';
    const index = this.selectedContributions.findIndex(
      (c) => (c.contributionId = contribution.contributionId)
    );
    this.selectedContribution = this.rejectedContributions[index];
    this.selectedContribution.state = 'removed';
  }

  setActiveCategory(category: Categories) {
    this.activeCategory = category;
    this.selectedContributions = this.categories[this.activeCategory];
  }

  animationStart(event: AnimationEvent) {
    this.disabled = true;
  }

  animationDone(event: AnimationEvent) {
    this.disabled = false;

    if (
      this.selectedContribution &&
      this.selectedContribution.state === 'removed'
    ) {
      // update the current timestamp
      this.selectedContribution.rightist!.lastUpdatedAt = new Date();

      if (this.selectedContribution.rightist) {
        let contributorId =
          this.selectedContribution.contributorId[
            this.selectedContribution.contributorId.length - 1
          ];
        this.selectedContribution.publish = this.publish;

        const { state, ...contribution } = this.selectedContribution;

        if (this.publish === 'approved') {
          let { rightist, ...result } = contribution;
          result.rightistId = rightist!.rightistId;
          result.approvedAt = new Date();
          this.archiveAPI
            .addNewArchieve(rightist!)
            .then(() => {});
          this.contributionAPI.updateUserContribution(
            contributorId,
            this.selectedContribution.contributionId,
            result
          );
        } else {
          this.contributionAPI.updateUserContribution(
            contributorId,
            this.selectedContribution.contributionId,
            contribution
          );
        }

        this.selectedContribution.state = 'void';
      }
    }
  }

  onReadMore(template: TemplateRef<any>, contribution: Contribution) {
    this.selectedContribution = contribution;
    this.modalRef = this.modalService.show(template, { class: 'modal-xl' });
  }
}
