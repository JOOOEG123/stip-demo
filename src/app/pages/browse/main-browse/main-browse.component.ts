import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Input,
  OnDestroy,
  Attribute,
} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { ArchieveApiService } from 'src/app/core/services/archives-api-service';
import { FilterTypes } from 'src/app/core/types/filters.type';

import { LETTERS } from './main-browse.constant';

@Component({
  selector: 'app-main-browse',
  templateUrl: './main-browse.component.html',
  styleUrls: ['./main-browse.component.scss'],
})
export class MainBrowseComponent implements OnInit, OnDestroy {
  //search result panel variables
  currentLetter = 'A';
  currentPage = 1;
  curView = 'List';
  display: any[] = [];
  filterValues: FilterTypes = {} as FilterTypes;

  itemsPerPage = 25;
  searchInput = '';
  letters = LETTERS;
  maxPage = 1;
  olditemsPerPage = 25;

  //variables for search functionalities
  db_result: any[] = [];
  archCacheAPI: any = {};
  archSubAPI: Subscription[] = [];
  isloading!: boolean;

  constructor(
    private archApi: ArchieveApiService,
    private changeDetection: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lettersBtnClickOrReset('A');
  }

  itemPerPageChanged() {
    //casting
    this.itemsPerPage = +this.itemsPerPage;
    this.setDisplayInfo(this.olditemsPerPage);
    this.olditemsPerPage = this.itemsPerPage;

    console.log('testing', this.itemsPerPage);
    console.log(this.curView);
  }

  setDisplayInfo(startItemsPerPage: number) {
    var start = (this.currentPage - 1) * startItemsPerPage;
    var end = start + this.itemsPerPage;
    this.display = this.db_result.slice(start, end);
    this.maxPage = Math.max(
      Math.ceil(this.db_result.length / this.itemsPerPage),
      1
    );
  }

  pageChanged(event: any) {
    console.log('in page changed');
    this.currentPage = event.page;
    this.setDisplayInfo(this.itemsPerPage);
  }

  lettersBtnClickOrReset(letter: string) {
    this.currentPage = 1;
    this.currentLetter = letter;
    // const alpha = letter === 'All' ? '' : letter;
    this.callAPI(letter);
  }

  callAPI(l: string) {
    //clear up display
    this.display = [];

    const alpha = l === 'All' ? '' : l;
    const archKey = `person_arch_${l}`;
    if (this.archCacheAPI[archKey]) {
      this.db_result = this.archCacheAPI[archKey];
      this.setDisplayInfo(this.itemsPerPage);
      console.log('from cache');
    } else {
      this.isloading = true;
      this.archSubAPI.push(
        this.archApi
          .getArchievePersonByAlphabet(alpha)
          .subscribe((datas: any) => {
            console.log(datas);
            this.db_result =
              l === 'All'
                ? datas
                    .map((alphabet: any) => [].concat(alphabet.persons))
                    .flat()
                : datas;
            this.archCacheAPI[archKey] = this.db_result;
            //reset current page
            this.setDisplayInfo(this.itemsPerPage);
            this.isloading = false;
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.archSubAPI.forEach((sub) => sub.unsubscribe());
    this.archCacheAPI = {};
  }

  filterByFilterValues(valueEmitted: any) {
    let seen = new Set<any>();

    console.log('triggering');

    this.getfilterData(seen);
    this.currentPage = 1;
    this.setDisplayInfo(this.itemsPerPage);
    console.log(this.display);
  }

  getfilterData(seen: Set<any>) {
    console.log('get gender');
  

    console.log([
      this.filterValues.date[0].getFullYear(),
      this.filterValues.date[1].getFullYear(),
    ]);

    seen.add(
      this.db_result.filter((record): boolean => {
        //get values from record->check whether contains same words-> filter out
        let values: any[] = [
          record.gender,
          record.nationality,
          record.workplace,
        ];
        let userValues: any[] = [this.filterValues.gender, this.filterValues.group, this.filterValues.occupation];
        //remove empty strings
        userValues = userValues.filter((element) => {
          return element !== '';
        });

        var containsAll = userValues.every((element) => {
          return values.includes(element);
        }) && this.getYearBecameRightist(record) && this.getStatus(record);
        containsAll = this.getYearBecameRightist(record)
        return containsAll;
      })
    );

    this.db_result = [...seen][0];
  }

  getYearBecameRightist(record: any) {
    var from = this.filterValues.date[0].getFullYear();
    var to = this.filterValues.date[1].getFullYear();

    return from <= record.year_rightist && record.year_rightist <= to;
  }
  getStatus(record: any) {
    var value = this.filterValues.status;
    if (
      record.year_of_death == 0 &&
      record.year_of_birth == 0 &&
      value == 'Unknown'
    ) {
      return true;
    } else if (record.year_of_death > 0 && value == 'Deceased') {
      return true;
    } else if (
      record.year_of_death == 0 &&
      record.year_of_birth > 0 &&
      value == 'Alive'
    ) {
      return true;
    } else {
      return false;
    }
  }

  searchBar() {
    console.log('in search bars');
    //reset db
    this.lettersBtnClickOrReset(this.currentLetter);
    console.log(this.db_result.length);
    const userValues = this.searchInput.split(' ');

    this.db_result = this.db_result.filter((record): boolean => {
      let values = Object.values(record).map((value): string =>
        String(value).toLowerCase()
      );
      console.log(values);
      return userValues.every((element) =>
        values.includes(element.toLowerCase())
      );
    });

    this.currentPage = 1;
    this.setDisplayInfo(this.itemsPerPage);
  }

  filterValueschanges(filterValues: FilterTypes) {
    console.log(filterValues);
  }
}
